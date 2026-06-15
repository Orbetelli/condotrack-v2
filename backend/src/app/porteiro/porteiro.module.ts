import { Module } from '@nestjs/common';
import { PorteiroController } from './porteiro.controller';
import { PorteiroService } from './porteiro.service';

@Module({
  controllers: [PorteiroController],
  providers: [PorteiroService],
})
export class PorteiroModule {}