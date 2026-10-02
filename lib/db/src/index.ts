import { drizzle } from "drizzle-orm/node-postgres";
import pg from "pg";
import * as schema from "./schema";

const { Pool } = pg;

let pool: any = null;
let db: any = null;

try {
  if (process.env.DATABASE_URL) {
    pool = new Pool({ connectionString: process.env.DATABASE_URL });
    db = drizzle(pool, { schema });
  } else {
    throw new Error("DATABASE_URL is not defined");
  }
} catch {
  console.warn("[AI Studio] Database not connected — using mock");
  const noOp = {
    findMany: async () => [],
    findFirst: async () => null,
    findUnique: async () => null,
    create: async (d: any) => d?.data ?? {},
    update: async (d: any) => d?.data ?? {},
    delete: async () => ({}),
  };
  const mockQuery = {
    select: () => ({
      from: () => ({
        orderBy: async () => [],
      }),
    }),
    insert: () => ({
      values: (val: any) => ({
        returning: async () => [val],
      }),
    }),
  };
  db = new Proxy(mockQuery, {
    get: (target: any, prop: string) => {
      if (prop in target) return target[prop];
      if (prop === "query") return new Proxy({}, { get: () => noOp });
      return () => ({ from: () => ({ orderBy: async () => [] }), values: (val: any) => ({ returning: async () => [val] }) });
    },
  });
}

export { pool, db };
export * from "./schema";
