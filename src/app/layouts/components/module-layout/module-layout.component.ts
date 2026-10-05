import MenuElementConfig from '../../models/menuElementConfig.model';
import { RouterLink, RouterLinkActive } from '@angular/router';
import { MatIconModule } from '@angular/material/icon';
import { Component, input } from '@angular/core';

@Component({
  imports: [
    RouterLinkActive,
    MatIconModule,
    RouterLink
  ],
  selector: 'app-module-layout',
  styleUrl: './module-layout.component.css',
  templateUrl: './module-layout.component.html',
})
export class ModuleLayoutComponent {
  readonly moduleName = input.required<string>();
  menuElements = input.required<Array<MenuElementConfig>>();
}
