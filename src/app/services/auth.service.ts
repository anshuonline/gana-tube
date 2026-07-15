import { Injectable, signal } from '@angular/core';
import { initializeApp } from 'firebase/app';
import { getAuth, signInWithRedirect, GoogleAuthProvider, signOut, User, onAuthStateChanged, updateProfile, getRedirectResult } from 'firebase/auth';
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

    // Handle redirect result
    getRedirectResult(this.auth).then((result) => {
      if (result) {
        this.currentUser.set(result.user);
      }
    }).catch((error) => {
      console.error('Redirect login failed', error);
      // Fallback or error handling
    });
  }

  async loginWithGoogle(): Promise<void> {
    try {
      await signInWithRedirect(this.auth, this.provider);
    } catch (error) {
      console.error('Login failed', error);
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
        // Here you would normally check your DB if the username is available
        // For now, we update Firebase Auth profile directly
        await updateProfile(this.auth.currentUser, {
          displayName: newName
        });
        // Update local signal to reflect immediately
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
