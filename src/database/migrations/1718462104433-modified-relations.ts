import { MigrationInterface, QueryRunner } from "typeorm";

export class ModifiedRelations1718462104433 implements MigrationInterface {
    name = 'ModifiedRelations1718462104433'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "email" ADD "emailTypeId" integer`);
        await queryRunner.query(`ALTER TABLE "email" ADD CONSTRAINT "FK_6614e4b90cf4ff091c2fbf51269" FOREIGN KEY ("emailTypeId") REFERENCES "email_type"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "email" DROP CONSTRAINT "FK_6614e4b90cf4ff091c2fbf51269"`);
        await queryRunner.query(`ALTER TABLE "email" DROP COLUMN "emailTypeId"`);
    }

}
