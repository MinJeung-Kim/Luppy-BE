import { Transform } from 'class-transformer';
import {
  Column,
  Entity,
  JoinColumn,
  ManyToOne,
  OneToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { BaseTable } from '../../common/entity/base-table.entity';
import { BoardDetail } from './board-detail.entity';
import { User } from 'src/user/entity/user.entity';

/**
 * ManyToOne : User -> 사용자는 여러개의 게시물을 만들 수 있음
 * OneToOne : BoardDetail -> 게시물은 하나의 상세 내용을 갖을 수 있음
 * ManyToMany : Tags -> 게시물은 여러개의 태그를 갖을 수 있고 태그는 여러개의 게시물에 속할 수 있음
 */

@Entity('board')
export class Board extends BaseTable {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  title: string;

  @Column('json')
  @Transform(({ value }) => {
    value.toString().toUpperCase();
  })
  tags: string[];

  @OneToOne(
    () => BoardDetail, //
    (boardDetail) => boardDetail.id,
    {
      cascade: true,
    },
  )
  @JoinColumn()
  detail: BoardDetail;

  @ManyToOne(
    () => User, //
    (user) => user.id,
    {
      cascade: true,
    },
  )
  user: User;
}
