import { db } from "@/lib/db";

let dbAvailable: boolean | null = null;

/**
 * Check if database is available (not all environments have SQLite)
 * Caches the result for performance
 */
export async function isDbAvailable(): Promise<boolean> {
  if (dbAvailable !== null) return dbAvailable;

  try {
    // Try a simple query
    await db.tenant.count();
    dbAvailable = true;
  } catch {
    dbAvailable = false;
    console.log("[DB] Database not available, using demo data");
  }

  return dbAvailable;
}

/**
 * Try to execute a database operation, return fallback if fails
 */
export async function withDbFallback<T>(
  operation: () => Promise<T>,
  fallback: T
): Promise<T> {
  try {
    if (!(await isDbAvailable())) return fallback;
    return await operation();
  } catch (error) {
    console.error("[DB] Query failed, using fallback:", error);
    return fallback;
  }
}
