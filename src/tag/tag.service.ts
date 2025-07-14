import { Injectable, NotFoundException } from '@nestjs/common';
import { CreateTagDto } from './dto/create-tag.dto';
import { UpdateTagDto } from './dto/update-tag.dto';
import { InjectRepository } from '@nestjs/typeorm';
import { Tag } from './entity/tag.entity';
import { Repository } from 'typeorm';

@Injectable()
export class TagService {
  constructor(
    @InjectRepository(Tag)
    private readonly tagRepository: Repository<Tag>,
  ) {}

  findAll() {
    return this.tagRepository.findAndCount();
  }

  findOne(id: number) {
    return this.tagRepository.findOne({
      where: { id },
    });
  }

  async create(createTagDto: CreateTagDto) {
    const tag = await this.tagRepository.findOne({
      where: { name: createTagDto.name },
    });

    if (tag) {
      throw new NotFoundException(`이미 존재하는 태그(${name}) 입니다.`);
    }
    return this.tagRepository.save(createTagDto);
  }

  async update(id: number, updateTagDto: UpdateTagDto) {
    const tag = await this.tagRepository.findOne({
      where: { id },
    });

    if (!tag) {
      throw new NotFoundException(`Tag with id ${id} not found`);
    }

    await this.tagRepository.update(
      {
        id,
      },
      { ...updateTagDto },
    );

    const newTag = await this.tagRepository.findOne({
      where: { id },
    });

    return newTag;
  }

  async remove(id: number) {
    const tag = await this.tagRepository.findOne({
      where: { id },
    });

    if (!tag) {
      throw new NotFoundException(`Tag with id ${id} not found`);
    }
    await this.tagRepository.delete(id);

    return id;
  }
}
