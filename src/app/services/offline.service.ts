import { Injectable, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import * as localforage from 'localforage';
import { Track } from './player.service';

@Injectable({
  providedIn: 'root'
})
export class OfflineService {
  private audioStore: LocalForage;
  private metadataStore: LocalForage;
  
  // Keep track of which songs are downloaded in a signal for UI reactivity
  public downloadedTracks = signal<Record<string, Track>>({});
  
  constructor(private http: HttpClient) {
    this.audioStore = localforage.createInstance({
      name: 'GanaTube',
      storeName: 'offline_audio'
    });
    
    this.metadataStore = localforage.createInstance({
      name: 'GanaTube',
      storeName: 'offline_metadata'
    });

    this.loadMetadata();
  }

  private async loadMetadata() {
    try {
      const keys = await this.metadataStore.keys();
      const tracks: Record<string, Track> = {};
      
      for (const key of keys) {
        const track = await this.metadataStore.getItem<Track>(key);
        if (track) {
          tracks[key] = track;
        }
      }
      this.downloadedTracks.set(tracks);
    } catch (e) {
      console.error('Failed to load offline metadata', e);
    }
  }

  public isDownloaded(videoId: string): boolean {
    return !!this.downloadedTracks()[videoId];
  }

  public getDownloadedTrackList(): Track[] {
    return Object.values(this.downloadedTracks());
  }

  public async getTrackBlob(videoId: string): Promise<Blob | null> {
    try {
      return await this.audioStore.getItem<Blob>(videoId);
    } catch (e) {
      console.error('Failed to get track blob', e);
      return null;
    }
  }

  public async getTrackBlobUrl(videoId: string): Promise<string | null> {
    const blob = await this.getTrackBlob(videoId);
    if (!blob) return null;
    return URL.createObjectURL(blob);
  }

  private pipedInstances = [
    'https://pipedapi.kavin.rocks',
    'https://pipedapi.smnz.de',
    'https://api.piped.projectsegfau.lt',
    'https://piped-api.lunar.icu',
    'https://pipedapi.tokhmi.xyz',
    'https://pipedapi.r4fo.com',
    'https://pipedapi.privacy.com.de',
    'https://pipedapi.adminforge.de',
    'https://piped-api.garudalinux.org',
    'https://pipedapi.chocoflan.net',
    'https://pipedapi.astartes.nl'
  ];

  public async downloadTrack(track: Track, progressCallback?: (progress: number) => void): Promise<boolean> {
    if (this.isDownloaded(track.videoId)) return true;

    try {
      // 1. Get the stream URL using our custom Python Backend API (Zero Load on Server)
      // Change this URL to where you host your python script (e.g. Render.com or VPS IP)
      const pythonApiUrl = 'https://ganatube-python-api.onrender.com'; 
      // For local testing: const pythonApiUrl = 'http://127.0.0.1:5000';
      
      const proxyUrl = `${pythonApiUrl}/api/extract?videoId=${track.videoId}`;
      
      const res = await fetch(proxyUrl);
      if (!res.ok) throw new Error(`Python API error! status: ${res.status}`);
      const streamRes = await res.json();
      
      if (streamRes.error) {
        throw new Error(streamRes.error);
      }

      if (!streamRes.streamUrl) {
        throw new Error('No audio stream URL returned from Python API.');
      }

      // 2. Download the actual audio file directly from Google Servers
      const response = await fetch(streamRes.streamUrl);
      
      if (!response.ok) throw new Error('Failed to download audio file');
      
      // Simulate progress if content-length is available
      const contentLength = response.headers.get('content-length');
      const total = contentLength ? parseInt(contentLength, 10) : 0;
      let loaded = 0;

      const reader = response.body?.getReader();
      const chunks: Uint8Array[] = [];

      if (reader) {
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          if (value) {
            chunks.push(value);
            loaded += value.length;
            if (total && progressCallback) {
              progressCallback(Math.round((loaded / total) * 100));
            }
          }
        }
      }

      const blob = new Blob(chunks as any, { type: streamRes.ext === 'webm' ? 'audio/webm' : 'audio/mp4' });

      // 3. Save to IndexedDB
      await this.audioStore.setItem(track.videoId, blob);
      await this.metadataStore.setItem(track.videoId, track);
      
      // Update state
      const updated = { ...this.downloadedTracks(), [track.videoId]: track };
      this.downloadedTracks.set(updated);
      
      return true;
    } catch (e) {
      console.error('Error downloading track', e);
      return false;
    }
  }

  public async removeTrack(videoId: string): Promise<void> {
    try {
      await this.audioStore.removeItem(videoId);
      await this.metadataStore.removeItem(videoId);
      
      const updated = { ...this.downloadedTracks() };
      delete updated[videoId];
      this.downloadedTracks.set(updated);
    } catch (e) {
      console.error('Failed to remove track', e);
    }
  }
}
