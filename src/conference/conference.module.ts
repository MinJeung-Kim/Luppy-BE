import { Module } from '@nestjs/common';
import { ConferenceService } from './conference.service';
import { ConferenceGateway } from './conference.gateway';

@Module({
  providers: [ConferenceGateway, ConferenceService],
})
export class ConferenceModule {}
