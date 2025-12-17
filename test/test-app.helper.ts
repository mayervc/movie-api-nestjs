import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { entities } from '../src/config/entities';

/**
 * Helper para crear la aplicación Nest de test
 * Se crea una sola vez y se reutiliza en todos los tests E2E
 */
let testApp: INestApplication;
let testModule: TestingModule;

/**
 * Crea y configura la aplicación Nest de test
 * Esta función se ejecuta una sola vez y el resultado se reutiliza
 *
 * @param modules - Módulos adicionales a importar (ej: AuthModule, UsersModule)
 */
export async function createTestApp(
  modules: any[] = []
): Promise<INestApplication> {
  if (testApp) {
    return testApp;
  }

  testModule = await Test.createTestingModule({
    imports: [
      ConfigModule.forRoot({
        isGlobal: true,
        envFilePath: '.env.test'
      }),
      TypeOrmModule.forRootAsync({
        imports: [ConfigModule],
        useFactory: (configService: ConfigService) => ({
          type: 'postgres',
          host: configService.get('DB_HOST', 'localhost'),
          port: configService.get<number>('DB_TEST_PORT', 5436),
          username: configService.get('DB_USERNAME', 'stremio'),
          password: configService.get('DB_PASSWORD', 'stremio_pass'),
          database: configService.get('DB_DATABASE', 'stremio_db_test'),
          entities: entities,
          synchronize: false,
          migrationsRun: false, // Las migraciones se ejecutan en test-setup.ts
          migrations: ['src/migrations/*.ts'],
          logging: false
        }),
        inject: [ConfigService]
      }),
      ...modules
    ]
  }).compile();

  testApp = testModule.createNestApplication();

  // Aplicar el mismo ValidationPipe que en main.ts
  testApp.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true
    })
  );

  await testApp.init();

  return testApp;
}

/**
 * Obtiene la aplicación de test existente
 */
export function getTestApp(): INestApplication {
  if (!testApp) {
    throw new Error('Test app not initialized. Call createTestApp() first.');
  }
  return testApp;
}

/**
 * Obtiene el módulo de test existente
 */
export function getTestModule(): TestingModule {
  if (!testModule) {
    throw new Error('Test module not initialized. Call createTestApp() first.');
  }
  return testModule;
}

/**
 * Cierra la aplicación de test
 * Se ejecuta en el teardown global
 */
export async function closeTestApp(): Promise<void> {
  if (testApp) {
    await testApp.close();
    testApp = null;
    testModule = null;
  }
}
