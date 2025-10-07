import { Injectable } from '@nestjs/common';
import { SuggestDto } from './dto/suggest.dto';
import { Socket } from 'socket.io';
import { firstValueFrom, timeout } from 'rxjs';
import { HttpService } from '@nestjs/axios';

@Injectable()
export class CanvasService {
  constructor(private readonly http: HttpService) { }

  async analyze(suggestDto: SuggestDto, client: Socket) {
    const url = process.env.ML_SERVER_URL ?? 'http://localhost:8000/analyze';
    const { data } = await firstValueFrom(
      this.http.post(url, suggestDto).pipe(timeout(8000)) // 8초 타임아웃
    );

    console.log('Received response from ML server:', data);

    client.emit('suggest:result', { ok: true, data });
    return { ok: true, data };
  }

}
