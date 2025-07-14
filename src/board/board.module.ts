import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { BoardService } from './board.service';
import { BoardController } from './board.controller';
import { CommonModule } from 'src/common/common.module';
import { BoardDetail } from './entity/board-detail.entity';
import { User } from 'src/user/entity/user.entity';
import { Tag } from 'src/tag/entity/tag.entity';
import { Board } from './entity/board.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([Board, BoardDetail, User, Tag]),
    CommonModule,
  ],
  controllers: [BoardController],
  providers: [BoardService],
})
export class BoardModule {}
