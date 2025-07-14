import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Query,
  ParseIntPipe,
  UseInterceptors,
  ClassSerializerInterceptor,
  Request,
} from '@nestjs/common';
import { BoardService } from './board.service';
import { CreateBoardDto } from './dto/create-board.dto';
import { UpdateBoardDto } from './dto/update-board.dto';
import { GetBoardsDto } from './dto/get-boards.dto';
import { Public } from 'src/auth/decorator/public.decorator';
import { RBAC } from 'src/auth/decorator/rbac.decorator';
import { Role } from 'src/user/entity/user.entity';
import { Transaction } from 'typeorm';
import { TransactionInterceptor } from 'src/common/interceptor/transaction.interceptor';

@Controller('board')
@UseInterceptors(ClassSerializerInterceptor)
export class BoardController {
  constructor(private readonly boardService: BoardService) {}

  @Get()
  @Public()
  findAll(@Query() dto: GetBoardsDto) {
    return this.boardService.findAll(dto);
  }

  @Get(':id')
  @Public()
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.boardService.findOne(id);
  }

  @Post()
  @RBAC(Role.admin)
  @UseInterceptors(TransactionInterceptor)
  create(@Body() body: CreateBoardDto, @Request() res) {
    return this.boardService.create(body, res.queryRunner);
  }

  @Patch(':id')
  @RBAC(Role.admin)
  update(@Param('id', ParseIntPipe) id: number, @Body() body: UpdateBoardDto) {
    return this.boardService.update(id, body);
  }

  @Delete(':id')
  @RBAC(Role.admin)
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.boardService.remove(id);
  }
}
