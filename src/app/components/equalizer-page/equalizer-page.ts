import { Component, OnInit, signal } from '@angular/core';
import { CommonModule, Location } from '@angular/common';
import { LucideChevronLeft, LucideSliders, LucideActivity } from '@lucide/angular';
import { FormsModule } from '@angular/forms';

interface Preset {
  name: string;
  values: number[]; // 10 bands: 32, 64, 125, 250, 500, 1k, 2k, 4k, 8k, 16k
}

@Component({
  selector: 'app-equalizer-page',
  standalone: true,
  imports: [CommonModule, LucideChevronLeft, LucideSliders, LucideActivity, FormsModule],
  templateUrl: './equalizer-page.html',
  styleUrls: ['./equalizer-page.scss']
})
export class EqualizerPageComponent implements OnInit {
  bands = ['32Hz', '64Hz', '125Hz', '250Hz', '500Hz', '1kHz', '2kHz', '4kHz', '8kHz', '16kHz'];
  currentValues = signal<number[]>([0, 0, 0, 0, 0, 0, 0, 0, 0, 0]);
  activePreset = signal<string>('Flat');

  presets: Preset[] = [
    { name: 'Flat', values: [0, 0, 0, 0, 0, 0, 0, 0, 0, 0] },
    { name: 'GanaTube Pro', values: [6, 4, 2, 0, -2, -1, 1, 3, 5, 6] },
    { name: 'Bass Boost', values: [8, 6, 4, 1, 0, 0, 0, 0, 0, 0] },
    { name: 'Acoustic', values: [3, 4, 3, 1, 2, 2, 4, 4, 3, 2] },
    { name: 'Electronic', values: [5, 4, 1, 0, -2, 2, 1, 4, 5, 6] },
    { name: 'Pop', values: [-1, 2, 4, 5, 4, 2, 0, -1, -2, -1] },
    { name: 'Rock', values: [5, 4, 3, -1, -2, -1, 2, 4, 5, 5] },
    { name: 'Classical', values: [4, 3, 2, 1, -1, -1, 0, 2, 3, 4] },
    { name: 'Vocal Booster', values: [-2, -1, 0, 3, 5, 5, 4, 1, 0, -1] },
  ];

  constructor(private location: Location) {}

  ngOnInit() {
    // Load from local storage if previously saved
    const saved = localStorage.getItem('gt_equalizer_preset');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (parsed.name && parsed.values) {
          this.activePreset.set(parsed.name);
          this.currentValues.set(parsed.values);
        }
      } catch(e) {}
    }
  }

  goBack() {
    this.location.back();
  }

  selectPreset(preset: Preset) {
    this.activePreset.set(preset.name);
    // Deep copy values so modifying slider doesn't modify the preset array itself
    this.currentValues.set([...preset.values]);
    this.saveState();
  }

  onSliderChange(index: number, event: any) {
    this.activePreset.set('Custom');
    const newValues = [...this.currentValues()];
    newValues[index] = parseInt(event.target.value, 10);
    this.currentValues.set(newValues);
    this.saveState();
  }

  private saveState() {
    localStorage.setItem('gt_equalizer_preset', JSON.stringify({
      name: this.activePreset(),
      values: this.currentValues()
    }));
  }
}
