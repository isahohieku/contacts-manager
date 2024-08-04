import { MigrationInterface, QueryRunner } from 'typeorm';

export class ContactUser1707544740248 implements MigrationInterface {
  name = 'ContactUser1707544740248';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `DROP INDEX "public"."IDX_0de7f3fee0fa6ca015942934a7"`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."IDX_8ce890fdfbf61bb2e1bf0b3289"`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."IDX_fba14e0dcb8cde05b749988fa8"`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."IDX_9f096e392fb91c5c11116c1f15"`,
    );
    await queryRunner.query(
      `ALTER TABLE "contact" DROP CONSTRAINT "UQ_eff09bb429f175523787f46003b"`,
    );
    await queryRunner.query(`ALTER TABLE "contact" DROP COLUMN "email"`);
    await queryRunner.query(`ALTER TABLE "contact" DROP COLUMN "password"`);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "contact" ADD "password" character varying`,
    );
    await queryRunner.query(
      `ALTER TABLE "contact" ADD "email" character varying`,
    );
    await queryRunner.query(
      `ALTER TABLE "contact" ADD CONSTRAINT "UQ_eff09bb429f175523787f46003b" UNIQUE ("email")`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_9f096e392fb91c5c11116c1f15" ON "contact" ("notes") `,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_fba14e0dcb8cde05b749988fa8" ON "contact" ("avatar") `,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_8ce890fdfbf61bb2e1bf0b3289" ON "contact" ("anniversary") `,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_0de7f3fee0fa6ca015942934a7" ON "contact" ("birthday") `,
    );
  }
}
