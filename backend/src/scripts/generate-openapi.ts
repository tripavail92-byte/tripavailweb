import { NestFactory } from '@nestjs/core';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { AppModule } from '../app.module';
import { writeFileSync, mkdirSync } from 'fs';
import { join } from 'path';

async function generateOpenAPI() {
  const app = await NestFactory.create(AppModule, { logger: false });
  app.setGlobalPrefix('v1');

  const config = new DocumentBuilder()
    .setTitle('TripAvail API')
    .setDescription('Two-sided travel marketplace API')
    .setVersion('1.0')
    .addBearerAuth()
    .addServer('http://localhost:4100', 'Development')
    .build();

  const document = SwaggerModule.createDocument(app, config);

  const outDir = join(__dirname, '..', '..', 'openapi');
  mkdirSync(outDir, { recursive: true });
  const outPath = join(outDir, 'openapi.json');
  writeFileSync(outPath, JSON.stringify(document, null, 2));
  await app.close();

  console.log(`OpenAPI written to ${outPath}`);
}

generateOpenAPI().catch((err) => {
  console.error('OpenAPI generation failed:', err);
  process.exit(1);
});
