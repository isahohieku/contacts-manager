import { MigrationInterface, QueryRunner } from "typeorm";

export class EmailAndEmailTypes1708015403164 implements MigrationInterface {
    name = 'EmailAndEmailTypes1708015403164'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TABLE "email_type" ("id" integer NOT NULL, "name" character varying NOT NULL, CONSTRAINT "PK_052f23c54fa604cc27c38c978e7" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TABLE "email" ("createdAt" TIMESTAMP NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP NOT NULL DEFAULT now(), "deletedAt" TIMESTAMP, "id" SERIAL NOT NULL, "email_address" character varying(100), "email_type" character varying(20), "contactId" integer, CONSTRAINT "PK_1e7ed8734ee054ef18002e29b1c" PRIMARY KEY ("id"))`);
        await queryRunner.query(`ALTER TABLE "email" ADD CONSTRAINT "FK_792af602479d447138e5d58b63e" FOREIGN KEY ("contactId") REFERENCES "contact"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "email" DROP CONSTRAINT "FK_792af602479d447138e5d58b63e"`);
        await queryRunner.query(`DROP TABLE "email"`);
        await queryRunner.query(`DROP TABLE "email_type"`);
    }

}
