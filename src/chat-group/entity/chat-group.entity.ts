import { ChatRoom } from 'src/chat/entity/chat-room.entity';
import { BaseTable } from 'src/common/entity/base-table.entity';
import { User } from 'src/user/entity/user.entity';
import { Column, Entity, ManyToOne, PrimaryGeneratedColumn, OneToMany } from 'typeorm';

@Entity()
export class ChatGroup extends BaseTable {
    @PrimaryGeneratedColumn()
    id: number;
    @Column()
    name: string;

    @Column()
    emoji: string;

    @Column({ nullable: true })
    desc?: string;

    @ManyToOne(() => User, (user) => user.chatGroups)
    user: User;

    @OneToMany(() => ChatRoom, (chatRoom) => chatRoom.chatGroup)
    chatRooms: ChatRoom[];

}
