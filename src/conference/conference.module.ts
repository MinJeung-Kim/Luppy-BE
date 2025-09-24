import { Module } from '@nestjs/common';
import { ConferenceService } from './conference.service';
import { ConferenceGateway } from './conference.gateway';
import { TypeOrmModule } from '@nestjs/typeorm';
import { User } from 'src/user/entity/user.entity';
import { AuthModule } from 'src/auth/auth.module';
import { CommonModule } from 'src/common/common.module';

@Module({
  imports: [TypeOrmModule.forFeature([User]), AuthModule, CommonModule],
  providers: [ConferenceGateway, ConferenceService],
})
export class ConferenceModule { }
