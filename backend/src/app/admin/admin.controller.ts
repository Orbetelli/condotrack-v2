import { Controller, Get, Post, Patch, Body, Param, UseGuards } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { AdminService } from './admin.service';
import { Roles } from '../auth/roles.decorator';
import { RolesGuard } from '../auth/roles.guard';

@Controller('admin')
@UseGuards(AuthGuard('jwt'), RolesGuard)
@Roles('admin')
export class AdminController {
  constructor(private readonly adminService: AdminService) {}

  @Get('stats')
  getStats() {
    return this.adminService.getStats();
  }

  @Get('condominios')
  getCondominios() {
    return this.adminService.getCondominios();
  }

  @Post('condominios')
  criarCondominio(@Body() dto: any) {
    return this.adminService.criarCondominio(dto);
  }

  @Patch('condominios/:id/status')
  atualizarStatusCondominio(@Param('id') id: string, @Body('status') status: string) {
    return this.adminService.atualizarStatusCondominio(id, status);
  }

  @Get('usuarios')
  getUsuarios() {
    return this.adminService.getUsuarios();
  }

  @Patch('usuarios/:id/status')
  atualizarStatusUsuario(@Param('id') id: string, @Body('status') status: string) {
    return this.adminService.atualizarStatusUsuario(id, status);
  }

  @Post('usuarios/:authId/reset-senha')
  resetarSenha(@Param('authId') authId: string, @Body('senha') senha: string) {
    return this.adminService.resetarSenha(authId, senha);
  }

  @Post('sindico')
  criarSindico(@Body() dto: any) {
    return this.adminService.criarSindico(dto);
  }
}