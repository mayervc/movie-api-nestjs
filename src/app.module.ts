import { Module } from '@nestjs/common';
import { APP_GUARD } from '@nestjs/core';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { MoviesModule } from './movies/movies.module';
import { UsersModule } from './users/users.module';
import { AuthModule } from './auth/auth.module';
import { JwtAuthGuard } from './auth/guards/jwt-auth.guard';
import { RolesGuard } from './auth/guards/roles.guard';
import { entities } from './config/entities';
import { CinemasModule } from './cinemas/cinemas.module';
import { ActorsModule } from './actors/actors.module';
import { RoomsModule } from './rooms/rooms.module';
import { ShowtimesModule } from './showtimes/showtimes.module';
import { TicketsModule } from './tickets/tickets.module';
import { PaymentsModule } from './payments/payments.module';
import { SubscriptionsModule } from './subscriptions/subscriptions.module';

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
        database: configService.get('DB_DATABASE', 'stremio_db_dev'),
        entities: entities,
        synchronize: false,
        logging: configService.get('NODE_ENV') === 'development'
      }),
      inject: [ConfigService]
    }),
    MoviesModule,
    UsersModule,
    AuthModule,
    CinemasModule,
    ActorsModule,
    RoomsModule,
    ShowtimesModule,
    TicketsModule,
    PaymentsModule,
    SubscriptionsModule
  ],
  providers: [
    {
      provide: APP_GUARD,
      useClass: JwtAuthGuard
    },
    {
      provide: APP_GUARD,
      useClass: RolesGuard
    }
  ]
})
export class AppModule {}
