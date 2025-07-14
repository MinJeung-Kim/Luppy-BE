import {
  CallHandler,
  ExecutionContext,
  Injectable,
  InternalServerErrorException,
  NestInterceptor,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { delay, tap } from 'rxjs/operators';
/**
 * 응답 시간을 측정하고, 특정 시간 이상 걸린 요청에 대해 경고를 출력하는 인터셉터
 * 이 예제에서는 1초(1000ms) 이상 걸린 요청에 대해 경고를 출력합니다.
 */

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

        if (diff > 1000) {
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
