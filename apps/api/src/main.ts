import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { GlobalExceptionFilter } from './common/filters/http-exception.filter';
import cookieParser from 'cookie-parser';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  app.setGlobalPrefix('api/v1');
  app.use(cookieParser());

  // 1. ENABLE CORS
  // This allows our Next.js frontend (on port 3000) to communicate with this API
  // credentials: true is REQUIRED for our HTTP-Only cookies to work!
  app.enableCors({
    origin: ['http://localhost:3000'],
    credentials: true, 
  });

  // 2. ATTACH GLOBAL EXCEPTION FILTER
  app.useGlobalFilters(new GlobalExceptionFilter());

  // 3. ENABLE STRICT VALIDATION
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );

  // 4. CONFIGURE SWAGGER DOCUMENTATION
  const config = new DocumentBuilder()
    .setTitle('NovaFlow API')
    .setDescription('The core backend API for the NovaFlow workspace management platform.')
    .setVersion('1.0')
    .addCookieAuth('accessToken')
    .build();
    
  const document = SwaggerModule.createDocument(app, config);
  // This sets the documentation URL to http://localhost:4000/api/docs
  SwaggerModule.setup('api/docs', app, document);

  await app.listen(4000);
  console.log(`🚀 Backend is running on: http://localhost:4000/api/v1`);
  console.log(`📖 Swagger docs available at: http://localhost:4000/api/docs`);
}
bootstrap();