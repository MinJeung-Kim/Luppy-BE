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
  const port = Number(process.env.PORT) || 8080; // Railway면 PORT가 주입됨
  await app.listen(port, '0.0.0.0');             // 한 번만 호출
  console.log(`✓ Listening on http://0.0.0.0:${port}`);
}
bootstrap();
