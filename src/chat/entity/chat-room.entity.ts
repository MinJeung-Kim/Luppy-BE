import { BaseTable } from 'src/common/entity/base-table.entity';
import { User } from 'src/user/entity/user.entity';
import {
  Column,
  Entity,
  JoinTable,
  ManyToMany,
  ManyToOne,
  OneToMany,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { Chat } from './chat.entity';
import { ChatGroup } from './chat-group.entity';

@Entity()
export class ChatRoom extends BaseTable {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  hostId: number;

  @ManyToOne(() => User, (user) => user.hostedChatRooms)
  host: User;

  @ManyToMany(
    () => User, //
    (user) => user.chatRooms,
  )
  @JoinTable()
  users: User[];

  @OneToMany(
    () => Chat, //
    (chat) => chat.chatRoom,
  )
  chats: Chat[];

  @ManyToOne(() => ChatGroup, (group) => group.chatRooms)
  chatGroup: ChatGroup;
}
