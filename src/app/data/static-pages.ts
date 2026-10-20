export const PAGE_CONTENT: Record<string, { title: string; html: string }> = {
  'how-it-works': {
    title: 'How It Works - Discover Music with GanaTube.in',
    html: `
      <div class="static-content-block">
        <h2>Discover Music with GanaTube.in</h2>
        <p>GanaTube.in makes it easier to explore music, find tracks that match your taste, and enjoy a more convenient listening experience. Whether you already know what you want to hear or are looking for something new, our platform helps you navigate music through a simple and user-friendly interface.</p>

        <h3>01. Find Your Music</h3>
        <p>Begin your journey by searching for a song, artist, album, or playlist. Enter a few words related to the music you have in mind and explore the available results. From familiar favorites to new musical interests, GanaTube.in helps you discover content that fits your preferences.</p>

        <h3>02. Browse and Discover</h3>
        <p>Explore music beyond your initial search. Visit artist profiles, browse album collections, and discover playlists featuring different styles and genres. Navigate through the available selections to find new artists, revisit popular tracks, and expand your musical horizons.</p>

        <h3>03. Enjoy a Seamless Listening Experience</h3>
        <p>Choose a track and start listening through the available player. Use playback controls to navigate between songs and manage upcoming tracks according to your preferences. The responsive interface is designed to make music accessible across desktop and mobile devices, with playback capabilities depending on the supported music source and browser.</p>

        <h3>04. Keep Your Favorites Organized</h3>
        <p>Make your music experience more personal by saving tracks and creating playlists, where supported. Organize your selections around your favorite artists, genres, moods, or daily activities. These tools help you build collections that make returning to the music you enjoy more convenient.</p>

        <h3>05. Share the Experience</h3>
        <p>Music is even better when shared. Explore available collaborative listening features to enjoy music with friends and exchange musical discoveries. Where synchronized listening rooms are supported, participants can join through a shared link and enjoy coordinated playback according to the room's available controls.</p>

        <h3>Start Exploring GanaTube.in</h3>
        <p>Your next favorite song could be just a search away. Explore the available music catalog, discover new sounds, and find a listening experience that suits your style.</p>
        <div class="contact-card" style="text-align: center; margin-top: 24px;">
          <p><a href="/search" style="font-weight: 600; font-size: 1.1rem; margin-right: 16px;">Explore Music</a> · <a href="/features" style="font-weight: 600; font-size: 1.1rem; margin-left: 16px;">Discover Our Features</a></p>
        </div>
      </div>
    `
  },
  'features': {
    title: 'Platform Features - GanaTube.in',
    html: `
      <div class="static-content-block">
        <h2>GanaTube.in Platform Features</h2>
        <p>GanaTube.in brings together music exploration, personalized listening tools, and performance-focused web technology to create a convenient music experience. From discovering new tracks to managing playlists, each feature is designed to make navigation simpler and music more accessible.</p>

        <h3>Distraction-Free Listening</h3>
        <p>Enjoy a cleaner listening interface designed to keep the focus on music. GanaTube.in aims to provide a streamlined playback experience with responsive controls and efficient loading, helping users navigate between tracks with minimal friction. Audio availability and playback behavior depend on the supported music source.</p>

        <h3>Offline Access and Content Caching</h3>
        <p>Browser caching helps improve loading efficiency and may make certain previously accessed resources available when connectivity is limited. Offline playback of complete music tracks depends on the availability of supported offline functionality and the permissions associated with the relevant content source.</p>

        <h3>Shared Listening Experiences</h3>
        <p>Discover music with friends through collaborative listening features, where available. Shared rooms can provide a convenient way to coordinate playback, exchange track suggestions, and enjoy music together, depending on the room's supported functionality.</p>

        <h3>Flexible Queue Controls</h3>
        <p>Create a listening sequence that suits your preferences. Add tracks to the queue, adjust their order, remove selections, and navigate through upcoming music using the available player controls. These tools provide greater flexibility when managing a listening session.</p>

        <h3>Efficient Media Loading</h3>
        <p>A performance-conscious interface helps reduce unnecessary resource loading. Lightweight components and interaction-based media initialization, where implemented, can improve responsiveness and help limit avoidable data usage, particularly on mobile connections.</p>

        <h3>Personalized Music Organization</h3>
        <p>Keep your preferred tracks organized with favorites and custom playlists, where supported. Local browser storage can retain selected settings and library information between sessions, depending on device and browser capabilities.</p>

        <h3>Privacy-Conscious Design</h3>
        <p>GanaTube.in aims to handle personal information responsibly and limit unnecessary data collection. Account information, if collected through supported sign-in options, is handled according to the platform's applicable privacy practices. For details about data handling, please consult our <a href="/privacy-policy">Privacy Policy</a>.</p>

        <h3>Performance and Reliability</h3>
        <p>We prioritize responsive page layouts, efficient resource utilization, and a consistent experience across supported devices. Performance optimization may include reducing unnecessary JavaScript execution, improving loading behavior, and evaluating key user-experience metrics such as Core Web Vitals.</p>
        <p>Our objective is to make music discovery and navigation convenient for users across a range of devices and network conditions.</p>

        <p style="margin-top: 32px; font-weight: 600; font-size: 1.15rem; color: #ffffff;">GanaTube.in — Discover music. Explore new sounds. Make every listening session your own.</p>
      </div>
    `
  },
  'faq': {
    title: 'Frequently Asked Questions - GanaTube.in',
    html: `
      <div class="static-content-block">
        <h2>Frequently Asked Questions</h2>
        <p>Find answers to common questions about GanaTube.in, including music playback, browser storage, offline functionality, shared listening features, and user privacy. This section helps you understand how the platform works and what to expect while using its services.</p>

        <div class="faq-item">
          <h3>Does GanaTube.in play audio advertisements?</h3>
          <p>GanaTube.in aims to provide a music-focused listening experience without disruptive audio advertisements inserted into playback. Display advertising may be used on certain website pages to support platform operations. The availability and behavior of advertisements depend on the relevant page and service implementation.</p>
        </div>

        <div class="faq-item">
          <h3>Where are my favorites and listening preferences saved?</h3>
          <p>Depending on the features you use, selected preferences, favorites, and playlist information may be retained using browser storage or other supported storage mechanisms. This can help preserve your settings between visits. Clearing browser data may remove locally stored information, and availability across different devices depends on whether account-based synchronization is implemented.</p>
        </div>

        <div class="faq-item">
          <h3>Can I listen to music without an internet connection?</h3>
          <p>Offline access depends on the content source and the functionality supported by GanaTube.in. Browser caching may retain certain website resources for faster loading, but this does not necessarily mean complete music tracks are available offline. Full offline playback requires an implemented caching mechanism and permission to store and play the relevant audio content.</p>
        </div>

        <div class="faq-item">
          <h3>How do shared listening rooms work?</h3>
          <p>Where available, shared listening rooms allow users to coordinate music playback through a common room or shared link. Depending on the implemented features, a host may manage playback while other participants follow the session. Synchronization accuracy and available controls depend on network conditions, the playback source, and the room's technical implementation.</p>
        </div>

        <div class="faq-item">
          <h3>How can I report an issue or recommend an improvement?</h3>
          <p>We welcome suggestions, technical feedback, and reports of problems that affect your experience. To contact the GanaTube.in team, email <a href="mailto:support@ganatube.in">support@ganatube.in</a> or visit our <a href="/contact">Contact Page</a>. Please include a brief description of the issue and the device or browser involved when relevant.</p>
        </div>

        <div class="faq-item">
          <h3>Why is a music or video preview unavailable?</h3>
          <p>Playback or preview problems can occur because of network interruptions, browser compatibility, regional restrictions, or limitations imposed by the content provider. Try refreshing the page, checking your internet connection, or opening the content again after a short interval. Some tracks may be unavailable in certain locations or may no longer be accessible through their original source.</p>
        </div>

        <div class="faq-item">
          <h3>How does GanaTube.in protect my personal information?</h3>
          <p>We aim to handle personal information responsibly and collect only the information necessary for the platform's supported functions. If Google Sign-In is available, basic account information may be processed for authentication. Personal information is handled according to our applicable data practices and privacy commitments.</p>
          <p style="margin-top: 10px;">For details about the information we collect, how it is used, and the choices available to you, please read our <a href="/privacy-policy">Privacy Policy</a>.</p>
        </div>

        <div class="contact-card" style="margin-top: 32px;">
          <h3>Still have questions?</h3>
          <p>Contact us at <a href="mailto:support@ganatube.in">support@ganatube.in</a> or visit our <a href="/contact">Contact Page</a> for assistance.</p>
        </div>
      </div>
    `
  },
  'about': {
    title: 'About GanaTube.in - Music Discovery Platform',
    html: `
      <div class="static-content-block">
        <h2>About GanaTube.in</h2>
        <p>GanaTube.in is a music discovery and listening platform designed to make exploring music simple, accessible, and seamless. Our focus is on delivering an intuitive listening experience through efficient music search, convenient playlist management, streamlined playback controls, and a privacy-conscious approach to technology.</p>

        <h3>Our Mission</h3>
        <p>At GanaTube.in, we believe discovering and enjoying music should be straightforward, enjoyable, and free from unnecessary distractions. We prioritize usability, responsive performance, and intuitive navigation to help listeners find the music they love with minimal effort.</p>
        <p>What began as an initiative to build a fast, browser-based music platform has evolved into a comprehensive music discovery experience. GanaTube.in brings together music search, artist and album exploration, playlist tools, synchronized listening rooms, and features designed to make music discovery more convenient across desktop and mobile devices.</p>

        <h3>What We Offer</h3>
        <h4>Music Discovery and Search</h4>
        <p>Explore a broad selection of music through search and discovery tools designed to help you find songs, artists, albums, and playlists. Discover music across different genres, moods, eras, and listening preferences, along with regularly updated selections of trending tracks and new releases.</p>

        <h4>Playlists and Playback Controls</h4>
        <p>Organize your listening experience with personalized playlists, saved favorites, and flexible queue management. GanaTube.in provides convenient tools for organizing music and retaining selected preferences across sessions, where supported by your browser and device.</p>

        <h4>Synchronized Listening Rooms</h4>
        <p>Enjoy music together through synchronized listening rooms. Create a private room, share its link with friends, and experience coordinated playback with real-time controls, subject to feature availability and playback-source limitations.</p>

        <h4>Music Guides and Editorial Content</h4>
        <p>Discover original articles, music exploration guides, playlist recommendations, genre introductions, and practical listening tips published by the GanaTube.in team. Our editorial content is designed to help users explore different musical styles, discover artists, and make more informed listening choices.</p>

        <h3>Our Commitment to Privacy</h3>
        <p>We recognize the importance of protecting user privacy. GanaTube.in aims to limit data collection to information reasonably necessary to provide and maintain its services. Where Google sign-in is available, this may include basic account information, such as your name and email address.</p>
        <p>We do not sell personal information to third parties or build behavioral profiles for advertising purposes. Where technically feasible, preferences and listening-related settings may be stored locally on your device to improve convenience and reduce unnecessary data transmission.</p>
        <p>Our data practices are subject to the applicable features, service providers, and technologies used by the platform. For complete information about data collection, usage, and your rights, please review our <a href="/privacy-policy">Privacy Policy</a> and <a href="/terms-of-service">Terms of Service</a>.</p>

        <h3>Technology and Performance</h3>
        <p>GanaTube.in is developed using modern web technologies, with progressive web application capabilities and service-worker-based caching where supported. Our technical approach emphasizes responsive interfaces, efficient resource loading, and a smooth experience across a range of devices and network conditions.</p>
        <p>We also work to make our editorial content accessible to search engines through appropriate page rendering and indexing practices. Regional discovery features and bandwidth-conscious loading help support a more accessible experience for listeners with different preferences and connectivity conditions.</p>
        <p>Playback availability, offline functionality, and supported features may depend on the browser, device, network, and underlying music source.</p>

        <h3>Get in Touch</h3>
        <p>We value feedback from our users and welcome questions, feature suggestions, bug reports, and partnership inquiries. Your feedback helps us identify opportunities to improve the platform and deliver a more reliable music discovery experience.</p>
        <div class="contact-card">
          <p><strong>Email:</strong> <a href="mailto:support@ganatube.in">support@ganatube.in</a></p>
          <p>You can also visit our <a href="/contact">Contact Page</a> for further assistance.</p>
        </div>
        <p style="margin-top: 24px; font-size: 0.95rem; color: rgba(255, 255, 255, 0.5);">© 2025-${new Date().getFullYear()} GanaTube.in. All rights reserved.</p>
      </div>
    `
  },
  'privacy-policy': {
    title: 'Privacy Policy | GanaTube.in',
    html: `
      <div class="static-content-block">
        <h2>Privacy Policy</h2>
        <p><strong>Effective Date:</strong> 06/04/2025<br>
        <strong>Last Updated:</strong> 06/04/2025</p>

        <p>At GanaTube.in, we take your privacy seriously. Please read this Privacy Policy to learn how we treat your personal data. By using or accessing our Services in any manner, you acknowledge that you accept the practices and policies outlined below, and you hereby consent that we will collect, use and share your information as described in this Privacy Policy.</p>
        <p>Remember that your use of GanaTube.in's Services is at all times subject to our <a href="/terms-of-service">Terms of Service</a>, which incorporates this Privacy Policy. Any terms we use in this Policy without defining them have the definitions given to them in the Terms of Service.</p>

        <h3>What this Privacy Policy Covers</h3>
        <p>This Privacy Policy covers how we treat Personal Data that we gather when you access or use our Services. "Personal Data" means any information that identifies or relates to a particular individual and also includes information referred to as "personally identifiable information" or "personal information" under applicable data privacy laws, rules or regulations. This Privacy Policy does not cover the practices of companies we don't own or control or people we don't manage.</p>

        <h3>Personal Data We Collect</h3>
        <h4>Information You Provide to Us</h4>
        <ul class="feature-list">
          <li><strong>Account Information:</strong> When you sign in using Google authentication, we collect only your email address and name. We do not access, store, or collect any other information from your Google account.</li>
          <li><strong>User Content:</strong> We collect information you provide when you create playlists, save favorites, leave feedback, or interact with our Services.</li>
          <li><strong>Usage Data:</strong> We automatically collect information about how you interact with our Services, including songs you listen to, playlists you create, and features you use.</li>
        </ul>

        <h4>Information Collected Automatically</h4>
        <ul class="feature-list">
          <li><strong>Device Information:</strong> We collect information about the device you use to access our Services, including device type, operating system, and browser type.</li>
          <li><strong>Usage Information:</strong> We collect information about your interactions with our Services, such as pages visited, features used, and time spent on the platform.</li>
          <li><strong>Log Data:</strong> When you use our Services, we automatically collect and store certain information in our server logs, including your IP address, access times, and pages viewed.</li>
        </ul>

        <h4>Local Storage and Cookies</h4>
        <p>We use browser local storage to improve your experience and provide browser preference storage. This includes:</p>
        <ul class="feature-list">
          <li>Your favorite songs and playlists</li>
          <li>Your audio quality preferences</li>
          <li>Your recent listening history</li>
          <li>Saved preferences and playback context</li>
          <li>User preferences and settings</li>
        </ul>

        <h3>How We Use Your Personal Data</h3>
        <p>We use the Personal Data we collect to:</p>
        <ul class="feature-list">
          <li>Provide, maintain, and improve our Services, including personalized music recommendations</li>
          <li>Authenticate your identity when you sign in using Google</li>
          <li>Save and sync your favorites, playlists, and preferences across devices</li>
          <li>Enable features like room sessions, local preferences, and collaborative playlists</li>
          <li>Respond to your inquiries and provide customer support</li>
          <li>Send you updates about our Services (you can opt out at any time)</li>
          <li>Detect, prevent, and address technical issues and security threats</li>
          <li>Analyze usage patterns to improve our Services and develop new features</li>
        </ul>

        <h3>Google Sign-In Authentication</h3>
        <p>When you choose to sign in using Google, we use Google's OAuth 2.0 authentication service. Through this process:</p>
        <ul class="feature-list">
          <li>We only request and receive your email address and name from Google</li>
          <li>We do not access, store, or collect any other information from your Google account</li>
          <li>We do not have access to your Google account password</li>
          <li>Google's use of your information is governed by Google's Privacy Policy. We encourage you to review their privacy practices.</li>
          <li>You can revoke our access to your Google account at any time through your Google account settings</li>
        </ul>

        <h3>How We Share Your Personal Data</h3>
        <p>We do not sell your Personal Data. We may share your information in the following circumstances:</p>
        <ul class="feature-list">
          <li><strong>Service Providers:</strong> We may share your data with third-party service providers who perform services on our behalf, such as hosting, analytics, and customer support. These providers are bound by contractual obligations to keep your data confidential.</li>
          <li><strong>Legal Requirements:</strong> We may disclose your information if required by law, regulation, legal process, or governmental request.</li>
          <li><strong>Protection of Rights:</strong> We may share information to protect our rights, privacy, safety, or property, or that of our users or others.</li>
          <li><strong>Business Transfers:</strong> If we are involved in a merger, acquisition, or sale of assets, your information may be transferred as part of that transaction.</li>
          <li><strong>With Your Consent:</strong> We may share your information with your explicit consent or at your direction.</li>
        </ul>

        <h3>Data Security</h3>
        <p>We implement appropriate technical and organizational measures to protect your Personal Data against unauthorized access, alteration, disclosure, or destruction. However, no method of transmission over the internet or electronic storage is 100% secure. While we strive to use commercially acceptable means to protect your Personal Data, we cannot guarantee absolute security.</p>

        <h3>Data Retention</h3>
        <p>We retain your Personal Data for as long as your account is active or as needed to provide you with our Services. We may retain certain information after you close your account if retention is necessary to comply with legal obligations, resolve disputes, or enforce our agreements.</p>

        <h3>Your Rights and Choices</h3>
        <h4>Access and Update Your Information</h4>
        <p>You can access and update your account information through your profile settings on our platform.</p>

        <h4>Delete Your Account</h4>
        <p>You can request to delete your account at any time by contacting us. When you delete your account, we will delete your Personal Data, subject to certain exceptions where we are required to retain information by law.</p>

        <h4>Local Storage Management</h4>
        <p>You can clear your local storage data at any time through your browser settings. Note that clearing local storage will remove your cached preferences, and locally stored playlists.</p>

        <h4>Opt-Out of Communications</h4>
        <p>You can opt-out of receiving promotional communications from us by following the unsubscribe instructions in those communications or by contacting us directly.</p>

        <h3>Children's Privacy</h3>
        <p>Our Services are not directed to individuals under the age of 13. We do not knowingly collect Personal Data from children under 13. If you believe we have collected information from a child under 13, please contact us immediately, and we will take steps to delete such information.</p>

        <h3>Third-Party Services</h3>
        <p>Our Services may contain links to third-party websites or services. We are not responsible for the privacy practices of these third parties. We encourage you to read their privacy policies.</p>
        <p>We use third-party services to provide our music streaming functionality. These services may have their own privacy policies, and we encourage you to review them.</p>

        <h3>Advertising and Cookies</h3>
        <p>GanaTube.in may display ads provided by Google AdSense. Google may use cookies (including the DoubleClick cookie) to serve ads based on your prior visits to this and other websites. You can opt out of personalized advertising by visiting Google Ads Settings at <a href="https://adssettings.google.com" target="_blank" rel="noopener noreferrer">https://adssettings.google.com</a>. You can also learn more about how Google uses cookies for ads at <a href="https://policies.google.com/technologies/ads" target="_blank" rel="noopener noreferrer">https://policies.google.com/technologies/ads</a>.</p>
        <p>Our <a href="/cookie-policy">Cookie Policy</a> explains how you can control cookies and local storage in your browser. Disabling certain cookies may affect ad relevance but should not impact core playback functionality.</p>

        <h3>International Data Transfers</h3>
        <p>Your information may be transferred to and processed in countries other than your country of residence. These countries may have data protection laws that differ from those in your country. By using our Services, you consent to the transfer of your information to these countries.</p>

        <h3>Changes to This Privacy Policy</h3>
        <p>We may update this Privacy Policy from time to time. We will notify you of any changes by posting the new Privacy Policy on this page and updating the "Effective date" at the top of this Privacy Policy. You are advised to review this Privacy Policy periodically for any changes.</p>

        <h3>Contact Us</h3>
        <p>If you have any questions about this Privacy Policy or our privacy practices, please contact us:</p>
        <div class="contact-card">
          <p><strong>Email:</strong> <a href="mailto:support@ganatube.in">support@ganatube.in</a></p>
          <p><strong>Website:</strong> <a href="https://ganatube.in">https://ganatube.in</a></p>
        </div>
        <p style="margin-top: 16px; font-size: 0.95rem; color: rgba(255, 255, 255, 0.7);">By using GanaTube.in, you acknowledge that you have read and understood this Privacy Policy and agree to the collection and use of your information as described herein.</p>
      </div>
    `
  },
  'terms-of-service': {
    title: 'Terms of Service | GanaTube.in',
    html: `
      <div class="static-content-block">
        <h2>Terms of Service</h2>
        <p><strong>Effective Date:</strong> 06/04/2025<br>
        <strong>Last Updated:</strong> 06/04/2025</p>

        <p>Welcome to GanaTube.in. These Terms of Service ("Terms") constitute a legally binding agreement between you and GanaTube.in regarding your use of our Services. Please read these Terms carefully before using our Services.</p>
        <p>By accessing or using GanaTube.in's Services in any manner, you acknowledge that you have read, understood, and agree to be bound by these Terms and our <a href="/privacy-policy">Privacy Policy</a>, which is incorporated by reference into these Terms. If you do not agree to these Terms, please do not use our Services.</p>

        <h3>What These Terms Cover</h3>
        <p>These Terms apply to your access to and use of GanaTube.in's website, applications, and services (collectively, our "Services"). These Terms include important information about your legal rights, including limitations of liability, warranty disclaimers, and dispute resolution.</p>

        <h3>Description of Service</h3>
        <p>GanaTube.in is a music discovery and streaming platform that aggregates music content and public metadata from third-party media sources and providers. Our Services allow you to:</p>
        <ul class="feature-list">
          <li>Search and discover music content</li>
          <li>Stream music and audio content</li>
          <li>Create and manage playlists</li>
          <li>Save favorite songs</li>
          <li>Share music with friends</li>
          <li>Access music recommendations</li>
          <li>Use playlist and queue tools for personal listening</li>
        </ul>
        <p>GanaTube.in aggregates content and metadata from public third-party services. Specifically, we utilize:</p>
        <ul class="feature-list">
          <li>Public third-party music providers and metadata databases for music search, cataloging, and discovery functionality</li>
          <li>Third-party web streaming providers for audio and media content playback</li>
        </ul>
        <p>We do not host, store, upload, or own the media content accessible through our Services. All content is dynamically indexed from third-party sources, and we act solely as a search and discovery platform.</p>
        <p><strong>Important Notice:</strong> We are not affiliated with, endorsed by, or officially partnered with any commercial music platform or recording label. We index publicly available web content for discovery and educational purposes only.</p>

        <h3>Third-Party Services and Content Providers</h3>
        <p>Our Services rely on third-party infrastructure and providers to deliver music information, metadata, search results, and media playback. These include:</p>
        <ul class="feature-list">
          <li><strong>Music Information Services:</strong> We use third-party data providers for search indexing, song metadata, album art, and artist biographies. We do not own this data and act strictly as an indexer.</li>
          <li><strong>Public Media Sources:</strong> Media streaming is delivered through third-party public web sources. Your interaction with third-party content through our Services remains subject to the respective terms and conditions of those third-party providers.</li>
          <li><strong>Authentication Services:</strong> We offer secure user authentication (such as Google Sign-In) for personal library management.</li>
          <li><strong>Cloud Infrastructure:</strong> We utilize standard cloud hosting and storage for application delivery and user preference synchronization.</li>
        </ul>
        <p>We aggregate and present content from these third-party sources, but we do not claim ownership of the content. All music, audio, video, artwork, and related content remain the property of their respective copyright holders.</p>
        <p>Your use of third-party content through our Services is subject to the terms and policies of those respective third-party providers. We are not responsible for the availability, accuracy, or legality of content hosted on external networks.</p>
        <p><strong>Third-Party Notice:</strong> Content availability depends on external networks and source providers. These services may change, update, or discontinue access at any time without prior notice.</p>

        <h3>Acceptable Use</h3>
        <p>You agree to use our Services only for lawful purposes and in accordance with these Terms. You agree not to:</p>
        <ul class="feature-list">
          <li>Use our Services to infringe upon any intellectual property rights, including copyright, trademark, or patent rights</li>
          <li>Reproduce, distribute, or publicly perform copyrighted content without proper authorization from the rights holders</li>
          <li>Use automated systems (bots, scrapers) to access our Services in a manner that could harm or overload our systems</li>
          <li>Attempt to reverse engineer, decompile, or disassemble our Services</li>
          <li>Use our Services to transmit any malicious code, viruses, or harmful content</li>
          <li>Impersonate any person or entity or misrepresent your affiliation with any person or entity</li>
          <li>Violate any applicable local, state, national, or international law or regulation</li>
        </ul>

        <h3>Copyright and Intellectual Property</h3>
        <h4>Content Ownership</h4>
        <p>All music, audio, video, artwork, and related content accessible through our Services are the property of their respective copyright owners. GanaTube.in does not claim ownership of any copyrighted content. We act solely as an aggregator and search platform.</p>

        <h4>Respect for Copyright</h4>
        <p>GanaTube.in respects intellectual property rights. We aggregate and provide access to content from third-party sources for informational and discovery purposes only. Users are responsible for ensuring their use of content complies with applicable copyright laws.</p>
        <p>You agree that you will only stream, download, or otherwise access content through our Services in a manner that respects the rights of copyright holders and complies with applicable laws.</p>

        <h4>DMCA Takedown Policy</h4>
        <p>If you believe that content accessible through our Services infringes your copyright, you may submit a notification pursuant to the Digital Millennium Copyright Act (DMCA) by providing our Copyright Agent with the following information in writing:</p>
        <ul class="feature-list">
          <li>A physical or electronic signature of a person authorized to act on behalf of the copyright owner</li>
          <li>Identification of the copyrighted work claimed to have been infringed</li>
          <li>Identification of the material claimed to be infringing and information reasonably sufficient to permit us to locate the material</li>
          <li>Your contact information</li>
          <li>A statement that you have a good faith belief that use of the material is not authorized by the copyright owner</li>
          <li>A statement that the information in the notification is accurate and, under penalty of perjury, that you are authorized to act on behalf of the copyright owner</li>
        </ul>
        <p>Please send DMCA notifications to: <a href="mailto:support@ganatube.in">support@ganatube.in</a></p>
        <p>Upon receipt of a valid DMCA notification, we will promptly investigate and, if appropriate, remove or disable access to the allegedly infringing content. We reserve the right to terminate accounts of users who are repeat infringers.</p>

        <h3>Compliance and Service Termination</h3>
        <p>GanaTube.in is committed to respecting intellectual property rights and copyright laws. We operate in good faith as a content aggregation platform and do not intend to infringe upon any copyrights.</p>
        <ul class="feature-list">
          <li><strong>Commitment to Compliance:</strong> If we receive a formal warning, cease and desist notice, or legal notice from any copyright owner, authorized rights holder, or content provider regarding indexed content, we are committed to taking immediate action. This may include:
            <ul style="margin-top: 8px;">
              <li>Immediately disabling or removing the affected content or links within 24 hours of receiving notice</li>
              <li>Ceasing access to the disputed content source</li>
              <li>Temporarily suspending or permanently terminating our Services if required</li>
              <li>Cooperating fully with copyright holders to resolve any concerns</li>
              <li>Providing written confirmation of compliance actions taken</li>
            </ul>
          </li>
          <li><strong>Response Timeline:</strong> We commit to responding to any legal notice, cease and desist letter, or takedown request within 24 hours of receipt. We will take corrective action immediately and provide confirmation of compliance within 48 hours.</li>
          <li><strong>Good Faith Operation:</strong> GanaTube.in operates as an educational music discovery platform without intent to cause harm to content owners or service providers. We acknowledge that:
            <ul style="margin-top: 8px;">
              <li>We do not claim any ownership of the media accessible through our platform</li>
              <li>We respect the policies and terms of all external service providers</li>
              <li>We are prepared to immediately remove content or cease operations if notified that any activity infringes upon legitimate rights</li>
              <li>We will not contest or delay compliance with verified takedown requests</li>
              <li>We maintain no backup systems or mirrors to circumvent takedown actions</li>
            </ul>
          </li>
        </ul>
        <p>We operate in good faith and are committed to complying promptly with any legitimate requests from content owners, creators, or authorized representatives. Our goal is to promote music discovery while rigorously respecting intellectual property rights.</p>
        
        <div class="contact-card">
          <h4>Priority Contact for Rights Holders</h4>
          <p>If you are a copyright owner, legal representative, or official representative of any recording label, artist, or content provider and believe our Services are infringing upon your rights or conflicting with your distribution terms, please contact us immediately at <a href="mailto:support@ganatube.in">support@ganatube.in</a> with <strong>"URGENT: Legal Notice"</strong> in the subject line. We will respond within 24 hours and take immediate corrective action.</p>
        </div>

        <h3>Monitoring and Compliance Measures</h3>
        <ul class="feature-list">
          <li><strong>Active Monitoring:</strong> We actively monitor our contact channels for any legal notices, complaints, or requests from copyright holders. We maintain dedicated systems to ensure prompt detection and response to any compliance-related communications.</li>
          <li><strong>No Commercial Exploitation:</strong> GanaTube.in operates without directly monetizing copyrighted content. We do not charge users for access to music, and we do not generate revenue from the distribution of copyrighted materials. Our service exists purely as a discovery and aggregation platform.</li>
          <li><strong>Voluntary Compliance:</strong> Even in the absence of formal legal action, if we become aware that our use of any content source is causing concern, conflicting with provider terms, or otherwise problematic, we reserve the right to voluntarily discontinue that functionality or suspend the relevant features entirely.</li>
          <li><strong>No Intent to Circumvent:</strong> We explicitly state that we have no intention to circumvent technological protection measures, bypass paywalls, or violate digital rights management (DRM) systems. Our Services rely strictly on publicly accessible web sources and do not attempt to bypass security measures.</li>
          <li><strong>Transparent Attribution:</strong> We provide clear attribution to content sources and artists wherever possible, including links to official platforms where users can access content through legitimate channels. We encourage users to support artists and content creators through official platforms.</li>
        </ul>

        <h3>User Content and Accounts</h3>
        <ul class="feature-list">
          <li><strong>User-Generated Content:</strong> You may create playlists, save favorites, and share music through our Services. You retain ownership of any content you create, but by using our Services, you grant us a license to store, display, and process your user-generated content to provide our Services.</li>
          <li><strong>Account Responsibility:</strong> You are responsible for maintaining the confidentiality of your account credentials and for all activities that occur under your account. You agree to notify us immediately of any unauthorized use of your account.</li>
          <li><strong>Account Termination:</strong> We reserve the right to suspend or terminate your account at any time, with or without cause or notice, if you violate these Terms or engage in any activity that we determine is harmful to our Services or other users.</li>
        </ul>

        <h3>Disclaimers and Limitations</h3>
        <ul class="feature-list">
          <li><strong>Service Availability:</strong> Our Services are provided "as is" and "as available" without warranties of any kind, either express or implied. We do not guarantee that our Services will be uninterrupted, secure, error-free, or free from viruses or harmful components.</li>
          <li><strong>Content Accuracy:</strong> While we strive to provide accurate music metadata and content, we do not guarantee the accuracy, completeness, or reliability of any content accessible through our Services. Content is aggregated from third-party sources and may contain errors or inaccuracies.</li>
          <li><strong>Limitation of Liability:</strong> To the maximum extent permitted by law, GanaTube.in and its officers, directors, employees, and agents shall not be liable for any indirect, incidental, special, consequential, or punitive damages, or any loss of profits or revenues, whether incurred directly or indirectly, or any loss of data, use, goodwill, or other intangible losses, resulting from your use of our Services.</li>
          <li><strong>Indemnification:</strong> You agree to indemnify, defend, and hold harmless GanaTube.in and its officers, directors, employees, and agents from and against any claims, liabilities, damages, losses, costs, and expenses (including reasonable attorney's fees) arising out of or relating to: your use of our Services, your violation of these Terms, your violation of any rights of any third party, or any content you submit, post, or transmit through our Services.</li>
        </ul>

        <h3>Third-Party Links and Services</h3>
        <p>Our Services may contain links to third-party websites or services that are not owned or controlled by GanaTube.in. We have no control over, and assume no responsibility for, the content, privacy policies, or practices of any third-party websites or services.</p>
        <p>You acknowledge and agree that GanaTube.in shall not be responsible or liable, directly or indirectly, for any damage or loss caused or alleged to be caused by or in connection with the use of or reliance on any such content, goods, or services available on or through any such websites or services.</p>

        <h3>Modifications to Terms</h3>
        <p>We reserve the right to modify these Terms at any time. We will notify users of any material changes by posting the new Terms on this page and updating the "Effective date" at the top of this Terms of Service.</p>
        <p>Your continued use of our Services after any changes to these Terms constitutes acceptance of the new Terms. If you do not agree to the modified Terms, you must discontinue your use of our Services.</p>

        <h3>Termination</h3>
        <p>We may terminate or suspend your access to our Services immediately, without prior notice or liability, for any reason whatsoever, including without limitation if you breach these Terms.</p>
        <p>Upon termination, your right to use our Services will cease immediately. All provisions of these Terms that by their nature should survive termination shall survive termination, including ownership provisions, warranty disclaimers, indemnity, and limitations of liability.</p>

        <h3>Commitment to Legal Compliance & Safe Harbor</h3>
        <ul class="feature-list">
          <li><strong>Transparent Operation:</strong> We operate transparently and disclose that:
            <ul style="margin-top: 8px;">
              <li>We rely on external web data and indexing services for music cataloging</li>
              <li>Content availability may change or be modified by source providers at any time</li>
              <li>We respect the intellectual property rights and distribution terms of all rights holders</li>
              <li>We are prepared to modify or cease operations if required for compliance reasons</li>
            </ul>
          </li>
          <li><strong>Immediate Cessation Commitment:</strong> Upon receiving any form of legal notice, DMCA notice, or formal inquiry from copyright owners, their representatives, legal authorities, or rights management organizations, we commit to immediately (within 24 hours):
            <ul style="margin-top: 8px;">
              <li>Acknowledge receipt of the communication</li>
              <li>Disable the specific index entry, link, or functionality in question</li>
              <li>Suspend the entire service if required by legal authorities</li>
              <li>Provide written confirmation of actions taken</li>
              <li>Cooperate fully with verified rights holders to resolve any issues</li>
            </ul>
          </li>
          <li><strong>No Resistance to Takedown:</strong> We will not challenge, delay, or resist legitimate takedown requests. We will not attempt to circumvent takedown actions through mirrors or alternative indexing.</li>
          <li><strong>Non-Commercial Platform Operation:</strong> As we operate without charging users or directly monetizing copyrighted recordings, we maintain a non-commercial, good faith operation dedicated to music discovery.</li>
        </ul>

        <h3>Governing Law and Dispute Resolution</h3>
        <p>These Terms shall be governed by and construed in accordance with the laws of the jurisdiction in which GanaTube.in operates, without regard to its conflict of law provisions.</p>
        <p>Any disputes arising out of or relating to these Terms or our Services shall be resolved through good faith negotiations. If such negotiations are unsuccessful, disputes shall be resolved through binding arbitration or in the appropriate courts of jurisdiction.</p>
        <p><strong>Priority Resolution for Copyright Holders:</strong> For any inquiries or concerns related to copyright or intellectual property, we commit to resolving issues swiftly and without litigation. We prioritize immediate compliance and amicable resolution above all else.</p>

        <h3>Contact Us</h3>
        <p>If you have any questions about these Terms of Service, please contact us:</p>
        <div class="contact-card">
          <p><strong>Email:</strong> <a href="mailto:support@ganatube.in">support@ganatube.in</a></p>
          <p><strong>Website:</strong> <a href="https://ganatube.in">https://ganatube.in</a></p>
        </div>
        <p style="margin-top: 16px; font-size: 0.95rem; color: rgba(255, 255, 255, 0.7);">By using GanaTube.in, you acknowledge that you have read, understood, and agree to be bound by these Terms of Service. If you do not agree to these Terms, please do not use our Services.</p>
      </div>
    `
  },
  'cookie-policy': {
    title: 'Cookie & Local Storage Policy | GanaTube',
    html: `
      <div class="static-content-block">
        <h2>Cookie & Local Storage Policy</h2>
        <p><strong>Effective Date:</strong> 06/04/2025<br>
        <strong>Last Updated:</strong> 06/04/2025</p>

        <p>This Cookie & Local Storage Policy explains how GanaTube ("we", "us", or "our") uses standard HTTP cookies, HTML5 local storage (LocalStorage and SessionStorage), and IndexedDB technologies on <a href="https://ganatube.in">ganatube.in</a> and our Progressive Web Application.</p>

        <h3>1. What Are Cookies and Storage Technologies?</h3>
        <ul class="feature-list">
          <li><strong>Cookies:</strong> Small alphanumeric data files placed on your device by web browsers when accessing websites. They help web applications remember session states, user preferences, and analytics data.</li>
          <li><strong>HTML5 Local Storage & IndexedDB:</strong> High-performance client-side browser storage that enables modern web apps to store data locally on your device without transmitting it over the network on every HTTP request. This enables fast, persistent playback state.</li>
        </ul>

        <h3>2. Categories of Storage and Cookies We Use</h3>
        <h4>A. Strictly Necessary & Functional Storage (Essential)</h4>
        <p>These local storage items are essential for core music playback and navigation and cannot be disabled without disrupting the player:</p>
        <ul class="feature-list">
          <li><strong>Audio Player State:</strong> Preserving current track index, playback timestamp, volume level, shuffle/repeat modes, and active queue lists so songs do not restart when navigating between pages.</li>
          <li><strong>User Interface Preferences:</strong> Saving your language selections (Hindi, Punjabi, English, etc.), audio quality preferences, and AMOLED dark mode settings.</li>
          <li><strong>Authentication State:</strong> Storing secure OAuth session tokens locally if you sign in with Google to maintain your session across page reloads.</li>
        </ul>

        <h4>B. Third-Party Advertising Cookies (Google AdSense)</h4>
        <p>GanaTube displays non-intrusive visual web banners powered by Google AdSense to fund server infrastructure and bandwidth costs while keeping streaming free:</p>
        <ul class="feature-list">
          <li>Third-party vendors, including Google, use cookies (such as the DoubleClick cookie) to serve ads based on a user's prior visits to GanaTube or other websites on the internet.</li>
          <li>Google's advertising cookies enable it and its partners to serve relevant advertisements to users based on browsing behavior.</li>
          <li>Cookies are also utilized for ad frequency capping, fraud prevention, and aggregated impression reporting.</li>
        </ul>

        <h4>C. Performance & Analytics Telemetry</h4>
        <p>Lightweight, aggregated telemetry cookies help our engineering team monitor page load performance, stream error rates, and peak concurrency to guarantee high platform availability.</p>

        <h3>3. Managing and Opting Out of Cookies</h3>
        <p>You have full autonomy over how cookies and storage mechanisms are utilized on your device:</p>
        <ul class="feature-list">
          <li><strong>Opt Out of Google Personalized Ads:</strong> You can opt out of personalized advertising by visiting <a href="https://adssettings.google.com" target="_blank" rel="noopener noreferrer">Google Ads Settings</a>.</li>
          <li><strong>Industry-Wide Ad Opt-Out:</strong> You can opt out of third-party advertising cookies through the <a href="https://optout.aboutads.info/" target="_blank" rel="noopener noreferrer">Digital Advertising Alliance (AboutAds)</a> or the <a href="https://www.youronlinechoices.eu/" target="_blank" rel="noopener noreferrer">European Interactive Digital Advertising Alliance (EDAA)</a>.</li>
          <li><strong>Browser Cookie Controls:</strong> You can configure your browser (Chrome, Safari, Firefox, Edge) to block, reject, or clear cookies and local storage via your browser settings. Note that disabling local storage may cause the music player to lose playback progress or queue continuity upon page reload.</li>
        </ul>

        <h3>4. Contact Us</h3>
        <p>If you have any questions about our use of cookies or local storage technologies, please contact us at: <a href="mailto:support@ganatube.in">support@ganatube.in</a></p>
      </div>
    `
  },
  'dmca': {
    title: 'DMCA & Copyright Policy | GanaTube',
    html: `
      <div class="static-content-block">
        <h2>DMCA & Copyright Policy</h2>
        <p><strong>Effective Date:</strong> 06/04/2025<br>
        <strong>Last Updated:</strong> 06/04/2025</p>

        <p>GanaTube ("we", "us", "our") strictly respects the intellectual property rights of artists, record labels, composers, and copyright owners, and we expect all users of our platform to do the same. In compliance with the Digital Millennium Copyright Act (17 U.S.C. § 512), EU Copyright Directives, and applicable international copyright laws, we maintain an expedited notice-and-takedown procedure.</p>

        <h3>1. Platform Architecture & Safe Harbor Notice</h3>
        <p>GanaTube operates as an online discovery index, search aggregator, and media player interface. <strong>GanaTube does not host, upload, or store copyrighted sound recordings or media files on its servers.</strong> Audio and multimedia content streamed through GanaTube is delivered dynamically from third-party public web sources and media providers.</p>
        <p>Because media files are hosted on external third-party services, removing or restricting access on the source platform automatically eliminates availability across GanaTube. However, we take all copyright concerns seriously and will promptly disable access to allegedly infringing content on our search index upon receiving a valid notification.</p>

        <h3>2. 24-Hour Expedited Takedown Response</h3>
        <p>We are committed to reviewing and processing all valid, complete DMCA takedown notices within <strong>24 hours of receipt</strong>. We do not delay or contest legitimate claims submitted by verified copyright holders or their authorized legal representatives.</p>

        <h3>3. Submitting a DMCA Takedown Notice</h3>
        <p>To file a legally binding takedown notice with our designated copyright agent, please provide a written communication containing the following statutory details:</p>
        <ul class="feature-list">
          <li><strong>1. Contact Information:</strong> Your full legal name, company or organization (if applicable), mailing address, telephone number, and an active email address.</li>
          <li><strong>2. Identification of Copyrighted Work:</strong> A clear description of the copyrighted sound recording, musical composition, or album claimed to have been infringed, including registration numbers if available.</li>
          <li><strong>3. Location of Infringing Material:</strong> The exact GanaTube URL(s), search query, or track identifier sufficient to allow our team to locate and disable the specific material on our platform.</li>
          <li><strong>4. Good Faith Statement:</strong> The statement: <em>"I have a good faith belief that use of the material in the manner complained of is not authorized by the copyright owner, its agent, or the law."</em></li>
          <li><strong>5. Statement of Accuracy:</strong> The statement: <em>"I swear, under penalty of perjury, that the information in this notification is accurate and that I am the copyright owner or an agent authorized to act on behalf of the owner of an exclusive right that is allegedly infringed."</em></li>
          <li><strong>6. Authorized Signature:</strong> A physical or electronic signature of the copyright owner or an authorized representative (typing your full legal name is legally sufficient for email submissions).</li>
        </ul>

        <h3>4. Designated Copyright Agent</h3>
        <p>Please send all formal copyright notices and DMCA communications directly to our designated team:</p>
        <div class="contact-card">
          <p><strong>Primary DMCA Email:</strong> <a href="mailto:dmca@ganatube.in">dmca@ganatube.in</a></p>
          <p><strong>Secondary Support Email:</strong> <a href="mailto:support@ganatube.in">support@ganatube.in</a></p>
          <p><strong>Platform:</strong> GanaTube (<a href="https://ganatube.in">https://ganatube.in</a>)</p>
        </div>

        <h3>5. Counter-Notification Procedure</h3>
        <p>If you believe that material you submitted or curated was removed or disabled as a result of mistake or misidentification, you may submit a formal counter-notification to our copyright agent containing your contact details, identification of the removed material, a statement under penalty of perjury of good-faith belief of error, and consent to legal jurisdiction.</p>

        <h3>6. Repeat Infringer Policy</h3>
        <p>In accordance with Section 512(i) of the DMCA and applicable global copyright laws, GanaTube enforces a strict policy that provides for the termination, in appropriate circumstances, of access, accounts, or services of users who are found to be repeat copyright infringers.</p>
      </div>
    `
  },
  'disclaimer': {
    title: 'Legal Disclaimer | GanaTube',
    html: `
      <div class="static-content-block">
        <h2>Legal Disclaimer</h2>
        <p><strong>Effective Date:</strong> 06/04/2025<br>
        <strong>Last Updated:</strong> 06/04/2025</p>

        <p>Please read this disclaimer carefully before using GanaTube (<a href="https://ganatube.in">ganatube.in</a>) or our Progressive Web Application. By accessing or using our Service, you acknowledge and agree to the terms described below.</p>

        <h3>1. Platform Purpose & Informational Usage</h3>
        <p>GanaTube is engineered as an online music discovery, personal listening, and playlist organization interface. It is not intended to replace commercial music distribution platforms, licensing houses, or official record releases. We strongly encourage all music listeners to support artists, composers, and bands by purchasing original music, attending live concerts, and subscribing to official artist merchandise channels.</p>

        <h3>2. Third-Party Media Content & External Providers</h3>
        <p><strong>GanaTube does not host, upload, store, or re-encode audio or video files on its servers.</strong> Media streams, metadata, preview soundbites, album artwork, and lyrical data accessible through GanaTube originate from independent third-party services and public web sources.</p>
        <p>GanaTube claims zero ownership over third-party multimedia content. All sound recordings, musical works, visual assets, and trademarks belong exclusively to their respective copyright holders. GanaTube exercises no editorial control over content hosted on external networks. If material is removed or modified on the source provider, it becomes automatically unavailable on GanaTube.</p>

        <h3>3. Non-Affiliation Notice</h3>
        <p>GanaTube is an independent project and is not affiliated with, endorsed by, sponsored by, or officially associated with any commercial streaming platforms, media corporations, or record labels. All product and company names are trademarks or registered trademarks of their respective holders. Their reference on GanaTube is strictly for identification and compatibility purposes.</p>

        <h3>4. "Zero Audio Ads" Clarification</h3>
        <p>Our commitment to "Zero Audio Ads" means that GanaTube will never inject audio commercial breaks, vocal promos, or sponsor interruptions into your music sessions. The platform is supported solely through non-intrusive visual display advertisements on the website to help offset server hosting and bandwidth costs.</p>

        <h3>5. Editorial Content & Music Guides</h3>
        <p>Articles, blog posts, workout music breakdowns, lyrics analyses, and listening guides published on GanaTube are provided solely for educational, cultural, and recreational purposes. They represent the independent opinions and analyses of our editorial team and should not be construed as professional, legal, or commercial advice.</p>

        <h3>6. No Warranties & Service Continuity</h3>
        <p>GanaTube is provided on an "as is" and "as available" basis without warranties of any kind. While we strive to maintain high uptime and seamless playback, the continuous operation of GanaTube depends upon external web sources and network infrastructure. We do not guarantee uninterrupted access, absence of technical errors, or permanent catalog availability.</p>

        <h3>7. Limitation of Liability</h3>
        <p>To the fullest extent permitted by applicable law, GanaTube, its operators, contributors, and affiliates shall not be liable for any direct, indirect, incidental, special, or consequential damages resulting from your use of or inability to use the Service, including mobile cellular data charges, device compatibility issues, or third-party service modifications.</p>

        <h3>8. Acceptance & Inquiries</h3>
        <p>By using GanaTube, you signify your full acceptance of this Disclaimer. If you do not agree with any portion of this disclaimer, you must discontinue your use of the Service immediately. For any inquiries, reach out to us at <a href="mailto:support@ganatube.in">support@ganatube.in</a>.</p>
      </div>
    `
  },
  'contact': {
    title: 'Contact GanaTube.in - Support & Inquiries',
    html: `
      <div class="static-content-block">
        <h2>Contact GanaTube.in</h2>
        <p>At GanaTube.in, we value user feedback and aim to make every interaction with our platform as smooth as possible. Whether you need technical assistance, want to share an idea, report a problem, or discuss a potential partnership, our team welcomes your inquiry.</p>

        <div class="contact-card">
          <h3>Customer Support</h3>
          <p><strong>Email:</strong> <a href="mailto:support@ganatube.in">support@ganatube.in</a></p>
          <p style="margin-top: 8px;">For general questions, playback difficulties, website errors, account-related concerns, or assistance with available features, contact our support team. Please include relevant details about your device, browser, and the issue you encountered so we can better understand your request.</p>
        </div>

        <div class="contact-card">
          <h3>Business and Partnerships</h3>
          <p><strong>Email:</strong> <a href="mailto:support@ganatube.in">support@ganatube.in</a></p>
          <p style="margin-top: 8px;">We welcome professional inquiries concerning business collaborations, promotional opportunities, technology integrations, sponsorship proposals, and media-related requests. If you have a proposal that aligns with GanaTube.in and its audience, feel free to get in touch.</p>
        </div>

        <div class="contact-card">
          <h3>Copyright and Legal Matters</h3>
          <p><strong>Email:</strong> <a href="mailto:support@ganatube.in">support@ganatube.in</a></p>
          <p style="margin-top: 8px;">For copyright complaints, intellectual property concerns, trademark matters, or other legal inquiries, please contact us with a clear description of the issue and the relevant supporting information. Use a subject line such as “Copyright Notice” or “Legal Inquiry” to help identify the nature of your request.</p>
          <p style="margin-top: 8px;">Please review our <a href="/dmca">DMCA Policy</a> for applicable procedures and submission requirements.</p>
        </div>

        <h3>Suggestions and Feature Requests</h3>
        <p>We are interested in hearing how GanaTube.in can become more useful to its visitors. Share your suggestions, describe the problem you want to solve, and explain how your proposed improvement could enhance the overall experience.</p>
        <p>Our evaluation of suggestions may take into account user needs, technical feasibility, platform priorities, and potential benefits.</p>

        <h3>Report a Technical Problem</h3>
        <p>If you experience an error or unexpected behavior while using GanaTube.in, providing detailed information can help us investigate the issue more effectively.</p>
        <p>Where possible, include:</p>
        <ul class="feature-list">
          <li><strong>Browser details:</strong> Browser name and version.</li>
          <li><strong>Device information:</strong> Device model and operating system.</li>
          <li><strong>Steps to reproduce:</strong> The actions that led to the problem.</li>
          <li><strong>Expected and actual results:</strong> Explain what you wanted to happen and what occurred instead.</li>
          <li><strong>Supporting evidence:</strong> Screenshots or screen recordings, if available.</li>
        </ul>
        <p><em>Please avoid including passwords, verification codes, or other sensitive personal information in your report.</em></p>

        <h3>Stay Connected</h3>
        <p>Keep an eye on our official communication channels for platform announcements, feature updates, music discovery discussions, and other community activities as they become available.</p>
        <p>For website-related questions or assistance, email us directly or use the contact options provided on our platform.</p>

        <div class="contact-card" style="text-align: center; margin-top: 24px;">
          <p><a href="/" style="font-weight: 600; font-size: 1.1rem;">Visit GanaTube.in</a></p>
          <p style="margin-top: 8px; color: rgba(255, 255, 255, 0.7);">GanaTube.in — Your destination for music discovery and listening.</p>
        </div>
        <p style="margin-top: 24px; font-size: 0.95rem; color: rgba(255, 255, 255, 0.5);">© 2025-${new Date().getFullYear()} GanaTube.in. All rights reserved.</p>
      </div>
    `
  }
};

// Canonical URL aliases for route flexibility (e.g., /terms, /privacy, /about-us, /cookies, /help)
PAGE_CONTENT['terms'] = PAGE_CONTENT['terms-of-service'];
PAGE_CONTENT['privacy'] = PAGE_CONTENT['privacy-policy'];
PAGE_CONTENT['cookie'] = PAGE_CONTENT['cookie-policy'];
PAGE_CONTENT['cookies'] = PAGE_CONTENT['cookie-policy'];
PAGE_CONTENT['about-us'] = PAGE_CONTENT['about'];
PAGE_CONTENT['help'] = PAGE_CONTENT['faq'];
