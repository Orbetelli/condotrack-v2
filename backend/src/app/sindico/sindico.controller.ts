import { Controller, Get, Patch, Param, Query, Body, UseGuards, Request } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { SindicoService } from './sindico.service';
import { Roles } from '../auth/roles.decorator';
import { RolesGuard } from '../auth/roles.guard';

@Controller('sindico')
@UseGuards(AuthGuard('jwt'), RolesGuard)
@Roles('sindico', 'admin')
export class SindicoController {
  constructor(private readonly sindicoService: SindicoService) {}

  @Get('stats')
  getStats(@Request() req: any) {
    return this.sindicoService.getStats(req.user.condominioId);
  }

  @Get('entregas')
  getEntregas(@Request() req: any, @Query('status') status?: string) {
    return this.sindicoService.getEntregas(req.user.condominioId, status);
  }

  @Get('moradores')
  getMoradores(@Request() req: any) {
    return this.sindicoService.getMoradores(req.user.condominioId);
  }

  @Patch('moradores/:id/status')
  atualizarStatusMorador(@Param('id') id: string, @Body('status') status: string) {
    return this.sindicoService.atualizarStatusMorador(id, status);
  }

  @Get('porteiros')
  getPorteiros(@Request() req: any) {
    return this.sindicoService.getPorteiros(req.user.condominioId);
  }

  @Patch('porteiros/:id/status')
  atualizarStatusPorteiro(@Param('id') id: string, @Body('status') status: string) {
    return this.sindicoService.atualizarStatusPorteiro(id, status);
  }

  @Get('apartamentos')
  getApartamentos(@Request() req: any) {
    return this.sindicoService.getApartamentos(req.user.condominioId);
  }
}