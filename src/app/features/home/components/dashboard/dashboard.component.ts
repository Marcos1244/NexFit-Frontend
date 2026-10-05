import { ModuleLayoutComponent } from '../../../../layouts/components/module-layout/module-layout.component';
import { Component } from '@angular/core';
import MenuElementConfig from '../../../../layouts/models/menuElementConfig.model';

@Component({
  imports: [
    ModuleLayoutComponent
  ],
  selector: 'app-dashboard',
  styleUrl: './dashboard.component.css',
  templateUrl: './dashboard.component.html',
})
export class DashboardComponent {
  readonly menuElements: Array<MenuElementConfig> = [];
}
