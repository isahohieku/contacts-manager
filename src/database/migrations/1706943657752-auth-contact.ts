import { MigrationInterface, QueryRunner } from "typeorm";

export class AuthContact1706943657752 implements MigrationInterface {
    name = 'AuthContact1706943657752'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TABLE "role" ("id" integer NOT NULL, "name" character varying NOT NULL, CONSTRAINT "PK_b36bcfe02fc8de3c57a8b2391c2" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TABLE "contact" ("createdAt" TIMESTAMP NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP NOT NULL DEFAULT now(), "deletedAt" TIMESTAMP, "id" SERIAL NOT NULL, "email" character varying, "password" character varying, "firstName" character varying(45) NOT NULL, "lastName" character varying(45), "organization" character varying(100), "job_title" character varying(100), "birthday" date, "anniversary" date, "avatar" character varying(100), "notes" text, "ownerId" integer, CONSTRAINT "UQ_eff09bb429f175523787f46003b" UNIQUE ("email"), CONSTRAINT "PK_2cbbe00f59ab6b3bb5b8d19f989" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE INDEX "IDX_098b27a757ea3de61f67cdfddd" ON "contact" ("firstName") `);
        await queryRunner.query(`CREATE INDEX "IDX_0d1e9990415a51a5c459dc0bb3" ON "contact" ("lastName") `);
        await queryRunner.query(`CREATE INDEX "IDX_06fb84db5e57c39d3928f18d6e" ON "contact" ("organization") `);
        await queryRunner.query(`CREATE INDEX "IDX_c59af2def01d8d8d8645bdf5b3" ON "contact" ("job_title") `);
        await queryRunner.query(`CREATE INDEX "IDX_0de7f3fee0fa6ca015942934a7" ON "contact" ("birthday") `);
        await queryRunner.query(`CREATE INDEX "IDX_8ce890fdfbf61bb2e1bf0b3289" ON "contact" ("anniversary") `);
        await queryRunner.query(`CREATE INDEX "IDX_fba14e0dcb8cde05b749988fa8" ON "contact" ("avatar") `);
        await queryRunner.query(`CREATE INDEX "IDX_9f096e392fb91c5c11116c1f15" ON "contact" ("notes") `);
        await queryRunner.query(`CREATE TABLE "status" ("id" integer NOT NULL, "name" character varying NOT NULL, CONSTRAINT "PK_e12743a7086ec826733f54e1d95" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TABLE "forgot" ("id" SERIAL NOT NULL, "hash" character varying NOT NULL, "createdAt" TIMESTAMP NOT NULL DEFAULT now(), "deletedAt" TIMESTAMP, "userId" integer, CONSTRAINT "PK_087959f5bb89da4ce3d763eab75" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE INDEX "IDX_df507d27b0fb20cd5f7bef9b9a" ON "forgot" ("hash") `);
        await queryRunner.query(`ALTER TABLE "users" ADD "provider" character varying NOT NULL DEFAULT 'email'`);
        await queryRunner.query(`ALTER TABLE "users" ADD "roleId" integer`);
        await queryRunner.query(`ALTER TABLE "users" ADD "statusId" integer`);
        await queryRunner.query(`ALTER TABLE "contact" ADD CONSTRAINT "FK_68cfe567915dcb767204eba5895" FOREIGN KEY ("ownerId") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "users" ADD CONSTRAINT "FK_368e146b785b574f42ae9e53d5e" FOREIGN KEY ("roleId") REFERENCES "role"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "users" ADD CONSTRAINT "FK_fffa7945e50138103659f6326b7" FOREIGN KEY ("statusId") REFERENCES "status"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "forgot" ADD CONSTRAINT "FK_31f3c80de0525250f31e23a9b83" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "forgot" DROP CONSTRAINT "FK_31f3c80de0525250f31e23a9b83"`);
        await queryRunner.query(`ALTER TABLE "users" DROP CONSTRAINT "FK_fffa7945e50138103659f6326b7"`);
        await queryRunner.query(`ALTER TABLE "users" DROP CONSTRAINT "FK_368e146b785b574f42ae9e53d5e"`);
        await queryRunner.query(`ALTER TABLE "contact" DROP CONSTRAINT "FK_68cfe567915dcb767204eba5895"`);
        await queryRunner.query(`ALTER TABLE "users" DROP COLUMN "statusId"`);
        await queryRunner.query(`ALTER TABLE "users" DROP COLUMN "roleId"`);
        await queryRunner.query(`ALTER TABLE "users" DROP COLUMN "provider"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_df507d27b0fb20cd5f7bef9b9a"`);
        await queryRunner.query(`DROP TABLE "forgot"`);
        await queryRunner.query(`DROP TABLE "status"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_9f096e392fb91c5c11116c1f15"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_fba14e0dcb8cde05b749988fa8"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_8ce890fdfbf61bb2e1bf0b3289"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_0de7f3fee0fa6ca015942934a7"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_c59af2def01d8d8d8645bdf5b3"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_06fb84db5e57c39d3928f18d6e"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_0d1e9990415a51a5c459dc0bb3"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_098b27a757ea3de61f67cdfddd"`);
        await queryRunner.query(`DROP TABLE "contact"`);
        await queryRunner.query(`DROP TABLE "role"`);
    }

}
