import { Controller, Get, Patch, Param, UseGuards, Request } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { MoradorService } from './morador.service';
import { Roles } from '../auth/roles.decorator';
import { RolesGuard } from '../auth/roles.guard';

@Controller('morador')
@UseGuards(AuthGuard('jwt'), RolesGuard)
@Roles('morador')
export class MoradorController {
  constructor(private readonly moradorService: MoradorService) {}

  @Get('entregas')
  getEntregas(@Request() req: any) {
    return this.moradorService.getEntregas(req.user.id, req.user.apartamentoId);
  }

  @Get('pendentes')
  getPendentes(@Request() req: any) {
    return this.moradorService.getPendentes(req.user.apartamentoId);
  }

  @Get('stats')
  getStats(@Request() req: any) {
    return this.moradorService.getStats(req.user.apartamentoId);
  }

  @Patch('entregas/:id/retirada')
  confirmarRetirada(@Param('id') id: string) {
    return this.moradorService.confirmarRetirada(id);
  }
}