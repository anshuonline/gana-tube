/**
 * GanaTube Server-Side Prerendering Engine
 * Generates full static HTML pages for all 113 blog posts and legal pages.
 * Ensures Google AdSense and search crawlers receive 100% full text without needing client-side JS.
 */

const fs = require('fs');
const path = require('path');

const DIST_BROWSER = path.join(__dirname, 'dist', 'ganatube', 'browser');
const INDEX_HTML_PATH = path.join(DIST_BROWSER, 'index.html');

if (!fs.existsSync(INDEX_HTML_PATH)) {
  console.error('[PRERENDER] dist/ganatube/browser/index.html not found! Run npm run build:local first.');
  process.exit(1);
}

const baseHtml = fs.readFileSync(INDEX_HTML_PATH, 'utf8');

// 1. Load Blog Posts
let blogDataRaw = fs.readFileSync(path.join(__dirname, 'src', 'app', 'data', 'blog-posts.data.ts'), 'utf8');
blogDataRaw = blogDataRaw.replace(/^import\s+.*?;/gm, '');
blogDataRaw = blogDataRaw.replace(/^export\s+interface\s+[\s\S]*?^}/gm, '');
blogDataRaw = blogDataRaw.replace('export const BLOG_POSTS: BlogPost[] =', 'const BLOG_POSTS =');
const getPosts = new Function(blogDataRaw + '; return BLOG_POSTS;');
const posts = getPosts();
console.log(`[PRERENDER] Loaded ${posts.length} blog posts from blog-posts.data.ts`);

