import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddUserSessionVersion1786121078242 implements MigrationInterface {
  name = 'AddUserSessionVersion1786121078242';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      'ALTER TABLE "user" ADD "sessionVersion" integer NOT NULL DEFAULT 0',
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query('ALTER TABLE "user" DROP COLUMN "sessionVersion"');
  }
}
