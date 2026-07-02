import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute } from '@angular/router';
import { DomSanitizer, SafeHtml } from '@angular/platform-browser';
import { PAGE_CONTENT } from '../../data/static-pages';

@Component({
  selector: 'app-static-page',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="static-page-container">
      <div class="static-page-content" [innerHTML]="safeHtml"></div>
    </div>
  `,
  styles: [`
    .static-page-container {
      padding: 40px 20px;
      min-height: calc(100vh - 200px);
    }
  `]
})
export class StaticPageComponent implements OnInit {
  private route = inject(ActivatedRoute);
  private sanitizer = inject(DomSanitizer);
  
  safeHtml: SafeHtml = '';
  pageId = '';

  ngOnInit() {
    this.route.paramMap.subscribe(params => {
      this.pageId = params.get('id') || '404';
      const content = PAGE_CONTENT[this.pageId];
      if (content) {
        this.safeHtml = this.sanitizer.bypassSecurityTrustHtml(content.html);
      } else {
        this.safeHtml = this.sanitizer.bypassSecurityTrustHtml(`
          <div class="static-content-block">
            <h2>Page Not Found</h2>
            <p>The page you are looking for does not exist.</p>
          </div>
        `);
      }
      window.scrollTo({ top: 0, behavior: 'smooth' });
    });
  }
}
