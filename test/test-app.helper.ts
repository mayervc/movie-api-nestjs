import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { MoviesModule } from '../src/movies/movies.module';
import { UsersModule } from '../src/users/users.module';
import { AuthModule } from '../src/auth/auth.module';
import typeormTestConfig from '../src/config/typeorm-test.config';

/**
 * Helper para crear la aplicación Nest de test
 * Se crea una sola vez y se reutiliza en todos los tests E2E
 */
let testApp: INestApplication;
let testModule: TestingModule;

/**
 * Crea y configura la aplicación Nest de test
 * Esta función se ejecuta una sola vez y el resultado se reutiliza
 * Crea un módulo de test que importa solo los módulos necesarios con la configuración correcta
 */
export async function createTestApp(): Promise<INestApplication> {
  if (testApp) {
    return testApp;
  }

  // Extraer configuración del DataSource de typeorm-test.config.ts
  const typeormOptions = typeormTestConfig.options as any;

  testModule = await Test.createTestingModule({
    imports: [
      // ConfigModule con .env.test
      ConfigModule.forRoot({
        isGlobal: true,
        envFilePath: '.env.test'
      }),
      // TypeOrmModule con configuración de test
      TypeOrmModule.forRootAsync({
        imports: [ConfigModule],
        useFactory: () => ({
          type: typeormOptions.type,
          host: typeormOptions.host,
          port: typeormOptions.port,
          username: typeormOptions.username,
          password: typeormOptions.password,
          database: typeormOptions.database,
          entities: typeormOptions.entities,
          synchronize: false,
          migrationsRun: false, // Las migraciones se ejecutan en test-setup.ts
          migrations: typeormOptions.migrations,
          logging: false
        }),
        inject: [ConfigService]
      }),
      // Importar solo los módulos necesarios para los tests
      MoviesModule,
      UsersModule,
      AuthModule
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
