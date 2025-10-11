import { Body, Controller, Post, UploadedFile, UseInterceptors, Req } from '@nestjs/common';
import { CanvasService } from './canvas.service';
import { TransactionInterceptor } from 'src/common/interceptor/transaction.interceptor';
import { FileInterceptor } from '@nestjs/platform-express';
import { Express } from 'express';
import 'multer';

@Controller('canvas')
export class CanvasController {
    constructor(private readonly canvasService: CanvasService) { }

    @Post('/analyze')
    @UseInterceptors(TransactionInterceptor, FileInterceptor('file'))
    async getCanvas(
        @UploadedFile() file: Express.Multer.File,
        @Body('hint') hint: string,
        @Req() req
    ) {
        // 요청 타임아웃을 60초로 설정
        req.setTimeout(60000);

        try {
            const parsedHint = JSON.parse(hint);

            const result = await this.canvasService.analyze({
                file,
                hint: parsedHint
            });
            return result;
        } catch (error) {
            throw error;
        }
    }
}