import { initializeApp, getApps, App } from "firebase-admin/app";
import { getFirestore, Firestore } from "firebase-admin/firestore";
import { getStorage, Storage } from "firebase-admin/storage";

let app: App;
let db: Firestore;
let storage: Storage;

function getFirebaseApp(): App {
  if (getApps().length > 0) return getApps()[0];

  // In GCP (Cloud Run/Functions), uses Application Default Credentials automatically
  // Locally, set GOOGLE_APPLICATION_CREDENTIALS or use gcloud auth
  app = initializeApp({
    projectId: process.env.GOOGLE_CLOUD_PROJECT || "dropship-488214",
    storageBucket: process.env.GCS_PRODUCTS_BUCKET || "dropship-488214-products",
  });

  return app;
}

export function getDb(): Firestore {
  if (!db) {
    db = getFirestore(getFirebaseApp());
    db.settings({ ignoreUndefinedProperties: true });
  }
  return db;
}

export function getStorageClient(): Storage {
  if (!storage) {
    storage = getStorage(getFirebaseApp());
  }
  return storage;
}
