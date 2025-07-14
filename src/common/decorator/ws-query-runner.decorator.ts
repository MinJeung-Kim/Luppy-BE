import {
  createParamDecorator,
  ExecutionContext,
  InternalServerErrorException,
} from '@nestjs/common';

export const WsQueryRunner = createParamDecorator(
  (data: unknown, ctx: ExecutionContext) => {
    const client = ctx.switchToWs().getClient();

    if (!client || !client.data || !client.data.queryRunner) {
      throw new InternalServerErrorException(
        'QueryRunner not found in client data',
      );
    }
    return client.data.queryRunner;
  },
);
