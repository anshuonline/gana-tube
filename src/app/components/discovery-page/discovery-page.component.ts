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
  genres = ['Pop', 'Hip-Hop', 'Classical', 'Lo-Fi', 'EDM', 'Rock', 'Acoustic', 'Jazz', 'R&B', 'Indie', 'Folk', 'Metal'];
  languages = ['Hindi', 'English', 'Punjabi', 'Bhojpuri', 'Tamil', 'Telugu', 'Bengali', 'Gujarati', 'Marathi', 'Assamese'];
  
  artistsByLanguage: Record<string, string[]> = {
    'Hindi': ['Arijit Singh', 'Shreya Ghoshal', 'Atif Aslam', 'Sonu Nigam', 'Udit Narayan', 'Kishore Kumar', 'Lata Mangeshkar', 'Kumar Sanu', 'Alka Yagnik', 'Neha Kakkar', 'Badshah', 'Jubin Nautiyal', 'B Praak', 'Darshan Raval', 'Vishal Mishra', 'Armaan Malik', 'Sunidhi Chauhan', 'Mohit Chauhan', 'A.R. Rahman', 'Pritam'],
    'English': ['Taylor Swift', 'Ed Sheeran', 'Dua Lipa', 'The Weeknd', 'Billie Eilish', 'Ariana Grande', 'Justin Bieber', 'Bruno Mars', 'Eminem', 'Drake', 'Adele', 'Beyonce', 'Coldplay', 'Imagine Dragons', 'Maroon 5', 'Post Malone', 'Shawn Mendes', 'Selena Gomez', 'Harry Styles', 'Rihanna'],
    'Punjabi': ['Diljit Dosanjh', 'Karan Aujla', 'Sidhu Moose Wala', 'AP Dhillon', 'Guru Randhawa', 'Harrdy Sandhu', 'Ammy Virk', 'Shubh', 'B Praak', 'Mankirt Aulakh', 'Garry Sandhu', 'Jass Manak', 'Parmish Verma', 'Gippy Grewal', 'Babbu Maan', 'Gurdas Maan', 'Ranjit Bawa', 'Nimrat Khaira', 'Sunanda Sharma', 'Jasmine Sandlas'],
    'Bhojpuri': ['Pawan Singh', 'Khesari Lal Yadav', 'Shilpi Raj', 'Nirahua', 'Manoj Tiwari', 'Priyanka Singh', 'Kalpana Patowary', 'Antra Singh Priyanka', 'Ritesh Pandey', 'Pramod Premi Yadav', 'Gunjan Singh', 'Neelkamal Singh', 'Arvind Akela Kallu', 'Ankush Raja', 'Mohan Rathore', 'Bharat Sharma', 'Indu Sonali', 'Mamta Raut', 'Chhaila Bihari', 'Devi'],
    'Tamil': ['Anirudh Ravichander', 'A.R. Rahman', 'Sid Sriram', 'Ilayaraja', 'S.P. Balasubrahmanyam', 'Vijay Prakash', 'Karthik', 'Yuvan Shankar Raja', 'Hariharan', 'K.S. Chithra', 'Shweta Mohan', 'Sujatha', 'Chinmayi', 'Jonita Gandhi', 'D. Imman', 'Harris Jayaraj', 'G.V. Prakash', 'Deva', 'Vidyasagar', 'Anuradha Sriram'],
    'Telugu': ['Devi Sri Prasad', 'Thaman S', 'S.P. Balasubrahmanyam', 'K.S. Chithra', 'Sid Sriram', 'M.M. Keeravani', 'Anurag Kulkarni', 'Mangli', 'Sunitha', 'Geetha Madhuri', 'Ram Miriyala', 'Karthik', 'Armaan Malik', 'Shreya Ghoshal', 'Hariharan', 'Mano', 'P. Susheela', 'S. Janaki', 'Rahul Sipligunj', 'Sri Krishna'],
    'Bengali': ['Arijit Singh', 'Shreya Ghoshal', 'Anupam Roy', 'Rupam Islam', 'Kishore Kumar', 'Nachiketa', 'Anjan Dutt', 'Hemanta Mukherjee', 'Manna Dey', 'Lata Mangeshkar', 'Asha Bhosle', 'Lopamudra Mitra', 'Srikanto Acharya', 'Iman Chakraborty', 'Somlata Acharyya', 'Shaan', 'Babul Supriyo', 'Jeet Gannguli', 'Fossils', 'Chandrabindoo'],
    'Gujarati': ['Kinjal Dave', 'Geeta Rabari', 'Kirtidan Gadhvi', 'Osman Mir', 'Aditya Gadhvi', 'Aishwarya Majmudar', 'Jignesh Kaviraj', 'Rakesh Barot', 'Vijay Suvada', 'Gaman Santhal', 'Falguni Pathak', 'Darshan Raval', 'Bhoomi Trivedi', 'Parthiv Gohil', 'Sachin-Jigar', 'Arvind Vegda', 'Praful Dave', 'Diwaliben Bhil', 'Hemant Chauhan', 'Urvashi Radadiya'],
    'Marathi': ['Ajay-Atul', 'Avadhoot Gupte', 'Bela Shende', 'Shreya Ghoshal', 'Swapnil Bandodkar', 'Suresh Wadkar', 'Lata Mangeshkar', 'Asha Bhosle', 'Anuradha Paudwal', 'Arun Date', 'Sudhir Phadke', 'Vaishali Samant', 'Neha Rajpal', 'Nandesh Umap', 'Adarsh Shinde', 'Pravin Kuwar', 'Jasraj Joshi', 'Rohan-Rohan', 'Salil Kulkarni', 'Sandeep Khare'],
    'Assamese': ['Zubeen Garg', 'Papon', 'Bhupen Hazarika', 'Dikshu', 'Nilotpal Bora', 'Bidyut Bikash', 'Neel Akash', 'Kusum Kailash', 'Vreegu Kashyap', 'Babu Baruah', 'Nirmali Das', 'Bornali Kalita', 'Deeplina Deka', 'Subasana Dutta', 'Madhusmita', 'Joi Barua', 'Sushmita Baruah', 'Khagen Mahanta', 'Ridip Rankit', 'Tarali Sarma']
  };

  selectedMoods: Set<string> = new Set();
  selectedGenres: Set<string> = new Set();
  selectedLanguage: string = 'Hindi';
  selectedArtists: Set<string> = new Set();
  customArtist: string = '';
  showSuggestions: boolean = false;

  get suggestedArtists() {
    return this.artistsByLanguage[this.selectedLanguage] || [];
  }

  get filteredSuggestions() {
    if (!this.customArtist.trim()) return [];
    const query = this.customArtist.toLowerCase().trim();
    return this.suggestedArtists.filter(a => a.toLowerCase().includes(query) && !this.selectedArtists.has(a));
  }

  get selectedMoodsArray() { return Array.from(this.selectedMoods); }
  get selectedGenresArray() { return Array.from(this.selectedGenres); }
  get selectedArtistsArray() { return Array.from(this.selectedArtists); }

  step: 'input' | 'loading' | 'results' = 'input';
  loadingMessage = '';
  
  results: YouTubeSearchResult[] = [];

  onLanguageChange(lang: string) {
    this.selectedLanguage = lang;
    // Optionally, we can clear selected artists if they change language, but let's keep them
  }

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

  toggleGenre(genre: string) {
    if (this.selectedGenres.has(genre)) {
      this.selectedGenres.delete(genre);
    } else {
      if (this.selectedGenres.size < 3) {
        this.selectedGenres.add(genre);
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
      this.showSuggestions = false;
    }
  }

  selectSuggestion(artist: string) {
    if (this.selectedArtists.size < 3) {
      this.selectedArtists.add(artist);
      this.customArtist = '';
      this.showSuggestions = false;
    }
  }

  onSearchFocus() {
    this.showSuggestions = true;
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
    
    // Generate query based on user input
    const moodsArray = Array.from(this.selectedMoods);
    const genresArray = Array.from(this.selectedGenres);
    const artistsArray = Array.from(this.selectedArtists);
    
    let queryParts = [this.selectedLanguage];
    if (moodsArray.length > 0) queryParts.push(...moodsArray);
    if (genresArray.length > 0) queryParts.push(...genresArray);
    queryParts.push('songs playlists');
    
    let query = queryParts.join(' ');
    if (artistsArray.length > 0) {
      query += ` by ${artistsArray.join(' and ')}`;
    }

    // Start API request in parallel
    const apiPromise = firstValueFrom(this.youtubeApi.searchMusic(query, 50)).catch(e => {
      console.error('Discovery error:', e);
      return null;
    });

    // Simulate AI Prediction loading phases (minimum 3 seconds total)
    const loadingMessages = [
      "Analyzing your music taste...",
      "Matching moods...",
      "Curating the best playlists...",
      "Preparing your discovery mix..."
    ];

    for (let i = 0; i < loadingMessages.length; i++) {
      this.loadingMessage = loadingMessages[i];
      await new Promise(r => setTimeout(r, 750)); // Faster animation, 3s total
    }

    try {
      const results = await apiPromise;
      if (results && results.length > 0) {
        this.results = results;
      } else {
        // Fallback if no results found for the specific query
        this.results = await firstValueFrom(this.youtubeApi.searchMusic(`Trending ${this.selectedLanguage} songs`, 20));
      }
      this.step = 'results';
    } catch (e) {
      console.error('Final fallback error:', e);
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
