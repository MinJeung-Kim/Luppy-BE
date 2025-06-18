import { Injectable, NotFoundException } from '@nestjs/common';
import { CreateBoardDto } from './dto/create-board.dto';
import { UpdateBoardDto } from './dto/update-board.dto';
import { Board } from './entity/board.entity';
import { InjectRepository } from '@nestjs/typeorm';
import { Like, Repository } from 'typeorm';
import { BoardDetail } from './entity/board-detail.entity';
import { User } from 'src/user/entity/user.entity';

@Injectable()
export class BoardService {
  constructor(
    @InjectRepository(Board)
    private readonly boardRepository: Repository<Board>,
    @InjectRepository(BoardDetail)
    private readonly boardDetailRepository: Repository<BoardDetail>,
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
  ) {}

  findAll(title?: string) {
    if (!title) {
      return this.boardRepository.findAndCount();
    }

    return this.boardRepository.findAndCount({
      where: { title: Like(`%${title}%`) },
    });
  }

  async findOne(id: number) {
    const board = await this.boardRepository.findOne({
      where: { id },
      relations: ['detail'],
    });

    if (!board) {
      throw new NotFoundException(`Board with id ${id} not found`);
    }
    return board;
  }

  async create(createBoardDto: CreateBoardDto) {
    const { detail, userId, ...boardRest } = createBoardDto;

    const user = await this.userRepository.findOne({
      where: {
        id: userId,
      },
    });

    if (!user) {
      throw new NotFoundException('존재하지 않는 ID의 유저 입니다.');
    }

    const boardDetail = await this.boardDetailRepository.save({
      detail,
    });

    const board = await this.boardRepository.save({
      ...boardRest,
      detail: boardDetail,
      user,
    });

    return board;
  }

  async update(id: number, updateBoardDto: UpdateBoardDto) {
    const board = await this.boardRepository.findOne({
      where: { id },
      relations: ['detail'],
    });

    if (!board) {
      throw new NotFoundException(`Board with id ${id} not found`);
    }

    const { detail, userId, ...boardRest } = updateBoardDto;

    let newUser;

    if (userId) {
      const user = await this.userRepository.findOne({
        where: {
          id: userId,
        },
      });

      if (!user) {
        throw new NotFoundException('존재하지 않는 ID의 유저 입니다.');
      }

      newUser = user;
    }

    const userUpdateFields = {
      ...boardRest,
      ...(newUser && { user: newUser }),
    };

    await this.boardRepository.update({ id }, userUpdateFields);

    if (detail) {
      await this.boardDetailRepository.update(
        {
          id: board.detail.id,
        },
        { detail },
      );
    }

    const newBoard = await this.boardRepository.findOne({
      where: { id },
      relations: ['detail', 'user'],
    });

    return newBoard;
  }

  async remove(id: number) {
    const board = await this.boardRepository.findOne({
      where: { id },
      relations: ['detail'],
    });

    if (!board) {
      throw new NotFoundException(`Board with id ${id} not found`);
    }

    await this.boardRepository.delete(id);
    await this.boardDetailRepository.delete(id);

    return id;
  }
}
