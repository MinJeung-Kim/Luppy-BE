import { Board } from 'src/board/entity/board.entity';
import { BaseTable } from 'src/common/entity/base-table.entity';
import { Column, Entity, ManyToMany, PrimaryGeneratedColumn } from 'typeorm';

@Entity('tag')
export class Tag extends BaseTable {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ unique: true })
  name: string;

  @ManyToMany(
    () => Board, //
    (board) => board.tags,
    { cascade: true },
  )
  boards: Board[];
}
