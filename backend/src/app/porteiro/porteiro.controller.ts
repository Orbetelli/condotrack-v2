import { Controller, Get, Post, Patch, Body, Param, Query, UseGuards, Request } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { PorteiroService, CreateEntregaDto, EntregaStatus } from './porteiro.service';
import { Roles } from '../auth/roles.decorator';
import { RolesGuard } from '../auth/roles.guard';

@Controller('porteiro')
@UseGuards(AuthGuard('jwt'), RolesGuard)
@Roles('porteiro', 'sindico', 'admin')
export class PorteiroController {
  constructor(private readonly porteiroService: PorteiroService) {}

  @Get('entregas')
  listarEntregas(@Request() req: any) {
    return this.porteiroService.listarEntregas(req.user.condominioId);
  }

  @Get('entregas/detalhe/:id')
  buscarEntrega(@Param('id') id: string) {
    return this.porteiroService.buscarEntregaPorId(id);
  }

  @Post('entregas')
  registrarEntrega(@Body() dto: CreateEntregaDto, @Request() req: any) {
    return this.porteiroService.registrarEntrega(
      req.user.id,
      req.user.condominioId,
      dto,
    );
  }

  @Patch('entregas/:id/retirada')
  registrarRetirada(@Param('id') id: string, @Request() req: any) {
    return this.porteiroService.registrarRetirada(id, req.user.id);
  }

  @Patch('entregas/:id/status')
  atualizarStatus(
    @Param('id') id: string,
    @Body('status') status: EntregaStatus,
  ) {
    return this.porteiroService.atualizarStatus(id, status);
  }

  @Get('stats')
  getStats(@Request() req: any) {
    return this.porteiroService.getStats(req.user.condominioId);
  }

  @Get('historico')
  buscarHistorico(
    @Query('bloco') bloco: string,
    @Query('numero') numero: string,
    @Request() req: any,
  ) {
    return this.porteiroService.buscarHistorico({
      bloco,
      numero,
      condominioId: req.user.condominioId,
    });
  }

  @Get('moradores')
  listarMoradores(@Request() req: any) {
    return this.porteiroService.listarMoradores(req.user.condominioId);
  }

  @Get('moradores/buscar')
  buscarMorador(
    @Query('nome') nome: string,
    @Request() req: any,
  ) {
    return this.porteiroService.buscarMoradorPorNome(nome, req.user.condominioId);
  }
}