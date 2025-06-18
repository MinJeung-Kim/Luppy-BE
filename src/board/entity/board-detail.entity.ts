import { Column, Entity, OneToOne, PrimaryGeneratedColumn } from 'typeorm';
import { Board } from './board.entity';

@Entity()
export class BoardDetail {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  detail: string;

  @OneToOne(
    () => Board, //
    (board) => board.id,
  )
  board: Board;
}
