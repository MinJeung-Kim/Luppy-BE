import {
  CallHandler,
  ExecutionContext,
  Injectable,
  NestInterceptor,
} from '@nestjs/common';
import { catchError, Observable, tap } from 'rxjs';
import { DataSource } from 'typeorm';

/**
 * 인터셉터는 요청을 가로채고, 필요한 작업을 수행한 후 다음 핸들러로 요청을 전달합니다.
 * 여기서는 데이터베이스 트랜잭션을 시작하고, 요청이 끝난 후 커밋 또는 롤백을 수행합니다.
 */
@Injectable()
export class TransactionInterceptor implements NestInterceptor {
  constructor(private readonly dataSource: DataSource) {}

  async intercept(
    context: ExecutionContext,
    next: CallHandler<any>,
  ): Promise<Observable<any>> {
    const req = context.switchToHttp().getRequest();

    const qr = this.dataSource.createQueryRunner();

    await qr.connect();
    await qr.startTransaction();

    req.queryRunner = qr; // 요청 객체에 쿼리 러너를 저장

    return next.handle().pipe(
      tap(async () => {
        // 요청이 성공적으로 처리되면 트랜잭션 커밋
        await qr.commitTransaction();
        await qr.release();
      }),
      catchError(async (error) => {
        // 요청 처리 중 오류가 발생하면 트랜잭션 롤백
        await qr.rollbackTransaction();
        await qr.release();

        throw error;
      }),
    );
  }
}
