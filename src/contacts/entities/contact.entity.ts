import { User } from 'src/users/entity/user.entity';
import { EntityBase } from 'src/utils/entity-helper';
import {
  Column,
  AfterLoad,
  Entity,
  Index,
  PrimaryGeneratedColumn,
  ManyToOne,
} from 'typeorm';

@Entity()
export class Contact extends EntityBase {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ unique: true, nullable: true })
  email: string | null;

  @Column({ nullable: true })
  password: string;

  public previousPassword: string;

  @AfterLoad()
  public loadPreviousPassword(): void {
    this.previousPassword = this.password;
  }

  @Index()
  @Column({ nullable: false, type: 'varchar', length: 45 })
  firstName: string | null;

  @Index()
  @Column({ nullable: true, type: 'varchar', length: 45 })
  lastName?: string | null;

  @Column({ nullable: true, type: 'varchar', length: 100 })
  @Index()
  organization?: string | null;

  @Column({ nullable: true, type: 'varchar', length: 100 })
  @Index()
  job_title?: string | null;

  @Column({ nullable: true, type: 'date' })
  @Index()
  birthday?: Date;

  @Column({ nullable: true, type: 'date' })
  @Index()
  anniversary?: Date;

  @Column({ nullable: true, type: 'varchar', length: 100 })
  @Index()
  avatar?: string | null;

  @Column({ nullable: true, type: 'text' })
  @Index()
  notes?: string | null;

  @ManyToOne(() => User, (user) => user.contacts)
  owner: User;
}
