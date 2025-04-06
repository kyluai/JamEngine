# The Jam Engine 🎵

A smart music recommendation engine that creates personalized playlists based on your mood, text input, and even images! Built during the hackathon, this project combines the power of AI with music to create the perfect soundtrack for any moment.

## Features

- 🎨 Picture-to-Song: Upload an image and get music recommendations based on its visual elements
- 🎯 Mood-based Playlists: Get personalized playlists based on your current mood
- 🎵 Smart Recommendations: AI-powered music suggestions that understand context
- 🎮 Interactive UI: Beautiful and intuitive interface for a seamless experience
- 🔄 Real-time Playback: Control your music directly from the app
- 🌈 Visual Feedback: See your music's mood through beautiful color visualizations

## Tech Stack

- React + TypeScript for the frontend
- Spotify Web API for music integration
- Tailwind CSS for styling
- Vite for build tooling
- Material-UI for components

## Getting Started

1. Clone the repository:
```bash
git clone https://github.com/kyluai/JamEngine.git
cd JamEngine
```

2. Install dependencies:
```bash
npm install
```

3. Create a `.env` file in the root directory with your Spotify credentials:
```env
VITE_SPOTIFY_CLIENT_ID=your_spotify_client_id
VITE_SPOTIFY_CLIENT_SECRET=your_spotify_client_secret
VITE_SPOTIFY_REDIRECT_URI=http://localhost:3000/callback
```

4. Start the development server:
```bash
npm run dev
```

## How to Use

1. **Picture-to-Song**
   - Upload any image
   - Our AI analyzes the visual elements
   - Get a playlist that matches the mood and colors

2. **Mood-based Playlists**
   - Select your current mood
   - Get a curated playlist that matches your vibe
   - Save your favorite playlists

3. **Smart Recommendations**
   - Type any text describing what you want to listen to
   - Get AI-powered music suggestions
   - Discover new artists and genres

## Project Structure

```
src/
├── components/     # Reusable UI components
├── pages/         # Main application pages
├── lib/           # Core functionality and services
└── test/          # Test files
```

## Future Enhancements

- [ ] Daylist feature for daily mood-based playlists
- [ ] Enhanced image analysis for better music matching
- [ ] Social sharing features
- [ ] Collaborative playlists

## Team

- [Your Name] - Frontend Development
- [Team Member 2] - Backend Integration
- [Team Member 3] - UI/UX Design

## Acknowledgments

- Spotify Web API for music integration
- Our amazing hackathon mentors
- The open-source community for their incredible tools