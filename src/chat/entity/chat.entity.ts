import { BaseTable } from 'src/common/entity/base-table.entity';
import { Column, Entity, JoinColumn, ManyToOne, PrimaryGeneratedColumn } from 'typeorm';
import { ChatRoom } from './chat-room.entity';

@Entity()
export class Chat extends BaseTable {
    @PrimaryGeneratedColumn()
    id: number;

    @Column()
    msg: string;

    @Column()
    sender: number;

    @Column({ default: false })
    isRead: boolean;

    @ManyToOne(
        () => ChatRoom, //
        (chatRoom) => chatRoom.chats,
        {
            nullable: false,
        },
    )
    @JoinColumn()
    chatRoom: ChatRoom;


}
