import { Component, OnInit, OnDestroy, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, NavigationEnd, RouterModule } from '@angular/router';
import { Title, Meta } from '@angular/platform-browser';
import {
  LucideArrowLeft,
  LucideClock,
  LucideUser,
  LucideArrowRight,
  LucideBookOpen,
  LucideLoader2,
  LucideChevronDown,
  LucideCheck,
  LucideTrendingUp,
  LucideTag,
  LucideSparkles,
  LucideShieldCheck,
  LucideShare2,
  LucideCheckCircle2,
  LucideBookmark,
  LucideSearch
} from '@lucide/angular';
import { filter, Subscription } from 'rxjs';

import { BlogPost, BLOG_POSTS } from '../../data/blog-posts.data';
import { BlogAuthor, BLOG_AUTHORS, getAuthorById } from '../../data/blog-authors.data';

export type { BlogPost };

@Component({
  selector: 'app-blog-page',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    LucideArrowLeft,
    LucideClock,
    LucideUser,
    LucideArrowRight,
    LucideBookOpen,
    LucideLoader2,
    LucideChevronDown,
    LucideCheck,
    LucideTrendingUp,
    LucideTag,
    LucideSparkles,
    LucideShieldCheck,
    LucideShare2,
    LucideCheckCircle2,
    LucideBookmark,
    LucideSearch
  ],
  templateUrl: './blog-page.component.html',
  styleUrls: ['./blog-page.component.scss']
})
export class BlogPageComponent implements OnInit, OnDestroy {
  currentPost: BlogPost | null = null;
  isLoading: boolean = false;
  private routerSub?: Subscription;

  // Filter only active published posts (or scheduled posts whose release date is past)
  allPublishedPosts: BlogPost[] = BLOG_POSTS.filter(p => {
    if (p.status === 'published' || !p.status) return true;
    if (p.status === 'scheduled' && p.scheduledDate) {
      return new Date(p.scheduledDate).getTime() <= Date.now();
    }
    return false;
  }).sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  authors: BlogAuthor[] = BLOG_AUTHORS;

  // Category filter
  selectedCategory: string = 'all';
  searchFilter: string = '';

  // Pagination
  readonly PAGE_SIZE = 8;
  displayedCount: number = 8;
  visiblePosts: BlogPost[] = [];
  hasMorePosts: boolean = true;
  isLoadingMore: boolean = false;

  // Top trending posts for sidebar
  trendingPosts: BlogPost[] = [];

  // Popular tags
  popularTags: string[] = [];

  // Share feedback
  copiedShareLink: boolean = false;

  constructor(
    private router: Router,
    private titleService: Title,
    private metaService: Meta,
    private cdr: ChangeDetectorRef
  ) {
    this.initSidebarData();
    this.updateVisiblePosts();
  }

  private initSidebarData(): void {
    // Trending 5 posts
    this.trendingPosts = this.allPublishedPosts.slice(0, 5);

    // Extract top tags
    const tagSet = new Set<string>();
    for (const post of this.allPublishedPosts) {
      for (const t of (post.tags || [])) {
        if (tagSet.size < 14) tagSet.add(t);
      }
    }
    this.popularTags = Array.from(tagSet);
  }

  get categoriesList(): { name: string; count: number }[] {
    const counts: Record<string, number> = {};
    for (const p of this.allPublishedPosts) {
      const cat = p.category || 'Bollywood Melodies';
      counts[cat] = (counts[cat] || 0) + 1;
    }
    return Object.keys(counts).map(cat => ({ name: cat, count: counts[cat] }));
  }

  get featuredPost(): BlogPost | null {
    // Highlight first published post as Spotlight Hero
    return this.allPublishedPosts.length > 0 ? this.allPublishedPosts[0] : null;
  }

  get filteredPosts(): BlogPost[] {
    let list = this.allPublishedPosts;
    if (this.selectedCategory !== 'all') {
      list = list.filter(p => p.category === this.selectedCategory);
    }
    if (this.searchFilter.trim()) {
      const q = this.searchFilter.toLowerCase().trim();
      list = list.filter(p =>
        p.title.toLowerCase().includes(q) ||
        p.excerpt.toLowerCase().includes(q) ||
        (p.tags || []).some(t => t.toLowerCase().includes(q))
      );
    }
    return list;
  }

