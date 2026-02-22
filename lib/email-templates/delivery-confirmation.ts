import { baseLayout, emailButton, emailDivider, emailHeading, emailText, emailMuted } from "./base-layout";

interface DeliveryData {
  customerName: string;
  orderNumber: string;
  productName: string;
  reviewUrl: string;
}

export function deliveryConfirmationEmail(data: DeliveryData): { subject: string; html: string } {
  const content = `
    ${emailHeading("החבילה שלך הגיעה! 🎁")}
    ${emailText(`שלום ${data.customerName},`)}
    ${emailText(`ההזמנה שלך (${data.orderNumber}) סומנה כנמסרה. מקווים שנהנית!`)}

    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color: #1A7A6D; border-radius: 12px; margin: 20px 0;">
      <tr>
        <td style="padding: 24px; text-align: center;">
          <span style="font-size: 40px;">⭐</span>
          <p style="margin: 12px 0 4px; font-size: 18px; font-weight: 700; color: #ffffff;">ספרו לנו מה חשבתם!</p>
          <p style="margin: 0 0 16px; font-size: 13px; color: rgba(255,255,255,0.8);">הביקורת שלכם עוזרת לקונים אחרים לבחור</p>
          <a href="${data.reviewUrl}" style="display: inline-block; background-color: #ffffff; color: #1A7A6D; font-size: 15px; font-weight: 700; padding: 12px 28px; border-radius: 10px; text-decoration: none;">
            כתוב ביקורת ⭐
          </a>
        </td>
      </tr>
    </table>

    ${emailDivider()}
    ${emailText("משהו לא בסדר? אנחנו כאן כדי לעזור. פנו אלינו בוואטסאפ או באימייל ונסדר הכל.")}
    ${emailMuted("זכרו — יש לכם 30 יום להחזרה ללא שאלות.")}
  `;

  return {
    subject: `🎁 החבילה שלך הגיעה! ספרו לנו מה חשבתם — ShipMate`,
    html: baseLayout(content, {
      preheader: `ההזמנה ${data.orderNumber} נמסרה! מה דעתך על ${data.productName}?`,
    }),
  };
}
