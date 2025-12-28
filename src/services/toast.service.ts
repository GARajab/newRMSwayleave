import { Injectable, signal } from '@angular/core';

export type ToastType = 'success' | 'error' | 'info';

export interface Toast {
    id: number;
    message: string;
    type: ToastType;
}

@Injectable({ providedIn: 'root' })
export class ToastService {
    toasts = signal<Toast[]>([]);
    private counter = 0;

    show(message: string, type: ToastType = 'info', duration = 3000) {
        const id = this.counter++;
        this.toasts.update(t => [...t, { id, message, type }]);
        setTimeout(() => this.remove(id), duration);
    }

    remove(id: number) {
        this.toasts.update(t => t.filter(toast => toast.id !== id));
    }

    success(message: string) { this.show(message, 'success'); }
    error(message: string) { this.show(message, 'error', 5000); }
    info(message: string) { this.show(message, 'info'); }
}