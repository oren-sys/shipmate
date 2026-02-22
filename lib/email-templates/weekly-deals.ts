import { baseLayout, emailButton, emailDivider, emailHeading, emailText, emailMuted } from "./base-layout";

interface DealProduct {
  titleHe: string;
  price: number;
  compareAtPrice: number;
  image: string;
  slug: string;
}

interface WeeklyDealsData {
  customerName: string;
  deals: DealProduct[];
  weekLabel: string;
}

export function weeklyDealsEmail(data: WeeklyDealsData): { subject: string; html: string } {
  const dealCards = data.deals
    .slice(0, 6)
    .map((deal) => {
      const discount = Math.round(((deal.compareAtPrice - deal.price) / deal.compareAtPrice) * 100);
      return `
      <td style="width: 50%; padding: 8px; vertical-align: top;">
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color: #ffffff; border-radius: 10px; border: 1px solid #f5f0eb; overflow: hidden;">
          ${deal.image ? `
          <tr>
            <td style="text-align: center; background-color: #FFF8F4;">
              <img src="${deal.image}" alt="${deal.titleHe}" width="150" height="150" style="display: block; margin: 0 auto; max-width: 100%; height: auto;">
            </td>
          </tr>` : ""}
          <tr>
            <td style="padding: 12px;">
              <p style="margin: 0 0 8px; font-size: 13px; color: #2D2D3A; line-height: 1.3; min-height: 2.5em;">${deal.titleHe}</p>
              <p style="margin: 0;">
                <span style="font-size: 18px; font-weight: 800; color: #FF6B47;">₪${deal.price.toFixed(0)}</span>
                <span style="font-size: 12px; color: #999; text-decoration: line-through; margin-right: 4px;">₪${deal.compareAtPrice.toFixed(0)}</span>
                <span style="font-size: 11px; font-weight: 700; color: #ffffff; background-color: #FF6B47; padding: 2px 6px; border-radius: 4px; margin-right: 4px;">${discount}%-</span>
              </p>
            </td>
          </tr>
        </table>
      </td>`;
    })
    .reduce((rows: string[], card, i) => {
      if (i % 2 === 0) rows.push(`<tr>${card}`);
      else rows[rows.length - 1] += `${card}</tr>`;
      return rows;
    }, [])
    .join("");

  const content = `
    ${emailHeading(`🔥 דילים שבועיים — ${data.weekLabel}`)}
    ${emailText(`שלום ${data.customerName},`)}
    ${emailText("ריכזנו בשבילך את המבצעים הכי שווים של השבוע. אל תפספסו!")}

    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin: 16px 0;">
      ${dealCards}
    </table>

    ${emailButton("לכל המבצעים 🛒", "https://shipmate.store/category/deals")}

    ${emailDivider()}
    ${emailMuted("מבצעים תקפים עד סוף השבוע או עד גמר המלאי.")}
  `;

  return {
    subject: `🔥 דילים שבועיים — עד ${data.deals.length > 0 ? Math.max(...data.deals.map(d => Math.round(((d.compareAtPrice - d.price) / d.compareAtPrice) * 100))) : 0}% הנחה! — ShipMate`,
    html: baseLayout(content, {
      preheader: `${data.deals.length} מבצעים חמים מחכים לך השבוע!`,
    }),
  };
}
