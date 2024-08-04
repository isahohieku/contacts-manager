import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddressAndAddressTypes1708036454744 implements MigrationInterface {
  name = 'AddressAndAddressTypes1708036454744';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE TABLE "address_type" ("id" integer NOT NULL, "name" character varying NOT NULL, CONSTRAINT "PK_7e192deb7cdcfa2b478be7d664f" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE TABLE "address" ("createdAt" TIMESTAMP NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP NOT NULL DEFAULT now(), "deletedAt" TIMESTAMP, "id" SERIAL NOT NULL, "street" character varying(100), "city" character varying(50), "state" character varying(50), "postal_code" character varying(20), "country" character varying(50), "address_type" character varying(20), "contactId" integer, CONSTRAINT "PK_d92de1f82754668b5f5f5dd4fd5" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `ALTER TABLE "address" ADD CONSTRAINT "FK_876834ed69f50f3614410e155f8" FOREIGN KEY ("contactId") REFERENCES "contact"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "address" DROP CONSTRAINT "FK_876834ed69f50f3614410e155f8"`,
    );
    await queryRunner.query(`DROP TABLE "address"`);
    await queryRunner.query(`DROP TABLE "address_type"`);
  }
}
