/**
 * Invoice Generator Cloud Function
 *
 * Generates Hebrew RTL tax invoices (חשבונית מס) as PDF.
 * Triggered by Cloud Tasks after successful payment.
 *
 * Flow:
 * 1. Receive orderId from Cloud Tasks
 * 2. Fetch order + customer data from Firestore
 * 3. Get next invoice number (atomic counter)
 * 4. Generate RTL Hebrew PDF with pdfkit
 * 5. Upload to Cloud Storage (private bucket)
 * 6. Generate signed URL (7-day expiry)
 * 7. Save Invoice record to Firestore
 */

import * as functions from "@google-cloud/functions-framework";
import { Firestore, FieldValue } from "@google-cloud/firestore";
import { Storage } from "@google-cloud/storage";

const db = new Firestore();
const storage = new Storage();

const BUCKET_NAME = process.env.INVOICES_BUCKET || "dropship-488214-invoices";
const VAT_RATE = 0.17;
const COMPANY_NAME = "ShipMate שיפמייט";
const COMPANY_ID = "516XXXXXX"; // ח.פ
const COMPANY_ADDRESS = "תל אביב, ישראל";

interface OrderItem {
  productId: string;
  titleHe: string;
  price: number;
  quantity: number;
}

interface OrderData {
  orderNumber: string;
  customer: {
    firstName: string;
    lastName: string;
    email: string;
    phone: string;
  };
  shippingAddress: {
    city: string;
    street: string;
    apartment?: string;
  };
  items: OrderItem[];
  subtotal: number;
  shipping: number;
  discount: number;
  total: number;
  createdAt: FirebaseFirestore.Timestamp;
}

/**
 * Get next invoice number atomically
 */
async function getNextInvoiceNumber(): Promise<number> {
  const counterRef = db.doc("counters/invoices");

  const result = await db.runTransaction(async (tx) => {
    const doc = await tx.get(counterRef);
    const current = doc.exists ? (doc.data()?.current || 999) : 999;
    const next = current + 1;
    tx.set(counterRef, { current: next }, { merge: true });
    return next;
  });

  return result;
}

/**
 * Generate invoice PDF buffer
 */
