import { AuthProvider } from '@contactApp/modules/auth/entities/auth-providers.entity';
import { Contact } from '@contactApp/modules/contacts/entities/contact.entity';
import { Country } from '@contactApp/modules/countries/entities/country.entity';
import { FileEntity } from '@contactApp/modules/files/entities/file.entity';
import { Role } from '@contactApp/modules/roles/entities/role.entity';
import { Status } from '@contactApp/modules/statuses/entities/status.entity';
import { Tag } from '@contactApp/modules/tags/entities/tag.entity';
import { EntityUser } from '@contactApp/shared/entities/entity-helper';
import * as bcrypt from 'bcryptjs';
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

  @ManyToOne(() => AuthProvider, {
    eager: true,
  })
  provider?: AuthProvider;

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

  @OneToMany(() => FileEntity, (file) => file.owner)
  files: FileEntity[];
}
