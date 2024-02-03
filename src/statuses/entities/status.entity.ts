import { Column, Entity, PrimaryColumn } from 'typeorm';
import { Allow } from 'class-validator';
import { EntityHelper } from 'src/utils/entity-helper';

@Entity()
export class Status extends EntityHelper {
  @PrimaryColumn()
  id: number;

  @Allow()
  @Column()
  name?: string;
}
