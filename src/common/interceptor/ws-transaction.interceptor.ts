import {
  CallHandler,
  ExecutionContext,
  Injectable,
  NestInterceptor,
} from '@nestjs/common';
import { catchError, Observable, tap } from 'rxjs';
import { DataSource } from 'typeorm';

@Injectable()
export class WsTransactionInterceptor implements NestInterceptor {
  constructor(private readonly dataSource: DataSource) {}

  async intercept(
    context: ExecutionContext,
    next: CallHandler<any>,
  ): Promise<Observable<any>> {
    const client = context.switchToWs().getClient();

    const qr = this.dataSource.createQueryRunner();

    await qr.connect();
    await qr.startTransaction();

    client.data.queryRunner = qr; // 요청 객체에 쿼리 러너를 저장

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
