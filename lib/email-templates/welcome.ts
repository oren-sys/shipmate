import { baseLayout, emailButton, emailDivider, emailHeading, emailText, emailMuted } from "./base-layout";

interface WelcomeData {
  customerName: string;
  couponCode?: string;
}

export function welcomeEmail(data: WelcomeData): { subject: string; html: string } {
  const content = `
    ${emailHeading("ברוכים הבאים ל-ShipMate! 🚀")}
    ${emailText(`שלום ${data.customerName},`)}
    ${emailText("שמחים שהצטרפת למשפחת ShipMate! אנחנו כאן כדי להביא לך מוצרים מגניבים מכל העולם, במחירים שלא תאמינו.")}

    <!-- Features -->
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin: 20px 0;">
      <tr>
        <td style="padding: 12px 0;">
          <table role="presentation" cellpadding="0" cellspacing="0">
            <tr>
              <td style="padding-left: 12px; font-size: 24px; vertical-align: top;">📦</td>
              <td>
                <span style="font-size: 14px; font-weight: 700; color: #2D2D3A;">משלוח לכל הארץ</span><br>
                <span style="font-size: 13px; color: #999;">חינם מעל ₪199</span>
              </td>
            </tr>
          </table>
        </td>
      </tr>
      <tr>
        <td style="padding: 12px 0;">
          <table role="presentation" cellpadding="0" cellspacing="0">
            <tr>
              <td style="padding-left: 12px; font-size: 24px; vertical-align: top;">🔒</td>
              <td>
                <span style="font-size: 14px; font-weight: 700; color: #2D2D3A;">תשלום מאובטח</span><br>
                <span style="font-size: 13px; color: #999;">עד 3 תשלומים ללא ריבית</span>
              </td>
            </tr>
          </table>
        </td>
      </tr>
      <tr>
        <td style="padding: 12px 0;">
          <table role="presentation" cellpadding="0" cellspacing="0">
            <tr>
              <td style="padding-left: 12px; font-size: 24px; vertical-align: top;">↩️</td>
              <td>
                <span style="font-size: 14px; font-weight: 700; color: #2D2D3A;">30 יום להחזרה</span><br>
                <span style="font-size: 13px; color: #999;">ללא שאלות, ללא טרחה</span>
              </td>
            </tr>
          </table>
        </td>
      </tr>
    </table>

    ${data.couponCode ? `
    ${emailDivider()}
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color: #1A7A6D; border-radius: 12px; margin: 16px 0;">
      <tr>
        <td style="padding: 20px; text-align: center;">
          <span style="font-size: 14px; color: rgba(255,255,255,0.8);">מתנת הצטרפות — 10% הנחה!</span><br>
          <span style="font-size: 28px; font-weight: 800; color: #ffffff; font-family: monospace; letter-spacing: 2px;">${data.couponCode}</span>
        </td>
      </tr>
    </table>
    ` : ""}

    ${emailButton("לצפות במוצרים 🔥", "https://shipmate.store")}

    ${emailDivider()}
    ${emailMuted("עקבו אחרינו ברשתות החברתיות לעדכונים ומבצעים!")}
  `;

  return {
    subject: `🚀 ברוכים הבאים ל-ShipMate! ${data.couponCode ? `קוד הנחה: ${data.couponCode}` : ""}`,
    html: baseLayout(content, {
      preheader: `שמחים שהצטרפת! ${data.couponCode ? `קוד הנחה ${data.couponCode} מחכה לך.` : "מוצרים מגניבים מחכים לך."}`,
    }),
  };
}
