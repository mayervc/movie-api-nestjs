import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { MoviesModule } from './movies/movies.module';
import { UsersModule } from './users/users.module';
import { AuthModule } from './auth/auth.module';
import { entities } from './config/entities';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env'
    }),
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: (configService: ConfigService) => ({
        type: 'postgres',
        host: configService.get('DB_HOST', 'localhost'),
        port: configService.get<number>('DB_PORT', 5434),
        username: configService.get('DB_USERNAME', 'stremio'),
        password: configService.get('DB_PASSWORD', 'stremio_pass'),
        database: configService.get('DB_DATABASE', 'movie_db_dev'),
        entities: entities,
        synchronize: configService.get('NODE_ENV') !== 'production',
        logging: configService.get('NODE_ENV') === 'development'
      }),
      inject: [ConfigService]
    }),
    MoviesModule,
    UsersModule,
    AuthModule
  ]
})
export class AppModule {}
