import { baseLayout, emailButton, emailDivider, emailHeading, emailText, emailMuted } from "./base-layout";

interface OrderItem {
  titleHe: string;
  quantity: number;
  price: number;
}

interface OrderConfirmationData {
  customerName: string;
  orderNumber: string;
  items: OrderItem[];
  subtotal: number;
  shipping: number;
  discount: number;
  total: number;
  shippingAddress: string;
}

export function orderConfirmationEmail(data: OrderConfirmationData): { subject: string; html: string } {
  const itemRows = data.items
    .map(
      (item) => `
      <tr>
        <td style="padding: 8px 0; font-size: 14px; color: #2D2D3A; border-bottom: 1px solid #f5f0eb;">
          ${item.titleHe}
          <span style="color: #999;">×${item.quantity}</span>
        </td>
        <td style="padding: 8px 0; font-size: 14px; color: #2D2D3A; text-align: left; border-bottom: 1px solid #f5f0eb; white-space: nowrap;">
          ₪${(item.price * item.quantity).toFixed(0)}
        </td>
      </tr>`
    )
    .join("");

  const content = `
    ${emailHeading("ההזמנה שלך התקבלה! 🎉")}
    ${emailText(`שלום ${data.customerName},`)}
    ${emailText("תודה שקנית ב-ShipMate! קיבלנו את ההזמנה שלך ונתחיל לטפל בה מיד.")}

    <!-- Order number -->
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color: #FFF8F4; border-radius: 12px; margin: 16px 0;">
      <tr>
        <td style="padding: 16px; text-align: center;">
          <span style="font-size: 13px; color: #999;">מספר הזמנה</span><br>
          <span style="font-size: 24px; font-weight: 800; color: #FF6B47; font-family: monospace;">${data.orderNumber}</span>
        </td>
      </tr>
    </table>

    ${emailDivider()}

    <!-- Items table -->
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
      ${itemRows}
    </table>

    <!-- Totals -->
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin-top: 12px;">
      <tr>
        <td style="padding: 4px 0; font-size: 13px; color: #999;">סה״כ מוצרים</td>
        <td style="padding: 4px 0; font-size: 13px; color: #2D2D3A; text-align: left;">₪${data.subtotal.toFixed(0)}</td>
      </tr>
      ${data.discount > 0 ? `
      <tr>
        <td style="padding: 4px 0; font-size: 13px; color: #1A7A6D;">הנחה</td>
        <td style="padding: 4px 0; font-size: 13px; color: #1A7A6D; text-align: left;">-₪${data.discount.toFixed(0)}</td>
      </tr>` : ""}
      <tr>
        <td style="padding: 4px 0; font-size: 13px; color: #999;">משלוח</td>
        <td style="padding: 4px 0; font-size: 13px; color: ${data.shipping === 0 ? "#1A7A6D" : "#2D2D3A"}; text-align: left;">
          ${data.shipping === 0 ? "חינם! 🎉" : `₪${data.shipping.toFixed(0)}`}
        </td>
      </tr>
      <tr>
        <td style="padding: 12px 0 4px; font-size: 18px; font-weight: 700; color: #2D2D3A; border-top: 2px solid #2D2D3A;">סה״כ</td>
        <td style="padding: 12px 0 4px; font-size: 18px; font-weight: 700; color: #FF6B47; text-align: left; border-top: 2px solid #2D2D3A;">₪${data.total.toFixed(0)}</td>
      </tr>
    </table>

    ${emailDivider()}

    ${emailMuted(`נשלח ל: ${data.shippingAddress}`)}
    ${emailMuted("הגעה משוערת: 10-21 ימי עסקים")}

    ${emailButton("צפה בהזמנה", `https://shipmate.store/order-confirmation/${data.orderNumber}`)}

    ${emailMuted("יש שאלות? אנחנו כאן בשבילך — פנו אלינו בוואטסאפ או באימייל.")}
  `;

  return {
    subject: `✅ ההזמנה שלך ${data.orderNumber} התקבלה — ShipMate`,
    html: baseLayout(content, {
      preheader: `ההזמנה ${data.orderNumber} אושרה! תודה שקנית ב-ShipMate.`,
    }),
  };
}
