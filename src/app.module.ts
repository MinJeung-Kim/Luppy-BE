import { Module } from '@nestjs/common';
import { BoardModule } from './board/board.module';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { UserModule } from './user/user.module';
import * as Joi from 'joi';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true, // 환경 변수를 전역으로 사용 가능하게 설정
      envFilePath: '.env', // 환경 변수 파일 경로
      ignoreEnvFile: process.env.NODE_ENV === 'prod', // 프로덕션 환경에서는 .env 파일을 무시
      validationSchema: Joi.object({
        ENV: Joi.string().valid('dev', 'prod').default('dev'),
        DB_TYPE: Joi.string().valid('mysql').required(),
        DB_HOST: Joi.string().required(),
        DB_PORT: Joi.number().default(3306),
        DB_USERNAME: Joi.string().required(),
        DB_PASSWORD: Joi.string().required(),
        DB_DATABASE: Joi.string().required(),
      }),
    }),
    // ConfigModule의 설정 값을 기반으로 TypeORM 모듈을 비동기로 설정
    TypeOrmModule.forRootAsync({
      useFactory: (configService: ConfigService) => ({
        type: configService.get<string>('DB_TYPE') as 'mysql',
        host: configService.get<string>('DB_HOST'),
        port: configService.get<number>('DB_PORT'),
        username: configService.get<string>('DB_USERNAME'),
        password: configService.get<string>('DB_PASSWORD'),
        database: configService.get<string>('DB_DATABASE'),
        entities: [__dirname + '/**/*.entity{.ts,.js}'], // 엔티티 경로
        synchronize: true, // 개발 환경에서만 사용, 프로덕션에서는 false로 설정
      }),
      inject: [ConfigService],
    }),
    BoardModule,
    UserModule,
  ],
})
export class AppModule {}
