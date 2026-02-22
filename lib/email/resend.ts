import { Resend } from "resend";

/**
 * Resend Email Service for ShipMate
 *
 * Setup:
 * 1. Sign up at https://resend.com
 * 2. Verify your domain (shipmate.store) in Resend dashboard
 * 3. Get API key and set RESEND_API_KEY env var
 *
 * Resend free tier: 3,000 emails/month, 100/day
 */

const resend = new Resend(process.env.RESEND_API_KEY || "");

const FROM_EMAIL = process.env.FROM_EMAIL || "ShipMate <noreply@shipmate.store>";
const ADMIN_EMAIL = process.env.ADMIN_EMAIL || "oren@skil.media";

/* ── Email Templates ── */

export async function sendOrderConfirmation(order: {
  orderId: string;
  customerEmail: string;
  customerName: string;
  items: { name: string; quantity: number; price: number }[];
  total: number;
  shippingDays: number;
}) {
  const itemsHtml = order.items
    .map(
      (item) =>
        `<tr>
          <td style="padding:8px 12px;border-bottom:1px solid #eee;text-align:right">${item.name}</td>
          <td style="padding:8px 12px;border-bottom:1px solid #eee;text-align:center">${item.quantity}</td>
          <td style="padding:8px 12px;border-bottom:1px solid #eee;text-align:left">₪${item.price.toFixed(2)}</td>
        </tr>`
    )
    .join("");

  return resend.emails.send({
    from: FROM_EMAIL,
    to: order.customerEmail,
    subject: `✅ הזמנה #${order.orderId} התקבלה — ShipMate`,
    html: `
      <div dir="rtl" style="font-family:'Heebo',Arial,sans-serif;max-width:600px;margin:0 auto;background:#fff">
        <div style="background:linear-gradient(135deg,#FF6B47,#E5553A);padding:30px;text-align:center;border-radius:12px 12px 0 0">
          <h1 style="color:#fff;margin:0;font-size:24px">ShipMate.store</h1>
          <p style="color:rgba(255,255,255,0.8);margin:8px 0 0">שיפמייט סטור</p>
        </div>

        <div style="padding:30px">
          <h2 style="color:#2D2D3A;margin:0 0 8px">שלום ${order.customerName}! 👋</h2>
          <p style="color:#666;margin:0 0 20px">ההזמנה שלך התקבלה בהצלחה ואנחנו כבר מטפלים בה.</p>

          <div style="background:#FFF8F4;border-radius:8px;padding:16px;margin-bottom:20px">
            <p style="margin:0;color:#2D2D3A"><strong>מספר הזמנה:</strong> #${order.orderId}</p>
            <p style="margin:4px 0 0;color:#666">זמן משלוח משוער: ${order.shippingDays}-${order.shippingDays + 5} ימי עסקים</p>
          </div>

          <table style="width:100%;border-collapse:collapse;margin-bottom:20px">
            <thead>
              <tr style="background:#f9f9f9">
                <th style="padding:10px 12px;text-align:right;color:#2D2D3A">מוצר</th>
                <th style="padding:10px 12px;text-align:center;color:#2D2D3A">כמות</th>
                <th style="padding:10px 12px;text-align:left;color:#2D2D3A">מחיר</th>
              </tr>
            </thead>
            <tbody>
              ${itemsHtml}
            </tbody>
            <tfoot>
              <tr>
                <td colspan="2" style="padding:12px;text-align:right;font-weight:bold;color:#2D2D3A">סה"כ</td>
                <td style="padding:12px;text-align:left;font-weight:bold;color:#FF6B47;font-size:18px">₪${order.total.toFixed(2)}</td>
              </tr>
            </tfoot>
          </table>

          <p style="color:#666;font-size:14px">נשלח לך עדכון ברגע שההזמנה תצא למשלוח 📦</p>

          <div style="text-align:center;margin-top:30px">
            <a href="https://shipmate.store" style="display:inline-block;background:#FF6B47;color:#fff;padding:12px 30px;border-radius:8px;text-decoration:none;font-weight:bold">
              חזרה לחנות
            </a>
          </div>
        </div>

        <div style="background:#2D2D3A;padding:20px;text-align:center;border-radius:0 0 12px 12px">
          <p style="color:rgba(255,255,255,0.5);margin:0;font-size:12px">
            ShipMate.store — שיפמייט סטור | © 2026
          </p>
        </div>
      </div>
    `,
  });
}

