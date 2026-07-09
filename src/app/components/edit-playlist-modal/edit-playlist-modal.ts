import { Component, Input, Output, EventEmitter, OnInit, OnChanges } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { LucideX } from '@lucide/angular';

@Component({
  selector: 'app-edit-playlist-modal',
  standalone: true,
  imports: [CommonModule, FormsModule, LucideX],
  templateUrl: './edit-playlist-modal.html',
  styleUrls: ['./edit-playlist-modal.scss']
})
export class EditPlaylistModalComponent implements OnInit, OnChanges {
  @Input() isOpen = false;
  @Input() initialName = '';
  @Input() initialIsPublic = false;
  
  @Output() save = new EventEmitter<{name: string, isPublic: boolean}>();
  @Output() close = new EventEmitter<void>();

  playlistName = '';
  isPublic = false;

  ngOnInit() {
    this.reset();
  }

  ngOnChanges() {
    if (this.isOpen) {
      this.reset();
    }
  }

  reset() {
    this.playlistName = this.initialName;
    this.isPublic = this.initialIsPublic;
  }

  onSave() {
    if (this.playlistName.trim()) {
      this.save.emit({ name: this.playlistName.trim(), isPublic: this.isPublic });
    }
  }

  onClose() {
    this.close.emit();
  }
}