  setCategory(cat: string): void {
    this.selectedCategory = cat;
    this.displayedCount = this.PAGE_SIZE;
    this.updateVisiblePosts();
  }

  filterByTag(tag: string): void {
    this.searchFilter = tag;
    this.displayedCount = this.PAGE_SIZE;
    this.updateVisiblePosts();
  }

  clearFilter(): void {
    this.selectedCategory = 'all';
    this.searchFilter = '';
    this.displayedCount = this.PAGE_SIZE;
    this.updateVisiblePosts();
  }

  private updateVisiblePosts(): void {
    const list = this.filteredPosts;
    this.visiblePosts = list.slice(0, this.displayedCount);
    this.hasMorePosts = this.displayedCount < list.length;
    this.cdr.markForCheck();
  }

  loadMore(): void {
    if (this.isLoadingMore || !this.hasMorePosts) return;
    this.isLoadingMore = true;
    this.cdr.markForCheck();

    setTimeout(() => {
      this.displayedCount = Math.min(this.displayedCount + this.PAGE_SIZE, this.filteredPosts.length);
      this.updateVisiblePosts();
      this.isLoadingMore = false;
      this.cdr.markForCheck();
    }, 120);
  }

  ngOnInit(): void {
    this.updateVisiblePosts();
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
      const found = this.allPublishedPosts.find(p => p.slug === slug) || BLOG_POSTS.find(p => p.slug === slug);
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
    this.cdr.markForCheck();
  }

  openPost(slug: string): void {
    const found = this.allPublishedPosts.find(p => p.slug === slug);
    if (!found) return;

    this.isLoading = true;
    this.cdr.markForCheck();
    window.scrollTo({ top: 0, behavior: 'smooth' });
    this.router.navigate(['/blog', slug]);

    setTimeout(() => {
      this.currentPost = found;
      this.isLoading = false;
      this.updateSEOForPost(found);
      this.cdr.markForCheck();
    }, 200);
  }

  goToBlogList(): void {
    this.isLoading = true;
    this.cdr.markForCheck();
    window.scrollTo({ top: 0, behavior: 'smooth' });
    this.router.navigate(['/blog']);

    setTimeout(() => {
      this.currentPost = null;
      this.isLoading = false;
      this.updateVisiblePosts();
      this.updateSEOForList();
      this.cdr.markForCheck();
    }, 150);
  }

  goToHome(): void {
    this.router.navigate(['/']);
  }

  getAuthor(id?: string): BlogAuthor {
    return getAuthorById(id);
  }

  getRelatedPosts(post: BlogPost): BlogPost[] {
    return this.allPublishedPosts
      .filter(p => p.slug !== post.slug && (p.category === post.category || p.authorId === post.authorId))
      .slice(0, 3);
  }

  copyShareLink(): void {
    if (typeof window !== 'undefined') {
      navigator.clipboard.writeText(window.location.href).then(() => {
        this.copiedShareLink = true;
        setTimeout(() => (this.copiedShareLink = false), 2500);
      });
    }
  }

  onImageError(event: Event, post: BlogPost): void {
    const target = event.target as HTMLImageElement;
    if (target) {
      target.src = 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?auto=format&fit=crop&w=800&q=80';
    }
  }

  private updateSEOForList(): void {
    this.titleService.setTitle('GanaTube Editorial - Music Culture, Artists & Audio Tech');
    this.metaService.updateTag({
      name: 'description',
      content: 'In-depth music journalism, artist journeys, Hindi cinema soundtracks, Desi Hip-Hop analysis, and high-fidelity streaming insights by the GanaTube Editorial Board.'
    });
    this.metaService.updateTag({
      name: 'keywords',
      content: 'music blogs, bollywood music, indian artists, arijit singh, diljit dosanjh, desi hip hop, lossless audio, ganatube editorial'
    });
  }

  private updateSEOForPost(post: BlogPost): void {
    this.titleService.setTitle(`${post.title} | GanaTube Editorial`);
    this.metaService.updateTag({ name: 'description', content: post.excerpt });
    this.metaService.updateTag({ name: 'author', content: post.author });
    this.metaService.updateTag({ name: 'keywords', content: post.tags.join(', ') });
    this.metaService.updateTag({ property: 'og:title', content: post.title });
    this.metaService.updateTag({ property: 'og:description', content: post.excerpt });
    this.metaService.updateTag({ property: 'og:image', content: post.coverImage });
  }
}
