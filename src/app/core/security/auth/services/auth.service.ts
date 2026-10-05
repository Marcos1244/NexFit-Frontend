import { Service, signal, computed } from '@angular/core';
import { JwtService } from './jwt.service';
import jwtPayload from '../models/jwtPayload.model';
import { RoleEnum } from '../../../enums/role.enum';

@Service()
export class AuthService {
  private jwt: JwtService = new JwtService();

  private readonly TOKEN_KEY = 'NEXFIT_TOKEN';
  private readonly payloadSignal = signal<jwtPayload | null>(null);

  readonly isAuthenticated = computed(() => {
    const payload = this.payloadSignal();

    if (!payload)
      return false;

    return payload.exp * 1000 > Date.now();
  });

  readonly sub = computed(() => this.payloadSignal()?.sub ?? null);

  readonly name = computed(() => this.payloadSignal()?.name ?? null);

  readonly lastname = computed(() => this.payloadSignal()?.lastname ?? null);

  readonly authorities = computed(() => this.payloadSignal()?.authorities ?? []);

  constructor() {
    this.refreshPayload();
  }

  saveSession(token: string): void {
    localStorage.setItem(this.TOKEN_KEY, token);

    this.payloadSignal.set(this.jwt.decode(token));
  }

  clearSession(): void {
    localStorage.removeItem(this.TOKEN_KEY);

    this.payloadSignal.set(null);
  }

  getToken(): string | null {
    return localStorage.getItem(this.TOKEN_KEY);
  }

  hasAnyRole(roles: Array<RoleEnum>): boolean {
    const payload = this.payloadSignal();

    if (!payload?.authorities)
      return false;

    return roles.some((r) => payload.authorities.includes(r));
  }

  private refreshPayload(): void {
    const token = this.getToken();

    if (token) {
      this.payloadSignal.set(this.jwt.decode(token));
    } else {
      return this.clearSession();
    }
  }
}
