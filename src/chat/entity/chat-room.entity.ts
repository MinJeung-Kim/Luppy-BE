import { BaseTable } from 'src/common/entity/base-table.entity';
import { Entity, JoinTable, ManyToMany, ManyToOne, OneToMany, PrimaryGeneratedColumn } from 'typeorm';
import { Chat } from './chat.entity';
import { User } from 'src/user/entity/user.entity';
import { ChatGroup } from 'src/chat-group/entity/chat-group.entity';

@Entity()
export class ChatRoom extends BaseTable {
    @PrimaryGeneratedColumn()
    id: number;

    @OneToMany(
        () => Chat, //
        (chat) => chat.chatRoom,
        {
            cascade: true,
            nullable: true,
        },
    )
    chats: Chat[];

    @ManyToMany(() => User, (user) => user.chatRooms)
    @JoinTable()
    memberIds: User[];

    @ManyToOne(() => ChatGroup, (chatGroup) => chatGroup.chatRooms)
    chatGroup: ChatGroup;
}