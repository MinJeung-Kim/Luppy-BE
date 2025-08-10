import * as Joi from 'joi';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigModule, ConfigService } from '@nestjs/config';
import {
  MiddlewareConsumer,
  Module,
  NestModule,
  RequestMethod,
} from '@nestjs/common';
import { RbacGuard } from './auth/guard/rbac.guard';
import { BearerTokenMiddleware } from './auth/middleware/bearer-token.middleware';
import { envVariables } from './common/const/env.const';
import { AuthGuard } from './auth/guard/auth.guard';
import { BoardModule } from './board/board.module';
import { AuthModule } from './auth/auth.module';
import { UserModule } from './user/user.module';
import { TagModule } from './tag/tag.module';
import { APP_FILTER, APP_GUARD, APP_INTERCEPTOR } from '@nestjs/core';
import { ResponseTimeInterceptor } from './common/interceptor/response-time.interceptor';
import { ForbiddenExceptionFilter } from './common/filter/forbidden.filter';
import { QueryFailedExceptionFilter } from './common/filter/query-failed.filter';
import { ChatModule } from './chat/chat.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true, // 환경 변수를 전역으로 사용 가능하게 설정
      envFilePath: '.env', // 환경 변수 파일 경로
      ignoreEnvFile: process.env.ENV === 'prod', // 프로덕션 환경에서는 .env 파일을 무시
      validationSchema: Joi.object({
        ENV: Joi.string().valid('dev', 'prod').default('dev'),
        DB_TYPE: Joi.string().valid('mysql').required(),
        MYSQLHOST: Joi.string().required(),
        MYSQLPORT: Joi.number().default(3306),
        MYSQLUSER: Joi.string().required(),
        MYSQLPASSWORD: Joi.string().required(),
        MYSQLDATABASE: Joi.string().required(),
        HASH_ROUNDS: Joi.number().required(),
        ACCESS_TOKEN_SECRET: Joi.string().required(),
        REFRESH_TOKEN_SECRET: Joi.string().required(),
      }),
    }),
    // ConfigModule의 설정 값을 기반으로 TypeORM 모듈을 비동기로 설정
    TypeOrmModule.forRootAsync({
      useFactory: (configService: ConfigService) => ({
        type: configService.get<string>(envVariables.dbType) as 'mysql',
        host: configService.get<string>(envVariables.dbHost),
        port: configService.get<number>(envVariables.dbPort),
        username: configService.get<string>(envVariables.dbUsername),
        password: configService.get<string>(envVariables.dbPassword),
        database: configService.get<string>(envVariables.dbDatabase),
        entities: [__dirname + '/**/*.entity{.ts,.js}'], // 엔티티 경로
        synchronize: true, // 개발 환경에서만 사용, 프로덕션에서는 false로 설정
      }),
      inject: [ConfigService],
    }),
    BoardModule,
    UserModule,
    TagModule,
    AuthModule,
    ChatModule,
  ],
  providers: [
    { provide: APP_GUARD, useClass: AuthGuard },
    { provide: APP_GUARD, useClass: RbacGuard },
    { provide: APP_INTERCEPTOR, useClass: ResponseTimeInterceptor },
    { provide: APP_FILTER, useClass: ForbiddenExceptionFilter },
    { provide: APP_FILTER, useClass: QueryFailedExceptionFilter },
  ],
})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer
      .apply(BearerTokenMiddleware)
      .exclude(
        {
          path: 'auth/login',
          method: RequestMethod.POST,
        },
        {
          path: 'auth/register',
          method: RequestMethod.POST,
        },
      )
      .forRoutes('*');
  }
}
