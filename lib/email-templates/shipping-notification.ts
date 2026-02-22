import { baseLayout, emailButton, emailDivider, emailHeading, emailText, emailMuted } from "./base-layout";

interface ShippingData {
  customerName: string;
  orderNumber: string;
  trackingNumber: string;
  trackingUrl: string;
  estimatedDelivery: string;
}

export function shippingNotificationEmail(data: ShippingData): { subject: string; html: string } {
  const content = `
    ${emailHeading("ההזמנה שלך בדרך! 🚀")}
    ${emailText(`שלום ${data.customerName},`)}
    ${emailText("חדשות טובות! ההזמנה שלך נשלחה ובדרך אליך.")}

    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color: #FFF8F4; border-radius: 12px; margin: 16px 0;">
      <tr>
        <td style="padding: 16px;">
          <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
            <tr>
              <td style="font-size: 13px; color: #999; padding-bottom: 4px;">מספר הזמנה</td>
              <td style="font-size: 14px; font-weight: 700; color: #2D2D3A; text-align: left; padding-bottom: 4px;">${data.orderNumber}</td>
            </tr>
            <tr>
              <td style="font-size: 13px; color: #999; padding-bottom: 4px;">מספר מעקב</td>
              <td style="font-size: 14px; font-weight: 700; color: #FF6B47; text-align: left; padding-bottom: 4px; font-family: monospace;">${data.trackingNumber}</td>
            </tr>
            <tr>
              <td style="font-size: 13px; color: #999;">הגעה משוערת</td>
              <td style="font-size: 14px; font-weight: 600; color: #1A7A6D; text-align: left;">${data.estimatedDelivery}</td>
            </tr>
          </table>
        </td>
      </tr>
    </table>

    ${emailButton("עקוב אחרי המשלוח 📦", data.trackingUrl, "#1A7A6D")}

    ${emailDivider()}
    ${emailMuted("נעדכן אותך ברגע שהחבילה תגיע. בינתיים, אפשר לעקוב אחרי המשלוח בלינק למעלה.")}
  `;

  return {
    subject: `🚀 ההזמנה ${data.orderNumber} נשלחה! — ShipMate`,
    html: baseLayout(content, {
      preheader: `ההזמנה שלך בדרך! מספר מעקב: ${data.trackingNumber}`,
    }),
  };
}
