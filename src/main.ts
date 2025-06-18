import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true, // 정의하지 않은 값은 제거
      forbidNonWhitelisted: true, // 정의하지 않은 값이 있으면 에러 발생
    }),
  );
  await app.listen(process.env.PORT ?? 3000);
}
bootstrap();
