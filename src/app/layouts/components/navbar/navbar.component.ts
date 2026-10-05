import { AuthService } from '../../../core/security/auth/services/auth.service';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { Component, inject } from '@angular/core';

@Component({
  imports: [
    MatButtonModule,
    MatIconModule
  ],
  selector: 'app-navbar',
  styleUrl: './navbar.component.css',
  templateUrl: './navbar.component.html',
})
export class NavbarComponent {
  readonly auth: AuthService = inject(AuthService);
}
