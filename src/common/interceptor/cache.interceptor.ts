import {
  CallHandler,
  ExecutionContext,
  Injectable,
  NestInterceptor,
} from '@nestjs/common';
import { Observable, of, tap } from 'rxjs';

/**
 * 요청을 기억해 뒀다가 동일한 요청이 들어오면 캐시된 응답을 반환하는 인터셉터
 * 이 예제에서는 메모리 캐시를 사용하지만, 실제 애플리케이션에서는 Redis나 Memcached와 같은 외부 캐시 스토어를 사용하는 것이 일반적입니다.
 */

@Injectable()
export class CacheInterceptor implements NestInterceptor {
  private cache = new Map<string, any>();

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const request = context.switchToHttp().getRequest();

    // GET /board
    const key = `${request.method}-${request.path}`;

    if (this.cache.has(key)) {
      console.log(`Cache hit for ${key}`);
      return of(this.cache.get(key));
    }

    return next.handle().pipe(
      tap((response) => {
        this.cache.set(key, response);
      }),
    );
  }
}
