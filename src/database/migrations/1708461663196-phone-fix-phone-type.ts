import { MigrationInterface, QueryRunner } from "typeorm";

export class PhoneFixPhoneType1708461663196 implements MigrationInterface {
    name = 'PhoneFixPhoneType1708461663196'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "phone" RENAME COLUMN "phone_type" TO "phoneTypeId"`);
        await queryRunner.query(`ALTER TABLE "phone" DROP COLUMN "phoneTypeId"`);
        await queryRunner.query(`ALTER TABLE "phone" ADD "phoneTypeId" integer`);
        await queryRunner.query(`ALTER TABLE "phone" ADD CONSTRAINT "FK_257ef2ce02587b9acd9b2529699" FOREIGN KEY ("phoneTypeId") REFERENCES "phone_type"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "phone" DROP CONSTRAINT "FK_257ef2ce02587b9acd9b2529699"`);
        await queryRunner.query(`ALTER TABLE "phone" DROP COLUMN "phoneTypeId"`);
        await queryRunner.query(`ALTER TABLE "phone" ADD "phoneTypeId" character varying(20)`);
        await queryRunner.query(`ALTER TABLE "phone" RENAME COLUMN "phoneTypeId" TO "phone_type"`);
    }

}
