import { Component, OnInit, OnDestroy, ChangeDetectorRef, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule, Router } from '@angular/router';
import {
  LucideLayoutDashboard,
  LucideCalendar,
  LucideClock,
  LucideCheckCircle2,
  LucideFileEdit,
  LucideUsers,
  LucidePlus,
  LucideExternalLink,
  LucideCopy,
  LucideCheck,
  LucideSearch,
  LucideFilter,
  LucideArrowLeft,
  LucideImage,
  LucideEye,
  LucideSparkles,
  LucideShieldCheck,
  LucideTag,
  LucideChevronRight,
  LucideX,
  LucideAlertCircle
} from '@lucide/angular';

import { BlogPost, BLOG_POSTS } from '../../data/blog-posts.data';
import { BlogAuthor, BLOG_AUTHORS, getAuthorById } from '../../data/blog-authors.data';

@Component({
  selector: 'app-cms-management',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    RouterModule,
    LucideLayoutDashboard,
    LucideCalendar,
    LucideClock,
    LucideCheckCircle2,
    LucideFileEdit,
    LucideUsers,
    LucidePlus,
    LucideExternalLink,
    LucideCopy,
    LucideCheck,
    LucideSearch,
    LucideFilter,
    LucideArrowLeft,
    LucideImage,
    LucideEye,
    LucideSparkles,
    LucideShieldCheck,
    LucideTag,
    LucideChevronRight,
    LucideX,
    LucideAlertCircle
  ],
  templateUrl: './cms-management.component.html',
  styleUrls: ['./cms-management.component.scss']
})
export class CmsManagementComponent implements OnInit, OnDestroy {
  posts = signal<BlogPost[]>(BLOG_POSTS);
  authors = signal<BlogAuthor[]>(BLOG_AUTHORS);

  activeTab = signal<'all' | 'scheduled' | 'published' | 'draft' | 'authors'>('scheduled');
  searchQuery = signal<string>('');
  selectedCategory = signal<string>('all');

  // Preview modal state
  previewPost = signal<BlogPost | null>(null);

  // Add / Schedule Post modal state
  isModalOpen = signal<boolean>(false);
  copySuccess = signal<boolean>(false);

  newPost = {
    title: '',
    slug: '',
    authorId: 'anshu-saxena',
    category: 'Bollywood Melodies',
    status: 'scheduled' as 'published' | 'scheduled' | 'draft',
    scheduledDate: '',
    excerpt: '',
    coverImage: '',
    tags: '',
    content: '',
    readTime: '5 min read'
  };

  categories = [
    'Bollywood Melodies',
    'Punjabi Wave',
    'Desi Hip-Hop',
    'Indie Pop',
    'Streaming Tech',
    'Classical & Sufi',
    'Pop Culture',
    'Music Trends',
    'Global Hits'
  ];

  private timerInterval?: any;

  constructor(private router: Router, private cdr: ChangeDetectorRef) {}

  ngOnInit(): void {
    // Set default scheduled date to 3 days from now at 10:00 AM
    const nextDate = new Date();
    nextDate.setDate(nextDate.getDate() + 3);
    nextDate.setHours(10, 0, 0, 0);
    this.newPost.scheduledDate = nextDate.toISOString().slice(0, 16);

    // Refresh countdowns every 30 seconds
    this.timerInterval = setInterval(() => {
      this.cdr.markForCheck();
    }, 30000);
  }

  ngOnDestroy(): void {
    if (this.timerInterval) {
      clearInterval(this.timerInterval);
    }
  }

  // Stats
  totalCount = computed(() => this.posts().length);
  publishedCount = computed(() => this.posts().filter(p => p.status === 'published' || !p.status).length);
  scheduledCount = computed(() => this.posts().filter(p => p.status === 'scheduled').length);
  draftCount = computed(() => this.posts().filter(p => p.status === 'draft').length);
  authorCount = computed(() => this.authors().length);

  nextScheduledPost = computed(() => {
    const scheduled = this.posts()
      .filter(p => p.status === 'scheduled' && p.scheduledDate)
      .sort((a, b) => new Date(a.scheduledDate!).getTime() - new Date(b.scheduledDate!).getTime());
    return scheduled.length > 0 ? scheduled[0] : null;
  });

