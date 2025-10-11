import { Module } from '@nestjs/common';
import { CanvasService } from './canvas.service';
import { AuthModule } from 'src/auth/auth.module';
import { CommonModule } from 'src/common/common.module';
import { HttpModule } from '@nestjs/axios';
import { CanvasController } from './canvas.controller';

@Module({
  imports: [CommonModule, AuthModule, HttpModule.register({
    baseURL: process.env.CANVAS_API_BASE_URL,
    timeout: 5000,
  }),],
  controllers: [CanvasController],
  providers: [CanvasService],
})
export class CanvasModule { }