// 2. Load Static Pages
let staticDataRaw = fs.readFileSync(path.join(__dirname, 'src', 'app', 'data', 'static-pages.ts'), 'utf8');
staticDataRaw = staticDataRaw.replace(/^export\s+const\s+PAGE_CONTENT.*?=\s*\{/, 'const PAGE_CONTENT = {');
const getStaticPages = new Function(staticDataRaw + '; return PAGE_CONTENT;');
const staticPages = getStaticPages();
console.log(`[PRERENDER] Loaded ${Object.keys(staticPages).length} static/legal pages from static-pages.ts`);

function escapeHtml(str) {
  if (!str) return '';
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

const PRERENDER_CSS = `
<style id="gt-prerender-css">
  body { margin: 0; background-color: #000000; color: #ffffff; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; -webkit-font-smoothing: antialiased; }
  .prerendered-shell { max-width: 900px; margin: 0 auto; padding: 24px 20px 80px; box-sizing: border-box; }
  .prerendered-header { display: flex; align-items: center; justify-content: space-between; padding: 16px 0 28px; border-bottom: 1px solid rgba(255,255,255,0.08); margin-bottom: 32px; }
  .prerendered-header .brand { display: flex; align-items: center; gap: 12px; text-decoration: none; color: #ffffff; font-weight: 700; font-size: 1.25rem; }
  .prerendered-header .brand img { width: 36px; height: 36px; border-radius: 8px; }
  .prerendered-nav { display: flex; gap: 20px; align-items: center; }
  .prerendered-nav a { color: rgba(255,255,255,0.7); text-decoration: none; font-size: 0.95rem; font-weight: 500; transition: color 0.2s; }
  .prerendered-nav a:hover { color: #ffffff; }
  .prerendered-meta { display: flex; flex-wrap: wrap; gap: 12px; align-items: center; font-size: 0.85rem; color: rgba(255,255,255,0.6); margin-bottom: 16px; }
  .prerendered-badge { background: linear-gradient(135deg, #a855f7, #ec4899); color: #ffffff; padding: 4px 10px; border-radius: 999px; font-weight: 600; font-size: 0.75rem; text-transform: uppercase; letter-spacing: 0.5px; }
  .prerendered-title { font-size: 2.2rem; line-height: 1.25; font-weight: 800; margin: 0 0 16px; color: #ffffff; letter-spacing: -0.5px; }
  .prerendered-author-box { display: flex; align-items: center; gap: 12px; padding: 12px 16px; background: rgba(255,255,255,0.03); border: 1px solid rgba(255,255,255,0.06); border-radius: 12px; margin-bottom: 28px; font-size: 0.9rem; color: rgba(255,255,255,0.8); }
  .prerendered-hero-img { width: 100%; max-height: 460px; object-fit: cover; border-radius: 16px; margin-bottom: 36px; border: 1px solid rgba(255,255,255,0.08); }
  .prerendered-body { font-size: 1.1rem; line-height: 1.8; color: rgba(255,255,255,0.85); }
  .prerendered-body h2 { font-size: 1.55rem; color: #ffffff; margin: 40px 0 16px; font-weight: 700; border-bottom: 1px solid rgba(255,255,255,0.08); padding-bottom: 8px; }
  .prerendered-body h3 { font-size: 1.3rem; color: #ffffff; margin: 32px 0 12px; font-weight: 600; }
  .prerendered-body p { margin: 0 0 20px; }
  .prerendered-body ul, .prerendered-body ol { margin: 0 0 24px; padding-left: 24px; }
  .prerendered-body li { margin-bottom: 8px; }
  .prerendered-body strong { color: #ffffff; }
  .prerendered-body a { color: #a855f7; text-decoration: none; border-bottom: 1px dotted #a855f7; }
  .prerendered-body a:hover { color: #ec4899; border-bottom-color: #ec4899; }
  .prerendered-tags { display: flex; flex-wrap: wrap; gap: 8px; margin: 36px 0; }
  .prerendered-tags .tag { background: rgba(255,255,255,0.05); border: 1px solid rgba(255,255,255,0.1); padding: 4px 12px; border-radius: 6px; font-size: 0.85rem; color: rgba(255,255,255,0.7); }
  .prerendered-cta { background: linear-gradient(135deg, rgba(168,85,247,0.15), rgba(236,72,153,0.15)); border: 1px solid rgba(168,85,247,0.3); border-radius: 16px; padding: 32px; text-align: center; margin: 48px 0; }
  .prerendered-cta h3 { margin: 0 0 8px; font-size: 1.4rem; color: #ffffff; }
  .prerendered-cta p { margin: 0 0 20px; color: rgba(255,255,255,0.7); }
  .prerendered-cta .cta-btn { display: inline-block; background: linear-gradient(135deg, #a855f7, #ec4899); color: #ffffff; padding: 12px 28px; border-radius: 999px; text-decoration: none; font-weight: 600; font-size: 1rem; box-shadow: 0 4px 20px rgba(168,85,247,0.4); }
  .prerendered-footer { margin-top: 64px; padding-top: 28px; border-top: 1px solid rgba(255,255,255,0.08); text-align: center; font-size: 0.85rem; color: rgba(255,255,255,0.5); }
  .prerendered-footer a { color: rgba(255,255,255,0.6); text-decoration: none; margin: 0 8px; }
  .prerendered-footer a:hover { color: #ffffff; }
  .blog-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(280px, 1fr)); gap: 24px; margin-top: 32px; }
  .blog-card { background: rgba(255,255,255,0.02); border: 1px solid rgba(255,255,255,0.08); border-radius: 12px; overflow: hidden; text-decoration: none; color: inherit; display: flex; flex-direction: column; transition: transform 0.2s, border-color 0.2s; }
  .blog-card:hover { transform: translateY(-3px); border-color: rgba(168,85,247,0.4); }
  .blog-card img { width: 100%; height: 160px; object-fit: cover; }
  .blog-card-content { padding: 16px; display: flex; flex-direction: column; flex-grow: 1; }
  .blog-card-meta { font-size: 0.75rem; color: rgba(255,255,255,0.5); margin-bottom: 8px; }
  .blog-card-title { font-size: 1.1rem; font-weight: 700; margin: 0 0 8px; color: #ffffff; line-height: 1.35; }
  .blog-card-excerpt { font-size: 0.85rem; color: rgba(255,255,255,0.65); line-height: 1.5; margin: 0; flex-grow: 1; }
  @media (max-width: 640px) {
    .prerendered-title { font-size: 1.65rem; }
    .prerendered-header { flex-direction: column; gap: 16px; align-items: flex-start; }
    .prerendered-body { font-size: 1rem; }
  }
</style>
`;

function replaceHeadTags(html, { title, description, canonicalUrl, ogType = 'website', ogImage, jsonLd }) {
  let modified = html;

  // Replace Title
  modified = modified.replace(/<title>[\s\S]*?<\/title>/i, `<title>${escapeHtml(title)}</title>`);

  // Replace Meta Description
  if (modified.includes('name="description"')) {
    modified = modified.replace(/<meta\s+name="description"\s+content="[^"]*">/i, `<meta name="description" content="${escapeHtml(description)}">`);
  } else {
    modified = modified.replace('</head>', `<meta name="description" content="${escapeHtml(description)}">\n</head>`);
  }

  // Replace Canonical Link
  if (modified.includes('rel="canonical"')) {
    modified = modified.replace(/<link\s+rel="canonical"\s+href="[^"]*">/i, `<link rel="canonical" href="${canonicalUrl}">`);
  } else {
    modified = modified.replace('</head>', `<link rel="canonical" href="${canonicalUrl}">\n</head>`);
  }

  // Replace OpenGraph Title & Description
  modified = modified.replace(/<meta\s+property="og:title"\s+content="[^"]*">/i, `<meta property="og:title" content="${escapeHtml(title)}">`);
  modified = modified.replace(/<meta\s+property="og:description"\s+content="[^"]*">/i, `<meta property="og:description" content="${escapeHtml(description)}">`);
  modified = modified.replace(/<meta\s+property="og:url"\s+content="[^"]*">/i, `<meta property="og:url" content="${canonicalUrl}">`);
  modified = modified.replace(/<meta\s+property="og:type"\s+content="[^"]*">/i, `<meta property="og:type" content="${ogType}">`);
  if (ogImage) {
    modified = modified.replace(/<meta\s+property="og:image"\s+content="[^"]*">/i, `<meta property="og:image" content="${ogImage}">`);
  }

  // Inject Prerender CSS & JSON-LD
  let headExtras = PRERENDER_CSS;
  if (jsonLd) {
    headExtras += `\n<script type="application/ld+json">\n${JSON.stringify(jsonLd, null, 2)}\n</script>\n`;
  }
  modified = modified.replace('</head>', `${headExtras}</head>`);

  return modified;
}

function writePage(subPath, htmlContent) {
  const targetDir = path.join(DIST_BROWSER, subPath);
  fs.mkdirSync(targetDir, { recursive: true });
  const targetFile = path.join(targetDir, 'index.html');
  fs.writeFileSync(targetFile, htmlContent, 'utf8');
}

// ─────────────────────────────────────────────────────────────────────────────
// 3. GENERATE ALL 113 BLOG POSTS
// ─────────────────────────────────────────────────────────────────────────────
let countBlogs = 0;
for (const post of posts) {
  const canonicalUrl = `https://ganatube.in/blog/${post.slug}`;
  const pageTitle = `${post.title} — GanaTube Editorial`;
  const pageDesc = post.excerpt || `Read ${post.title} on GanaTube Editorial. Explore acoustic storytelling, artists, and music psychology.`;
  const cover = post.coverImage || 'https://ganatube.in/ganatube-logo.png';

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "BlogPosting",
    "headline": post.title,
    "description": pageDesc,
    "image": [cover],
    "datePublished": post.date,
    "dateModified": post.date,
    "author": {
      "@type": "Person",
      "name": post.author || "Anshu Saxena"
    },
    "publisher": {
      "@type": "Organization",
      "name": "GanaTube",
      "logo": {
        "@type": "ImageObject",
        "url": "https://ganatube.in/ganatube-logo.webp"
      }
    },
    "mainEntityOfPage": {
      "@type": "WebPage",
      "@id": canonicalUrl
    }
  };

  const articleInnerHtml = `
  <div class="prerendered-shell">
    <header class="prerendered-header">
      <a href="/" class="brand">
        <img src="/ganatube-logo.webp" alt="GanaTube" width="36" height="36" />
        <span>GanaTube</span>
      </a>
      <nav class="prerendered-nav">
        <a href="/">Home</a>
        <a href="/blog">Blog &amp; Guides</a>
        <a href="/curated-playlists">Playlists</a>
        <a href="/discovery">Discovery</a>
      </nav>
    </header>

    <article class="prerendered-article">
      <div class="prerendered-meta">
        <span class="prerendered-badge">${escapeHtml(post.category || 'Editorial')}</span>
        <span>${escapeHtml(post.readTime || '5 min read')}</span>
        <span>•</span>
        <span>${escapeHtml(post.date)}</span>
      </div>

      <h1 class="prerendered-title">${escapeHtml(post.title)}</h1>

      <div class="prerendered-author-box">
        <span>Curated &amp; written by <strong>${escapeHtml(post.author || 'GanaTube Editorial Team')}</strong></span>
      </div>

      ${cover ? `<img class="prerendered-hero-img" src="${cover}" alt="${escapeHtml(post.title)}" />` : ''}

      <div class="prerendered-body">
        ${post.content}
      </div>

      <div class="prerendered-tags">
        ${(post.tags || []).map(t => `<span class="tag">#${escapeHtml(t)}</span>`).join('')}
      </div>

      <div class="prerendered-cta">
        <h3>Stream Music Online Free Without Ads</h3>
        <p>Listen to your favorite songs, create collaborative rooms, and experience high-fidelity sound on GanaTube.</p>
        <a href="/" class="cta-btn">Start Listening Now</a>
      </div>
    </article>

    <footer class="prerendered-footer">
      <p>
        <a href="/about">About Us</a> ·
        <a href="/privacy-policy">Privacy Policy</a> ·
        <a href="/terms-of-service">Terms of Service</a> ·
        <a href="/contact">Contact</a> ·
        <a href="/blog">Editorial Archive</a>
      </p>
      <p>© ${new Date().getFullYear()} GanaTube.in — All rights reserved.</p>
    </footer>
  </div>
  `;

  let postHtml = replaceHeadTags(baseHtml, {
    title: pageTitle,
    description: pageDesc,
    canonicalUrl,
    ogType: 'article',
    ogImage: cover,
    jsonLd
  });

  // Inject inside <app-root> so crawlers immediately parse it before client hydration
  postHtml = postHtml.replace('<app-root></app-root>', `<app-root>${articleInnerHtml}</app-root>`);

  writePage(path.join('blog', post.slug), postHtml);
  countBlogs++;
}
console.log(`[PRERENDER] Successfully generated ${countBlogs} individual blog post pages!`);

// ─────────────────────────────────────────────────────────────────────────────
// 4. GENERATE /blog ARCHIVE INDEX PAGE
// ─────────────────────────────────────────────────────────────────────────────
{
  const canonicalUrl = 'https://ganatube.in/blog';
  const pageTitle = 'Music Culture, Editorial & Listening Guides — GanaTube Blog';
  const pageDesc = 'Explore 100+ curated music essays, deep work listening guides, acoustic psychology, regional spotlights, and web audio discovery on GanaTube.';

  const blogCardsHtml = posts.map(p => `
    <a href="/blog/${p.slug}" class="blog-card">
      <img src="${p.coverImage || 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?auto=format&fit=crop&w=600&q=80'}" alt="${escapeHtml(p.title)}" loading="lazy" />
      <div class="blog-card-content">
        <div class="blog-card-meta">
          <span>${escapeHtml(p.category || 'Editorial')}</span> · <span>${escapeHtml(p.date)}</span>
        </div>
        <h2 class="blog-card-title">${escapeHtml(p.title)}</h2>
        <p class="blog-card-excerpt">${escapeHtml(p.excerpt || '')}</p>
      </div>
    </a>
  `).join('');

  const blogHubHtml = `
  <div class="prerendered-shell">
    <header class="prerendered-header">
      <a href="/" class="brand">
        <img src="/ganatube-logo.webp" alt="GanaTube" width="36" height="36" />
        <span>GanaTube</span>
      </a>
      <nav class="prerendered-nav">
        <a href="/">Home</a>
        <a href="/blog">Blog &amp; Guides</a>
        <a href="/curated-playlists">Playlists</a>
        <a href="/discovery">Discovery</a>
      </nav>
    </header>

    <div style="margin-bottom: 32px;">
      <h1 class="prerendered-title">Music Culture, Editorial &amp; Listening Guides</h1>
      <p style="font-size: 1.15rem; color: rgba(255,255,255,0.7); line-height: 1.6; margin: 0;">
        Explore authentic deep-dives into sonic psychology, music discovery frameworks, acoustic analysis, and independent artist legacies curated by the GanaTube team.
      </p>
    </div>

    <div class="blog-grid">
      ${blogCardsHtml}
    </div>

    <footer class="prerendered-footer">
      <p>
        <a href="/about">About Us</a> ·
        <a href="/privacy-policy">Privacy Policy</a> ·
        <a href="/terms-of-service">Terms of Service</a> ·
        <a href="/contact">Contact</a>
      </p>
      <p>© ${new Date().getFullYear()} GanaTube.in — All rights reserved.</p>
    </footer>
  </div>
  `;

  let blogIndexHtml = replaceHeadTags(baseHtml, {
    title: pageTitle,
    description: pageDesc,
    canonicalUrl,
    ogType: 'website'
  });
  blogIndexHtml = blogIndexHtml.replace('<app-root></app-root>', `<app-root>${blogHubHtml}</app-root>`);
  writePage('blog', blogIndexHtml);
  console.log('[PRERENDER] Successfully generated /blog index page!');
}

// ─────────────────────────────────────────────────────────────────────────────
// 5. GENERATE ALL LEGAL & STATIC PAGES
// ─────────────────────────────────────────────────────────────────────────────
let countStatic = 0;
const staticRoutes = [
  'privacy-policy',
  'terms-of-service',
  'terms',
  'privacy',
  'about',
  'about-us',
  'contact',
  'dmca',
  'disclaimer',
  'cookie-policy',
  'cookies',
  'how-it-works',
  'features',
  'faq',
  'help'
];

for (const key of staticRoutes) {
  const pageData = staticPages[key];
  if (!pageData) continue;

  const canonicalUrl = `https://ganatube.in/${key}`;
  const pageTitle = `${pageData.title || key} — GanaTube`;
  const pageDesc = `Review the official ${pageData.title || key} for GanaTube.in. Discover our commitments to user privacy, transparent terms, and clean audio streaming.`;

  const staticInnerHtml = `
  <div class="prerendered-shell">
    <header class="prerendered-header">
      <a href="/" class="brand">
        <img src="/ganatube-logo.webp" alt="GanaTube" width="36" height="36" />
        <span>GanaTube</span>
      </a>
      <nav class="prerendered-nav">
        <a href="/">Home</a>
        <a href="/blog">Blog &amp; Guides</a>
        <a href="/curated-playlists">Playlists</a>
        <a href="/discovery">Discovery</a>
      </nav>
    </header>

    <div class="prerendered-body" style="padding-top: 12px;">
      ${pageData.html}
    </div>

    <footer class="prerendered-footer">
      <p>
        <a href="/about">About Us</a> ·
        <a href="/privacy-policy">Privacy Policy</a> ·
        <a href="/terms-of-service">Terms of Service</a> ·
        <a href="/contact">Contact</a> ·
        <a href="/blog">Blog</a>
      </p>
      <p>© ${new Date().getFullYear()} GanaTube.in — All rights reserved.</p>
    </footer>
  </div>
  `;

  let staticHtml = replaceHeadTags(baseHtml, {
    title: pageTitle,
    description: pageDesc,
    canonicalUrl,
    ogType: 'website'
  });
  staticHtml = staticHtml.replace('<app-root></app-root>', `<app-root>${staticInnerHtml}</app-root>`);
  writePage(key, staticHtml);
  countStatic++;
}
console.log(`[PRERENDER] Successfully generated ${countStatic} static/legal pages!`);

console.log('[PRERENDER] Complete! All pages are statically ready for AdSense bots & crawlers.');
