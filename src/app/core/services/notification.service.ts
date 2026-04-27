import { Injectable, signal } from '@angular/core';

export interface ToastMessage {
  id: number;
  type: 'success' | 'error' | 'warning' | 'info';
  title: string;
  message?: string;
  duration?: number;
}

@Injectable({ providedIn: 'root' })
export class NotificationService {
  private nextId = 0;
  readonly toasts = signal<ToastMessage[]>([]);

  success(title: string, message?: string): void {
    this.addToast('success', title, message);
  }

  error(title: string, message?: string): void {
    this.addToast('error', title, message, 8000);
  }

  warning(title: string, message?: string): void {
    this.addToast('warning', title, message, 6000);
  }

  info(title: string, message?: string): void {
    this.addToast('info', title, message);
  }

  dismiss(id: number): void {
    this.toasts.update((ts) => ts.filter((t) => t.id !== id));
  }

  private addToast(
    type: ToastMessage['type'],
    title: string,
    message?: string,
    duration = 4000,
  ): void {
    const id = this.nextId++;
    const toast: ToastMessage = { id, type, title, message, duration };
    this.toasts.update((ts) => [...ts, toast]);
    if (duration > 0) {
      setTimeout(() => this.dismiss(id), duration);
    }
  }
}
