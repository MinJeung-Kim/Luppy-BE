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
import { AuthGuard } from 'src/auth/guard/auth.guard';
import { Public } from 'src/auth/decorator/public.decorator';
import { RBAC } from 'src/auth/decorator/rbac.decorator';
import { Role } from 'src/user/entity/user.entity';

@Controller('board')
@UseInterceptors(ClassSerializerInterceptor)
export class BoardController {
  constructor(private readonly boardService: BoardService) {}

  @Get()
  @Public()
  findAll(@Query('title', BoardTitleValidationPipe) title: string) {
    return this.boardService.findAll(title);
  }

  @Get(':id')
  @Public()
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.boardService.findOne(id);
  }

  @Post()
  @RBAC(Role.admin)
  create(@Body() body: CreateBoardDto) {
    return this.boardService.create(body);
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
