import { neon } from "@neondatabase/serverless";
import { drizzle } from "drizzle-orm/neon-http";
import * as schema from "./schema";

if (!process.env.DATABASE_URL) {
  throw new Error("DATABASE_URL이 설정되지 않았습니다 (.env.local 확인)");
}

const sql = neon(process.env.DATABASE_URL);

export const db = drizzle({ client: sql, schema });
