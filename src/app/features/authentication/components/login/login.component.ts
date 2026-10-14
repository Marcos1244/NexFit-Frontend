import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { AuthService } from '../../../../core/security/auth/services/auth.service';
import { MatFormFieldModule } from '@angular/material/form-field';
import { LoginService } from '../../services/login.service';
import { MatButtonModule } from '@angular/material/button';
import { MatInputModule } from '@angular/material/input';
import { MatIconModule } from '@angular/material/icon';
import { Component, inject } from '@angular/core';
import { Router } from '@angular/router';
import TokenDto from '../../dto/token.dto';
import MessageError from '../../../../core/dto/messageError.dto';
import { form } from '@angular/forms/signals';
import { NotificationService } from '../../../../ui/services/notification.service';
import { DialogThemeEnum } from '../../../../ui/enums/DialogTheme.enum';

@Component({
  imports: [
    ReactiveFormsModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatIconModule
  ],
  selector: 'app-login',
  styleUrl: './login.component.css',
  templateUrl: './login.component.html',
})
export class LoginComponent {
  private formBuilder: FormBuilder = inject(FormBuilder);
  private service: LoginService = inject(LoginService);
  private auth: AuthService = inject(AuthService);
  private router: Router = inject(Router);
  private notification: NotificationService = inject(NotificationService);

  formGroup: FormGroup = this.formBuilder.group({
    ci: [
      '',
      [
        Validators.required
      ]
    ],
    password: [
      '',
      [
        Validators.required,
        Validators.minLength(6),
        Validators.maxLength(30)]
      ]
  });

  onSubmit (): void {
    if (!this.formGroup.invalid) {
      this.service.login(this.formGroup.value).subscribe({
        next: (response: TokenDto): void => {
          this.auth.saveSession(response.token);

          this.router.navigateByUrl('/application/home');
        },
        error: (info: { error: MessageError }) => {
          this.notification.alert({
            message: info.error.message,
            theme: DialogThemeEnum.Danger
          });
        }
      });
    }
  }

  protected readonly form = form;
}
