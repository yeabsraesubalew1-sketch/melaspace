import mongoose from "mongoose";
import { Redis } from "@upstash/redis";

// =============================
// MongoDB
// =============================

const MONGODB_URI = process.env.MONGODB_URI;

if (!MONGODB_URI) {
  throw new Error("MONGODB_URI is not defined in environment variables");
}

interface MongooseGlobal {
  conn: typeof mongoose | null;
  promise: Promise<typeof mongoose> | null;
}

// Prevent multiple connections in dev / hot reload
const globalForMongoose = globalThis as unknown as {
  mongoose?: MongooseGlobal;
};

if (!globalForMongoose.mongoose) {
  globalForMongoose.mongoose = { conn: null, promise: null };
}

export async function connectDB() {
  const cached = globalForMongoose.mongoose!;

  if (cached.conn) return cached.conn;

  if (!cached.promise) {
    cached.promise = mongoose
      .connect(MONGODB_URI as string, {
        bufferCommands: false,
      })
      .catch((error) => {
        cached.promise = null;
        throw error;
      });
  }

  try {
    cached.conn = await cached.promise;
    return cached.conn;
  } catch (error) {
    cached.promise = null;
    throw error;
  }
}

// =============================
// Upstash Redis
// =============================

const UPSTASH_REDIS_REST_URL = process.env.UPSTASH_REDIS_REST_URL;
const UPSTASH_REDIS_REST_TOKEN = process.env.UPSTASH_REDIS_REST_TOKEN;

if (!UPSTASH_REDIS_REST_URL || !UPSTASH_REDIS_REST_TOKEN) {
  throw new Error("Upstash Redis environment variables are missing");
}

export const redis = new Redis({
  url: UPSTASH_REDIS_REST_URL,
  token: UPSTASH_REDIS_REST_TOKEN,
});

// =============================
// Rate Limiting (Fixed Window)
// =============================

interface RateLimitOptions {
  key: string;           // unique identifier (ip, userId, etc.)
  limit: number;         // max requests
  window: number;        // window in seconds
}

export async function rateLimit({ key, limit, window }: RateLimitOptions) {
  const redisKey = `ratelimit:${key}`;

  const current = await redis.incr(redisKey);

  if (current === 1) {
    // first hit → set expiration
    await redis.expire(redisKey, window);
  }

  return {
    success: current <= limit,
    remaining: Math.max(0, limit - current),
  };
}
