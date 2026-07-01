import fs from "node:fs";
import path from "node:path";
import { PGlite } from "@electric-sql/pglite";
import { describe, expect, it } from "vitest";

describe("PostgreSQL migration", () => {
  it("applies the initial Prisma migration and creates core tables and indexes", async () => {
    const migrationSql = fs.readFileSync(
      path.join(process.cwd(), "prisma", "migrations", "20260630000000_init_postgresql", "migration.sql"),
      "utf8"
    );
    const db = new PGlite();

    await db.exec(migrationSql);

    const tables = await db.query<{ table_name: string }>(
      "select table_name from information_schema.tables where table_schema = 'public' order by table_name"
    );
    expect(tables.rows.map((row) => row.table_name)).toEqual(
      expect.arrayContaining([
        "Assignment",
        "AuditLog",
        "Complaint",
        "Doctor",
        "Document",
        "EducationRecord",
        "Facility",
        "RecommendationCandidate",
        "RecommendationRequest",
        "User"
      ])
    );

    const uniqueIndex = await db.query<{ indexname: string }>(
      "select indexname from pg_indexes where schemaname = 'public' and indexname = 'RecommendationCandidate_recommendationRequestId_doctorId_key'"
    );
    expect(uniqueIndex.rows).toHaveLength(1);

    await db.close();
  }, 30_000);
});
