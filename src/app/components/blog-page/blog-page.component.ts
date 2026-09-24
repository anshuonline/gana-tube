import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { Title, Meta } from '@angular/platform-browser';
import { LucideArrowLeft, LucideClock, LucideUser } from '@lucide/angular';

export interface BlogPost {
  slug: string;
  title: string;
  excerpt: string;
  content: string;
  date: string;
  author: string;
  tags: string[];
}

@Component({
  selector: 'app-blog-page',
  standalone: true,
  imports: [CommonModule, RouterModule, LucideArrowLeft, LucideClock, LucideUser],
  templateUrl: './blog-page.component.html',
  styleUrls: ['./blog-page.component.scss']
})
export class BlogPageComponent implements OnInit {
  currentPost: BlogPost | null = null;

  posts: BlogPost[] = [
    {
      slug: 'free-music-online-without-ads-2026',
      title: 'How to Listen to Free Music Online Without Ads in 2026',
      excerpt: 'Tired of unskippable ads? Discover the ultimate web-based solution for uninterrupted, ad-free music streaming.',
      date: 'Sep 24, 2026',
      author: 'GanaTube Team',
      tags: ['Music', 'Ad Free Music', 'Free Music Online', 'Streaming', 'Tech'],
      content: `
        <p>If you are tired of listening to unskippable audio ads between your favorite songs, you are not alone. The era of truly free music streaming apps seems to be over, with platforms aggressively pushing expensive premium subscriptions. However, there is still a hidden gem on the internet.</p>
        <p>Enter <strong><a href="/">GanaTube.in</a></strong>, a revolutionary web-based music streaming platform that is changing the way we listen to music online.</p>
        <h3>Why GanaTube is the ultimate solution:</h3>
        <ul>
          <li><strong>100% Ad-Free Experience:</strong> You can listen to hundreds of songs back-to-back without a single audio or display ad breaking your flow.</li>
          <li><strong>Zero Login Hassle:</strong> Unlike other apps that harvest your data, GanaTube requires absolutely no sign-up or login. Just visit the site and play.</li>
          <li><strong>Desktop Background Play:</strong> While mobile browsers heavily restrict background audio, GanaTube fully supports seamless background play on your Desktop! You can minimize your browser, work on other tabs, and let the music play uninterrupted.</li>
        </ul>
        <p>If you want a pure, ad-free music experience without opening your wallet, bookmark GanaTube today.</p>
      `
    },
    {
      slug: 'best-unblocked-music-player-school-office',
      title: 'The Best Unblocked Music Player for School and Office Wi-Fi',
      excerpt: 'Bypass strict network firewalls and listen to your favorite unblocked songs seamlessly.',
      date: 'Sep 23, 2026',
      author: 'GanaTube Team',
      tags: ['Unblocked Music', 'Education', 'Productivity', 'Web Development', 'Music Streaming'],
      content: `
        <p>Most schools, colleges, and corporate offices use strict network firewalls to block popular music streaming sites like Spotify, Apple Music, and YouTube. Sitting through a long study session or workday in silence can be exhausting. So, how do you bypass this?</p>
        <p>The easiest solution is using an <strong>unblocked music player</strong> like <strong><a href="/">GanaTube.in</a></strong>.</p>
        <h3>Why GanaTube bypasses strict networks:</h3>
        <p>Because GanaTube is an independent, lightweight web application, it rarely gets flagged by institutional firewalls. You don't need to download any sketchy unblocker apps or VPNs.</p>
        <ul>
          <li><strong>No App Installation Needed:</strong> It runs directly in your browser.</li>
          <li><strong>Massive Library:</strong> Search for any track globally and play it instantly.</li>
          <li><strong>Perfect for Desktop Work:</strong> It offers flawless background play on desktop computers. You can hide the tab and listen to your favorite unblocked songs while completing your assignments or office spreadsheets.</li>
        </ul>
        <p>Stop staring at blocked network screens and switch to GanaTube for uninterrupted productivity.</p>
      `
    },
    {
      slug: 'ganatube-vs-youtube-music-free-alternative',
      title: 'Why GanaTube is the Best Free Alternative to YouTube Music',
      excerpt: 'Experience the world\'s biggest music library without the annoying background play restrictions.',
      date: 'Sep 22, 2026',
      author: 'GanaTube Team',
      tags: ['YouTube Music', 'Spotify Alternative', 'Free Apps', 'Music', 'Web Player'],
      content: `
        <p>YouTube Music has one of the best music catalogs in the world, featuring rare covers, live performances, and official studio tracks. But there is a massive problem with its free tier: <strong>No Background Play and Too Many Ads.</strong></p>
        <p>If you lock your screen or switch tabs, the music stops completely. Unless you pay for premium, it is almost unusable as a daily music driver. This is where <strong><a href="/">GanaTube.in</a></strong> steps in.</p>
        <h3>The GanaTube Advantage:</h3>
        <p>GanaTube gives you access to a massive universe of songs but fixes everything that is wrong with modern streaming free tiers.</p>
        <ul>
          <li><strong>Ad-Free by Default:</strong> No premium subscription required to skip ads.</li>
          <li><strong>Desktop Multitasking:</strong> GanaTube supports background playback on Desktop. You can open a new software, minimize your browser, and the music won't abruptly pause.</li>
          <li><strong>Clean UI:</strong> An ultra-modern, AMOLED dark-mode interface that looks better than most premium apps.</li>
        </ul>
        <p>Experience the world's biggest music library without the annoying restrictions.</p>
      `
    },
    {
      slug: 'listen-to-music-together-online-free',
      title: 'How to Sync and Listen to Music Together with Friends Online',
      excerpt: 'Host virtual listening parties and listen to music in perfect sync with your friends for free.',
      date: 'Sep 21, 2026',
      author: 'GanaTube Team',
      tags: ['Listen Together', 'Social Media', 'Music Player', 'Relationships', 'Tech Solutions'],
      content: `
        <p>Listening to music with friends makes the experience ten times better. Whether you are hosting a virtual study session, managing a long-distance relationship, or just chilling remotely, syncing your music is a great way to bond.</p>
        <p>While apps like Spotify offer "Group Sessions," they strictly require all participants to have a paid Premium account. Thankfully, <strong><a href="/rooms">GanaTube.in</a></strong> has solved this problem for free.</p>
        <h3>Introducing GanaTube's "Listen Together" Rooms:</h3>
        <p>GanaTube features a built-in Rooms functionality that lets you host virtual listening parties with zero cost.</p>
        <ul>
          <li><strong>Create a Room:</strong> You become the Host. You control the playback, play, pause, and skip tracks.</li>
          <li><strong>Invite Friends:</strong> Just share the room link. Anyone can join instantly without logging in.</li>
          <li><strong>Live Sync & Chat:</strong> Your friends hear exactly what you hear at the exact same second. Listeners can even search for tracks and send "Song Requests" directly to the Host's queue!</li>
        </ul>
        <p>Combine this with GanaTube's ad-free playback and desktop background support, and you have the most powerful social music platform on the internet today.</p>
      `
    },
    {
      slug: 'play-free-music-online-no-signup',
      title: 'Play Free Music Online Instantly: No Sign-Up, No Downloads',
      excerpt: 'Protect your privacy and stream music anonymously without giving away your email or phone number.',
      date: 'Sep 20, 2026',
      author: 'GanaTube Team',
      tags: ['Privacy', 'Free Music Online', 'Web Player', 'Streaming Apps', 'Tech Trends'],
      content: `
        <p>Have you ever just wanted to quickly listen to a specific song, but the website forces you to download an app, verify your email, or create an account before playing a single second of audio? In 2026, music streaming has become incredibly intrusive. Apps track your listening habits, bombard you with marketing emails, and drain your phone’s storage.</p>
        <p>If you value your privacy and prefer instant access, <strong><a href="/">GanaTube.in</a></strong> is exactly what you are looking for.</p>
        <h3>The Power of a True Web Player:</h3>
        <p>GanaTube is built on a modern web framework, meaning it operates entirely inside your browser.</p>
        <ul>
          <li><strong>Zero Registration:</strong> There is absolutely no "Sign Up" or "Log In" button forced on you. You open the link, search for your track, and hit play. It’s that simple.</li>
          <li><strong>No App Downloads:</strong> Save your device's storage. You get a native, premium-app-like experience right in your browser.</li>
          <li><strong>Desktop Background Play:</strong> Whether you are coding, writing, or designing on your PC, GanaTube’s desktop background playback ensures your music keeps running smoothly while you switch tabs and multitask.</li>
          <li><strong>Ad-Free Experience:</strong> The best part? The platform respects your time by streaming music completely free of audio advertisements.</li>
        </ul>
        <p>For an anonymous, fast, and frictionless music streaming experience, ditch the heavy apps and switch to GanaTube.</p>
      `
    }
  ];

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private titleService: Title,
    private metaService: Meta
  ) {}

  ngOnInit(): void {
    this.route.paramMap.subscribe(params => {
      const slug = params.get('slug');
      if (slug) {
        this.currentPost = this.posts.find(p => p.slug === slug) || null;
        if (this.currentPost) {
          // Set dynamic SEO tags for the specific blog post
          this.titleService.setTitle(this.currentPost.title + ' - GanaTube Blog');
          this.metaService.updateTag({ name: 'description', content: this.currentPost.excerpt });
          this.metaService.updateTag({ name: 'keywords', content: this.currentPost.tags.join(', ') });
        } else {
          this.router.navigate(['/blog']);
        }
      } else {
        this.currentPost = null;
        // Set SEO for the main blog list page
        this.titleService.setTitle('GanaTube Blog - Free Music Streaming News & Updates');
        this.metaService.updateTag({ name: 'description', content: 'Read the latest articles about free music streaming, unblocked music players, and ad-free listening on the GanaTube Blog.' });
        this.metaService.updateTag({ name: 'keywords', content: 'music blog, streaming news, ganatube blog, free music articles' });
      }
    });
  }
}
