import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddDefaultAuthProvidersToUser1727465729543
  implements MigrationInterface
{
  name = 'AddDefaultAuthProvidersToUser1727465729543';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "users" RENAME COLUMN "provider" TO "providerId"`,
    );
    await queryRunner.query(`ALTER TABLE "users" DROP COLUMN "providerId"`);
    await queryRunner.query(`ALTER TABLE "users" ADD "providerId" integer`);
    await queryRunner.query(
      `ALTER TABLE "users" ADD CONSTRAINT "FK_fab34e0791096b2a0a1bf8bd7ff" FOREIGN KEY ("providerId") REFERENCES "auth_provider"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `UPDATE "users" SET "providerId" = 1 WHERE "providerId" IS NULL`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "users" DROP CONSTRAINT "FK_fab34e0791096b2a0a1bf8bd7ff"`,
    );
    await queryRunner.query(`ALTER TABLE "users" DROP COLUMN "providerId"`);
    await queryRunner.query(
      `ALTER TABLE "users" ADD "providerId" character varying NOT NULL DEFAULT 'email'`,
    );
    await queryRunner.query(
      `ALTER TABLE "users" RENAME COLUMN "providerId" TO "provider"`,
    );
  }
}
