import { MigrationInterface, QueryRunner } from 'typeorm';

export class InitialSchema1786121078241 implements MigrationInterface {
  name = 'InitialSchema1786121078241';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`CREATE EXTENSION IF NOT EXISTS "uuid-ossp"`);
    await queryRunner.query(`CREATE EXTENSION IF NOT EXISTS "pg_trgm"`);
    await queryRunner.query(`CREATE EXTENSION IF NOT EXISTS "btree_gin"`);
    await queryRunner.query(
      `CREATE TYPE "public"."subscription_plan_billingcycle_enum" AS ENUM('monthly', 'annually')`,
    );
    await queryRunner.query(
      `CREATE TABLE "subscription_plan" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "name" character varying NOT NULL, "description" text, "bestFor" text, "price" numeric(10,2) NOT NULL, "level" integer NOT NULL DEFAULT '0', "colors" text array, "fromCredits" integer NOT NULL DEFAULT '0', "toCredits" integer NOT NULL DEFAULT '0', "toAiCredits" integer NOT NULL DEFAULT '0', "toFreeAiCredits" integer NOT NULL DEFAULT '0', "maxComponents" integer NOT NULL DEFAULT '0', "maxComponentSize" integer NOT NULL DEFAULT '0', "stripePriceId" text, "billingCycle" "public"."subscription_plan_billingcycle_enum" DEFAULT 'monthly', "isFeatured" boolean NOT NULL DEFAULT false, "isAvailable" boolean NOT NULL DEFAULT true, "promoData" jsonb, "features" text array, "createdAt" TIMESTAMP NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "PK_5fde988e5d9b9a522d70ebec27c" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE TYPE "public"."subscription_status_enum" AS ENUM('active', 'inactive', 'cancelled', 'expired')`,
    );
    await queryRunner.query(
      `CREATE TABLE "subscription" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "status" "public"."subscription_status_enum" NOT NULL DEFAULT 'active', "startDate" TIMESTAMP NOT NULL, "endDate" TIMESTAMP, "stripeSubscriptionId" text, "ipAddress" text, "createdAt" TIMESTAMP NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP NOT NULL DEFAULT now(), "lastResetDate" TIMESTAMP, "userId" uuid, "planId" uuid, CONSTRAINT "PK_8c3e00ebd02103caa1174cd5d9d" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE TABLE "themes" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "name" character varying(100) NOT NULL, "factors" jsonb NOT NULL, "groups" jsonb NOT NULL, "values" jsonb NOT NULL, "created_at" TIMESTAMP NOT NULL DEFAULT now(), "componentId" uuid, CONSTRAINT "PK_ddbeaab913c18682e5c88155592" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE TYPE "public"."upvote_status_enum" AS ENUM('upvote', 'downvote')`,
    );
    await queryRunner.query(
      `CREATE TABLE "upvote" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "status" "public"."upvote_status_enum", "userId" uuid, "componentId" uuid, CONSTRAINT "PK_e63693403e030d3e060747dd776" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE TYPE "public"."component_language_enum" AS ENUM('react', 'react-ts', 'vue', 'vue-ts', 'nextjs', 'nextjs-ts', 'react-native', 'react-native-ts', 'static')`,
    );
    await queryRunner.query(
      `CREATE TYPE "public"."component_visibility_enum" AS ENUM('draft', 'private', 'public', 'external', 'free')`,
    );
    await queryRunner.query(
      `CREATE TABLE "component" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "name" character varying NOT NULL, "description" character varying, "activeFile" character varying, "previewFile" character varying, "language" "public"."component_language_enum" NOT NULL, "isShared" boolean DEFAULT false, "pageSettings" jsonb, "usedDeps" jsonb, "usedUiFrameworks" jsonb, "isSetup" boolean DEFAULT false, "imageUploaded" boolean DEFAULT false, "publishingDomain" character varying, "createdAt" TIMESTAMP NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP NOT NULL DEFAULT now(), "deletedAt" TIMESTAMP, "upvotesCount" integer NOT NULL DEFAULT '0', "visibility" "public"."component_visibility_enum" NOT NULL DEFAULT 'draft', "userId" uuid, CONSTRAINT "UQ_bb5afdb6b85d6baaf7f5692cdbe" UNIQUE ("publishingDomain"), CONSTRAINT "PK_c084eba2d3b157314de79135f09" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_a60bfff7094fd0352057e8b44e" ON "component" ("name") `,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_48fa8c41d3625e7dbf1c2c842c" ON "component" ("language") `,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_7df7f698c807a0b303e0fb82a6" ON "component" ("visibility") `,
    );
    await queryRunner.query(
      `CREATE TABLE "cli_token" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "token" character varying NOT NULL, "createdAt" TIMESTAMP NOT NULL DEFAULT now(), "lastUsedAt" TIMESTAMP NOT NULL, "userId" uuid, CONSTRAINT "REL_b666cd76ae85c43a8c39b021bc" UNIQUE ("userId"), CONSTRAINT "PK_e3f4158ab68554916c795508b1e" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE TABLE "user" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "email" character varying NOT NULL, "username" character varying, "password" character varying, "firstName" character varying, "lastName" character varying, "valid" boolean NOT NULL DEFAULT false, "availableCredits" integer NOT NULL DEFAULT '0', "availableAiCredits" integer NOT NULL DEFAULT '0', "availableFreeAiCredits" integer NOT NULL DEFAULT '0', "createdAt" TIMESTAMP NOT NULL DEFAULT now(), "failedPayments" integer DEFAULT '0', "languagePreferences" jsonb, CONSTRAINT "UQ_e12875dfb3b1d92d7d7c5377e22" UNIQUE ("email"), CONSTRAINT "UQ_78a916df40e02a9deb1c4b75edb" UNIQUE ("username"), CONSTRAINT "PK_cace4a159ff9f2512dd42373760" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE TABLE "user_used_components" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "components" jsonb NOT NULL, "userId" uuid, CONSTRAINT "PK_d869aa23d5eb7596e9f8abcd27f" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE TYPE "public"."token_type_enum" AS ENUM('0', '1', '2')`,
    );
    await queryRunner.query(
      `CREATE TABLE "token" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "email" character varying NOT NULL, "token" character varying NOT NULL, "meta" character varying, "date" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "type" "public"."token_type_enum" NOT NULL, CONSTRAINT "PK_82fae97f905930df5d62a702fc9" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE TABLE "external_component" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "componentId" uuid, CONSTRAINT "REL_eed567adebeadd511d16ec4730" UNIQUE ("componentId"), CONSTRAINT "PK_fdad5d300e20b4d1b846b433b8c" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE TABLE "newsletter" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "email" character varying NOT NULL, "createdAt" TIMESTAMP NOT NULL DEFAULT now(), "deletedAt" TIMESTAMP, CONSTRAINT "UQ_7e3d2b10221e8b16279dac58319" UNIQUE ("email"), CONSTRAINT "PK_036bb790d1d19efeacfd2f3740c" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE TABLE "report" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "itemId" character varying, "itemType" character varying, "reason" character varying, "createdAt" TIMESTAMP NOT NULL DEFAULT now(), "userId" uuid, CONSTRAINT "PK_99e4d0bea58cba73c57f935a546" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `ALTER TABLE "subscription" ADD CONSTRAINT "FK_cc906b4bc892b048f1b654d2aa0" FOREIGN KEY ("userId") REFERENCES "user"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "subscription" ADD CONSTRAINT "FK_6b6d0e4dc88105a4a11103dd2cd" FOREIGN KEY ("planId") REFERENCES "subscription_plan"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "themes" ADD CONSTRAINT "FK_a681db15d57d1c7de5bfb5e4ecf" FOREIGN KEY ("componentId") REFERENCES "component"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "upvote" ADD CONSTRAINT "FK_3abd9f37a94f8db3c33bda4fdae" FOREIGN KEY ("userId") REFERENCES "user"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "upvote" ADD CONSTRAINT "FK_025c321fb9ee3e234cd8e1daeec" FOREIGN KEY ("componentId") REFERENCES "component"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "component" ADD CONSTRAINT "FK_27a15241df08397ea1328de3263" FOREIGN KEY ("userId") REFERENCES "user"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "cli_token" ADD CONSTRAINT "FK_b666cd76ae85c43a8c39b021bc7" FOREIGN KEY ("userId") REFERENCES "user"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "user_used_components" ADD CONSTRAINT "FK_8729f2196df32331aabba83fb1f" FOREIGN KEY ("userId") REFERENCES "user"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "external_component" ADD CONSTRAINT "FK_eed567adebeadd511d16ec47308" FOREIGN KEY ("componentId") REFERENCES "component"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "report" ADD CONSTRAINT "FK_e347c56b008c2057c9887e230aa" FOREIGN KEY ("userId") REFERENCES "user"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `CREATE INDEX IF NOT EXISTS "idx_component_name_trgm" ON "component" USING gin ("name" gin_trgm_ops)`,
    );
    await queryRunner.query(
      `CREATE INDEX IF NOT EXISTS "idx_component_name_visibility" ON "component" ("name", "visibility")`,
    );
    await queryRunner.query(
      `CREATE INDEX IF NOT EXISTS "idx_component_frameworks" ON "component" USING gin ("usedUiFrameworks")`,
    );
    await queryRunner.query(
      `INSERT INTO "subscription_plan" ("id", "name", "description", "price", "fromCredits", "toCredits", "toAiCredits", "toFreeAiCredits", "maxComponents", "maxComponentSize", "isAvailable") VALUES ('00000000-0000-4000-8000-000000000001', 'Free', 'Default self-hosted plan', 0, 25, 25, 50, 100, 25, 10485760, true) ON CONFLICT ("id") DO NOTHING`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "report" DROP CONSTRAINT "FK_e347c56b008c2057c9887e230aa"`,
    );
    await queryRunner.query(
      `ALTER TABLE "external_component" DROP CONSTRAINT "FK_eed567adebeadd511d16ec47308"`,
    );
    await queryRunner.query(
      `ALTER TABLE "user_used_components" DROP CONSTRAINT "FK_8729f2196df32331aabba83fb1f"`,
    );
    await queryRunner.query(
      `ALTER TABLE "cli_token" DROP CONSTRAINT "FK_b666cd76ae85c43a8c39b021bc7"`,
    );
    await queryRunner.query(
      `ALTER TABLE "component" DROP CONSTRAINT "FK_27a15241df08397ea1328de3263"`,
    );
    await queryRunner.query(
      `ALTER TABLE "upvote" DROP CONSTRAINT "FK_025c321fb9ee3e234cd8e1daeec"`,
    );
    await queryRunner.query(
      `ALTER TABLE "upvote" DROP CONSTRAINT "FK_3abd9f37a94f8db3c33bda4fdae"`,
    );
    await queryRunner.query(
      `ALTER TABLE "themes" DROP CONSTRAINT "FK_a681db15d57d1c7de5bfb5e4ecf"`,
    );
    await queryRunner.query(
      `ALTER TABLE "subscription" DROP CONSTRAINT "FK_6b6d0e4dc88105a4a11103dd2cd"`,
    );
    await queryRunner.query(
      `ALTER TABLE "subscription" DROP CONSTRAINT "FK_cc906b4bc892b048f1b654d2aa0"`,
    );
    await queryRunner.query(`DROP TABLE "report"`);
    await queryRunner.query(`DROP TABLE "newsletter"`);
    await queryRunner.query(`DROP TABLE "external_component"`);
    await queryRunner.query(`DROP TABLE "token"`);
    await queryRunner.query(`DROP TYPE "public"."token_type_enum"`);
    await queryRunner.query(`DROP TABLE "user_used_components"`);
    await queryRunner.query(`DROP TABLE "user"`);
    await queryRunner.query(`DROP TABLE "cli_token"`);
    await queryRunner.query(
      `DROP INDEX "public"."IDX_7df7f698c807a0b303e0fb82a6"`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."IDX_48fa8c41d3625e7dbf1c2c842c"`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."IDX_a60bfff7094fd0352057e8b44e"`,
    );
    await queryRunner.query(`DROP TABLE "component"`);
    await queryRunner.query(`DROP TYPE "public"."component_visibility_enum"`);
    await queryRunner.query(`DROP TYPE "public"."component_language_enum"`);
    await queryRunner.query(`DROP TABLE "upvote"`);
    await queryRunner.query(`DROP TYPE "public"."upvote_status_enum"`);
    await queryRunner.query(`DROP TABLE "themes"`);
    await queryRunner.query(`DROP TABLE "subscription"`);
    await queryRunner.query(`DROP TYPE "public"."subscription_status_enum"`);
    await queryRunner.query(`DROP TABLE "subscription_plan"`);
    await queryRunner.query(
      `DROP TYPE "public"."subscription_plan_billingcycle_enum"`,
    );
  }
}
