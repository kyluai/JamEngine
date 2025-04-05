# Vibify Music Integration

A comprehensive music integration library that supports Spotify, Apple Music, and SoundCloud. This library provides a unified interface for searching tracks, getting recommendations, and controlling playback across multiple music streaming services.

## Features

- Unified interface for multiple music streaming services
- Track search across all platforms
- AI-powered music recommendations based on text input
- Playback control (play, pause, skip)
- Current track information
- Mood and genre detection
- Authentication handling for each service

## Prerequisites

Before you begin, ensure you have:

1. Node.js (v14 or later)
2. npm or yarn
3. Developer accounts for the services you want to use:
   - [Spotify Developer Account](https://developer.spotify.com/dashboard)
   - [Apple Developer Account](https://developer.apple.com/programs/)
   - [SoundCloud Developer Account](https://developers.soundcloud.com/)

## Installation

1. Clone the repository:
```bash
git clone https://github.com/yourusername/vibify.git
cd vibify
```

2. Install dependencies:
```bash
npm install
# or
yarn install
```

3. Create a `.env` file in the root directory with your API credentials:
```env
# Spotify Configuration
VITE_SPOTIFY_CLIENT_ID=your_spotify_client_id
VITE_SPOTIFY_CLIENT_SECRET=your_spotify_client_secret
VITE_SPOTIFY_REDIRECT_URI=http://localhost:3000/callback

# Apple Music Configuration
VITE_APPLE_MUSIC_TEAM_ID=your_team_id
VITE_APPLE_MUSIC_KEY_ID=your_key_id
VITE_APPLE_MUSIC_PRIVATE_KEY=your_private_key
VITE_APPLE_MUSIC_DEVELOPER_TOKEN=your_developer_token

# SoundCloud Configuration
VITE_SOUNDCLOUD_CLIENT_ID=your_soundcloud_client_id
VITE_SOUNDCLOUD_CLIENT_SECRET=your_soundcloud_client_secret
VITE_SOUNDCLOUD_REDIRECT_URI=http://localhost:3000/soundcloud-callback
```

## Usage

### Initialize the Music Service Factory

```typescript
import { MusicServiceFactory, ServiceType } from './lib/music-service-factory';

const factory = MusicServiceFactory.getInstance();
```

### Authentication

```typescript
// Get a specific service
const spotifyService = factory.getService('spotify');

// Check if authenticated
if (!spotifyService.isAuthenticated()) {
  // Get login URL
  const loginUrl = spotifyService.initiateLogin();
  // Redirect user to loginUrl
}

// Handle callback after authentication
await spotifyService.handleCallback(code);
```

### Search Tracks

```typescript
// Search on a specific service
const tracks = await spotifyService.searchTracks('your search query');

// Search across all authenticated services
const allResults = await factory.searchAllServices('your search query');
```

### Get Recommendations

```typescript
// Get recommendations based on text input
const recommendations = await spotifyService.getRecommendationsFromText(
  'I want some upbeat pop music for a party'
);

// Get recommendations from all services
const allRecommendations = await factory.getRecommendationsFromAllServices(
  'I want some relaxing jazz for studying'
);
```

### Playback Control

```typescript
// Get current track
const currentTrack = await spotifyService.getCurrentTrack();

// Control playback
await spotifyService.play();
await spotifyService.pause();
await spotifyService.skip();
```

## Service-Specific Setup

### Spotify Setup
1. Create a new application in the [Spotify Developer Dashboard](https://developer.spotify.com/dashboard)
2. Add `http://localhost:3000/callback` to the Redirect URIs
3. Copy the Client ID and Client Secret to your `.env` file

### Apple Music Setup
1. Enroll in the [Apple Developer Program](https://developer.apple.com/programs/)
2. Create a MusicKit identifier
3. Generate a private key
4. Add your Team ID, Key ID, and Private Key to your `.env` file
5. Generate a Developer Token and add it to your `.env` file

### SoundCloud Setup
1. Register your application at [SoundCloud for Developers](https://developers.soundcloud.com/)
2. Add `http://localhost:3000/soundcloud-callback` to the Redirect URIs
3. Copy the Client ID and Client Secret to your `.env` file

## Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Acknowledgments

- Spotify Web API
- Apple Music API
- SoundCloud API
- All the contributors who have helped with this project