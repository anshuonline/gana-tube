export interface BlogAuthor {
  id: string;
  name: string;
  role: string;
  bio: string;
  initials: string;
  gradient: string;
  avatarUrl?: string;
  location: string;
  expertise: string[];
  articleCount?: number;
  socialLinks?: {
    twitter?: string;
    linkedin?: string;
    website?: string;
  };
}

export const BLOG_AUTHORS: BlogAuthor[] = [
  {
    id: 'anshu-saxena',
    name: 'Anshu Saxena',
    role: 'Founder & Editor-in-Chief',
    initials: 'AS',
    gradient: 'linear-gradient(135deg, #a855f7 0%, #ec4899 100%)',
    avatarUrl: '',
    location: 'New Delhi, India',
    bio: 'Founder of GanaTube and Chief Editorial Director. Technologist, web architect, and music curator dedicated to engineering ultra-fast, distraction-free audio streaming and spotlighting Indian musical innovation.',
    expertise: ['Audio Streaming', 'Music Tech', 'Product Architecture', 'Playback Systems'],
    articleCount: 33,
    socialLinks: {
      twitter: 'https://twitter.com/ganatube',
      linkedin: 'https://linkedin.com/company/ganatube',
      website: 'https://ganatube.in'
    }
  },
  {
    id: 'pooja-sharma',
    name: 'Pooja Sharma',
    role: 'Senior Music Critic & Bollywood Specialist',
    initials: 'PS',
    gradient: 'linear-gradient(135deg, #ec4899 0%, #f43f5e 100%)',
    avatarUrl: '',
    location: 'Mumbai, India',
    bio: 'Senior cultural journalist with over 8 years covering contemporary Hindi cinema soundtracks, classic ghazals, semi-classical compositions, and the evolving artistry of Indian playback legends.',
    expertise: ['Bollywood Melodies', 'Vocal Analysis', 'Soundtracks', 'Sufi Classics'],
    articleCount: 26,
    socialLinks: {
      twitter: 'https://twitter.com/pooja_music'
    }
  },
  {
    id: 'rohan-verma',
    name: 'Rohan Verma',
    role: 'Indie & Hip-Hop Correspondent',
    initials: 'RV',
    gradient: 'linear-gradient(135deg, #3b82f6 0%, #06b6d4 100%)',
    avatarUrl: '',
    location: 'Bengaluru, India',
    bio: 'Music analyst tracking India’s rapidly expanding independent music movement, Desi Hip-Hop (DHH) subcultures, underground rap scenes, and breakthrough bedroom producers.',
    expertise: ['Desi Hip-Hop', 'Indie Pop', 'Urban Beats', 'Music Production'],
    articleCount: 23,
    socialLinks: {
      twitter: 'https://twitter.com/rohan_v_music'
    }
  },
  {
    id: 'sneha-patel',
    name: 'Sneha Patel',
    role: 'Audio Engineering & Sound Quality Analyst',
    initials: 'SP',
    gradient: 'linear-gradient(135deg, #10b981 0%, #06b6d4 100%)',
    avatarUrl: '',
    location: 'Pune, India',
    bio: 'Audio acoustics researcher and streaming technology analyst exploring lossless bitrate streaming, web-audio codecs, spatial soundscapes, and digital signal processing in modern web players.',
    expertise: ['Lossless Codecs', 'Web Audio API', 'Spatial Acoustics', 'Hi-Fi Streaming'],
    articleCount: 18,
    socialLinks: {
      linkedin: 'https://linkedin.com/in/snehapatel-audio'
    }
  },
  {
    id: 'kabir-mehta',
    name: 'Kabir Mehta',
    role: 'Regional & Folk Music Columnist',
    initials: 'KM',
    gradient: 'linear-gradient(135deg, #f59e0b 0%, #ef4444 100%)',
    avatarUrl: '',
    location: 'Chandigarh, India',
    bio: 'Cultural archivist and music columnist documenting the global rise of the Punjabi wave, qawwali traditions, and regional folk rhythms across the Indian subcontinent.',
    expertise: ['Punjabi Wave', 'Folk Traditions', 'Concert Reviews', 'Global Fusion'],
    articleCount: 13,
    socialLinks: {
      twitter: 'https://twitter.com/kabirmehta_music'
    }
  }
];

export function getAuthorById(id?: string): BlogAuthor {
  if (!id) return BLOG_AUTHORS[0];
  const found = BLOG_AUTHORS.find(a => a.id === id);
  return found || BLOG_AUTHORS[0];
}

export function getAuthorByName(name?: string): BlogAuthor {
  if (!name) return BLOG_AUTHORS[0];
  const found = BLOG_AUTHORS.find(a => a.name.toLowerCase() === name.toLowerCase());
  return found || BLOG_AUTHORS[0];
}
