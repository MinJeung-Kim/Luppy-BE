import { BaseTable } from 'src/common/entity/base-table.entity';
import { Column, Entity, JoinTable, ManyToOne, OneToMany, PrimaryGeneratedColumn } from 'typeorm';
import { ChatRoom } from './chat-room.entity';
import { User } from 'src/user/entity/user.entity';

@Entity()
export class ChatGroup extends BaseTable {
    @PrimaryGeneratedColumn()
    id: number;

    @Column()
    emoji: string;

    @Column()
    name: string;

    @Column()
    description: string;

    @OneToMany(() => ChatRoom, (room) => room.chatGroup)
    @JoinTable()
    chatRooms: ChatRoom[];

    @ManyToOne(
        () => User, //
        (user) => user.chatGroups,
        { onDelete: 'CASCADE' },
    )
    creator: User;
}