  filteredPosts = computed(() => {
    const tab = this.activeTab();
    const query = this.searchQuery().toLowerCase().trim();
    const cat = this.selectedCategory();

    return this.posts().filter(post => {
      // Tab filter
      if (tab === 'scheduled' && post.status !== 'scheduled') return false;
      if (tab === 'published' && post.status !== 'published' && post.status !== undefined) return false;
      if (tab === 'draft' && post.status !== 'draft') return false;

      // Category filter
      if (cat !== 'all' && post.category !== cat) return false;

      // Search query
      if (query) {
        const titleMatch = post.title.toLowerCase().includes(query);
        const authorMatch = (post.author || '').toLowerCase().includes(query);
        const tagMatch = (post.tags || []).some(t => t.toLowerCase().includes(query));
        if (!titleMatch && !authorMatch && !tagMatch) return false;
      }

      return true;
    }).sort((a, b) => {
      if (tab === 'scheduled') {
        const timeA = a.scheduledDate ? new Date(a.scheduledDate).getTime() : Infinity;
        const timeB = b.scheduledDate ? new Date(b.scheduledDate).getTime() : Infinity;
        return timeA - timeB;
      }
      return 0;
    });
  });

  getAuthor(id?: string): BlogAuthor {
    return getAuthorById(id);
  }

  getCountdownText(dateStr?: string): string {
    if (!dateStr) return 'No date set';
    const target = new Date(dateStr).getTime();
    const now = Date.now();
    const diff = target - now;

    if (diff <= 0) return 'Ready to publish';

    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    const mins = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));

    if (days > 0) return `In ${days}d ${hours}h`;
    if (hours > 0) return `In ${hours}h ${mins}m`;
    return `In ${mins}m`;
  }

  onTitleChange(): void {
    if (!this.newPost.slug) {
      this.newPost.slug = this.slugify(this.newPost.title);
    }
  }

  slugify(text: string): string {
    return text
      .toLowerCase()
      .replace(/[^\w\s-]/g, '')
      .trim()
      .replace(/[\s_-]+/g, '-')
      .replace(/^-+|-+$/g, '');
  }

  openAddModal(presetStatus: 'scheduled' | 'draft' | 'published' = 'scheduled'): void {
    this.newPost.status = presetStatus;
    this.isModalOpen.set(true);
  }

  closeModal(): void {
    this.isModalOpen.set(false);
  }

  openPreview(post: BlogPost): void {
    this.previewPost.set(post);
  }

  closePreview(): void {
    this.previewPost.set(null);
  }

  copyPostSnippet(): void {
    const authorObj = getAuthorById(this.newPost.authorId);
    const postSnippet: BlogPost = {
      slug: this.newPost.slug || this.slugify(this.newPost.title),
      title: this.newPost.title,
      excerpt: this.newPost.excerpt,
      content: this.newPost.content || `<p>${this.newPost.excerpt}</p>`,
      date: new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
      author: authorObj.name,
      authorId: authorObj.id,
      category: this.newPost.category,
      status: this.newPost.status,
      scheduledDate: this.newPost.status === 'scheduled' ? new Date(this.newPost.scheduledDate).toISOString() : undefined,
      tags: this.newPost.tags ? this.newPost.tags.split(',').map(t => t.trim()).filter(Boolean) : [this.newPost.category],
      coverImage: this.newPost.coverImage || 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?auto=format&fit=crop&w=800&q=80',
      readTime: this.newPost.readTime || '5 min read'
    };

    const formattedCode = JSON.stringify(postSnippet, null, 2);
    navigator.clipboard.writeText(formattedCode).then(() => {
      this.copySuccess.set(true);
      setTimeout(() => this.copySuccess.set(false), 3000);
    });
  }

  navigateToBlog(slug?: string): void {
    if (slug) {
      this.router.navigate(['/blog', slug]);
    } else {
      this.router.navigate(['/blog']);
    }
  }

  navigateToMusic(): void {
    this.router.navigate(['/']);
  }
}