async function generateInvoicePDF(
  invoiceNumber: number,
  order: OrderData,
  issueDate: Date
): Promise<Buffer> {
  // Dynamic import for pdfkit
  const PDFDocument = (await import("pdfkit")).default;

  return new Promise((resolve, reject) => {
    const chunks: Buffer[] = [];
    const doc = new PDFDocument({
      size: "A4",
      margin: 50,
      info: {
        Title: `חשבונית מס ${invoiceNumber}`,
        Author: COMPANY_NAME,
      },
    });

    doc.on("data", (chunk: Buffer) => chunks.push(chunk));
    doc.on("end", () => resolve(Buffer.concat(chunks)));
    doc.on("error", reject);

    const pageWidth = doc.page.width - 100; // margins
    const rightX = doc.page.width - 50;

    // Use built-in Helvetica (PDFKit doesn't have Hebrew fonts by default)
    // In production, register a Hebrew font like Heebo
    // doc.registerFont('Heebo', 'path/to/Heebo-Regular.ttf');
    const font = "Helvetica";
    const fontBold = "Helvetica-Bold";

    // === Header ===
    doc.fontSize(24).font(fontBold);
    doc.text(COMPANY_NAME, 50, 50, { align: "right" });

    doc.fontSize(10).font(font);
    doc.text(COMPANY_ADDRESS, 50, 80, { align: "right" });
    doc.text(`${COMPANY_ID} .ח.פ`, 50, 95, { align: "right" });

    // Invoice title
    doc.moveDown(2);
    doc.fontSize(20).font(fontBold);
    doc.text("חשבונית מס / קבלה", 50, 130, { align: "center" });

    // Invoice number and date
    doc.fontSize(11).font(font);
    const dateStr = issueDate.toLocaleDateString("he-IL", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });

    doc.text(`מספר: ${invoiceNumber}`, 50, 170, { align: "right" });
    doc.text(`תאריך: ${dateStr}`, 50, 185, { align: "right" });
    doc.text(`הזמנה: ${order.orderNumber}`, 50, 200, { align: "right" });

    // === Customer details ===
    doc.moveDown(1);
    const custY = 230;
    doc.fontSize(12).font(fontBold);
    doc.text(":לכבוד", 50, custY, { align: "right" });

    doc.fontSize(11).font(font);
    const customerName = `${order.customer.firstName} ${order.customer.lastName}`;
    doc.text(customerName, 50, custY + 18, { align: "right" });

    const address = [
      order.shippingAddress.street,
      order.shippingAddress.apartment,
      order.shippingAddress.city,
    ]
      .filter(Boolean)
      .join(", ");
    doc.text(address, 50, custY + 33, { align: "right" });
    doc.text(order.customer.phone, 50, custY + 48, { align: "right" });

    // === Items table ===
    const tableTop = custY + 80;
    const colWidths = {
      total: 80,
      price: 70,
      qty: 50,
      desc: pageWidth - 200,
    };

    // Table header
    doc.fontSize(10).font(fontBold);
    doc.rect(50, tableTop - 5, pageWidth, 22).fill("#f5f0eb");
    doc.fillColor("#2D2D3A");

    let colX = rightX;
    doc.text("פריט", colX - colWidths.desc, tableTop, {
      width: colWidths.desc,
      align: "right",
    });
    colX -= colWidths.desc;
    doc.text("כמות", colX - colWidths.qty, tableTop, {
      width: colWidths.qty,
      align: "center",
    });
    colX -= colWidths.qty;
    doc.text("מחיר", colX - colWidths.price, tableTop, {
      width: colWidths.price,
      align: "center",
    });
    colX -= colWidths.price;
    doc.text("סה״כ", colX - colWidths.total, tableTop, {
      width: colWidths.total,
      align: "left",
    });

    // Table rows
    doc.font(font).fontSize(10);
    let rowY = tableTop + 28;

    for (const item of order.items) {
      const lineTotal = item.price * item.quantity;
      colX = rightX;

      doc.text(item.titleHe, colX - colWidths.desc, rowY, {
        width: colWidths.desc,
        align: "right",
      });
      colX -= colWidths.desc;
      doc.text(String(item.quantity), colX - colWidths.qty, rowY, {
        width: colWidths.qty,
        align: "center",
      });
      colX -= colWidths.qty;
      doc.text(`${item.price.toFixed(2)} ₪`, colX - colWidths.price, rowY, {
        width: colWidths.price,
        align: "center",
      });
      colX -= colWidths.price;
      doc.text(`${lineTotal.toFixed(2)} ₪`, colX - colWidths.total, rowY, {
        width: colWidths.total,
        align: "left",
      });

      // Row separator
      rowY += 20;
      doc
        .moveTo(50, rowY - 3)
        .lineTo(rightX, rowY - 3)
        .strokeColor("#e5e0db")
        .stroke();
      rowY += 5;
    }

    // === Totals ===
    const totalsX = 50;
    const totalsWidth = 200;
    rowY += 10;

    doc.font(font).fontSize(10);

    // Subtotal
    doc.text("סה״כ לפני מע״מ", totalsX + totalsWidth, rowY, {
      width: 150,
      align: "right",
    });
    const beforeVat = order.subtotal / (1 + VAT_RATE);
    doc.text(`${beforeVat.toFixed(2)} ₪`, totalsX, rowY, {
      width: totalsWidth,
      align: "left",
    });
    rowY += 18;

    // VAT
    doc.text(`מע״מ (${(VAT_RATE * 100).toFixed(0)}%)`, totalsX + totalsWidth, rowY, {
      width: 150,
      align: "right",
    });
    const vatAmount = order.subtotal - beforeVat;
    doc.text(`${vatAmount.toFixed(2)} ₪`, totalsX, rowY, {
      width: totalsWidth,
      align: "left",
    });
    rowY += 18;

    // Shipping
    if (order.shipping > 0) {
      doc.text("משלוח", totalsX + totalsWidth, rowY, {
        width: 150,
        align: "right",
      });
      doc.text(`${order.shipping.toFixed(2)} ₪`, totalsX, rowY, {
        width: totalsWidth,
        align: "left",
      });
      rowY += 18;
    }

    // Discount
    if (order.discount > 0) {
      doc.text("הנחה", totalsX + totalsWidth, rowY, {
        width: 150,
        align: "right",
      });
      doc.text(`${order.discount.toFixed(2)}- ₪`, totalsX, rowY, {
        width: totalsWidth,
        align: "left",
      });
      rowY += 18;
    }

    // Total
    rowY += 5;
    doc
      .moveTo(totalsX, rowY)
      .lineTo(totalsX + totalsWidth + 150, rowY)
      .strokeColor("#2D2D3A")
      .lineWidth(1.5)
      .stroke();
    rowY += 10;

    doc.font(fontBold).fontSize(14);
    doc.text("סה״כ לתשלום", totalsX + totalsWidth, rowY, {
      width: 150,
      align: "right",
    });
    doc.fillColor("#FF6B47");
    doc.text(`${order.total.toFixed(2)} ₪`, totalsX, rowY, {
      width: totalsWidth,
      align: "left",
    });

    // === Footer ===
    doc.fillColor("#999");
    doc.font(font).fontSize(8);
    doc.text(
      "מסמך זה הופק באופן אוטומטי ואינו דורש חתימה. תודה שקניתם ב-ShipMate!",
      50,
      doc.page.height - 60,
      { align: "center", width: pageWidth }
    );

    doc.end();
  });
}

