# Music Service Implementation

## Overview
This document details the implementation of music services in the Vibify application, including Apple Music and SoundCloud integrations.

## Service Architecture

### Common Interface
All music services implement the `MusicService` interface with the following core functionality:
- Authentication
- Track search
- Recommendations
- Playback control
- Current track information

### Apple Music Service
#### Authentication
- Uses JWT for secure authentication
- Requires developer credentials:
  - Developer Token
  - Team ID
  - Key ID
  - Private Key
- Implements OAuth2 flow for user authentication

#### Features
1. **Track Search**
   - Searches Apple Music catalog
   - Returns track metadata including:
     - Title
     - Artist
     - Album
     - Preview URL
     - Artwork

2. **Recommendations**
   - Analyzes input text for:
     - Keywords
     - Genre
     - Theme
     - Lyrics
   - Uses multiple parameters for matching:
     - Tempo range
     - Energy level
     - Valence
     - Danceability
   - Calculates confidence score based on:
     - Genre match
     - Keyword matches
     - Theme alignment

3. **Playback Control**
   - Play/Pause
   - Skip tracks
   - Get current track info

### SoundCloud Service
#### Authentication
- Uses OAuth2 authentication
- Requires:
  - Client ID
  - Client Secret
  - Redirect URI

#### Features
1. **Track Search**
   - Searches SoundCloud catalog
   - Returns track metadata
   - Supports filtering by:
     - Genre
     - Tags
     - License type

2. **Recommendations**
   - Text analysis for:
     - Keywords
     - Genre
     - Theme
   - Confidence calculation based on:
     - Genre match
     - Tag matches
     - Theme alignment

3. **Current Track**
   - Retrieves currently playing track
   - Note: Direct playback control not supported by API

## Environment Variables
Required environment variables for each service:

### Apple Music
```
VITE_APPLE_MUSIC_DEVELOPER_TOKEN=your_developer_token
VITE_APPLE_MUSIC_TEAM_ID=your_team_id
VITE_APPLE_MUSIC_KEY_ID=your_key_id
VITE_APPLE_MUSIC_PRIVATE_KEY=your_private_key
```

### SoundCloud
```
VITE_SOUNDCLOUD_CLIENT_ID=your_client_id
VITE_SOUNDCLOUD_CLIENT_SECRET=your_client_secret
VITE_SOUNDCLOUD_REDIRECT_URI=your_redirect_uri
```

## Future Improvements
1. Add support for more music services
2. Implement caching for API responses
3. Add more sophisticated text analysis
4. Improve error handling and retry logic
5. Add unit tests
6. Implement rate limiting
7. Add support for playlists
8. Implement offline mode 