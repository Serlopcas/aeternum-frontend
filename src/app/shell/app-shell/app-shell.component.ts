import { ChangeDetectionStrategy, Component, HostListener, signal } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { AboutDialogComponent } from '../../shared/components/about-dialog/about-dialog.component';
import { ToastOutletComponent } from '../../shared/components/toast-outlet/toast-outlet.component';
import { FooterComponent } from '../footer/footer.component';
import { SidebarComponent } from '../sidebar/sidebar.component';
import { TopbarComponent } from '../topbar/topbar.component';

@Component({
  selector: 'app-shell',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    RouterOutlet,
    SidebarComponent,
    TopbarComponent,
    ToastOutletComponent,
    FooterComponent,
    AboutDialogComponent,
  ],
  templateUrl: './app-shell.component.html',
  styleUrl: './app-shell.component.scss',
})
export class AppShellComponent {
  sidebarCollapsed = signal(false);
  mobileSidebarOpen = signal(false);
  aboutOpen = signal(false);

  closeMobileSidebar(): void {
    this.mobileSidebarOpen.set(false);
  }

  @HostListener('document:keydown.escape')
  onEscape(): void {
    this.mobileSidebarOpen.set(false);
    this.aboutOpen.set(false);
  }
}
