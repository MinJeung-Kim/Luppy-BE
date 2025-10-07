import { Module } from '@nestjs/common';
import { CanvasService } from './canvas.service';
import { CanvasGateway } from './canvas.gateway';
import { AuthModule } from 'src/auth/auth.module';
import { CommonModule } from 'src/common/common.module';
import { HttpModule } from '@nestjs/axios';

@Module({
  imports: [CommonModule, AuthModule, HttpModule.register({
    baseURL: process.env.CANVAS_API_BASE_URL,
    timeout: 5000,
  }),],
  providers: [CanvasGateway, CanvasService],
})
export class CanvasModule { }
