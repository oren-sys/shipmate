import { TranslationServiceClient } from "@google-cloud/translate";

const client = new TranslationServiceClient();
const PROJECT = process.env.GOOGLE_CLOUD_PROJECT || "dropship-488214";

export async function translateToHebrew(text: string): Promise<string> {
  const [response] = await client.translateText({
    parent: `projects/${PROJECT}/locations/global`,
    contents: [text],
    mimeType: "text/plain",
    targetLanguageCode: "he",
    sourceLanguageCode: "en",
  });
  return response.translations?.[0]?.translatedText || text;
}

export async function translateBatch(texts: string[]): Promise<string[]> {
  if (texts.length === 0) return [];
  const [response] = await client.translateText({
    parent: `projects/${PROJECT}/locations/global`,
    contents: texts,
    mimeType: "text/plain",
    targetLanguageCode: "he",
    sourceLanguageCode: "en",
  });
  return response.translations?.map((t) => t.translatedText || "") || texts;
}
