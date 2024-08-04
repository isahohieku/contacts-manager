import { MigrationInterface, QueryRunner } from 'typeorm';

export class PhoneNumbers1707594317324 implements MigrationInterface {
  name = 'PhoneNumbers1707594317324';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE TABLE "phone" ("createdAt" TIMESTAMP NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP NOT NULL DEFAULT now(), "deletedAt" TIMESTAMP, "id" SERIAL NOT NULL, "phone_number" character varying(20), "phone_type" character varying(20), "contactId" integer, CONSTRAINT "PK_f35e6ee6c1232ce6462505c2b25" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `ALTER TABLE "phone" ADD CONSTRAINT "FK_0d49fa96cb9d5cc46b9598f3489" FOREIGN KEY ("contactId") REFERENCES "contact"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "phone" DROP CONSTRAINT "FK_0d49fa96cb9d5cc46b9598f3489"`,
    );
    await queryRunner.query(`DROP TABLE "phone"`);
  }
}
