import { Module } from '@nestjs/common';
import { BoardService } from './board.service';
import { BoardController } from './board.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Board } from './entity/board.entity';
import { BoardDetail } from './entity/board-detail.entity';
import { User } from 'src/user/entity/user.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Board, BoardDetail, User])],
  controllers: [BoardController],
  providers: [BoardService],
})
export class BoardModule {}
