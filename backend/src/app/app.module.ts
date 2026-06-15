import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { AuthModule } from './auth/auth.module';
import { PorteiroModule } from './porteiro/porteiro.module';
import { MoradorModule } from './morador/morador.module';
import { SindicoModule } from './sindico/sindico.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    AuthModule,
    PorteiroModule,
    MoradorModule,
    SindicoModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}