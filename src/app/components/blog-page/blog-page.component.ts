import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, NavigationEnd, RouterModule } from '@angular/router';
import { Title, Meta } from '@angular/platform-browser';
import { LucideArrowLeft, LucideClock, LucideUser, LucideArrowRight, LucideBookOpen, LucideLoader2 } from '@lucide/angular';
import { filter, Subscription } from 'rxjs';

export interface BlogPost {
  slug: string;
  title: string;
  excerpt: string;
  content: string;
  date: string;
  author: string;
  tags: string[];
  coverImage: string;
  readTime: string;
}

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

  posts: BlogPost[] = [
    {
      slug: 'free-music-streaming-without-interruptions',
      title: 'The Ultimate Guide to Free Music Streaming Without Interruptions',
      excerpt: 'Discover how to enjoy your favorite tracks continuously without paying for premium subscriptions.',
      date: 'Sep 24, 2026',
      author: 'GanaTube Team',
      readTime: '3 min read',
      coverImage: 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?auto=format&fit=crop&w=800&q=80',
      tags: ['Streaming', 'Free Music', 'Audio Guide'],
      content: `
        <p>Listening to music online has become a daily habit for millions. However, constant interruptions can easily ruin the vibe. If you are tired of monthly subscriptions, finding a truly seamless free music streaming platform is essential.</p>
        <p>Modern platforms often restrict your listening experience by forcing audio ads between every few songs. But there are better ways to enjoy your playlists.</p>
        <h3>Why Continuous Playback Matters</h3>
        <p>Whether you are studying, working out, or relaxing, music helps maintain focus. A continuous stream keeps you in the zone. Web-based players like <strong><a href="/">GanaTube</a></strong> focus entirely on the listening experience, offering unlimited track skipping and seamless playback.</p>
        <h3>Top Tips for Interruption-Free Audio</h3>
        <ul>
          <li><strong>Use Web PWAs:</strong> Lightweight web apps avoid intrusive background updates and app-store restrictions.</li>
          <li><strong>Organize Playlists by Mood:</strong> Keep focus-heavy sessions separate from workout beats.</li>
          <li><strong>Keep Audio High Quality:</strong> Uncompressed streaming avoids dynamic volume jumps.</li>
        </ul>
        <p>Start listening the smart way and reclaim your audio experience today.</p>
      `
    },
    {
      slug: 'how-to-listen-to-unblocked-music-at-school',
      title: 'How to Listen to Unblocked Music at School or Work',
      excerpt: 'Bypass strict network firewalls easily and keep your productivity high with unblocked music players.',
      date: 'Sep 23, 2026',
      author: 'GanaTube Team',
      readTime: '4 min read',
      coverImage: 'https://images.unsplash.com/photo-1487180144351-b8472da7d491?auto=format&fit=crop&w=800&q=80',
      tags: ['Unblocked Music', 'Productivity', 'Web Player'],
      content: `
        <p>Most schools and corporate offices use strict network firewalls to block popular entertainment sites. Sitting through a long study session in absolute silence can be exhausting.</p>
        <p>The easiest solution is using an <strong>unblocked music player</strong> built directly for the web.</p>
        <h3>The Browser Advantage</h3>
        <p>Because web applications run inside the browser and don't require heavy media servers or executable installations, they rarely get flagged by institutional firewalls.</p>
        <ul>
          <li><strong>No Installation:</strong> Open the link and play instantly without administrator privileges.</li>
          <li><strong>Safe & Secure:</strong> No need for sketchy VPNs, slow proxies, or malware-laden plugins.</li>
          <li><strong>Huge Library:</strong> Access millions of tracks globally without restriction.</li>
        </ul>
        <p>Boost your focus and get through the workday with uninterrupted music right from your browser tab.</p>
      `
    },
    {
      slug: 'desktop-background-play-for-music',
      title: 'Why Desktop Background Play is Essential for Music Lovers',
      excerpt: 'Learn how to multitask effectively by keeping your music playing in the background while you work on your PC.',
      date: 'Sep 22, 2026',
      author: 'GanaTube Team',
      readTime: '3 min read',
      coverImage: 'https://images.unsplash.com/photo-1470225620780-dba8ba36b745?auto=format&fit=crop&w=800&q=80',
      tags: ['Desktop', 'Background Play', 'Multitasking'],
      content: `
        <p>Have you ever switched tabs to read an email, only to have your music abruptly pause? It is one of the most frustrating experiences for desktop users.</p>
        <p>Many modern free tiers intentionally disable background playback to push users toward paid subscriptions. But if you work on a PC all day, you need true multitasking.</p>
        <h3>Seamless Multitasking</h3>
        <p>Web-first audio platforms like <strong><a href="/">GanaTube</a></strong> ensure that your music keeps playing no matter what you are doing. You can minimize the browser, open spreadsheets, or play a game, and the audio will remain flawless.</p>
        <p>Never let arbitrary software limitations interrupt your creative workflow again.</p>
      `
    },
    {
      slug: 'host-virtual-listening-parties',
      title: 'How to Host Virtual Listening Parties Online',
      excerpt: 'Connect with friends globally by listening to the same music at the exact same time.',
      date: 'Sep 21, 2026',
      author: 'GanaTube Team',
      readTime: '4 min read',
      coverImage: 'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?auto=format&fit=crop&w=800&q=80',
      tags: ['Listen Together', 'Social', 'Music Rooms'],
      content: `
        <p>Listening to music with friends makes the experience significantly better. Whether you are managing a long-distance relationship or just chilling remotely, syncing your audio is a great way to bond.</p>
        <p>While some apps offer group sessions, they usually require all participants to have a premium account. But there are completely free ways to do this.</p>
        <h3>Built-in Synchronized Rooms</h3>
        <p>With features like 'Listen Together', you can host virtual rooms for free. The Host controls the playback, and everyone else hears the music in perfect sync.</p>
        <ul>
          <li><strong>Instant Invites:</strong> Share a link and friends join instantly with one click.</li>
          <li><strong>Live Chat:</strong> Discuss the tracks as they play in real time.</li>
          <li><strong>Song Requests:</strong> Listeners can queue up their favorite tracks for the host to review.</li>
        </ul>
        <p>Start your own virtual party today and share the vibe with the world.</p>
      `
    },
    {
      slug: 'protecting-your-privacy-while-streaming',
      title: 'Protecting Your Privacy While Streaming Music',
      excerpt: 'Stream anonymously without giving away your email, phone number, or personal data.',
      date: 'Sep 20, 2026',
      author: 'GanaTube Team',
      readTime: '3 min read',
      coverImage: 'https://images.unsplash.com/photo-1550751827-4bd374c3f58b?auto=format&fit=crop&w=800&q=80',
      tags: ['Privacy', 'Security', 'Anonymous'],
      content: `
        <p>In 2026, music streaming has become incredibly intrusive. Apps track your listening habits, bombard you with marketing emails, and constantly demand access to your device's data.</p>
        <p>If you value your privacy, you need a platform that respects your boundaries.</p>
        <h3>The No Sign-Up Philosophy</h3>
        <p>True web players allow you to stream music without forcing a registration screen. You don't need to provide an email, and you don't need to download an app that tracks your location.</p>
        <p>Enjoy your favorite albums anonymously and keep your inbox free from unwanted spam.</p>
      `
    },
    {
      slug: 'benefits-of-dark-mode-audio-players',
      title: 'The Health and Battery Benefits of Dark Mode Audio Players',
      excerpt: 'Why AMOLED dark themes are better for your eyes and your device battery.',
      date: 'Sep 19, 2026',
      author: 'GanaTube Team',
      readTime: '3 min read',
      coverImage: 'https://images.unsplash.com/photo-1458560871784-56d23406c091?auto=format&fit=crop&w=800&q=80',
      tags: ['Dark Mode', 'AMOLED', 'Design'],
      content: `
        <p>Staring at bright white screens while listening to music late at night can cause severe eye strain and disrupt your sleep cycle.</p>
        <p>This is why native Dark Mode isn't just an aesthetic choice - it's a functional necessity for modern web applications.</p>
        <h3>AMOLED Black and Battery Saving</h3>
        <p>For users with OLED or AMOLED screens, true black pixels are actually turned off completely. This means an audio player designed with deep black backgrounds will consume significantly less battery while keeping your music playing for hours.</p>
        <p>Protect your eyes and your battery life by switching to platforms that prioritize dark mode by default.</p>
      `
    },
    {
      slug: 'creating-the-perfect-study-playlist',
      title: 'Creating the Perfect Study Playlist for Maximum Focus',
      excerpt: 'Learn the science behind audio frequencies and how to curate music that boosts concentration.',
      date: 'Sep 18, 2026',
      author: 'GanaTube Team',
      readTime: '4 min read',
      coverImage: 'https://images.unsplash.com/photo-1459749411175-04bf5292ceea?auto=format&fit=crop&w=800&q=80',
      tags: ['Study', 'Focus', 'Playlists'],
      content: `
        <p>Music has a profound impact on cognitive function. But not all music is good for studying. Listening to heavy metal while trying to solve complex calculus might not yield the best results.</p>
        <h3>The Lo-Fi and Instrumental Advantage</h3>
        <p>Research shows that music without lyrics, such as classical, ambient, or Lo-Fi hip hop, helps the brain enter a state of flow.</p>
        <ul>
          <li><strong>Consistent Tempo:</strong> Choose tracks with 60 to 70 beats per minute.</li>
          <li><strong>No Lyrics:</strong> Words can distract the language processing centers of your brain.</li>
          <li><strong>Volume Control:</strong> Keep the volume low enough to serve as ambient background sound.</li>
        </ul>
        <p>Curate your perfect focus playlist today and crush your next study or coding session.</p>
      `
    },
    {
      slug: 'exploring-regional-music-online',
      title: 'Exploring Regional Music: From Punjabi Pop to Tamil Melodies',
      excerpt: 'Dive deep into the rich cultural diversity of regional music streaming.',
      date: 'Sep 17, 2026',
      author: 'GanaTube Team',
      readTime: '4 min read',
      coverImage: 'https://images.unsplash.com/photo-1510915361894-db8b60106cb1?auto=format&fit=crop&w=800&q=80',
      tags: ['Regional Music', 'Culture', 'Diversity'],
      content: `
        <p>While international pop dominates the charts, regional music has seen an explosive rise in global popularity. The vibrancy of Punjabi beats, the soulfulness of Bengali folk, and the intricate rhythms of Tamil and Telugu cinema are captivating millions.</p>
        <h3>A World of Sound</h3>
        <p>A truly global music player doesn't restrict you to mainstream English tracks. It opens the door to explore different cultures through audio.</p>
        <p>Whether you want to discover high-energy Bhojpuri tracks or relaxing instrumental covers of classic Hindi songs, having a diverse streaming platform makes all the difference.</p>
      `
    },
    {
      slug: 'the-resurgence-of-retro-music',
      title: 'The Resurgence of Retro: Why 80s and 90s Music is Trending Again',
      excerpt: 'Nostalgia is powerful. Discover why retro tracks are dominating modern streaming charts.',
      date: 'Sep 16, 2026',
      author: 'GanaTube Team',
      readTime: '3 min read',
      coverImage: 'https://images.unsplash.com/photo-1483032469466-b937c425697b?auto=format&fit=crop&w=800&q=80',
      tags: ['Retro', 'Nostalgia', 'Trends'],
      content: `
        <p>Everything old is new again. In recent years, we've seen a massive resurgence of 80s synth-pop and 90s alternative rock across streaming platforms and social media apps.</p>
        <h3>The Power of Nostalgia</h3>
        <p>As modern life becomes increasingly complex, listeners seek comfort in the familiar sounds of their childhood. Furthermore, classic Bollywood melodies from the 90s remain the absolute gold standard for romantic music.</p>
        <p>A good streaming library makes it incredibly easy to travel back in time. Search for any retro classic and experience the magic of the golden eras instantly.</p>
      `
    },
    {
      slug: 'high-definition-audio-streaming-explained',
      title: 'High-Definition Audio Streaming Explained',
      excerpt: 'What makes HD audio different, and why your ears deserve the best sound quality.',
      date: 'Sep 15, 2026',
      author: 'GanaTube Team',
      readTime: '3 min read',
      coverImage: 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?auto=format&fit=crop&w=800&q=80',
      tags: ['HD Audio', 'Sound Quality', 'Tech'],
      content: `
        <p>Not all streams are created equal. When you listen to music online, the audio is compressed to save bandwidth. But aggressive compression destroys the subtle details of a song.</p>
        <h3>Why HD Audio Matters</h3>
        <p>High-Definition (HD) audio retains the depth of the bass, the crispness of the vocals, and the clarity of the instruments. It provides a studio-like experience right in your browser.</p>
        <p>If you are using good quality headphones or speakers, settling for low-bitrate audio is a massive waste. Always choose platforms that prioritize clean, uncompressed, or high-bitrate streaming.</p>
      `
    }
  ];

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
