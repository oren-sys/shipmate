import * as ff from "@google-cloud/functions-framework";
import { Storage } from "@google-cloud/storage";
import { initializeApp, getApps } from "firebase-admin/app";
import { getFirestore, Timestamp } from "firebase-admin/firestore";
import sharp from "sharp";

if (getApps().length === 0) {
  initializeApp({ projectId: process.env.GOOGLE_CLOUD_PROJECT || "dropship-488214" });
}

const db = getFirestore();
const storage = new Storage();
const PROJECT = process.env.GOOGLE_CLOUD_PROJECT || "dropship-488214";
const BUCKET = `${PROJECT}-products`;

interface ImageSize {
  name: string;
  width: number;
  height: number;
}

const SIZES: ImageSize[] = [
  { name: "thumb", width: 200, height: 200 },
  { name: "medium", width: 600, height: 600 },
  { name: "large", width: 1200, height: 1200 },
];

interface ProcessRequest {
  productId: string;
  imageUrls: string[];
}

ff.http("imageProcessor", async (req, res) => {
  try {
    const { productId, imageUrls }: ProcessRequest = req.body;

    if (!productId || !imageUrls || imageUrls.length === 0) {
      res.status(400).json({ error: "Missing productId or imageUrls" });
      return;
    }

    console.log(`Processing ${imageUrls.length} images for product ${productId}`);

    const processedImages: string[] = [];

    for (let i = 0; i < imageUrls.length; i++) {
      try {
        const variants = await processImage(productId, imageUrls[i], i);
        // Use medium size as the default product image
        const mediumUrl = variants.find((v) => v.includes("medium"));
        if (mediumUrl) {
          processedImages.push(mediumUrl);
        }
      } catch (error) {
        console.error(`Failed to process image ${i} for ${productId}:`, error);
      }
    }

    // Update product with processed images
    if (processedImages.length > 0) {
      await db.collection("products").doc(productId).update({
        images: processedImages,
        updatedAt: Timestamp.now(),
      });

      // Also update search index image
      const searchDoc = await db.collection("searchIndex").doc(productId).get();
      if (searchDoc.exists) {
        await searchDoc.ref.update({
          image: processedImages[0],
        });
      }
    }

    console.log(`Processed ${processedImages.length} images for ${productId}`);
    res.json({
      success: true,
      productId,
      images: processedImages,
    });
  } catch (error: any) {
    console.error("Image processor error:", error);
    res.status(500).json({ error: error.message });
  }
});

async function processImage(
  productId: string,
  imageUrl: string,
  index: number
): Promise<string[]> {
  // Download the original image
  let buffer: Buffer;

  if (imageUrl.startsWith("https://storage.googleapis.com/")) {
    // Image is already in Cloud Storage — download from bucket
    const urlPath = imageUrl.replace(`https://storage.googleapis.com/${BUCKET}/`, "");
    const [data] = await storage.bucket(BUCKET).file(urlPath).download();
    buffer = data;
  } else {
    // External URL — fetch it
    const response = await fetch(imageUrl);
    if (!response.ok) throw new Error(`Failed to fetch ${imageUrl}: ${response.status}`);
    buffer = Buffer.from(await response.arrayBuffer());
  }

  const uploadedUrls: string[] = [];

  // Generate each size variant as WebP
  for (const size of SIZES) {
    try {
      const processed = await sharp(buffer)
        .resize(size.width, size.height, {
          fit: "cover",
          position: "centre",
        })
        .webp({ quality: 85 })
        .toBuffer();

      const filePath = `products/${productId}/${size.name}-${index}.webp`;
      const file = storage.bucket(BUCKET).file(filePath);

      await file.save(processed, {
        contentType: "image/webp",
        resumable: false,
        metadata: {
          cacheControl: "public, max-age=31536000",
        },
      });

      const url = `https://storage.googleapis.com/${BUCKET}/${filePath}`;
      uploadedUrls.push(url);
    } catch (error) {
      console.error(`Failed to create ${size.name} variant for image ${index}:`, error);
    }
  }

  return uploadedUrls;
}
