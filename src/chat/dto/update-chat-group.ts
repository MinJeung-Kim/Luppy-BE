import { PartialType } from '@nestjs/mapped-types';
import { CreateGroupDto } from './create-chat-group';

export class UpdateGroupDto extends PartialType(CreateGroupDto) { }
