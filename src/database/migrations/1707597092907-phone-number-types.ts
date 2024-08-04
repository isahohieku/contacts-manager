import { MigrationInterface, QueryRunner } from 'typeorm';

export class PhoneNumberTypes1707597092907 implements MigrationInterface {
  name = 'PhoneNumberTypes1707597092907';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE TABLE "phone_type" ("id" integer NOT NULL, "name" character varying NOT NULL, CONSTRAINT "PK_846a6d3d787b091783db67b0e4c" PRIMARY KEY ("id"))`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE "phone_type"`);
  }
}
