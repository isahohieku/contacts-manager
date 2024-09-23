import { MigrationInterface, QueryRunner } from 'typeorm';

export class AuthProviders1727064848882 implements MigrationInterface {
  name = 'AuthProviders1727064848882';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE TABLE "auth_provider" ("id" SERIAL NOT NULL, "name" character varying NOT NULL, "active" boolean NOT NULL DEFAULT false, CONSTRAINT "PK_0a6e6348fe38ba49160eb903c95" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(`ALTER TABLE "contact" DROP COLUMN "avatar"`);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "contact" ADD "avatar" character varying(100)`,
    );
    await queryRunner.query(`DROP TABLE "auth_provider"`);
  }
}
