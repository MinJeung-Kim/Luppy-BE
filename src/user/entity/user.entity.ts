import { Board } from 'src/board/entity/board.entity';
import { BaseTable } from 'src/common/entity/base-table.entity';
import { Column, Entity, OneToMany, PrimaryGeneratedColumn } from 'typeorm';

@Entity()
export class User extends BaseTable {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  name: string;

  @Column()
  dob: Date;

  @Column()
  nationality: string;

  @OneToMany(
    () => Board, //
    (board) => board.user,
  )
  boards: Board;
}
