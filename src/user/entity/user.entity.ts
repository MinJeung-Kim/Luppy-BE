import { Exclude } from 'class-transformer';
import { Board } from 'src/board/entity/board.entity';
import { ChatGroup } from 'src/chat-group/entity/chat-group.entity';
import { ChatRoom } from 'src/chat/entity/chat-room.entity';
import { BaseTable } from 'src/common/entity/base-table.entity';
import {
  Column,
  Entity,
  ManyToMany,
  OneToMany,
  PrimaryGeneratedColumn,
} from 'typeorm';

export enum Role {
  admin = 0,
  paidUser = 1,
  user = 2,
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

  @Column()
  profile: string;

  @Column({ type: 'enum', enum: Role, default: Role.user })
  role: Role;

  @Column({ unique: true })
  phone: string;

  @OneToMany(
    () => Board, //
    (board) => board.user,
  )
  boards: Board;

  @OneToMany(() => ChatGroup, (group) => group.user)
  chatGroups: ChatGroup;


  @ManyToMany(() => ChatRoom, (room) => room.memberIds)
  chatRooms: ChatRoom[];

}
