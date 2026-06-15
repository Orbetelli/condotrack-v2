import { Component, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AuthService } from '../services/auth/auth.service';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './login.html',
  styleUrl: './login.scss',
})
export class LoginComponent {
  email = '';
  senha = '';
  erro = signal('');
  carregando = signal(false);
  mostrarSenha = false;

  constructor(private auth: AuthService) {}

  async handleLogin() {
    if (!this.email || !this.senha) {
      this.erro.set('Preencha e-mail e senha.');
      return;
    }

    this.erro.set('');
    this.carregando.set(true);

    const { erro } = await this.auth.login(this.email, this.senha);

    if (erro) this.erro.set(erro);
    this.carregando.set(false);
  }

  toggleSenha() { this.mostrarSenha = !this.mostrarSenha; }

  getSaudacao(): string {
    const h = new Date().getHours();
    return h < 12 ? 'Bom dia' : h < 18 ? 'Boa tarde' : 'Boa noite';
  }
}