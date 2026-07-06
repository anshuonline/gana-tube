import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';

@Component({
  selector: 'app-managegt-login',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './managegt-login.html',
  styleUrls: ['./managegt-login.scss']
})
export class ManagegtLoginComponent {
  username = '';
  password = '';
  errorMessage = '';
  isLoading = false;

  constructor(private http: HttpClient, private router: Router) {}

  login() {
    if (!this.username || !this.password) {
      this.errorMessage = 'Please enter both username and password';
      return;
    }

    this.isLoading = true;
    this.errorMessage = '';

    const loginUrl = window.location.origin.includes('localhost') 
      ? 'http://localhost/manageads/managegt-api.php?action=login'
      : 'https://manageads.ganatube.in/managegt-api.php?action=login';

    this.http.post<any>(loginUrl, { username: this.username, password: this.password })
      .subscribe({
        next: (res) => {
          this.isLoading = false;
          if (res.status === 'success') {
            localStorage.setItem('managegt_token', res.token);
            // Navigate to sections and reload to update layout sidebar
            this.router.navigate(['/managegt/sections']).then(() => {
              window.location.reload();
            });
          }
        },
        error: (err) => {
          this.isLoading = false;
          this.errorMessage = err.error?.message || 'Login failed. Check backend connection.';
        }
      });
  }
}
