import { Injectable } from '@nestjs/common';
import { SuggestDto } from './dto/suggest.dto';
import { firstValueFrom, timeout } from 'rxjs';
import { HttpService } from '@nestjs/axios';
import * as FormData from 'form-data';

@Injectable()
export class CanvasService {
  constructor(private readonly http: HttpService) { }

  async analyze(suggestDto: SuggestDto) {

    try {
      // IPv4 주소를 명시적으로 사용하여 IPv6 연결 문제 방지
      const url = process.env.ML_SERVER_URL ?? 'http://127.0.0.1:8000/analyze';

      const FormDataClass = FormData;
      const formData = new FormDataClass();

      // 파일 추가
      if (suggestDto.file) {
        formData.append('file', suggestDto.file.buffer, {
          filename: suggestDto.file.originalname,
          contentType: suggestDto.file.mimetype
        });
      }

      // 힌트 데이터를 JSON 문자열로 추가
      if (suggestDto.hint) {
        formData.append('hint', JSON.stringify(suggestDto.hint));
      }

      const response = await firstValueFrom(
        this.http.post(url, formData, {
          headers: {
            ...formData.getHeaders(),
          },
          timeout: 30000, // 30초 타임아웃
        }).pipe(timeout(30000)) // RxJS 타임아웃도 30초로 설정
      );

      return { ok: true, data: response.data };
    } catch (error) {

      // 연결 실패 시 적절한 에러 응답 반환
      throw new Error(`ML 서버 연결 실패: ${error.message}`);
    }
  }

}
