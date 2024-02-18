import { MigrationInterface, QueryRunner } from "typeorm";

export class Tags1708292662531 implements MigrationInterface {
    name = 'Tags1708292662531'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TABLE "tags" ("createdAt" TIMESTAMP NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP NOT NULL DEFAULT now(), "deletedAt" TIMESTAMP, "id" SERIAL NOT NULL, "name" character varying NOT NULL, "ownerId" integer, CONSTRAINT "UQ_3fd460f4be27ee71a596145ecdf" UNIQUE ("ownerId", "name"), CONSTRAINT "PK_e7dc17249a1148a1970748eda99" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TABLE "contact_tags_tags" ("contactId" integer NOT NULL, "tagsId" integer NOT NULL, CONSTRAINT "PK_12c87bf6362fe55b14e29aac4a8" PRIMARY KEY ("contactId", "tagsId"))`);
        await queryRunner.query(`CREATE INDEX "IDX_397895254780136f858ac5231f" ON "contact_tags_tags" ("contactId") `);
        await queryRunner.query(`CREATE INDEX "IDX_087b5f91eafe2ea2e98196c67d" ON "contact_tags_tags" ("tagsId") `);
        await queryRunner.query(`ALTER TABLE "tags" ADD CONSTRAINT "FK_8ce74535e58cbab22452bc758cb" FOREIGN KEY ("ownerId") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "contact_tags_tags" ADD CONSTRAINT "FK_397895254780136f858ac5231f5" FOREIGN KEY ("contactId") REFERENCES "contact"("id") ON DELETE CASCADE ON UPDATE CASCADE`);
        await queryRunner.query(`ALTER TABLE "contact_tags_tags" ADD CONSTRAINT "FK_087b5f91eafe2ea2e98196c67da" FOREIGN KEY ("tagsId") REFERENCES "tags"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "contact_tags_tags" DROP CONSTRAINT "FK_087b5f91eafe2ea2e98196c67da"`);
        await queryRunner.query(`ALTER TABLE "contact_tags_tags" DROP CONSTRAINT "FK_397895254780136f858ac5231f5"`);
        await queryRunner.query(`ALTER TABLE "tags" DROP CONSTRAINT "FK_8ce74535e58cbab22452bc758cb"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_087b5f91eafe2ea2e98196c67d"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_397895254780136f858ac5231f"`);
        await queryRunner.query(`DROP TABLE "contact_tags_tags"`);
        await queryRunner.query(`DROP TABLE "tags"`);
    }

}
