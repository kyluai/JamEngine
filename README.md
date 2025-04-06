# The Jam Engine 🎵

A music app we built for our hackathon project! It helps you find the perfect music based on your mood, what you type, or even pictures you upload.

## What it does

- Upload pictures and get music that matches the vibe
- Get playlists based on how you're feeling
- Type what you want to listen to and get smart suggestions
- Control your music right from the app
- See cool color visualizations of your music's mood

## What we used

- React and TypeScript
- Spotify API
- Tailwind CSS
- Vite
- Material-UI

## How to run it

1. Get the code:
```bash
git clone https://github.com/kyluai/JamEngine.git
cd JamEngine
```

2. Install stuff:
```bash
npm install
```

3. Make a `.env` file with your Spotify info:
```env
VITE_SPOTIFY_CLIENT_ID=your_spotify_client_id
VITE_SPOTIFY_CLIENT_SECRET=your_spotify_client_secret
VITE_SPOTIFY_REDIRECT_URI=http://localhost:3000/callback
```

4. Start it up:
```bash
npm run dev
```

## How to use it

1. **Picture to Music**
   - Put in any picture
   - It figures out what's in the picture
   - Gives you music that matches

2. **Mood Music**
   - Pick how you're feeling
   - Get a playlist that fits
   - Save the ones you like

3. **Smart Search**
   - Type what you want to hear
   - Get music suggestions
   - Find new stuff to listen to

## Project stuff

```
src/
├── components/     # UI parts
├── pages/         # Different pages
├── lib/           # Main code
└── test/          # Tests
```

## Things we want to add later

- [ ] Daily playlists based on your mood
- [ ] Better picture analysis
- [ ] Share playlists with friends
- [ ] Make playlists together

## Our team

- [Your Name] - Made the frontend
- [Team Member 2] - Did the Spotify stuff
- [Team Member 3] - Made it look nice

## Thanks to

- Spotify for their API
- Our hackathon mentors
- Everyone who made the tools we used