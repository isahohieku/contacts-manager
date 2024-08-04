import { MigrationInterface, QueryRunner } from 'typeorm';

export class EmailTypeRelation1719118461247 implements MigrationInterface {
  name = 'EmailTypeRelation1719118461247';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "email" DROP COLUMN "email_type"`);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "email" ADD "email_type" character varying(20)`,
    );
  }
}
