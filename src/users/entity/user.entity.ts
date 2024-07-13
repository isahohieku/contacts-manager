import {
  Column,
  AfterLoad,
  Entity,
  Index,
  PrimaryGeneratedColumn,
  BeforeInsert,
  BeforeUpdate,
  OneToMany,
  ManyToOne,
} from 'typeorm';
import * as bcrypt from 'bcryptjs';
import { Contact } from '../../contacts/entities/contact.entity';
import { EntityUser } from '../../utils/entity-helper';
import { AuthProvidersEnum } from '../../auth/auth-providers.enum';
import { Role } from '../../roles/entities/role.entity';
import { Status } from '../../statuses/entities/status.entity';
import { Tag } from '../../tags/entities/tag.entity';
import { Country } from '../../countries/entities/country.entity';

@Entity('users')
export class User extends EntityUser {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ unique: true, nullable: true })
  email: string | null;

  @Column({ nullable: true })
  password: string;

  @Column({ nullable: true })
  avatar: string | null;

  public previousPassword: string;

  @AfterLoad()
  public loadPreviousPassword(): void {
    this.previousPassword = this.password;
  }

  @BeforeInsert()
  @BeforeUpdate()
  async setPassword() {
    if (this.previousPassword !== this.password && this.password) {
      const salt = await bcrypt.genSalt();
      this.password = await bcrypt.hash(this.password, salt);
    }
  }

  @Column({ default: AuthProvidersEnum.email })
  provider: string;

  @Index()
  @Column({ nullable: true })
  firstName: string | null;

  @Index()
  @Column({ nullable: true })
  lastName: string | null;

  @ManyToOne(() => Role, {
    eager: true,
  })
  role?: Role | null;

  @ManyToOne(() => Status, {
    eager: true,
  })
  status?: Status;

  @ManyToOne(() => Country, {
    eager: true,
  })
  country: Country;

  @Column({ nullable: true })
  @Index()
  hash: string | null;

  @OneToMany(() => Contact, (contact) => contact.owner)
  contacts: Contact[];

  @OneToMany(() => Tag, (tag) => tag.owner)
  tags: Tag[];
}
