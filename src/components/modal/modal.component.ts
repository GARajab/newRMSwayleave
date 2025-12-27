
import { Component, ChangeDetectionStrategy, input, output, HostListener, ElementRef } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-modal',
  templateUrl: './modal.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule],
})
export class ModalComponent {
  title = input<string>('');
  close = output<void>();

  constructor(private elementRef: ElementRef) {}

  closeModal() {
    this.close.emit();
  }

  @HostListener('document:keydown.escape', ['$event'])
  onKeydownHandler(event: KeyboardEvent) {
    this.closeModal();
  }

  onBackdropClick(event: MouseEvent) {
    if (event.target === this.elementRef.nativeElement.querySelector('.modal-backdrop')) {
        this.closeModal();
    }
  }
}
