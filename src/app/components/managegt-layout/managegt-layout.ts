import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router } from '@angular/router';

interface SidebarGroup {
  key: string;
  label: string;
  icon: string;
  links: { path: string; label: string; icon: string }[];
}

@Component({
  selector: 'app-managegt-layout',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './managegt-layout.html',
  styleUrls: ['./managegt-layout.scss']
})
export class ManagegtLayoutComponent implements OnInit {
  isLoggedIn = false;
  isMobileMenuOpen = false;
  openGroups: Record<string, boolean> = {
    'content': true,
    'promotion': true,
    'analytics': true
  };

  groups: SidebarGroup[] = [
    {
      key: 'content',
      label: 'Content',
      icon: 'layers',
      links: [
        { path: '/managegt/sections', label: 'Custom Sections', icon: 'grid' },
        { path: '/managegt/sections/discovery', label: 'Discovery', icon: 'compass' },
        { path: '/managegt/playlists', label: 'Custom Playlists', icon: 'music' }
      ]
    },
    {
      key: 'promotion',
      label: 'Promotion',
      icon: 'megaphone',
      links: [
        { path: '/managegt/header', label: 'Manage Header', icon: 'layout' },
        { path: '/managegt/popups', label: 'Manage Popups', icon: 'mail' }
      ]
    },
    {
      key: 'rooms',
      label: 'Rooms',
      icon: 'radio',
      links: [
        { path: '/managegt/roombots', label: 'Manage RoomBots', icon: 'bot' }
      ]
    },
    {
      key: 'analytics',
      label: 'Analytics',
      icon: 'chart',
      links: [
        { path: '/managegt/users', label: 'Users', icon: 'users' }
      ]
    }
  ];

  toggleGroup(key: string) {
    this.openGroups[key] = !this.openGroups[key];
  }

  trackByGroup(index: number, group: SidebarGroup): string {
    return group.key;
  }

  isGroupActive(group: SidebarGroup): boolean {
    return group.links.some(l => this.router.url.startsWith(l.path));
  }

  toggleMobileMenu() {
    this.isMobileMenuOpen = !this.isMobileMenuOpen;
  }

  closeMobileMenu() {
    this.isMobileMenuOpen = false;
  }

  constructor(private router: Router) {}

  ngOnInit() {
    this.checkLoginStatus();
    // Auto-open the group containing the current page
    const active = this.groups.find(g => this.isGroupActive(g));
    if (active) this.openGroups[active.key] = true;
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
