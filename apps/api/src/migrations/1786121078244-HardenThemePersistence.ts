import { MigrationInterface, QueryRunner } from 'typeorm';

export class HardenThemePersistence1786121078244 implements MigrationInterface {
  name = 'HardenThemePersistence1786121078244';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`LOCK TABLE "themes" IN ACCESS EXCLUSIVE MODE`);
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "themes_quarantine_1786121078244" (
        "quarantine_id" bigserial NOT NULL,
        "id" uuid NOT NULL,
        "name" character varying(100) NOT NULL,
        "factors" jsonb NOT NULL,
        "groups" jsonb NOT NULL,
        "values" jsonb NOT NULL,
        "created_at" TIMESTAMP NOT NULL,
        "componentId" uuid,
        "reason" text NOT NULL,
        "quarantined_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
        CONSTRAINT "PK_themes_quarantine_1786121078244" PRIMARY KEY ("quarantine_id")
      )
    `);

    // Classify before normalization so quarantined evidence preserves exact
    // source bytes. The one supported legacy array form is valid only because
    // surviving rows are normalized after rejected rows have been archived.
    await queryRunner.query(`
      CREATE TEMPORARY TABLE "themes_cleanup_1786121078244" ON COMMIT DROP AS
      WITH classified AS MATERIALIZED (
        SELECT t."id",
          CASE
            WHEN t."componentId" IS NULL OR c."id" IS NULL
              THEN 'orphan_component'
            WHEN (
                t."groups" <> '[]'::jsonb
                AND jsonb_typeof(t."groups") IS DISTINCT FROM 'object'
              )
              OR jsonb_typeof(t."factors") IS DISTINCT FROM 'array'
              OR jsonb_typeof(t."values") IS DISTINCT FROM 'array'
              THEN 'invalid_shape'
          END AS reason
        FROM "themes" t
        LEFT JOIN "component" c ON c."id" = t."componentId"
      ), ranked AS MATERIALIZED (
        SELECT t."id", row_number() OVER (
          PARTITION BY t."componentId"
          ORDER BY t."created_at" ASC, t."id" ASC
        ) AS rn
        FROM "themes" t
        JOIN "component" c ON c."id" = t."componentId"
        JOIN classified x ON x."id" = t."id" AND x.reason IS NULL
      )
      SELECT "id", reason FROM classified WHERE reason IS NOT NULL
      UNION ALL
      SELECT "id", 'duplicate_component'::text FROM ranked WHERE rn > 1
    `);
    await queryRunner.query(`
      INSERT INTO "themes_quarantine_1786121078244"
        ("id", "name", "factors", "groups", "values", "created_at", "componentId", "reason")
      SELECT t."id", t."name", t."factors", t."groups", t."values",
        t."created_at", t."componentId", x.reason
      FROM "themes" t
      JOIN "themes_cleanup_1786121078244" x ON x."id" = t."id"
    `);
    await queryRunner.query(`
      DELETE FROM "themes" t
      USING "themes_cleanup_1786121078244" x
      WHERE t."id" = x."id"
    `);
    await queryRunner.query(
      `UPDATE "themes" SET "groups" = '{}'::jsonb WHERE "groups" = '[]'::jsonb`,
    );

    await queryRunner.query(`ALTER TABLE "themes" ADD "version" integer`);
    await queryRunner.query(`UPDATE "themes" SET "version" = 1`);
    await queryRunner.query(
      `ALTER TABLE "themes" ALTER COLUMN "version" SET DEFAULT 1`,
    );
    await queryRunner.query(
      `ALTER TABLE "themes" ALTER COLUMN "version" SET NOT NULL`,
    );
    await queryRunner.query(`
      ALTER TABLE "themes" ADD CONSTRAINT "CHK_themes_version"
      CHECK ("version" >= 1)
    `);

    await queryRunner.query(`ALTER TABLE "themes" ADD "updated_at" TIMESTAMP`);
    await queryRunner.query(`UPDATE "themes" SET "updated_at" = "created_at"`);
    await queryRunner.query(
      `ALTER TABLE "themes" ALTER COLUMN "updated_at" SET DEFAULT now()`,
    );
    await queryRunner.query(
      `ALTER TABLE "themes" ALTER COLUMN "updated_at" SET NOT NULL`,
    );

    await queryRunner.query(`
      ALTER TABLE "themes"
      DROP CONSTRAINT IF EXISTS "FK_a681db15d57d1c7de5bfb5e4ecf"
    `);
    await queryRunner.query(
      `ALTER TABLE "themes" ALTER COLUMN "componentId" SET NOT NULL`,
    );
    await queryRunner.query(`
      ALTER TABLE "themes" ADD CONSTRAINT "UQ_themes_component"
      UNIQUE ("componentId")
    `);
    await queryRunner.query(`
      ALTER TABLE "themes" ADD CONSTRAINT "FK_themes_component"
      FOREIGN KEY ("componentId") REFERENCES "component"("id")
      ON DELETE CASCADE ON UPDATE NO ACTION
    `);
    await queryRunner.query(`
      ALTER TABLE "themes" ADD CONSTRAINT "CHK_themes_groups_object"
      CHECK (jsonb_typeof("groups") = 'object')
    `);
    await queryRunner.query(`
      ALTER TABLE "themes" ADD CONSTRAINT "CHK_themes_factors_array"
      CHECK (jsonb_typeof("factors") = 'array')
    `);
    await queryRunner.query(`
      ALTER TABLE "themes" ADD CONSTRAINT "CHK_themes_values_array"
      CHECK (jsonb_typeof("values") = 'array')
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "themes" DROP CONSTRAINT IF EXISTS "CHK_themes_values_array"`,
    );
    await queryRunner.query(
      `ALTER TABLE "themes" DROP CONSTRAINT IF EXISTS "CHK_themes_factors_array"`,
    );
    await queryRunner.query(
      `ALTER TABLE "themes" DROP CONSTRAINT IF EXISTS "CHK_themes_groups_object"`,
    );
    await queryRunner.query(
      `ALTER TABLE "themes" DROP CONSTRAINT IF EXISTS "CHK_themes_version"`,
    );
    await queryRunner.query(
      `ALTER TABLE "themes" DROP CONSTRAINT IF EXISTS "UQ_themes_component"`,
    );
    await queryRunner.query(
      `ALTER TABLE "themes" DROP CONSTRAINT IF EXISTS "FK_themes_component"`,
    );
    await queryRunner.query(
      `ALTER TABLE "themes" ALTER COLUMN "componentId" DROP NOT NULL`,
    );
    await queryRunner.query(`
      ALTER TABLE "themes" ADD CONSTRAINT "FK_a681db15d57d1c7de5bfb5e4ecf"
      FOREIGN KEY ("componentId") REFERENCES "component"("id")
      ON DELETE NO ACTION ON UPDATE NO ACTION
    `);

    // Cascade-deleted component themes cannot safely be resurrected. Restore
    // only the latest archived snapshot per theme ID so repeated up/down cycles
    // are deterministic while the append-only archive remains as evidence.
    await queryRunner.query(`
      INSERT INTO "themes"
        ("id", "name", "factors", "groups", "values", "created_at", "componentId")
      SELECT q."id", q."name", q."factors", q."groups", q."values",
        q."created_at", q."componentId"
      FROM (
        SELECT DISTINCT ON (archived."id") archived.*
        FROM "themes_quarantine_1786121078244" archived
        ORDER BY archived."id", archived."quarantine_id" DESC
      ) q
      WHERE (q."componentId" IS NULL OR EXISTS (
        SELECT 1 FROM "component" c WHERE c."id" = q."componentId"
      ))
      ON CONFLICT ("id") DO NOTHING
    `);
    await queryRunner.query(`ALTER TABLE "themes" DROP COLUMN "updated_at"`);
    await queryRunner.query(`ALTER TABLE "themes" DROP COLUMN "version"`);
    // Intentionally retain themes_quarantine_1786121078244: down must not erase
    // evidence, including rows whose component was deleted under cascade.
  }
}