export async function sendShippingUpdate(data: {
  customerEmail: string;
  customerName: string;
  orderId: string;
  trackingNumber: string;
  trackingUrl: string;
}) {
  return resend.emails.send({
    from: FROM_EMAIL,
    to: data.customerEmail,
    subject: `📦 ההזמנה שלך נשלחה! — #${data.orderId}`,
    html: `
      <div dir="rtl" style="font-family:'Heebo',Arial,sans-serif;max-width:600px;margin:0 auto;background:#fff">
        <div style="background:linear-gradient(135deg,#FF6B47,#E5553A);padding:30px;text-align:center;border-radius:12px 12px 0 0">
          <h1 style="color:#fff;margin:0;font-size:24px">ShipMate.store</h1>
        </div>
        <div style="padding:30px">
          <h2 style="color:#2D2D3A">שלום ${data.customerName}! 🎉</h2>
          <p style="color:#666">ההזמנה שלך #${data.orderId} יצאה לדרך!</p>

          <div style="background:#E8F5E9;border-radius:8px;padding:16px;margin:20px 0">
            <p style="margin:0;color:#2D2D3A"><strong>מספר מעקב:</strong> ${data.trackingNumber}</p>
          </div>

          <div style="text-align:center">
            <a href="${data.trackingUrl}" style="display:inline-block;background:#1A7A6D;color:#fff;padding:12px 30px;border-radius:8px;text-decoration:none;font-weight:bold">
              🔍 עקוב אחרי המשלוח
            </a>
          </div>
        </div>
        <div style="background:#2D2D3A;padding:20px;text-align:center;border-radius:0 0 12px 12px">
          <p style="color:rgba(255,255,255,0.5);margin:0;font-size:12px">ShipMate.store © 2026</p>
        </div>
      </div>
    `,
  });
}

export async function sendAdminNotification(data: {
  subject: string;
  message: string;
}) {
  return resend.emails.send({
    from: FROM_EMAIL,
    to: ADMIN_EMAIL,
    subject: `[ShipMate Admin] ${data.subject}`,
    html: `
      <div dir="rtl" style="font-family:'Heebo',Arial,sans-serif;max-width:600px;margin:0 auto;padding:20px">
        <h2 style="color:#2D2D3A">${data.subject}</h2>
        <div style="color:#666;line-height:1.6">${data.message}</div>
        <hr style="border:none;border-top:1px solid #eee;margin:20px 0">
        <p style="color:#999;font-size:12px">ShipMate Admin Notification</p>
      </div>
    `,
  });
}

export async function sendNewsletterWelcome(data: {
  email: string;
  couponCode?: string;
}) {
  return resend.emails.send({
    from: FROM_EMAIL,
    to: data.email,
    subject: `🎁 ברוכים הבאים ל-ShipMate! הנה ההנחה שלך`,
    html: `
      <div dir="rtl" style="font-family:'Heebo',Arial,sans-serif;max-width:600px;margin:0 auto;background:#fff">
        <div style="background:linear-gradient(135deg,#FF6B47,#E5553A);padding:40px 30px;text-align:center;border-radius:12px 12px 0 0">
          <h1 style="color:#fff;margin:0;font-size:28px">ברוכים הבאים! 🎉</h1>
          <p style="color:rgba(255,255,255,0.8);margin:12px 0 0;font-size:16px">עכשיו אתם חלק ממשפחת ShipMate</p>
        </div>
        <div style="padding:30px;text-align:center">
          ${data.couponCode ? `
            <p style="color:#666;margin:0 0 20px">הנה קוד הנחה מיוחד בשבילכם:</p>
            <div style="background:#FFF8F4;border:2px dashed #FF6B47;border-radius:12px;padding:20px;margin:0 auto;max-width:300px">
              <p style="margin:0;color:#FF6B47;font-size:28px;font-weight:bold;letter-spacing:4px">${data.couponCode}</p>
              <p style="margin:8px 0 0;color:#666;font-size:14px">10% הנחה על ההזמנה הבאה</p>
            </div>
          ` : ""}
          <div style="margin-top:30px">
            <a href="https://shipmate.store" style="display:inline-block;background:#FF6B47;color:#fff;padding:14px 40px;border-radius:8px;text-decoration:none;font-weight:bold;font-size:16px">
              🛍️ בואו לגלות
            </a>
          </div>
        </div>
        <div style="background:#2D2D3A;padding:20px;text-align:center;border-radius:0 0 12px 12px">
          <p style="color:rgba(255,255,255,0.5);margin:0;font-size:12px">ShipMate.store — שיפמייט סטור</p>
        </div>
      </div>
    `,
  });
}
