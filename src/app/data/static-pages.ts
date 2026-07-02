export const PAGE_CONTENT: Record<string, { title: string; html: string }> = {
  'how-it-works': {
    title: 'How It Works',
    html: `
      <div class="static-content-block">
        <h2>The Technology Behind GanaTube</h2>
        <p>GanaTube leverages advanced, lightweight algorithms to provide a seamless, continuous music experience. Unlike traditional music streaming platforms that rely on heavy centralized servers and bloated applications, GanaTube connects directly to the largest open media libraries in the world. We instantly extract high-quality audio streams without the need for heavy video downloads, saving your bandwidth and battery.</p>
        
        <h3>Step 1: Discovery</h3>
        <p>When you open GanaTube, our algorithm instantly serves you personalized music shelves based on your selected language and region. Whether you're looking for Hindi Romantic songs, Punjabi Pop, or English EDM hits, the platform dynamically generates recommendations in real-time.</p>

        <h3>Step 2: Intelligent Search</h3>
        <p>Looking for a specific track? Our blazing-fast search engine queries millions of tracks instantly. We prioritize official audio tracks and high-quality lyric videos to ensure the best listening experience possible.</p>

        <h3>Step 3: Infinite Playback</h3>
        <p>The magic happens when you hit play. GanaTube's <strong>Smart Algorithmic Queuing</strong> analyzes the metadata of the currently playing track—artist, genre, mood, and era—and dynamically generates a limitless queue of similar tracks. You never have to manually select the next song; the music just flows.</p>
      </div>
    `
  },
  'features': {
    title: 'Features',
    html: `
      <div class="static-content-block">
        <h2>Why Choose GanaTube?</h2>
        <p>We built GanaTube to solve the modern problems of music streaming: too many ads, bloated apps, and paywalls. Here is what makes us different:</p>
        
        <ul class="feature-list">
          <li>
            <strong>Distraction-Free Audio</strong>
            <p>Enjoy pure music without visual clutter or heavy video buffering. Our player is designed to prioritize audio quality while keeping CPU and RAM usage to an absolute minimum.</p>
          </li>
          <li>
            <strong>Infinite Algorithmic Playback</strong>
            <p>Our smart queuing engine ensures the music never stops. It continuously finds related tracks, meaning you can start a playlist and let it run all day without any manual intervention.</p>
          </li>
          <li>
            <strong>Instant Language Filtering</strong>
            <p>Instantly filter recommendations by your preferred regional language (Hindi, Punjabi, English, Bhojpuri, etc.) using our quick-access mood chips.</p>
          </li>
          <li>
            <strong>Zero Cost & Zero Ads (Audio)</strong>
            <p>A completely free, community-driven platform. We don't interrupt your music with audio ads between songs. It's just you and your music.</p>
          </li>
          <li>
            <strong>No Account Required</strong>
            <p>We respect your privacy. All your preferences and queue histories are stored locally on your device. We don't track your listening habits on centralized servers.</p>
          </li>
        </ul>
      </div>
    `
  },
  'faq': {
    title: 'Frequently Asked Questions',
    html: `
      <div class="static-content-block">
        <h2>Got Questions? We've Got Answers.</h2>
        
        <div class="faq-item">
          <h3>Is GanaTube completely free?</h3>
          <p>Yes, GanaTube is entirely free to use. There are no premium tiers, no paywalls, and no hidden subscription fees.</p>
        </div>
        
        <div class="faq-item">
          <h3>Do I need to create an account?</h3>
          <p>No account is required! We believe in privacy by design. We save your preferences (like your preferred language) locally on your device using your browser's Local Storage. We do not maintain a central database of our users.</p>
        </div>

        <div class="faq-item">
          <h3>How do I change the language or mood?</h3>
          <p>On the home screen, you'll see a row of "chips" or buttons at the top (e.g., Hindi, English, Punjabi, Romantic, Lo-Fi). Simply click on one of these chips, and the entire homepage will instantly re-generate recommendations based on that mood or language.</p>
        </div>

        <div class="faq-item">
          <h3>Does it work in the background on mobile?</h3>
          <p>Yes, GanaTube is designed to be as lightweight as possible. While iOS and Android have strict rules about browser background playback, GanaTube utilizes modern web APIs to try and keep the music playing while your screen is off, depending on your browser's capabilities.</p>
        </div>
        
        <div class="faq-item">
          <h3>Where does the music come from?</h3>
          <p>GanaTube acts as a search and streaming client that interfaces with public APIs (like YouTube) to source audio streams. We do not host any of the music files ourselves.</p>
        </div>
      </div>
    `
  },
  'about': {
    title: 'About Us',
    html: `
      <div class="static-content-block">
        <h2>Our Mission</h2>
        <p>GanaTube is an independent project built for true music lovers. Our mission is simple: to provide a fast, lightweight, and privacy-respecting way to stream your favorite songs from anywhere in the world.</p>
        <p>In today's digital landscape, music streaming has become increasingly complicated. Mainstream apps are heavy, consume massive amounts of battery, constantly track your behavior, and interrupt your listening experience with intrusive audio advertisements.</p>
        <p>We decided to build an alternative. GanaTube prioritizes performance and user experience over everything else. We stripped away the heavy elements, the tracking scripts, and the paywalls to give you pure, uninterrupted audio.</p>
        
        <h2>The Team</h2>
        <p>We are a small, passionate group of developers and music enthusiasts who believe that access to music should be universal and frictionless. We build in public and constantly iterate based on community feedback.</p>
      </div>
    `
  },
  'contact': {
    title: 'Contact Us',
    html: `
      <div class="static-content-block">
        <h2>Get In Touch</h2>
        <p>We'd love to hear from you! Whether you have a feature request, found a bug, or just want to say hello, our inbox is always open.</p>
        
        <div class="contact-card">
          <h3>General Inquiries & Feedback</h3>
          <p>Email: <a href="mailto:support@ganatube.in" style="color: var(--color-primary);">support@ganatube.in</a></p>
        </div>

        <div class="contact-card">
          <h3>Copyright & DMCA Issues</h3>
          <p>Email: <a href="mailto:dmca@ganatube.in" style="color: var(--color-primary);">dmca@ganatube.in</a></p>
        </div>
        
        <p style="margin-top: 2rem;">Please allow up to 48 hours for our team to respond to your queries. We appreciate your patience!</p>
      </div>
    `
  },
  'privacy-policy': {
    title: 'Privacy Policy',
    html: `
      <div class="static-content-block">
        <h2>Your Privacy is Our Priority</h2>
        <p>At GanaTube, we take your privacy very seriously. This policy outlines the limited information we interact with when you use our platform.</p>
        
        <h3>1. Local Storage, Not Cloud Storage</h3>
        <p>GanaTube operates primarily within your browser. When you select a preferred language or interact with the UI, those preferences are saved in your browser's Local Storage. We do not upload, sync, or store your personal listening history on any centralized servers.</p>

        <h3>2. Analytics and Telemetry</h3>
        <p>To ensure the platform runs smoothly, we use standard, anonymized analytics (such as Google Analytics). This helps us understand basic metrics like page load speeds, error rates, and general geographic usage. This data is strictly aggregated and cannot be used to identify you personally or track your specific music tastes.</p>

        <h3>3. Third-Party APIs</h3>
        <p>Because GanaTube sources its audio streams from third-party platforms (like YouTube APIs), your interaction with the media player is also subject to the privacy policies of those underlying platforms. We strip out as much tracking as technically possible, but basic connection data (like your IP address) is inevitably exposed to the servers providing the audio stream.</p>
      </div>
    `
  },
  'terms-of-service': {
    title: 'Terms of Service',
    html: `
      <div class="static-content-block">
        <h2>Terms and Conditions of Use</h2>
        
        <h3>1. Acceptance of Terms</h3>
        <p>By accessing and using GanaTube (the "Platform"), you accept and agree to be bound by the terms and provision of this agreement. If you do not agree to abide by these terms, please do not use this service.</p>

        <h3>2. Description of Service</h3>
        <p>GanaTube provides a web-based interface that allows users to search, discover, and stream audio content available on public third-party APIs. We do not host, upload, or control any of the audio/video content available through the search function.</p>

        <h3>3. Acceptable Use</h3>
        <p>You agree not to misuse the platform. This includes, but is not limited to: attempting to reverse-engineer our APIs, deploying automated scraping bots that degrade the service for others, or using our services for any illegal activities.</p>
        
        <h3>4. Disclaimer of Warranties</h3>
        <p>The service is provided on an "AS IS" and "AS AVAILABLE" basis. GanaTube makes no warranties, expressed or implied, and hereby disclaims and negates all other warranties including, without limitation, implied warranties or conditions of merchantability, fitness for a particular purpose, or non-infringement of intellectual property.</p>
      </div>
    `
  },
  'cookie-policy': {
    title: 'Cookie Policy',
    html: `
      <div class="static-content-block">
        <h2>How We Use Cookies</h2>
        <p>GanaTube uses a minimal amount of cookies and local storage to provide a functional and seamless user experience.</p>
        
        <h3>Essential Cookies / Local Storage</h3>
        <p>We use your browser's Local Storage to remember your basic UI settings, such as your selected default language (e.g., Hindi or English) and your theme preferences. These are absolutely necessary for the site to function as intended across your sessions.</p>

        <h3>Analytics Cookies</h3>
        <p>We may deploy first-party analytics cookies to help us measure traffic and site performance. This data is fully anonymized.</p>

        <h3>No Advertising Cookies</h3>
        <p>We do not use tracking cookies, retargeting pixels, or third-party advertisement cookies. We do not sell your data to advertisers.</p>
      </div>
    `
  },
  'dmca': {
    title: 'DMCA Policy',
    html: `
      <div class="static-content-block">
        <h2>Copyright and DMCA Takedowns</h2>
        <p>GanaTube acts strictly as a search engine and streaming client wrapper. <strong>We do not host, store, or upload any media files (audio or video) on our own servers.</strong></p>
        
        <p>All content is indexed dynamically through public third-party APIs (such as YouTube). Therefore, GanaTube has no direct control over the media being distributed.</p>
        
        <h3>Filing a Takedown Notice</h3>
        <p>If you are a copyright owner or an agent thereof, and you believe that any content indexed by GanaTube infringes upon your copyrights, we strongly advise you to file a DMCA takedown notice directly with the host of the media (e.g., YouTube), as removing it from the host will automatically remove it from GanaTube.</p>
        
        <p>However, if you wish to have the content blocked from appearing in GanaTube's specific search index, you may submit a takedown request to us at:</p>
        <p><strong><a href="mailto:dmca@ganatube.in" style="color: var(--color-primary);">dmca@ganatube.in</a></strong></p>
        
        <p>Please include the exact URLs of the content in question and proof of copyright ownership.</p>
      </div>
    `
  },
  'disclaimer': {
    title: 'Disclaimer',
    html: `
      <div class="static-content-block">
        <h2>Legal Disclaimer</h2>
        <p>GanaTube is an independent, third-party client application. All audio, video, and image content provided by the search results is the sole property of their respective creators, artists, labels, and publishers.</p>
        
        <p>We make no claim of ownership over the audio streams, album art, or metadata provided through the platform.</p>
        
        <p>The GanaTube platform is developed for educational and experimental purposes to demonstrate modern web API integrations and algorithmic queuing techniques. Users are responsible for adhering to the terms of service of the underlying APIs used by this platform.</p>
      </div>
    `
  }
};
