import { Component, EventEmitter, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { firstValueFrom } from 'rxjs';
import { LucidePlay, LucideSparkles, LucideCompass, LucideMic2, LucideGlobe } from '@lucide/angular';
import { YoutubeApiService, YouTubeSearchResult } from '../../services/youtube-api.service';
import { PlayerService } from '../../services/player.service';

@Component({
  selector: 'app-discovery-page',
  standalone: true,
  imports: [CommonModule, FormsModule, LucidePlay, LucideSparkles, LucideCompass, LucideMic2, LucideGlobe],
  templateUrl: './discovery-page.component.html',
  styleUrls: ['./discovery-page.component.scss']
})
export class DiscoveryPageComponent {
  @Output() playTrack = new EventEmitter<YouTubeSearchResult>();
  @Output() toggleMenu = new EventEmitter<{track: YouTubeSearchResult, event: MouseEvent}>();

  moods = ['Happy', 'Sad', 'Party', 'Chill', 'Workout', 'Romantic', 'Focus', 'Sleep', 'Drive', 'Nostalgia', 'Motivation', 'Devotional'];
  languages = ['Hindi', 'English', 'Punjabi', 'Bhojpuri', 'Tamil', 'Telugu', 'Bengali', 'Gujarati', 'Marathi'];
  
  // A few predefined artists or allow custom typing
  suggestedArtists = ['Arijit Singh', 'Diljit Dosanjh', 'Shreya Ghoshal', 'Badshah', 'Atif Aslam', 'Sonu Nigam', 'A.R. Rahman', 'Kishore Kumar'];

  selectedMoods: Set<string> = new Set();
  selectedLanguage: string = 'Hindi';
  selectedArtists: Set<string> = new Set();
  customArtist: string = '';

  get selectedMoodsArray() { return Array.from(this.selectedMoods); }
  get selectedArtistsArray() { return Array.from(this.selectedArtists); }

  step: 'input' | 'loading' | 'results' = 'input';
  loadingMessage = '';
  
  results: YouTubeSearchResult[] = [];

  constructor(
    private youtubeApi: YoutubeApiService,
    private playerService: PlayerService
  ) {}

  toggleMood(mood: string) {
    if (this.selectedMoods.has(mood)) {
      this.selectedMoods.delete(mood);
    } else {
      if (this.selectedMoods.size < 3) {
        this.selectedMoods.add(mood);
      }
    }
  }

  toggleArtist(artist: string) {
    if (this.selectedArtists.has(artist)) {
      this.selectedArtists.delete(artist);
    } else {
      if (this.selectedArtists.size < 3) {
        this.selectedArtists.add(artist);
      }
    }
  }

  addCustomArtist() {
    if (this.customArtist.trim() && this.selectedArtists.size < 3) {
      this.selectedArtists.add(this.customArtist.trim());
      this.customArtist = '';
    }
  }

  removeArtist(artist: string) {
    this.selectedArtists.delete(artist);
  }

  async discover() {
    if (this.selectedMoods.size === 0) {
      // Must select at least one mood
      return;
    }

    this.step = 'loading';
    this.results = [];
    
    // Simulate AI Prediction loading phases
    const loadingMessages = [
      "Analyzing your music taste...",
      "Matching moods...",
      "Curating the best playlists...",
      "Preparing your discovery mix..."
    ];

    for (let i = 0; i < loadingMessages.length; i++) {
      this.loadingMessage = loadingMessages[i];
      await new Promise(r => setTimeout(r, 1200));
    }

    // Generate query based on user input
    const moodsArray = Array.from(this.selectedMoods);
    const artistsArray = Array.from(this.selectedArtists);
    
    let query = `${this.selectedLanguage} ${moodsArray.join(' ')} songs playlists`;
    if (artistsArray.length > 0) {
      query += ` by ${artistsArray.join(' and ')}`;
    }

    try {
      // Fetch results
      this.results = await firstValueFrom(this.youtubeApi.searchMusic(query, 50));
      this.step = 'results';
    } catch (e) {
      console.error('Discovery error:', e);
      this.step = 'input';
    }
  }

  onPlay(track: YouTubeSearchResult) {
    this.playTrack.emit(track);
  }

  onRightClick(event: MouseEvent, track: YouTubeSearchResult): void {
    event.preventDefault();
    event.stopPropagation();
    this.toggleMenu.emit({track, event});
  }

  reset() {
    this.step = 'input';
    this.results = [];
  }

  isCurrentTrack(track: YouTubeSearchResult): boolean {
    return this.playerService.currentTrack()?.videoId === track.videoId;
  }
}