/**
 * HTTP Cloud Function — Generate Invoice
 */
functions.http("generateInvoice", async (req, res) => {
  try {
    // Verify Cloud Tasks header (internal only)
    const taskHeader = req.headers["x-cloudtasks-taskname"];
    if (!taskHeader && process.env.NODE_ENV === "production") {
      res.status(403).json({ error: "Forbidden — Cloud Tasks only" });
      return;
    }

    const { orderId } = req.body;
    if (!orderId) {
      res.status(400).json({ error: "Missing orderId" });
      return;
    }

    // Fetch order from Firestore
    const orderDoc = await db.doc(`orders/${orderId}`).get();
    if (!orderDoc.exists) {
      res.status(404).json({ error: `Order ${orderId} not found` });
      return;
    }

    const order = orderDoc.data() as OrderData;

    // Check if invoice already exists for this order
    const existingInvoice = await db
      .collection("invoices")
      .where("orderId", "==", orderId)
      .limit(1)
      .get();

    if (!existingInvoice.empty) {
      const existing = existingInvoice.docs[0].data();
      res.json({
        invoiceId: existingInvoice.docs[0].id,
        invoiceNumber: existing.invoiceNumber,
        message: "Invoice already exists",
      });
      return;
    }

    // Get next invoice number
    const invoiceNumber = await getNextInvoiceNumber();
    const issueDate = new Date();

    // Generate PDF
    const pdfBuffer = await generateInvoicePDF(invoiceNumber, order, issueDate);

    // Upload to Cloud Storage
    const fileName = `invoices/${issueDate.getFullYear()}/${invoiceNumber}.pdf`;
    const bucket = storage.bucket(BUCKET_NAME);
    const file = bucket.file(fileName);

    await file.save(pdfBuffer, {
      contentType: "application/pdf",
      metadata: {
        orderId,
        invoiceNumber: String(invoiceNumber),
        orderNumber: order.orderNumber,
      },
    });

    // Generate signed URL (7-day expiry)
    const [signedUrl] = await file.getSignedUrl({
      action: "read",
      expires: Date.now() + 7 * 24 * 60 * 60 * 1000, // 7 days
    });

    // Save invoice record to Firestore
    const invoiceRef = db.collection("invoices").doc();
    await invoiceRef.set({
      invoiceNumber,
      orderId,
      orderNumber: order.orderNumber,
      customerName: `${order.customer.firstName} ${order.customer.lastName}`,
      customerEmail: order.customer.email,
      total: order.total,
      vatAmount: order.subtotal - order.subtotal / (1 + VAT_RATE),
      pdfPath: fileName,
      signedUrl,
      signedUrlExpires: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      issuedAt: FieldValue.serverTimestamp(),
    });

    // Update order with invoice reference
    await db.doc(`orders/${orderId}`).update({
      invoiceId: invoiceRef.id,
      invoiceNumber,
      invoicePdfPath: fileName,
    });

    console.log(`Invoice ${invoiceNumber} generated for order ${order.orderNumber}`);

    res.json({
      invoiceId: invoiceRef.id,
      invoiceNumber,
      pdfPath: fileName,
      signedUrl,
    });
  } catch (error) {
    console.error("Invoice generation error:", error);
    res.status(500).json({ error: "Failed to generate invoice" });
  }
});
