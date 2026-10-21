import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { LucideMusic, LucideArrowRight, LucideSparkles } from '@lucide/angular';
import { JingleService } from '../../services/jingle.service';

@Component({
  selector: 'app-jingle-overlay',
  standalone: true,
  imports: [CommonModule, LucideMusic, LucideArrowRight, LucideSparkles],
  templateUrl: './jingle-overlay.component.html',
  styleUrls: ['./jingle-overlay.component.scss']
})
export class JingleOverlayComponent {
  public jingleService = inject(JingleService);

  onSkip(): void {
    if (this.jingleService.canSkip()) {
      this.jingleService.skipJingle();
    }
  }
}
