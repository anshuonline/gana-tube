import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { LEGAL_CONTENT } from './legal-content';

@Component({
  selector: 'app-legal-pages',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './legal-pages.component.html',
  styleUrls: ['./legal-pages.component.scss']
})
export class LegalPagesComponent implements OnInit {
  private route = inject(ActivatedRoute);
  private router = inject(Router);

  title = '';
  lastUpdated = '';
  contentHtml = '';

  ngOnInit() {
    this.route.url.subscribe(segments => {
      const path = segments[0]?.path; // e.g., 'privacy', 'terms', 'dmca', 'about'
      const content = LEGAL_CONTENT[path];
      
      if (content) {
        this.title = content.title;
        this.lastUpdated = content.lastUpdated;
        this.contentHtml = content.content;
      } else {
        this.router.navigate(['/home']);
      }
    });
  }
}
