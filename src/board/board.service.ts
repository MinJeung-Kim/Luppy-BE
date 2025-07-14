import { Injectable, NotFoundException } from '@nestjs/common';
import { CreateBoardDto } from './dto/create-board.dto';
import { UpdateBoardDto } from './dto/update-board.dto';
import { Board } from './entity/board.entity';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, In, QueryRunner, Repository } from 'typeorm';
import { BoardDetail } from './entity/board-detail.entity';
import { User } from 'src/user/entity/user.entity';
import { Tag } from 'src/tag/entity/tag.entity';
import { GetBoardsDto } from './dto/get-boards.dto';
import { CommonService } from 'src/common/common.service';
import { Query } from 'mysql2/typings/mysql/lib/protocol/sequences/Query';

@Injectable()
export class BoardService {
  constructor(
    @InjectRepository(Board)
    private readonly boardRepository: Repository<Board>,
    @InjectRepository(BoardDetail)
    private readonly boardDetailRepository: Repository<BoardDetail>,
    private readonly dataSource: DataSource,
    private readonly commonService: CommonService,
  ) {}

  async findAll(dto: GetBoardsDto) {
    // const { title, page, take } = dto;
    const { title } = dto;

    // 쿼리빌더 =  복잡한 코드일 경우 유용함.
    const qb = await this.boardRepository
      .createQueryBuilder('board')
      .leftJoinAndSelect('board.user', 'user')
      .leftJoinAndSelect('board.tags', 'tags');

    if (title) {
      qb.where('board.title LIKE :title', { title: `%${title}%` });
    }

    // this.commonService.applyPaginationParamsToQb(qb, dto);
    this.commonService.applyCursorPaginationParamsToQb(qb, dto);

    return qb.getManyAndCount();
  }

  async findOne(id: number) {
    // 레포지토리 패턴
    const board = await this.boardRepository.findOne({
      where: { id },
      relations: ['detail', 'user', 'tags'],
    });

    if (!board) {
      throw new NotFoundException(`Board with id ${id} not found`);
    }
    return board;
  }

  async create(createBoardDto: CreateBoardDto, qr: QueryRunner) {
    const { detail, userId, tagIds, ...boardRest } = createBoardDto;

    const user = await qr.manager.findOne(User, {
      where: {
        id: userId,
      },
    });

    if (!user) {
      throw new NotFoundException('존재하지 않는 ID의 유저 입니다.');
    }

    const tags = await qr.manager.find(Tag, {
      where: {
        id: In(tagIds),
      },
    });

    if (tags.length !== tagIds.length) {
      throw new NotFoundException(
        `존재하지 않는 태그가 있습니다. 존재하는 ids -> ${tags.map((tag) => tag.id).join(',')}`,
      );
    }

    const boardDetail = qr.manager.create(BoardDetail, { detail });

    await qr.manager.save(BoardDetail, boardDetail);

    // Board 엔티티 인스턴스 생성 및 저장
    const board = qr.manager.create(Board, {
      ...boardRest,
      detail: boardDetail,
      user,
      tags,
    });

    await qr.manager.save(Board, board);

    return board;
  }

  async update(id: number, updateBoardDto: UpdateBoardDto) {
    const qr = this.dataSource.createQueryRunner();
    await qr.connect();
    await qr.startTransaction();

    try {
      const board = await qr.manager.findOne(Board, {
        where: { id },
        relations: ['detail', 'user', 'tags'],
      });

      if (!board) {
        throw new NotFoundException(`Board with id ${id} not found`);
      }

      const { detail, userId, tagIds, ...boardRest } = updateBoardDto;

      if (userId) {
        const user = await qr.manager.findOne(User, { where: { id: userId } });

        if (!user) {
          throw new NotFoundException('존재하지 않는 ID의 유저 입니다.');
        }

        board.user = user;
      }

      if (tagIds) {
        const tags = await qr.manager.find(Tag, { where: { id: In(tagIds) } });

        if (tags.length !== tagIds.length) {
          throw new NotFoundException(
            `존재하지 않는 태그가 있습니다. 존재하는 ids -> ${tags.map((tag) => tag.id).join(',')}`,
          );
        }

        board.tags = tags;
      }

      Object.assign(board, boardRest);

      if (detail) {
        await qr.manager.update(
          BoardDetail,
          {
            id: board.detail.id,
          },
          { detail },
        );
      }

      await qr.manager.save(Board, board);

      await qr.commitTransaction();

      return this.boardRepository.findOne({
        where: { id },
        relations: ['detail', 'user', 'tags'],
      });
    } catch (error) {
      await qr.rollbackTransaction();
      throw error;
    } finally {
      await qr.release();
    }
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
