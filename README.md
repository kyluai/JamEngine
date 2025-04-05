# Vibify

A music recommendation platform that uses natural language processing to find the perfect music for any mood or situation.

## Features

### Enhanced Music Search
- **Natural Language Processing**: Search for music using natural language descriptions
- **Multi-Service Support**: Search across Apple Music and SoundCloud simultaneously
- **Smart Analysis**: Analyzes keywords, genre, theme, and lyrics to provide relevant recommendations
- **Confidence Scoring**: Each recommendation includes a confidence score based on match quality

### Supported Services
- **Apple Music**
  - Full authentication with JWT
  - Track search and recommendations
  - Playback control
  - Current track information

- **SoundCloud**
  - OAuth2 authentication
  - Track search and recommendations
  - Direct streaming links
  - Artist information

## Getting Started

1. Clone the repository
2. Install dependencies:
   ```bash
   npm install
   ```

3. Create a `.env` file with the following credentials:
   ```
   # Apple Music
   VITE_APPLE_MUSIC_DEVELOPER_TOKEN=your_developer_token
   VITE_APPLE_MUSIC_TEAM_ID=your_team_id
   VITE_APPLE_MUSIC_KEY_ID=your_key_id
   VITE_APPLE_MUSIC_PRIVATE_KEY=your_private_key

   # SoundCloud
   VITE_SOUNDCLOUD_CLIENT_ID=your_client_id
   VITE_SOUNDCLOUD_CLIENT_SECRET=your_client_secret
   VITE_SOUNDCLOUD_REDIRECT_URI=http://localhost:3000/callback
   ```

4. Start the development server:
   ```bash
   npm run dev
   ```

## Usage

1. Enter a natural language description of the music you're looking for
2. The system will analyze your input and search across both Apple Music and SoundCloud
3. Results will be displayed with confidence scores and detailed information
4. Click on any track to listen on the respective platform

## Examples

Try these search queries:
- "happy pop music for a party"
- "sad rock songs about heartbreak"
- "upbeat electronic music for working out"
- "chill acoustic songs for studying"
- "epic orchestral music for gaming"

## Development

### Running Tests
```bash
npm test
```

### Building for Production
```bash
npm run build
```

## Contributing

1. Fork the repository
2. Create a feature branch
3. Commit your changes
4. Push to the branch
5. Create a Pull Request

## License

MIT