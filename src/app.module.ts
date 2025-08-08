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
        // 개발 환경용 DB 설정
        DB_HOST: Joi.string().when('ENV', {
          is: 'dev',
          then: Joi.required(),
          otherwise: Joi.optional(),
        }),
        DB_PORT: Joi.number().default(3306),
        DB_USERNAME: Joi.string().when('ENV', {
          is: 'dev',
          then: Joi.required(),
          otherwise: Joi.optional(),
        }),
        DB_PASSWORD: Joi.string().when('ENV', {
          is: 'dev',
          then: Joi.required(),
          otherwise: Joi.optional(),
        }),
        DB_DATABASE: Joi.string().when('ENV', {
          is: 'dev',
          then: Joi.required(),
          otherwise: Joi.optional(),
        }),
        // 운영 환경용 DB 설정
        MYSQL_PUBLIC_URL: Joi.string().when('ENV', {
          is: 'prod',
          then: Joi.required(),
          otherwise: Joi.optional(),
        }),
        MYSQLPORT: Joi.number().default(3306),
        MYSQLUSER: Joi.string().when('ENV', {
          is: 'prod',
          then: Joi.required(),
          otherwise: Joi.optional(),
        }),
        MYSQL_ROOT_PASSWORD: Joi.string().when('ENV', {
          is: 'prod',
          then: Joi.required(),
          otherwise: Joi.optional(),
        }),
        MYSQL_DATABASE: Joi.string().when('ENV', {
          is: 'prod',
          then: Joi.required(),
          otherwise: Joi.optional(),
        }),
        HASH_ROUNDS: Joi.number().required(),
        ACCESS_TOKEN_SECRET: Joi.string().required(),
        REFRESH_TOKEN_SECRET: Joi.string().required(),
      }),
    }),
    // ConfigModule의 설정 값을 기반으로 TypeORM 모듈을 비동기로 설정
    TypeOrmModule.forRootAsync({
      useFactory: (configService: ConfigService) => {
        const env = configService.get<string>(envVariables.env);
        const isProd = env === 'prod';

        return {
          type: configService.get<string>(envVariables.dbType) as 'mysql',
          host: isProd
            ? configService.get<string>(envVariables.prodDbHost)
            : configService.get<string>(envVariables.dbHost),
          port: isProd
            ? configService.get<number>(envVariables.prodDbPort)
            : configService.get<number>(envVariables.dbPort),
          username: isProd
            ? configService.get<string>(envVariables.prodDbUsername)
            : configService.get<string>(envVariables.dbUsername),
          password: isProd
            ? configService.get<string>(envVariables.prodDbPassword)
            : configService.get<string>(envVariables.dbPassword),
          database: isProd
            ? configService.get<string>(envVariables.prodDbDatabase)
            : configService.get<string>(envVariables.dbDatabase),
          entities: [__dirname + '/**/*.entity{.ts,.js}'], // 엔티티 경로
          synchronize: env === 'dev', // 개발 환경에서만 true, 프로덕션에서는 false
        };
      },
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
