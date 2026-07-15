import { Injectable, signal } from '@angular/core';
import { initializeApp } from 'firebase/app';
import { getAuth, signInWithPopup, GoogleAuthProvider, signOut, User, onAuthStateChanged, updateProfile } from 'firebase/auth';
import { environment } from '../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private app = initializeApp(environment.firebase);
  private auth = getAuth(this.app);
  private provider = new GoogleAuthProvider();

  // We use a Signal to hold the current user. It starts as undefined (loading), 
  // and becomes User (logged in) or null (logged out).
  currentUser = signal<User | null | undefined>(undefined);

  constructor() {
    // Listen for auth state changes
    onAuthStateChanged(this.auth, (user) => {
      this.currentUser.set(user);
    });
  }

  async loginWithGoogle(): Promise<void> {
    try {
      await signInWithPopup(this.auth, this.provider);
    } catch (error: any) {
      // Don't log user-initiated cancellations
      if (error?.code !== 'auth/cancelled-popup-request' && error?.code !== 'auth/popup-closed-by-user') {
        console.error('Login failed', error);
      }
      throw error;
    }
  }

  async logout(): Promise<void> {
    try {
      await signOut(this.auth);
    } catch (error) {
      console.error('Logout failed', error);
      throw error;
    }
  }

  async updateUsername(newName: string): Promise<boolean> {
    try {
      if (this.auth.currentUser) {
        await updateProfile(this.auth.currentUser, {
          displayName: newName
        });
        this.currentUser.set({ ...this.auth.currentUser });
        return true;
      }
      return false;
    } catch (error) {
      console.error('Failed to update username', error);
      return false;
    }
  }
}
