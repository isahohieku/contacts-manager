import { MigrationInterface, QueryRunner } from 'typeorm';

export class UserAvatar1719075740731 implements MigrationInterface {
  name = 'UserAvatar1719075740731';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "users" ADD "avatar" character varying`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "users" DROP COLUMN "avatar"`);
  }
}
