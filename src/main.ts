import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';

async function bootstrap() {
  try {
    const app = await NestFactory.create(AppModule);
    app.enableCors({
      origin: process.env.ALLOWED_ORIGINS?.split(',').map((o) => o.trim()),
    });
    await app.listen(process.env.PORT!);
    console.log(`Server running on port ${process.env.PORT}`);
  } catch (err) {
    console.error(err);
    process.exitCode = 1;
  }
}

bootstrap();
