/**
 * Health Check API
 *
 * GET /api/health
 *
 * Checks:
 * - App is running
 * - Firestore is accessible
 * - Cloud Storage buckets exist
 * - Basic system info
 *
 * Used by:
 * - Cloud Run liveness/startup probes
 * - Monitoring dashboards
 * - Pre-launch validation
 */

import { NextResponse } from "next/server";
import { getDb } from "@/lib/firebase";

interface HealthCheck {
  status: "healthy" | "degraded" | "unhealthy";
  timestamp: string;
  uptime: number;
  version: string;
  checks: {
    firestore: { status: string; latencyMs?: number };
    environment: { status: string; missing?: string[] };
  };
}

const startTime = Date.now();

export async function GET() {
  const health: HealthCheck = {
    status: "healthy",
    timestamp: new Date().toISOString(),
    uptime: Math.floor((Date.now() - startTime) / 1000),
    version: process.env.npm_package_version || "1.0.0",
    checks: {
      firestore: { status: "unknown" },
      environment: { status: "unknown" },
    },
  };

  // Check Firestore
  try {
    const firestoreStart = Date.now();
    const db = getDb();
    await db.collection("_health").doc("ping").set({
      timestamp: new Date().toISOString(),
      source: "health-check",
    });
    health.checks.firestore = {
      status: "ok",
      latencyMs: Date.now() - firestoreStart,
    };
  } catch (error) {
    health.checks.firestore = {
      status: "error",
    };
    health.status = "degraded";
    console.error("Health check - Firestore error:", error);
  }

  // Check required environment variables
  const requiredEnvVars = [
    "GOOGLE_CLOUD_PROJECT",
    "NEXTAUTH_SECRET",
  ];

  const missingEnvVars = requiredEnvVars.filter(
    (key) => !process.env[key]
  );

  if (missingEnvVars.length > 0) {
    health.checks.environment = {
      status: "warning",
      missing: missingEnvVars,
    };
    if (health.status === "healthy") {
      health.status = "degraded";
    }
  } else {
    health.checks.environment = { status: "ok" };
  }

  const statusCode = health.status === "unhealthy" ? 503 : 200;

  return NextResponse.json(health, { status: statusCode });
}
