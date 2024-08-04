import { MigrationInterface, QueryRunner } from 'typeorm';

export class EmailAddressContact1711866252453 implements MigrationInterface {
  name = 'EmailAddressContact1711866252453';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "address" RENAME COLUMN "address_type" TO "addressTypeId"`,
    );
    await queryRunner.query(
      `ALTER TABLE "address" DROP COLUMN "addressTypeId"`,
    );
    await queryRunner.query(
      `ALTER TABLE "address" ADD "addressTypeId" integer`,
    );
    await queryRunner.query(
      `ALTER TABLE "address" ADD CONSTRAINT "FK_c22c764ae32ba0ef10ab2ce8697" FOREIGN KEY ("addressTypeId") REFERENCES "address_type"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "address" DROP CONSTRAINT "FK_c22c764ae32ba0ef10ab2ce8697"`,
    );
    await queryRunner.query(
      `ALTER TABLE "address" DROP COLUMN "addressTypeId"`,
    );
    await queryRunner.query(
      `ALTER TABLE "address" ADD "addressTypeId" character varying(20)`,
    );
    await queryRunner.query(
      `ALTER TABLE "address" RENAME COLUMN "addressTypeId" TO "address_type"`,
    );
  }
}
