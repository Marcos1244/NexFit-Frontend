import { Service } from '@angular/core';
import jwtPayload from '../models/jwtPayload.model';

@Service()
export class JwtService {
  decode(token: string): jwtPayload | null {
    if (!token)
      return null;

    const parts = token.split('.');
    const payload = parts[1];

    if (parts.length !== 3 || !payload)
      return null;

    try {
      return JSON.parse(this.base64UrlDecode(payload)) as jwtPayload;
    } catch (err) {
      console.error('Hubo un error decodificando carga útil del JWT: ', err);
      return null;
    }
  }

  private base64UrlDecode(input: string): string {
    const base64 = input.replace(/-/g, '+').replace(/_/g, '/');
    const padded = base64.padEnd(base64.length + ((4 - (base64.length % 4)) % 4), '=');

    return decodeURIComponent(
      Array.from(atob(padded))
        .map((c) => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
        .join(''),
    );
  }
}
