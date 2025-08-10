import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { corsOptions } from './utils/cors-options';
import { AppModule } from './app.module';


async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  app.enableCors(corsOptions);
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true, // 정의하지 않은 값은 제거
      forbidNonWhitelisted: true, // 정의하지 않은 값이 있으면 에러 발생
      transformOptions: {
        enableImplicitConversion: true, // 타입 변환 허용
      },
    }),
  );
  // const port = await app.listen(Number(process.env.PORT) || 8080);
  const port = await app.listen(Number(process.env.PORT));
  await app.listen(port);
}
bootstrap();
