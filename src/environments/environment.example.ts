export const environment = {
  production: false,
  // ⚠️ Add your YouTube Data API v3 key here.
  // Get one at: https://console.cloud.google.com/apis/library/youtube.googleapis.com
  youtubeApiKey: 'YOUR_YOUTUBE_API_KEY_HERE',
  youtubeApiUrl: 'https://www.googleapis.com/youtube/v3',
  backendUrl: '/api',
  firebase: {
    apiKey: "YOUR_FIREBASE_API_KEY_HERE",
    authDomain: "ganatube-8ec4a.firebaseapp.com",
    projectId: "ganatube-8ec4a",
    storageBucket: "ganatube-8ec4a.firebasestorage.app",
    messagingSenderId: "YOUR_SENDER_ID",
    appId: "YOUR_APP_ID",
    measurementId: "YOUR_MEASUREMENT_ID"
  }
};
