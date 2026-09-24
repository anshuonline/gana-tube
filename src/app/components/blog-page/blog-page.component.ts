import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, NavigationEnd, RouterModule } from '@angular/router';
import { Title, Meta } from '@angular/platform-browser';
import { LucideArrowLeft, LucideClock, LucideUser, LucideArrowRight, LucideBookOpen, LucideLoader2 } from '@lucide/angular';
import { filter, Subscription } from 'rxjs';

import { BlogPost, BLOG_POSTS } from '../../data/blog-posts.data';

export type { BlogPost };

@Component({
  selector: 'app-blog-page',
  standalone: true,
  imports: [CommonModule, RouterModule, LucideArrowLeft, LucideClock, LucideUser, LucideArrowRight, LucideBookOpen, LucideLoader2],
  templateUrl: './blog-page.component.html',
  styleUrls: ['./blog-page.component.scss']
})
export class BlogPageComponent implements OnInit, OnDestroy {
  currentPost: BlogPost | null = null;
  isLoading: boolean = false;
  private routerSub?: Subscription;

  posts: BlogPost[] = BLOG_POSTS;

  constructor(
    private router: Router,
    private titleService: Title,
    private metaService: Meta
  ) {}

  ngOnInit(): void {
    this.checkCurrentRoute();
    this.routerSub = this.router.events.pipe(
      filter(event => event instanceof NavigationEnd)
    ).subscribe(() => {
      const rawUrl = this.router.url.split('?')[0];
      const segments = rawUrl.split('/').filter(s => s.length > 0);
      if (segments.length >= 2 && segments[0] === 'blog') {
        const slug = decodeURIComponent(segments[1]);
        if (this.currentPost?.slug !== slug) {
          this.checkCurrentRoute();
        }
      } else if (this.currentPost !== null) {
        this.checkCurrentRoute();
      }
    });
  }

  ngOnDestroy(): void {
    this.routerSub?.unsubscribe();
  }

  checkCurrentRoute(): void {
    const rawUrl = this.router.url.split('?')[0];
    const segments = rawUrl.split('/').filter(s => s.length > 0);
    if (segments.length >= 2 && segments[0] === 'blog') {
      const slug = decodeURIComponent(segments[1]);
      const found = this.posts.find(p => p.slug === slug);
      if (found) {
        this.currentPost = found;
        this.updateSEOForPost(found);
      } else {
        this.currentPost = null;
        this.updateSEOForList();
      }
    } else {
      this.currentPost = null;
      this.updateSEOForList();
    }
    this.isLoading = false;
  }

  openPost(slug: string): void {
    const found = this.posts.find(p => p.slug === slug);
    if (!found) return;

    this.isLoading = true;
    window.scrollTo({ top: 0, behavior: 'smooth' });
    this.router.navigate(['/blog', slug]);

    setTimeout(() => {
      this.currentPost = found;
      this.isLoading = false;
      this.updateSEOForPost(found);
    }, 280);
  }

  goToBlogList(): void {
    this.isLoading = true;
    window.scrollTo({ top: 0, behavior: 'smooth' });
    this.router.navigate(['/blog']);

    setTimeout(() => {
      this.currentPost = null;
      this.isLoading = false;
      this.updateSEOForList();
    }, 200);
  }

  goToHome(): void {
    this.router.navigate(['/']);
  }

  onImageError(event: Event, post: BlogPost): void {
    const target = event.target as HTMLImageElement;
    if (target) {
      target.src = 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?auto=format&fit=crop&w=800&q=80';
    }
  }

  private updateSEOForList(): void {
    this.titleService.setTitle('Blogs - GanaTube');
    this.metaService.updateTag({ name: 'description', content: 'Explore curated music blogs, free streaming tips, and guides on GanaTube.' });
    this.metaService.updateTag({ name: 'keywords', content: 'music blogs, ganatube blogs, free music streaming tips, unblocked music' });
  }

  private updateSEOForPost(post: BlogPost): void {
    this.titleService.setTitle(`${post.title} - GanaTube Blogs`);
    this.metaService.updateTag({ name: 'description', content: post.excerpt });
    this.metaService.updateTag({ name: 'keywords', content: post.tags.join(', ') });
  }
}
