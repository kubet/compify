import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddComponentRevision1786121078243 implements MigrationInterface {
  name = 'AddComponentRevision1786121078243';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE TABLE "component_revision" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "digest" character(64) NOT NULL, "revision" integer NOT NULL, "schemaVersion" smallint NOT NULL, "visibility" "public"."component_visibility_enum" NOT NULL, "registryItem" jsonb NOT NULL, "createdAt" TIMESTAMP NOT NULL DEFAULT now(), "componentId" uuid NOT NULL, CONSTRAINT "UQ_component_revision_component_digest" UNIQUE ("componentId", "digest"), CONSTRAINT "UQ_component_revision_component_revision" UNIQUE ("componentId", "revision"), CONSTRAINT "PK_component_revision" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_component_revision_digest" ON "component_revision" ("digest")`,
    );
    await queryRunner.query(
      `ALTER TABLE "component_revision" ADD CONSTRAINT "FK_component_revision_component" FOREIGN KEY ("componentId") REFERENCES "component"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "component_revision" DROP CONSTRAINT "FK_component_revision_component"`,
    );
    await queryRunner.query(`DROP INDEX "IDX_component_revision_digest"`);
    await queryRunner.query(`DROP TABLE "component_revision"`);
  }
}
