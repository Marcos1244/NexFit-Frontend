import { MatIconModule } from '@angular/material/icon';
import { RouterModule } from '@angular/router';
import { Component } from '@angular/core';

@Component({
  imports: [
    MatIconModule,
    RouterModule
  ],
  selector: 'app-sidebar',
  styleUrl: './sidebar.component.css',
  templateUrl: './sidebar.component.html',
})
export class SidebarComponent {}
