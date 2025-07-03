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
} from '@nestjs/common';
import { BoardService } from './board.service';
import { CreateBoardDto } from './dto/create-board.dto';
import { UpdateBoardDto } from './dto/update-board.dto';
import { BoardTitleValidationPipe } from './pipe/board-title-validation.pipe';

@Controller('board')
@UseInterceptors(ClassSerializerInterceptor)
export class BoardController {
  constructor(private readonly boardService: BoardService) {}

  @Post()
  create(@Body() body: CreateBoardDto) {
    return this.boardService.create(body);
  }

  @Get()
  findAll(@Query('title', BoardTitleValidationPipe) title: string) {
    return this.boardService.findAll(title);
  }

  @Get(':id')
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.boardService.findOne(id);
  }

  @Patch(':id')
  update(@Param('id', ParseIntPipe) id: number, @Body() body: UpdateBoardDto) {
    return this.boardService.update(id, body);
  }

  @Delete(':id')
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.boardService.remove(id);
  }
}
