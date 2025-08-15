import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { EntityNotFoundFilter } from './entity-not-found/entity-not-found.filter';
import { ValidationPipe } from '@nestjs/common';
import { EventsGateway } from './events/events.gateway';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  const port = process.env.PORT || 3000;

   app.enableCors({
    origin: ['http://localhost:3001', 'http://localhost:3002'],
    credentials: true,
  });

  app.useGlobalFilters(new EntityNotFoundFilter());
  app.useGlobalPipes(new ValidationPipe());

  console.log(`🚀 Server starting on port ${port}`);
  await app.listen(port);
  console.log(`✅ Server running on http://localhost:${port}`);
}
bootstrap();
