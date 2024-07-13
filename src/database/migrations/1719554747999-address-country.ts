import { MigrationInterface, QueryRunner } from "typeorm";

export class AddressCountry1719554747999 implements MigrationInterface {
    name = 'AddressCountry1719554747999'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "address" RENAME COLUMN "country" TO "countryId"`);
        await queryRunner.query(`ALTER TABLE "address" DROP COLUMN "countryId"`);
        await queryRunner.query(`ALTER TABLE "address" ADD "countryId" integer`);
        await queryRunner.query(`ALTER TABLE "address" ADD CONSTRAINT "FK_d87215343c3a3a67e6a0b7f3ea9" FOREIGN KEY ("countryId") REFERENCES "address_type"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "address" DROP CONSTRAINT "FK_d87215343c3a3a67e6a0b7f3ea9"`);
        await queryRunner.query(`ALTER TABLE "address" DROP COLUMN "countryId"`);
        await queryRunner.query(`ALTER TABLE "address" ADD "countryId" character varying(50)`);
        await queryRunner.query(`ALTER TABLE "address" RENAME COLUMN "countryId" TO "country"`);
    }

}
