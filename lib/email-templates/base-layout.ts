/**
 * Base Email Layout
 *
 * Responsive, mobile-first, RTL Hebrew email template.
 * Inline CSS for maximum email client compatibility.
 * ShipMate branding: coral #FF6B47, teal #1A7A6D, cream #FFF8F4.
 */

export interface EmailLayoutOptions {
  preheader?: string;
  showUnsubscribe?: boolean;
}

export function baseLayout(
  content: string,
  options: EmailLayoutOptions = {}
): string {
  const { preheader = "", showUnsubscribe = true } = options;

  return `<!DOCTYPE html>
<html lang="he" dir="rtl">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <meta http-equiv="X-UA-Compatible" content="IE=edge">
  <title>ShipMate שיפמייט</title>
  <!--[if mso]>
  <noscript>
    <xml>
      <o:OfficeDocumentSettings>
        <o:PixelsPerInch>96</o:PixelsPerInch>
      </o:OfficeDocumentSettings>
    </xml>
  </noscript>
  <![endif]-->
</head>
<body style="margin: 0; padding: 0; background-color: #FFF8F4; font-family: 'Heebo', Arial, sans-serif; direction: rtl; text-align: right; -webkit-text-size-adjust: 100%; -ms-text-size-adjust: 100%;">
  ${preheader ? `<div style="display: none; max-height: 0; overflow: hidden; font-size: 1px; line-height: 1px; color: #FFF8F4;">${preheader}</div>` : ""}

  <!-- Wrapper -->
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color: #FFF8F4;">
    <tr>
      <td align="center" style="padding: 20px 10px;">
        <!-- Container -->
        <table role="presentation" width="600" cellpadding="0" cellspacing="0" style="max-width: 600px; width: 100%; background-color: #ffffff; border-radius: 16px; overflow: hidden; box-shadow: 0 2px 8px rgba(0,0,0,0.05);">

          <!-- Header -->
          <tr>
            <td style="background-color: #FF6B47; padding: 24px 30px; text-align: center;">
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
                <tr>
                  <td style="text-align: center;">
                    <span style="font-size: 28px; font-weight: 800; color: #ffffff; font-family: 'Nunito', Arial, sans-serif; letter-spacing: -0.5px;">
                      📦 ShipMate
                    </span>
                    <br>
                    <span style="font-size: 12px; color: rgba(255,255,255,0.85); font-family: 'Heebo', Arial, sans-serif;">
                      שיפמייט — החבר שלך לקניות חכמות
                    </span>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Content -->
          <tr>
            <td style="padding: 30px;">
              ${content}
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="background-color: #2D2D3A; padding: 24px 30px; text-align: center;">
              <p style="margin: 0 0 8px; color: rgba(255,255,255,0.6); font-size: 12px;">
                © 2026 ShipMate | שיפמייט. כל הזכויות שמורות.
              </p>
              <p style="margin: 0 0 8px; color: rgba(255,255,255,0.4); font-size: 11px;">
                תל אביב, ישראל
              </p>
              ${
                showUnsubscribe
                  ? `<p style="margin: 0;">
                      <a href="https://shipmate.store/unsubscribe" style="color: #FF6B47; font-size: 11px; text-decoration: underline;">
                        הסרה מרשימת התפוצה
                      </a>
                    </p>`
                  : ""
              }
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
}

/**
 * Reusable email components
 */

export function emailButton(text: string, url: string, color: string = "#FF6B47"): string {
  return `
    <table role="presentation" cellpadding="0" cellspacing="0" style="margin: 24px auto;">
      <tr>
        <td style="background-color: ${color}; border-radius: 12px; padding: 14px 32px; text-align: center;">
          <a href="${url}" style="color: #ffffff; font-size: 16px; font-weight: 700; text-decoration: none; font-family: 'Heebo', Arial, sans-serif; display: inline-block;">
            ${text}
          </a>
        </td>
      </tr>
    </table>`;
}

export function emailDivider(): string {
  return `<hr style="border: none; border-top: 1px solid #e5e0db; margin: 20px 0;">`;
}

export function emailHeading(text: string): string {
  return `<h2 style="margin: 0 0 16px; font-size: 22px; font-weight: 700; color: #2D2D3A; font-family: 'Heebo', Arial, sans-serif;">${text}</h2>`;
}

export function emailText(text: string): string {
  return `<p style="margin: 0 0 12px; font-size: 15px; line-height: 1.6; color: #2D2D3A; font-family: 'Heebo', Arial, sans-serif;">${text}</p>`;
}

export function emailMuted(text: string): string {
  return `<p style="margin: 0 0 8px; font-size: 13px; line-height: 1.5; color: #999; font-family: 'Heebo', Arial, sans-serif;">${text}</p>`;
}
