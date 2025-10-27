import {
  CallHandler,
  ExecutionContext,
  Injectable,
  InternalServerErrorException,
  NestInterceptor,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { delay, tap } from 'rxjs/operators';

@Injectable()
export class ResponseTimeInterceptor implements NestInterceptor {
  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const req = context.switchToHttp().getRequest();

    const reqTime = Date.now();
    return next.handle().pipe(
      //   delay(1000),
      tap(() => {
        const resTime = Date.now();
        const diff = resTime - reqTime;

        // Canvas 분석 요청은 30초까지 허용, 다른 요청은 1초까지
        const timeoutLimit = req.url.includes('/canvas/analyze') ? 30000 : 1000;

        if (diff > timeoutLimit) {
          console.warn(
            `!!!TIMEOUT!!![${req.method}] ${req.url} - Response Time: ${diff}ms`,
          );
          throw new InternalServerErrorException(
            `Request took too long: ${diff}ms`,
          );
        } else {
          console.log(`[${req.method}] ${req.url} - Response Time: ${diff}ms`);
        }
      }),
    );
  }
}
