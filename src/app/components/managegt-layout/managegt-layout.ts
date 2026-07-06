import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router } from '@angular/router';

@Component({
  selector: 'app-managegt-layout',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './managegt-layout.html',
  styleUrls: ['./managegt-layout.scss']
})
export class ManagegtLayoutComponent implements OnInit {
  isLoggedIn = false;

  constructor(private router: Router) {}

  ngOnInit() {
    this.checkLoginStatus();
  }

  checkLoginStatus() {
    const token = localStorage.getItem('managegt_token');
    if (!token) {
      this.isLoggedIn = false;
      this.router.navigate(['/managegt/login']);
    } else {
      this.isLoggedIn = true;
    }
  }

  logout() {
    localStorage.removeItem('managegt_token');
    this.isLoggedIn = false;
    this.router.navigate(['/managegt/login']);
  }
}
