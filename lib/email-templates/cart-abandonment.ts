import { baseLayout, emailButton, emailDivider, emailHeading, emailText, emailMuted } from "./base-layout";

interface CartItem {
  titleHe: string;
  price: number;
  image?: string;
}

interface CartAbandonmentData {
  customerName: string;
  items: CartItem[];
  total: number;
  cartUrl: string;
}

/**
 * Cart Abandonment Email Sequence
 *
 * Stage 1 (1 hour):  Gentle reminder
 * Stage 2 (24 hours): +10% coupon
 * Stage 3 (48 hours): +15% coupon + urgency
 */

export function cartAbandonmentStage1(data: CartAbandonmentData): { subject: string; html: string } {
  const itemsList = data.items
    .map(
      (item) => `
      <tr>
        <td style="padding: 8px 0; font-size: 14px; color: #2D2D3A; border-bottom: 1px solid #f5f0eb;">
          ${item.titleHe}
        </td>
        <td style="padding: 8px 0; font-size: 14px; font-weight: 600; color: #FF6B47; text-align: left; border-bottom: 1px solid #f5f0eb;">
          ₪${item.price.toFixed(0)}
        </td>
      </tr>`
    )
    .join("");

  const content = `
    ${emailHeading("שכחת משהו? 🛒")}
    ${emailText(`שלום ${data.customerName},`)}
    ${emailText("שמנו לב שהשארת פריטים בסל הקניות. הם עדיין מחכים לך!")}

    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin: 16px 0;">
      ${itemsList}
    </table>

    <p style="margin: 16px 0 0; font-size: 18px; font-weight: 700; color: #2D2D3A; text-align: left;">
      סה״כ: <span style="color: #FF6B47;">₪${data.total.toFixed(0)}</span>
    </p>

    ${emailButton("חזרו לסל הקניות", data.cartUrl)}

    ${emailDivider()}
    ${emailMuted("הפריטים בסל שלך שמורים לזמן מוגבל.")}
  `;

  return {
    subject: `🛒 שכחת משהו בסל? — ShipMate`,
    html: baseLayout(content, {
      preheader: `${data.items.length} פריטים מחכים לך בסל הקניות`,
    }),
  };
}

export function cartAbandonmentStage2(
  data: CartAbandonmentData & { couponCode: string }
): { subject: string; html: string } {
  const discountAmount = +(data.total * 0.1).toFixed(0);

  const content = `
    ${emailHeading("קיבלת 10% הנחה! 🎁")}
    ${emailText(`שלום ${data.customerName},`)}
    ${emailText("עדיין חושבים על הפריטים בסל? יש לנו הפתעה קטנה בשבילכם...")}

    <!-- Coupon box -->
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color: #FF6B47; border-radius: 12px; margin: 20px 0;">
      <tr>
        <td style="padding: 24px; text-align: center;">
          <span style="font-size: 14px; color: rgba(255,255,255,0.8);">קוד קופון</span><br>
          <span style="font-size: 32px; font-weight: 800; color: #ffffff; font-family: monospace; letter-spacing: 3px;">${data.couponCode}</span><br>
          <span style="font-size: 16px; color: #ffffff; font-weight: 600;">10% הנחה — חיסכון של ₪${discountAmount}</span>
        </td>
      </tr>
    </table>

    ${emailButton("לממש את ההנחה 🔥", `${data.cartUrl}?coupon=${data.couponCode}`)}

    ${emailDivider()}
    ${emailMuted("הקופון תקף ל-24 שעות בלבד.")}
  `;

  return {
    subject: `🎁 קיבלת 10% הנחה על הסל שלך! — ShipMate`,
    html: baseLayout(content, {
      preheader: `קוד קופון ${data.couponCode} — 10% הנחה מחכה לך!`,
    }),
  };
}

export function cartAbandonmentStage3(
  data: CartAbandonmentData & { couponCode: string }
): { subject: string; html: string } {
  const discountAmount = +(data.total * 0.15).toFixed(0);

  const content = `
    ${emailHeading("הזדמנות אחרונה! ⏰")}
    ${emailText(`שלום ${data.customerName},`)}
    ${emailText("הפריטים בסל שלך עומדים להיגמר... והעלנו את ההנחה במיוחד בשבילך!")}

    <!-- Urgency banner -->
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background: linear-gradient(135deg, #FF6B47, #e55a3a); border-radius: 12px; margin: 20px 0;">
      <tr>
        <td style="padding: 24px; text-align: center;">
          <span style="font-size: 48px;">⏰</span><br>
          <span style="font-size: 14px; color: rgba(255,255,255,0.8);">קוד קופון — רק היום!</span><br>
          <span style="font-size: 36px; font-weight: 800; color: #ffffff; font-family: monospace; letter-spacing: 3px;">${data.couponCode}</span><br>
          <span style="font-size: 20px; color: #FFD23F; font-weight: 700;">15% הנחה — חיסכון של ₪${discountAmount}!</span>
        </td>
      </tr>
    </table>

    ${emailButton("לממש עכשיו — לפני שנגמר! 🏃", `${data.cartUrl}?coupon=${data.couponCode}`)}

    ${emailDivider()}
    ${emailMuted("הקופון תקף ל-12 שעות בלבד. אחרי זה — חוזרים למחיר מלא.")}
  `;

  return {
    subject: `⏰ הזדמנות אחרונה! 15% הנחה על הסל שלך — ShipMate`,
    html: baseLayout(content, {
      preheader: `15% הנחה — ${data.couponCode} — רק היום!`,
    }),
  };
}
