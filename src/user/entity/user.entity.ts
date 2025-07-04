import { Exclude } from 'class-transformer';
import { Board } from 'src/board/entity/board.entity';
import { BaseTable } from 'src/common/entity/base-table.entity';
import { Column, Entity, OneToMany, PrimaryGeneratedColumn } from 'typeorm';

export enum Role {
  admin = 'admin',
  paidUser = 'paidUser',
  user = 'user',
}

@Entity()
export class User extends BaseTable {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ unique: true })
  email: string;

  @Column()
  @Exclude({
    // 비번을 응답으로 주지 않는다.
    toPlainOnly: true,
  })
  password: string;

  @Column()
  name: string;

  @Column({ type: 'enum', enum: Role, default: Role.user })
  role: Role;

  @Column()
  phone: string;

  @OneToMany(
    () => Board, //
    (board) => board.user,
  )
  boards: Board;
}
