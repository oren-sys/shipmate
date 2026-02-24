/**
 * Fix existing products:
 * 1. Shorten long Hebrew titles (remove filler words, cap at 8 words)
 * 2. Translate English descriptions to Hebrew (if missing)
 *
 * Run: npx tsx scripts/fix-existing-products.ts
 */
import { initializeApp, cert, getApps } from "firebase-admin/app";
import { getFirestore, Timestamp } from "firebase-admin/firestore";
import { TranslationServiceClient } from "@google-cloud/translate";

// Init Firebase
if (getApps().length === 0) {
  initializeApp({ projectId: "dropship-488214" });
}
const db = getFirestore();

// Init Translate
const translateClient = new TranslationServiceClient();
const PROJECT = "dropship-488214";

async function translateToHebrew(text: string): Promise<string> {
  const [response] = await translateClient.translateText({
    parent: `projects/${PROJECT}/locations/global`,
    contents: [text],
    mimeType: "text/plain",
    targetLanguageCode: "he",
    sourceLanguageCode: "en",
  });
  return response.translations?.[0]?.translatedText || text;
}

function shortenHebrewTitle(title: string): string {
  const fillerWords = ["עם", "של", "בעל", "כולל", "מסוג", "איכותי", "מקצועי", "חדש", "מתאים"];
  let words = title.split(/\s+/);
  if (words.length > 8) {
    words = words.filter((w) => !fillerWords.includes(w));
  }
  if (words.length > 8) {
    words = words.slice(0, 8);
  }
  return words.join(" ");
}

async function main() {
  console.log("Fixing existing products...\n");

  const snap = await db.collection("products").get();
  console.log(`Found ${snap.size} products\n`);

  let titleFixed = 0;
  let descFixed = 0;
  let errors = 0;

  for (const doc of snap.docs) {
    const data = doc.data();
    const updates: Record<string, unknown> = {};

    // 1. Shorten long Hebrew titles
    if (data.titleHe) {
      const words = data.titleHe.split(/\s+/);
      if (words.length > 8) {
        const shortened = shortenHebrewTitle(data.titleHe);
        updates.titleHe = shortened;
        console.log(`  ✂️  Title: "${data.titleHe.substring(0, 50)}..." → "${shortened}"`);
        titleFixed++;
      }
    }

    // 2. Translate description if missing Hebrew but has English
    if (!data.descriptionHe && data.descriptionEn) {
      try {
        const plainDesc = data.descriptionEn.replace(/<[^>]*>/g, "").substring(0, 2000);
        if (plainDesc.trim().length > 10) {
          const translated = await translateToHebrew(plainDesc);
          updates.descriptionHe = translated;
          console.log(`  🌐 Translated description for: ${(data.titleHe || data.titleEn || doc.id).substring(0, 40)}`);
          descFixed++;
        }
      } catch (err) {
        console.error(`  ❌ Translation failed for ${doc.id}:`, (err as Error).message);
        errors++;
      }
    }

    // Apply updates if any
    if (Object.keys(updates).length > 0) {
      updates.updatedAt = Timestamp.now();
      await db.collection("products").doc(doc.id).update(updates);
    }
  }

  console.log(`\nDone!`);
  console.log(`  Titles shortened: ${titleFixed}`);
  console.log(`  Descriptions translated: ${descFixed}`);
  console.log(`  Errors: ${errors}`);
}

main().catch(console.error);
