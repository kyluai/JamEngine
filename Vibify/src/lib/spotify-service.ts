import axios from 'axios';
import { SpotifyRecommendation, SpotifyTrack, VisualFeatures } from '../types/spotify';

export interface MoodAnalysis {
  primaryMood: string;
  secondaryMoods: string[];
  keywords: string[];
  themes: string[];
  confidence: number;
  explanation?: string;
  musicalQualities?: string[];
  inputType: 'mood' | 'scenario' | 'mixed';
  scenario?: {
    activity?: string;
    setting?: string;
    timeOfDay?: string;
    energyLevel?: 'low' | 'medium' | 'high';
    socialContext?: 'alone' | 'with_friends' | 'with_family' | 'in_crowd';
    instrumentalPreference?: boolean;
  };
}

export interface CurrentTrack {
  name: string;
  artist: string;
  album: string;
  imageUrl: string;
  isPlaying: boolean;
  progress: number;
  duration: number;
}

interface Context {
  activity?: string;
  timeOfDay?: string;
  setting?: string;
}

export class SpotifyService {
  private readonly CLIENT_ID = import.meta.env.VITE_SPOTIFY_CLIENT_ID;
  private readonly CLIENT_SECRET = import.meta.env.VITE_SPOTIFY_CLIENT_SECRET;
  private readonly REDIRECT_URI = import.meta.env.VITE_SPOTIFY_REDIRECT_URI || 'http://localhost:3000/callback';
  private accessToken: string | null = null;

  // Cache for recommendations to improve performance
  private recommendationCache: Map<string, { timestamp: number; recommendations: SpotifyRecommendation[] }> = new Map();
  private readonly CACHE_EXPIRY_MS = 5 * 60 * 1000; // 5 minutes

  constructor() {
    // Log environment variables (without exposing secrets)
    console.log('Spotify Client ID available:', !!this.CLIENT_ID);
    console.log('Spotify Client Secret available:', !!this.CLIENT_SECRET);
    
    // Check for existing token in localStorage
    const savedToken = localStorage.getItem('spotify_access_token');
    if (savedToken) {
      this.accessToken = savedToken;
    }
  }

  public async verifyToken(token: string): Promise<boolean> {
    try {
      const response = await fetch('https://api.spotify.com/v1/me', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      return response.ok;
    } catch (error) {
      console.error('Error verifying token:', error);
      return false;
    }
  }

  public initiateLogin() {
    const scope = [
      'user-read-private',
      'user-read-email',
      'playlist-read-private',
      'playlist-modify-private',
      'playlist-modify-public',
      'user-top-read',
      'user-read-recently-played',
      'user-library-read',
      'user-read-playback-state',
      'user-modify-playback-state',
      'streaming'
    ].join(' ');
    
    const authUrl = new URL('https://accounts.spotify.com/authorize');
    authUrl.searchParams.append('response_type', 'code');
    authUrl.searchParams.append('client_id', this.CLIENT_ID);
    authUrl.searchParams.append('scope', scope);
    authUrl.searchParams.append('redirect_uri', this.REDIRECT_URI);
    authUrl.searchParams.append('show_dialog', 'true');

    window.location.href = authUrl.toString();
  }

  public async handleCallback(code: string): Promise<void> {
    try {
      const response = await axios.post('https://accounts.spotify.com/api/token', 
        new URLSearchParams({
          grant_type: 'authorization_code',
          code: code,
          redirect_uri: this.REDIRECT_URI,
          client_id: this.CLIENT_ID,
          client_secret: this.CLIENT_SECRET
        }), {
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded'
          }
        });

      const token = response.data.access_token;
      if (!token) {
        throw new Error('No access token received from Spotify');
      }

      this.accessToken = token;
      localStorage.setItem('spotify_access_token', token);
    } catch (error) {
      console.error('Error handling callback:', error);
      throw error;
    }
  }

  private async getAccessToken(): Promise<string> {
    try {
      if (this.accessToken) {
        // Verify the token is still valid
        const isValid = await this.verifyToken(this.accessToken);
        if (isValid) {
          return this.accessToken;
        }
        // If token is invalid, clear it
        this.accessToken = null;
        localStorage.removeItem('spotify_access_token');
      }

      const savedToken = localStorage.getItem('spotify_access_token');
      if (savedToken) {
        const isValid = await this.verifyToken(savedToken);
        if (isValid) {
          this.accessToken = savedToken;
          return savedToken;
        }
        localStorage.removeItem('spotify_access_token');
      }

      // If we get here, we need to force a new login
      console.log('No valid token found, initiating new login');
      localStorage.removeItem('spotify_access_token');
      this.accessToken = null;
      this.initiateLogin();
      throw new Error('Please log in to Spotify to continue.');
    } catch (error) {
      console.error('Error in getAccessToken:', error);
      // Force new login for any authorization errors
      if (axios.isAxiosError(error) && (error.response?.status === 401 || error.response?.status === 403)) {
        localStorage.removeItem('spotify_access_token');
        this.accessToken = null;
        this.initiateLogin();
      }
      throw error;
    }
  }

  private async searchTracks(query: string): Promise<SpotifyTrack[]> {
    try {
      const token = await this.getAccessToken();
      
      // Clean and format the query to match Spotify's search behavior
      const cleanQuery = this.formatSearchQuery(query);
      console.log('Formatted search query:', cleanQuery);
      
      // Use the search endpoint with parameters that match Spotify's search behavior
      const response = await axios.get('https://api.spotify.com/v1/search', {
        headers: {
          'Authorization': `Bearer ${token}`
        },
        params: {
          q: cleanQuery,
          type: 'track',
          limit: 20,
          market: 'US',
          include_external: 'audio'
        }
      });
      
      if (!response.data.tracks || response.data.tracks.items.length === 0) {
        console.log('No tracks found with query:', cleanQuery);
        return [];
      }
      
      console.log(`Found ${response.data.tracks.items.length} tracks for query: ${cleanQuery}`);
      
      // Transform the tracks to our format
      return response.data.tracks.items.map((track: any) => ({
        id: track.id,
        name: track.name,
        artist: track.artists[0].name,
        album: track.album.name,
        images: track.album.images,
        preview_url: track.preview_url,
        external_url: track.external_urls.spotify
      }));
    } catch (error) {
      console.error('Error searching tracks:', error);
      if (axios.isAxiosError(error) && error.response?.status === 401) {
        this.initiateLogin();
      }
      throw error;
    }
  }

  private formatSearchQuery(text: string): string {
    // Remove common stop words and filter relevant words
    const stopWords = new Set(['the', 'a', 'an', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for', 'of', 'with', 'by']);
    const words = text.toLowerCase()
      .split(/\s+/)
      .filter(word => !stopWords.has(word) && word.length > 2);

    // Extract key phrases and concepts
    const keyPhrases = this.extractKeyPhrases(text);
    const concepts = this.extractKeyConcepts(text);
    const entities = this.extractEntities(text);
    const temporalContext = this.extractTemporalContext(text);
    const spatialContext = this.extractSpatialContext(text);

    // Build a more sophisticated search query
    const queryParts: string[] = [];

    // Add key phrases if available
    if (keyPhrases.length > 0) {
      queryParts.push(keyPhrases.slice(0, 2).join(' '));
    }

    // Add relevant concepts
    if (concepts.length > 0) {
      queryParts.push(concepts.slice(0, 2).join(' '));
    }

    // Add temporal context if available
    if (temporalContext.length > 0) {
      queryParts.push(temporalContext[0]);
    }

    // Add spatial context if available
    if (spatialContext.length > 0) {
      queryParts.push(spatialContext[0]);
    }

    // Add genre hints based on the context
    const genreHints = this.getGenreHintsForContext(text);
    if (genreHints.length > 0) {
      queryParts.push(genreHints.slice(0, 2).join(' '));
    }

    // Add year range for more recent results
    queryParts.push('year:2000-2024');

    // Combine all parts and remove duplicates
    const query = [...new Set(queryParts)].join(' ').trim();

    console.log('Formatted search query:', query);
    return query;
  }

  private extractKeyPhrases(text: string): string[] {
    // Extract meaningful phrases from the text
    const phrases: string[] = [];
    const words = text.toLowerCase().split(/\s+/);
    
    // Look for common phrase patterns
    for (let i = 0; i < words.length - 1; i++) {
      const phrase = `${words[i]} ${words[i + 1]}`;
      if (this.isSignificantPhrase(phrase)) {
        phrases.push(phrase);
      }
    }
    
    return phrases;
  }

  private isSignificantPhrase(phrase: string): boolean {
    // Define patterns for significant phrases
    const significantPatterns = [
      /work out/i,
      /study session/i,
      /road trip/i,
      /beach day/i,
      /night out/i,
      /morning routine/i,
      /evening walk/i,
      /party time/i,
      /chill vibes/i,
      /focus mode/i
    ];
    
    return significantPatterns.some(pattern => pattern.test(phrase));
  }

  private getGenreHintsForContext(text: string): string[] {
    const genreHints: string[] = [];
    
    // Check for activity-based genres
    if (text.match(/workout|exercise|gym|fitness/i)) {
      genreHints.push('workout', 'rock', 'electronic', 'hip hop');
    }
    if (text.match(/study|focus|work|concentrate/i)) {
      genreHints.push('ambient', 'classical', 'lofi', 'instrumental');
    }
    if (text.match(/party|dance|celebration/i)) {
      genreHints.push('dance', 'pop', 'electronic', 'house');
    }
    if (text.match(/relax|chill|calm/i)) {
      genreHints.push('ambient', 'chill', 'jazz', 'lofi');
    }
    
    // Check for mood-based genres
    if (text.match(/happy|joy|excited/i)) {
      genreHints.push('pop', 'dance', 'disco');
    }
    if (text.match(/sad|melancholy|emotional/i)) {
      genreHints.push('acoustic', 'piano', 'indie');
    }
    if (text.match(/energetic|powerful|strong/i)) {
      genreHints.push('rock', 'metal', 'electronic');
    }
    
    return [...new Set(genreHints)];
  }

  /**
   * Gets recommendations based on a search query
   */
  private async getRecommendations(searchQuery: string): Promise<SpotifyRecommendation[]> {
    try {
      // In a real implementation, this would call the Spotify API
      // For now, we'll simulate recommendations based on the search query
      
      // Simulate API call delay
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Generate a unique hash from the search query
      const queryHash = this.hashString(searchQuery);
      const seed = this.hashToNumber(queryHash);
      const rng = this.seededRandom(seed);
      
      // Define possible songs
      const songs = [
        { title: "Colorful Dreams", artist: "The Chromatics", mood: "dreamy", genres: ["dream pop", "indie"] },
        { title: "Vibrant Vibes", artist: "The Spectrum", mood: "energetic", genres: ["pop", "dance"] },
        { title: "Muted Memories", artist: "The Monochromes", mood: "nostalgic", genres: ["indie", "folk"] },
        { title: "Bright Horizons", artist: "The Luminaries", mood: "inspiring", genres: ["pop", "rock"] },
        { title: "Dark Depths", artist: "The Shadows", mood: "mysterious", genres: ["electronic", "ambient"] },
        { title: "Warm Embrace", artist: "The Sunsets", mood: "romantic", genres: ["r&b", "soul"] },
        { title: "Cool Breeze", artist: "The Zephyrs", mood: "peaceful", genres: ["ambient", "jazz"] },
        { title: "Playful Spirit", artist: "The Whims", mood: "playful", genres: ["pop", "indie"] },
        { title: "Melancholic Melody", artist: "The Echoes", mood: "melancholic", genres: ["indie", "folk"] },
        { title: "Happy Harmony", artist: "The Joyous", mood: "happy", genres: ["pop", "dance"] }
      ];
      
      // Shuffle the songs
      const shuffledSongs = [...songs].sort(() => rng() - 0.5);
      
      // Take the first 3 songs
      const selectedSongs = shuffledSongs.slice(0, 3);
      
      // Convert to recommendations
      return selectedSongs.map(song => {
        const id = this.hashString(song.title + song.artist);
        const recommendation: SpotifyRecommendation = {
          id,
          title: song.title,
          artist: song.artist,
          album: song.title,
          albumArt: `https://via.placeholder.com/300?text=${encodeURIComponent(song.title)}`,
          imageUrl: `https://via.placeholder.com/300?text=${encodeURIComponent(song.title)}`,
          previewUrl: `https://example.com/preview/${id}`,
          spotifyUrl: `https://open.spotify.com/track/${id}`,
          description: `A song that matches the search query: ${searchQuery}`,
          mood: song.mood,
          genres: song.genres,
          tempo: 120 + Math.floor(rng() * 60)
        };
        return recommendation;
      });
    } catch (error) {
      console.error("Error getting recommendations:", error);
      throw error;
    }
  }

  private getEnergyFromMood(mood: string): number {
    const moodEnergyMap: { [key: string]: number } = {
      'happy': 0.8,
      'sad': 0.3,
      'energetic': 0.9,
      'calm': 0.3,
      'angry': 0.9,
      'romantic': 0.5,
      'nostalgic': 0.4,
      'peaceful': 0.2,
      'focused': 0.4,
      'party': 0.9,
      'chill': 0.3,
      'inspirational': 0.7,
      'cinematic': 0.6,
      'urban': 0.7,
      'nature': 0.4,
      'dreamy': 0.3,
      'introspective': 0.3,
      'neutral': 0.5
    };
    return moodEnergyMap[mood.toLowerCase()] || 0.5;
  }

  private getValenceFromMood(mood: string): number {
    const moodValenceMap: { [key: string]: number } = {
      'happy': 0.8,
      'sad': 0.2,
      'energetic': 0.7,
      'calm': 0.6,
      'angry': 0.3,
      'romantic': 0.7,
      'nostalgic': 0.5,
      'peaceful': 0.7,
      'focused': 0.5,
      'party': 0.8,
      'chill': 0.6,
      'inspirational': 0.8,
      'cinematic': 0.5,
      'urban': 0.6,
      'nature': 0.7,
      'dreamy': 0.6,
      'introspective': 0.4,
      'neutral': 0.5
    };
    return moodValenceMap[mood.toLowerCase()] || 0.5;
  }

  private getDanceabilityFromMood(mood: string): number {
    const moodDanceabilityMap: { [key: string]: number } = {
      'happy': 0.7,
      'sad': 0.3,
      'energetic': 0.8,
      'calm': 0.3,
      'angry': 0.6,
      'romantic': 0.4,
      'nostalgic': 0.5,
      'peaceful': 0.2,
      'focused': 0.3,
      'party': 0.9,
      'chill': 0.4,
      'inspirational': 0.5,
      'cinematic': 0.3,
      'urban': 0.7,
      'nature': 0.3,
      'dreamy': 0.3,
      'introspective': 0.2,
      'neutral': 0.5
    };
    return moodDanceabilityMap[mood.toLowerCase()] || 0.5;
  }

  private getGenresForMood(mood: string, availableGenres: string[]): string[] {
    const moodGenreMap: { [key: string]: string[] } = {
      'happy': ['pop', 'dance', 'disco', 'funk', 'soul', 'r-n-b'],
      'sad': ['acoustic', 'piano', 'folk', 'indie', 'alternative'],
      'energetic': ['rock', 'metal', 'punk', 'electronic', 'dance'],
      'calm': ['ambient', 'classical', 'jazz', 'chill', 'meditation'],
      'angry': ['metal', 'rock', 'punk', 'grunge', 'industrial'],
      'romantic': ['r-n-b', 'soul', 'jazz', 'pop', 'indie'],
      'nostalgic': ['classic', 'rock', 'pop', 'folk', 'jazz'],
      'peaceful': ['ambient', 'classical', 'meditation', 'chill', 'jazz'],
      'focused': ['ambient', 'classical', 'electronic', 'chill', 'lofi', 'instrumental'],
      'party': ['dance', 'pop', 'electronic', 'hip-hop', 'house', 'edm'],
      'chill': ['lofi', 'chill', 'ambient', 'jazz', 'indie'],
      'inspirational': ['pop', 'rock', 'indie', 'electronic', 'ambient'],
      'cinematic': ['classical', 'ambient', 'electronic', 'orchestral', 'soundtrack'],
      'urban': ['hip-hop', 'r-n-b', 'soul', 'electronic', 'pop'],
      'nature': ['ambient', 'folk', 'acoustic', 'world', 'new-age'],
      'dreamy': ['ambient', 'electronic', 'chill', 'indie', 'dream-pop'],
      'introspective': ['ambient', 'acoustic', 'piano', 'indie', 'folk']
    };

    const defaultGenres = ['pop', 'rock', 'hip-hop', 'electronic', 'dance'];
    const moodGenres = moodGenreMap[mood.toLowerCase()] || defaultGenres;
    
    // Filter to only include available genres
    return moodGenres.filter(genre => availableGenres.includes(genre));
  }

  private determineInputType(text: string): 'mood' | 'scenario' | 'mixed' {
    // Mood indicators
    const moodIndicators = [
      /feel(ing)?\s+(\w+)/i,
      /i'?m\s+(\w+)/i,
      /i'?m\s+feeling\s+(\w+)/i,
      /mood\s+(\w+)/i,
      /emotion(ally)?\s+(\w+)/i,
      /(\w+)\s+mood/i,
      /feeling\s+(\w+)/i,
      /(\w+)\s+emotion/i,
      /(\w+)\s+feeling/i
    ];
    
    // Scenario indicators
    const scenarioIndicators = [
      /at\s+(\w+)/i,
      /in\s+(\w+)/i,
      /on\s+(\w+)/i,
      /with\s+(\w+)/i,
      /while\s+(\w+)/i,
      /during\s+(\w+)/i,
      /for\s+(\w+)/i,
      /studying\s+(\w+)/i,
      /working\s+(\w+)/i,
      /exercising\s+(\w+)/i,
      /running\s+(\w+)/i,
      /driving\s+(\w+)/i,
      /walking\s+(\w+)/i,
      /chilling\s+(\w+)/i,
      /relaxing\s+(\w+)/i,
      /partying\s+(\w+)/i,
      /dancing\s+(\w+)/i,
      /meditating\s+(\w+)/i,
      /yoga\s+(\w+)/i,
      /reading\s+(\w+)/i,
      /writing\s+(\w+)/i,
      /coding\s+(\w+)/i,
      /brainstorming\s+(\w+)/i,
      /hackathon\s+(\w+)/i
    ];
    
    // Check for mood indicators
    let moodCount = 0;
    for (const pattern of moodIndicators) {
      if (pattern.test(text)) {
        moodCount++;
      }
    }
    
    // Check for scenario indicators
    let scenarioCount = 0;
    for (const pattern of scenarioIndicators) {
      if (pattern.test(text)) {
        scenarioCount++;
      }
    }
    
    // Additional checks for specific mood words
    const moodWords = ['happy', 'sad', 'angry', 'excited', 'calm', 'relaxed', 'energetic', 'tired', 'focused', 'inspired'];
    for (const word of moodWords) {
      if (text.toLowerCase().includes(word)) {
        moodCount++;
      }
    }
    
    // Additional checks for specific scenario words
    const scenarioWords = ['beach', 'library', 'gym', 'party', 'concert', 'work', 'study', 'home', 'office', 'car', 'train', 'bus', 'plane'];
    for (const word of scenarioWords) {
      if (text.toLowerCase().includes(word)) {
        scenarioCount++;
      }
    }
    
    // Determine input type based on counts
    if (moodCount > scenarioCount && moodCount > 1) {
      return 'mood';
    } else if (scenarioCount > moodCount && scenarioCount > 1) {
      return 'scenario';
    } else {
      return 'mixed';
    }
  }

  private analyzeScenario(text: string): MoodAnalysis['scenario'] {
    const scenario: MoodAnalysis['scenario'] = {};
    
    // Activity patterns (expanded)
    const activityPatterns = {
      studying: /study|learn|read|work|focus|brainstorm|hackathon|research|academic|school|university|college|knowledge|intellectual/i,
      exercising: /workout|exercise|run|gym|fitness|training|sport|athletic|active|strength|endurance|jog|swim|bike|yoga|meditate/i,
      relaxing: /relax|chill|rest|meditate|yoga|unwind|decompress|calm|peace|tranquility|serenity|balance|zen/i,
      partying: /party|dance|club|celebration|festival|fun|upbeat|wild|crazy|loud|energetic|vibrant|lively|social|gathering|event/i,
      commuting: /commute|travel|drive|walk|journey|road|trip|voyage|wander|roam|transport|transit|bus|train|plane|metro/i,
      socializing: /hang|meet|social|friends|party|family|group|together|with|company|conversation|chat|talk/i,
      working: /work|job|office|desk|computer|laptop|meeting|project|task|deadline|professional|business|career/i,
      creative: /create|art|paint|draw|design|write|compose|music|song|poem|story|novel|blog|content|creative/i
    };
    
    // Setting patterns (expanded)
    const settingPatterns = {
      nature: /nature|outdoors|park|forest|beach|mountain|ocean|wilderness|natural|organic|earth|green|wild|garden|lake|river/i,
      urban: /city|street|downtown|urban|building|metropolitan|nightlife|night|cityscape|metropolis|downtown|neighborhood|district/i,
      home: /home|house|room|apartment|bedroom|living room|kitchen|bathroom|couch|sofa|bed|chair|desk|studio|garage/i,
      office: /office|work|desk|studio|cubicle|meeting room|conference|boardroom|classroom|lecture hall|library|cafe|coffee shop/i,
      transport: /car|bus|train|plane|metro|subway|taxi|uber|lyft|bike|bicycle|motorcycle|boat|ship|ferry/i,
      entertainment: /concert|show|movie|theater|cinema|stage|performance|festival|club|bar|pub|restaurant|cafe|coffee shop/i
    };
    
    // Time of day patterns (expanded)
    const timePatterns = {
      morning: /morning|dawn|sunrise|breakfast|early|start|awake|fresh|new day|first thing|early hours/i,
      afternoon: /afternoon|noon|lunch|midday|middle of the day|daytime|day|sun|sunny|bright/i,
      evening: /evening|sunset|dusk|dinner|nightfall|twilight|late afternoon|early evening|after work|after school/i,
      night: /night|midnight|late|nighttime|dark|moon|stars|late night|evening|nightfall|after dark|bedtime/i
    };
    
    // Energy level patterns
    const energyPatterns = {
      low: /relax|chill|calm|peaceful|quiet|serene|tranquil|gentle|soft|soothing|peace|low energy|slow|easy/i,
      medium: /moderate|balanced|steady|consistent|regular|normal|average|middle|medium|moderate energy/i,
      high: /energetic|active|dynamic|intense|powerful|strong|vigorous|high energy|fast|quick|rapid|brisk/i
    };
    
    // Social context patterns
    const socialPatterns = {
      alone: /alone|by myself|solo|myself|individual|personal|private|solitude|quiet time|me time|self/i,
      with_friends: /friends|buddies|mates|pals|companions|with friends|group of friends|friend group|social circle/i,
      with_family: /family|relatives|parents|siblings|brothers|sisters|cousins|with family|family time|family gathering/i,
      in_crowd: /crowd|people|public|audience|spectators|onlookers|bystanders|strangers|others|everyone|everybody/i
    };
    
    // Instrumental preference patterns
    const instrumentalPatterns = {
      instrumental: /instrumental|no vocals|without lyrics|background|ambient|atmospheric|soundtrack|score|music only|just music/i,
      with_lyrics: /with lyrics|with vocals|with singing|with words|with voice|with voices|with singers|with vocalists/i
    };
    
    // Check for activity
    for (const [activity, pattern] of Object.entries(activityPatterns)) {
      if (pattern.test(text)) {
        scenario.activity = activity;
        break;
      }
    }
    
    // Check for setting
    for (const [setting, pattern] of Object.entries(settingPatterns)) {
      if (pattern.test(text)) {
        scenario.setting = setting;
        break;
      }
    }
    
    // Check for time of day
    for (const [time, pattern] of Object.entries(timePatterns)) {
      if (pattern.test(text)) {
        scenario.timeOfDay = time;
        break;
      }
    }
    
    // Check for energy level
    for (const [energy, pattern] of Object.entries(energyPatterns)) {
      if (pattern.test(text)) {
        scenario.energyLevel = energy as 'low' | 'medium' | 'high';
        break;
      }
    }
    
    // Check for social context
    for (const [social, pattern] of Object.entries(socialPatterns)) {
      if (pattern.test(text)) {
        scenario.socialContext = social as 'alone' | 'with_friends' | 'with_family' | 'in_crowd';
        break;
      }
    }
    
    // Check for instrumental preference
    for (const [preference, pattern] of Object.entries(instrumentalPatterns)) {
      if (pattern.test(text)) {
        scenario.instrumentalPreference = preference === 'instrumental';
        break;
      }
    }
    
    return scenario;
  }

  private determineMood(text: string): MoodAnalysis {
    // Enhanced mood detection with more sophisticated analysis
    const moodKeywords: { [key: string]: string[] } = {
      'happy': ['happy', 'joy', 'excited', 'cheerful', 'upbeat', 'fun', 'positive', 'uplifting', 'smile', 'laugh', 'bright', 'sunny', 'vibrant'],
      'sad': ['sad', 'depressed', 'down', 'melancholy', 'blue', 'heartbroken', 'emotional', 'tears', 'crying', 'lonely', 'empty', 'dark', 'gloomy'],
      'energetic': ['energetic', 'pumped', 'excited', 'energized', 'powerful', 'motivated', 'focused', 'productive', 'workout', 'exercise', 'dynamic', 'intense', 'powerful', 'strong'],
      'calm': ['calm', 'peaceful', 'relaxed', 'serene', 'tranquil', 'meditation', 'mindful', 'quiet', 'gentle', 'soft', 'soothing', 'peace'],
      'angry': ['angry', 'frustrated', 'mad', 'upset', 'annoyed', 'aggressive', 'furious', 'rage', 'hate', 'angst', 'intense', 'violent'],
      'romantic': ['romantic', 'love', 'passionate', 'intimate', 'romance', 'date', 'valentine', 'heart', 'kiss', 'beautiful', 'sweet', 'tender'],
      'nostalgic': ['nostalgic', 'memories', 'remember', 'past', 'old', 'retro', 'vintage', 'throwback', 'yesterday', 'childhood', 'memory', 'classic'],
      'peaceful': ['peaceful', 'quiet', 'serene', 'tranquil', 'calm', 'gentle', 'soft', 'still', 'silent', 'quiet', 'hush', 'tranquility'],
      'focused': ['focused', 'concentrated', 'study', 'work', 'productive', 'brainstorming', 'coding', 'writing', 'reading', 'attention', 'mindful', 'alert', 'sharp'],
      'party': ['party', 'dance', 'club', 'celebration', 'festival', 'fun', 'upbeat', 'wild', 'crazy', 'loud', 'energetic', 'vibrant', 'lively'],
      'chill': ['chill', 'relaxed', 'laid-back', 'easy', 'casual', 'lofi', 'background', 'mellow', 'smooth', 'cool', 'relaxing', 'easy-going'],
      'inspirational': ['inspirational', 'motivational', 'inspiring', 'uplifting', 'encouraging', 'positive', 'empowering', 'encouraging', 'motivating', 'inspiring', 'powerful'],
      'cinematic': ['cinematic', 'movie', 'film', 'dramatic', 'epic', 'grand', 'orchestral', 'soundtrack', 'scene', 'story', 'narrative', 'visual'],
      'urban': ['urban', 'city', 'street', 'downtown', 'metropolitan', 'nightlife', 'night', 'cityscape', 'urban', 'metropolis', 'downtown'],
      'nature': ['nature', 'outdoor', 'forest', 'mountain', 'ocean', 'beach', 'wilderness', 'natural', 'organic', 'earth', 'green', 'wild'],
      'dreamy': ['dreamy', 'ethereal', 'float', 'cloud', 'dream', 'surreal', 'otherworldly', 'magical', 'mystical', 'fantasy', 'imaginative'],
      'introspective': ['introspective', 'reflective', 'thoughtful', 'contemplative', 'meditative', 'deep', 'philosophical', 'thinking', 'self-aware', 'conscious', 'mindful']
    };

    // Theme keywords for additional context
    const themeKeywords: { [key: string]: string[] } = {
      'night': ['night', 'evening', 'dark', 'moon', 'stars', 'midnight', 'late', 'nighttime', 'dusk', 'twilight'],
      'morning': ['morning', 'dawn', 'sunrise', 'early', 'breakfast', 'start', 'awake', 'fresh', 'new day'],
      'summer': ['summer', 'sun', 'heat', 'warm', 'beach', 'vacation', 'holiday', 'sunny', 'hot', 'outdoor'],
      'winter': ['winter', 'cold', 'snow', 'frost', 'ice', 'chilly', 'freezing', 'cozy', 'fireplace', 'warm'],
      'rain': ['rain', 'rainy', 'wet', 'storm', 'thunder', 'lightning', 'drizzle', 'downpour', 'umbrella', 'puddle'],
      'travel': ['travel', 'journey', 'adventure', 'explore', 'discover', 'road', 'trip', 'voyage', 'wander', 'roam'],
      'workout': ['workout', 'exercise', 'gym', 'fitness', 'training', 'sport', 'athletic', 'active', 'strength', 'endurance'],
      'study': ['study', 'learning', 'education', 'academic', 'school', 'university', 'college', 'knowledge', 'research', 'intellectual'],
      'meditation': ['meditation', 'mindfulness', 'zen', 'yoga', 'breath', 'calm', 'peace', 'tranquility', 'serenity', 'balance'],
      'party': ['party', 'celebration', 'festival', 'dance', 'club', 'social', 'gathering', 'event', 'fun', 'lively']
    };

    const words = text.toLowerCase().split(/\s+/);
    const moodScores: { [key: string]: number } = {};
    const themeScores: { [key: string]: number } = {};
    const extractedKeywords: string[] = [];
    const extractedThemes: string[] = [];

    // First pass: check for exact matches and calculate scores
    for (const [mood, keywords] of Object.entries(moodKeywords)) {
      let score = 0;
      for (const keyword of keywords) {
        if (words.includes(keyword)) {
          score += 2; // Exact match gets higher score
          extractedKeywords.push(keyword);
        } else {
          // Check for partial matches
          for (const word of words) {
            if (word.includes(keyword) || keyword.includes(word)) {
              score += 1; // Partial match gets lower score
              if (!extractedKeywords.includes(keyword)) {
                extractedKeywords.push(keyword);
              }
            }
          }
        }
      }
      if (score > 0) {
        moodScores[mood] = score;
      }
    }

    // Check for themes
    for (const [theme, keywords] of Object.entries(themeKeywords)) {
      let score = 0;
      for (const keyword of keywords) {
        if (words.includes(keyword)) {
          score += 2;
          extractedThemes.push(keyword);
        } else {
          for (const word of words) {
            if (word.includes(keyword) || keyword.includes(word)) {
              score += 1;
              if (!extractedThemes.includes(keyword)) {
                extractedThemes.push(keyword);
              }
            }
          }
        }
      }
      if (score > 0) {
        themeScores[theme] = score;
      }
    }

    // Find primary mood (highest score)
    let primaryMood = 'neutral';
    let maxScore = 0;
    for (const [mood, score] of Object.entries(moodScores)) {
      if (score > maxScore) {
        maxScore = score;
        primaryMood = mood;
      }
    }

    // Find secondary moods (other moods with significant scores)
    const secondaryMoods = Object.entries(moodScores)
      .filter(([mood, score]) => mood !== primaryMood && score > 0)
      .sort((a, b) => b[1] - a[1])
      .map(([mood]) => mood)
      .slice(0, 3); // Limit to top 3 secondary moods

    // Context-based mood detection for specific activities
    if (text.toLowerCase().includes('study') || text.toLowerCase().includes('work') || 
        text.toLowerCase().includes('focus') || text.toLowerCase().includes('concentrate') ||
        text.toLowerCase().includes('brainstorming') || text.toLowerCase().includes('coding')) {
      if (primaryMood === 'neutral' || moodScores[primaryMood] < 3) {
        primaryMood = 'focused';
        if (!secondaryMoods.includes('focused')) {
          secondaryMoods.unshift('focused');
          if (secondaryMoods.length > 3) secondaryMoods.pop();
        }
      }
    } else if (text.toLowerCase().includes('party') || text.toLowerCase().includes('dance') || 
               text.toLowerCase().includes('celebration') || text.toLowerCase().includes('festival')) {
      if (primaryMood === 'neutral' || moodScores[primaryMood] < 3) {
        primaryMood = 'party';
        if (!secondaryMoods.includes('party')) {
          secondaryMoods.unshift('party');
          if (secondaryMoods.length > 3) secondaryMoods.pop();
        }
      }
    } else if (text.toLowerCase().includes('chill') || text.toLowerCase().includes('relax') || 
               text.toLowerCase().includes('background') || text.toLowerCase().includes('lofi')) {
      if (primaryMood === 'neutral' || moodScores[primaryMood] < 3) {
        primaryMood = 'chill';
        if (!secondaryMoods.includes('chill')) {
          secondaryMoods.unshift('chill');
          if (secondaryMoods.length > 3) secondaryMoods.pop();
        }
      }
    } else if (text.toLowerCase().includes('inspire') || text.toLowerCase().includes('motivate') || 
               text.toLowerCase().includes('encourage')) {
      if (primaryMood === 'neutral' || moodScores[primaryMood] < 3) {
        primaryMood = 'inspirational';
        if (!secondaryMoods.includes('inspirational')) {
          secondaryMoods.unshift('inspirational');
          if (secondaryMoods.length > 3) secondaryMoods.pop();
        }
      }
    }

    // Special case for cinematic descriptions
    if (text.toLowerCase().includes('cinematic') || text.toLowerCase().includes('movie') || 
        text.toLowerCase().includes('film') || text.toLowerCase().includes('soundtrack') ||
        text.toLowerCase().includes('scene') || text.toLowerCase().includes('main character')) {
      if (primaryMood === 'neutral' || moodScores[primaryMood] < 3) {
        primaryMood = 'cinematic';
        if (!secondaryMoods.includes('cinematic')) {
          secondaryMoods.unshift('cinematic');
          if (secondaryMoods.length > 3) secondaryMoods.pop();
        }
      }
    }

    // Calculate confidence based on score strength
    const confidence = Math.min(0.5 + (maxScore / 10), 1.0);
    
    // Determine input type and analyze scenario if needed
    const inputType = this.determineInputType(text);
    const scenario = inputType === 'scenario' || inputType === 'mixed' ? this.analyzeScenario(text) : undefined;

    return {
      primaryMood,
      secondaryMoods,
      keywords: extractedKeywords,
      themes: extractedThemes,
      confidence,
      inputType,
      scenario
    };
  }

  private generateAIExplanation(
    primaryMood: string,
    keywords: string[],
    themes: string[],
    context: Context,
    inputType: 'mood' | 'scenario' | 'mixed',
    scenario?: MoodAnalysis['scenario']
  ): string {
    const { activity, timeOfDay, setting } = context;
    
    // Base explanation templates
    const templates: { [key: string]: string } = {
      focused: "These tracks are carefully selected to enhance your concentration and productivity. They feature steady rhythms and minimal distractions to help you maintain focus.",
      party: "Get ready to dance! These high-energy tracks are perfect for creating an energetic atmosphere and getting everyone moving.",
      chill: "These laid-back tunes create a relaxed atmosphere perfect for unwinding and taking it easy.",
      happy: "Bright and uplifting melodies to boost your mood and spread positivity.",
      sad: "Emotional and introspective tracks that resonate with your current feelings.",
      energetic: "Powerful and dynamic tracks to boost your energy levels and motivation.",
      relaxed: "Smooth and calming compositions to help you unwind and find peace.",
      inspirational: "Uplifting and motivational tracks to spark creativity and drive.",
      introspective: "Thoughtful and deep tracks that encourage self-reflection.",
      nostalgic: "Songs that evoke memories and create a sense of longing for the past.",
      romantic: "Sweet and intimate tracks perfect for romantic moments.",
      cinematic: "Epic and dramatic compositions that create a movie-like atmosphere.",
      urban: "Modern and contemporary tracks that capture the energy of city life.",
      nature: "Organic and natural sounds that connect you with the outdoors.",
      dreamy: "Ethereal and atmospheric tracks that transport you to another world.",
      angry: "Intense and powerful tracks to channel your emotions.",
      peaceful: "Serene and tranquil compositions to find inner peace.",
      neutral: "Balanced and versatile tracks suitable for various situations."
    };
    
    let explanation = templates[primaryMood.toLowerCase()] || "These tracks are selected based on your current mood and preferences.";
    
    // Add context-specific details
    if (activity) {
      explanation += ` Perfect for ${activity}${timeOfDay ? ` during the ${timeOfDay}` : ''}${setting ? ` in a ${setting} environment` : ''}.`;
    }
    
    // Add keyword-specific details if available
    if (keywords.length > 0) {
      const relevantKeywords = keywords.slice(0, 3).join(', ');
      explanation += ` The selection emphasizes ${relevantKeywords} elements.`;
    }
    
    // Add theme-specific details if available
    if (themes.length > 0) {
      const relevantThemes = themes.slice(0, 2).join(' and ');
      explanation += ` The music reflects ${relevantThemes} themes.`;
    }
    
    // Add scenario-specific details if available
    if (inputType === 'scenario' && scenario) {
      if (scenario.activity) {
        explanation = `Based on your ${scenario.activity} activity${scenario.setting ? ` in a ${scenario.setting} setting` : ''}, `;
        
        if (scenario.activity === 'studying') {
          explanation += "we've selected tracks with minimal distractions and steady rhythms to help you maintain focus.";
        } else if (scenario.activity === 'exercising') {
          explanation += "we've chosen high-energy tracks with strong beats to keep you motivated during your workout.";
        } else if (scenario.activity === 'relaxing') {
          explanation += "we've picked calming tracks with smooth melodies to help you unwind and relax.";
        } else if (scenario.activity === 'partying') {
          explanation += "we've selected upbeat tracks with danceable rhythms to create an energetic atmosphere.";
        } else if (scenario.activity === 'commuting') {
          explanation += "we've chosen tracks that make your journey more enjoyable and less stressful.";
        } else if (scenario.activity === 'socializing') {
          explanation += "we've selected tracks that create a positive and engaging atmosphere for social interaction.";
        } else if (scenario.activity === 'working') {
          explanation += "we've chosen tracks that enhance productivity while maintaining focus.";
        } else if (scenario.activity === 'creative') {
          explanation += "we've selected tracks that inspire creativity and artistic expression.";
        } else {
          explanation += "we've chosen tracks that complement your activity and enhance the experience.";
        }
      } else if (scenario.setting) {
        explanation = `For your ${scenario.setting} setting${scenario.timeOfDay ? ` during the ${scenario.timeOfDay}` : ''}, `;
        
        if (scenario.setting === 'nature') {
          explanation += "we've selected tracks with organic sounds and peaceful melodies that connect with the natural environment.";
        } else if (scenario.setting === 'urban') {
          explanation += "we've chosen tracks that capture the energy and rhythm of city life.";
        } else if (scenario.setting === 'home') {
          explanation += "we've selected tracks that create a comfortable and relaxing atmosphere for your home environment.";
        } else if (scenario.setting === 'office') {
          explanation += "we've chosen tracks that enhance focus and productivity in a work environment.";
        } else if (scenario.setting === 'transport') {
          explanation += "we've selected tracks that make your journey more enjoyable and less stressful.";
        } else if (scenario.setting === 'entertainment') {
          explanation += "we've chosen tracks that enhance the entertainment experience and create the right atmosphere.";
        } else {
          explanation += "we've selected tracks that complement your setting and enhance the experience.";
        }
      }
      
      // Add energy level details if available
      if (scenario.energyLevel) {
        if (scenario.energyLevel === 'low') {
          explanation += " The tracks have a relaxed pace and gentle dynamics to match your low-energy environment.";
        } else if (scenario.energyLevel === 'medium') {
          explanation += " The tracks have a balanced energy level that's neither too intense nor too relaxed.";
        } else if (scenario.energyLevel === 'high') {
          explanation += " The tracks have high energy and strong dynamics to match your energetic environment.";
        }
      }
      
      // Add social context details if available
      if (scenario.socialContext) {
        if (scenario.socialContext === 'alone') {
          explanation += " These tracks are perfect for personal reflection and solo activities.";
        } else if (scenario.socialContext === 'with_friends') {
          explanation += " These tracks create a fun and engaging atmosphere for hanging out with friends.";
        } else if (scenario.socialContext === 'with_family') {
          explanation += " These tracks are suitable for family gatherings and create a warm, welcoming atmosphere.";
        } else if (scenario.socialContext === 'in_crowd') {
          explanation += " These tracks are designed to stand out in a busy environment and create a shared experience.";
        }
      }
      
      // Add instrumental preference details if available
      if (scenario.instrumentalPreference !== undefined) {
        if (scenario.instrumentalPreference) {
          explanation += " The selection includes instrumental tracks to minimize distractions.";
        } else {
          explanation += " The selection includes tracks with vocals to provide lyrical content and engagement.";
        }
      }
    }
    
    return explanation;
  }

  private getMusicalQualities(mood: string): string[] {
    const qualities: { [key: string]: string[] } = {
      focused: [
        "Steady tempo and rhythm",
        "Minimal vocal distractions",
        "Clear instrumental focus",
        "Consistent energy level"
      ],
      party: [
        "High energy beats",
        "Strong dance rhythms",
        "Upbeat melodies",
        "Dynamic bass lines"
      ],
      chill: [
        "Smooth melodies",
        "Relaxed tempo",
        "Ambient textures",
        "Gentle harmonies"
      ],
      happy: [
        "Bright major chords",
        "Upbeat rhythms",
        "Cheerful melodies",
        "Positive lyrics"
      ],
      sad: [
        "Minor key progressions",
        "Emotional melodies",
        "Introspective lyrics",
        "Subtle dynamics"
      ],
      energetic: [
        "Fast tempo",
        "Powerful rhythms",
        "Strong dynamics",
        "Driving bass"
      ],
      relaxed: [
        "Slow to medium tempo",
        "Smooth transitions",
        "Peaceful melodies",
        "Soft dynamics"
      ],
      inspirational: [
        "Building arrangements",
        "Uplifting progressions",
        "Motivational lyrics",
        "Dynamic crescendos"
      ],
      introspective: [
        "Complex harmonies",
        "Thoughtful lyrics",
        "Layered textures",
        "Subtle nuances"
      ],
      nostalgic: [
        "Retro elements",
        "Familiar melodies",
        "Vintage sounds",
        "Classic arrangements"
      ],
      romantic: [
        "Intimate melodies",
        "Soft dynamics",
        "Emotional lyrics",
        "Warm harmonies"
      ],
      cinematic: [
        "Epic arrangements",
        "Dramatic dynamics",
        "Orchestral elements",
        "Thematic development"
      ],
      urban: [
        "Modern production",
        "Contemporary beats",
        "City-inspired sounds",
        "Urban rhythms"
      ],
      nature: [
        "Organic sounds",
        "Natural textures",
        "Environmental elements",
        "Peaceful melodies"
      ],
      dreamy: [
        "Atmospheric textures",
        "Ethereal sounds",
        "Floating melodies",
        "Ambient layers"
      ],
      angry: [
        "Heavy dynamics",
        "Aggressive rhythms",
        "Intense energy",
        "Powerful sounds"
      ],
      peaceful: [
        "Gentle melodies",
        "Soft dynamics",
        "Calming harmonies",
        "Tranquil atmosphere"
      ],
      neutral: [
        "Balanced arrangements",
        "Moderate tempo",
        "Versatile style",
        "Adaptable mood"
      ]
    };
    
    return qualities[mood.toLowerCase()] || [
      "Balanced musical elements",
      "Versatile style",
      "Adaptable mood"
    ];
  }

  private getCacheKey(text: string): string {
    // Create a more specific cache key based on the input text
    const normalizedText = text.toLowerCase().trim();
    const words = normalizedText.split(/\s+/).sort().join(' ');
    return `recommendations:${words}`;
  }

  private async getFallbackRecommendations(moodAnalysis: MoodAnalysis): Promise<SpotifyTrack[]> {
    console.log('Getting fallback recommendations for mood:', moodAnalysis.primaryMood);
    
    // Try different fallback strategies in order of specificity
    const strategies = [
      // 1. Try genre-based search with mood
      async () => {
        const genreQuery = this.getGenreQueryForMood(moodAnalysis.primaryMood);
        return await this.searchTracks(genreQuery);
      },
      // 2. Try artist-based search with mood
      async () => {
        const artistQuery = this.getArtistQueryForMood(moodAnalysis.primaryMood);
        return await this.searchTracks(artistQuery);
      },
      // 3. Try popular songs search with mood
      async () => {
        const popularQuery = this.getPopularSongsQueryForMood(moodAnalysis.primaryMood);
        return await this.searchTracks(popularQuery);
      },
      // 4. Try scenario-based search if available
      async () => {
        if (moodAnalysis.scenario) {
          const scenarioQuery = this.getScenarioQuery(moodAnalysis.scenario);
          return await this.searchTracks(scenarioQuery);
        }
        return [];
      }
    ];

    // Try each strategy until we get results
    for (const strategy of strategies) {
      try {
        const results = await strategy();
        if (results.length > 0) {
          console.log('Fallback strategy succeeded with', results.length, 'results');
          return results;
        }
      } catch (error) {
        console.warn('Fallback strategy failed:', error);
        continue;
      }
    }

    // If all strategies fail, throw an error
    throw new Error('Unable to find suitable recommendations. Please try a different description or be more specific about your preferences.');
  }

  private getScenarioQuery(scenario: MoodAnalysis['scenario']): string {
    if (!scenario) {
      return 'year:2000-2024';
    }

    const queryParts: string[] = [];

    // Add activity-based query
    if (scenario.activity) {
      queryParts.push(scenario.activity);
    }

    // Add setting-based query
    if (scenario.setting) {
      queryParts.push(scenario.setting);
    }

    // Add time of day
    if (scenario.timeOfDay) {
      queryParts.push(scenario.timeOfDay);
    }

    // Add energy level
    if (scenario.energyLevel) {
      queryParts.push(scenario.energyLevel);
    }

    // Add social context
    if (scenario.socialContext) {
      queryParts.push(scenario.socialContext);
    }

    // Add year range for recent results
    queryParts.push('year:2000-2024');

    return queryParts.join(' ');
  }

  async getRecommendationsFromText(text: string): Promise<SpotifyRecommendation[]> {
    try {
      // Check cache with the new cache key
      const cacheKey = this.getCacheKey(text);
    const cachedResult = this.recommendationCache.get(cacheKey);
      
      // Only use cache if it's fresh and the input is similar enough
    if (cachedResult && Date.now() - cachedResult.timestamp < this.CACHE_EXPIRY_MS) {
      console.log('Returning cached recommendations for:', text);
      return cachedResult.recommendations;
    }

      // Perform deep semantic analysis of the input text
      const semanticAnalysis = this.performSemanticAnalysis(text);
      console.log('Semantic analysis:', semanticAnalysis);
      
      // Analyze the mood from the text with enhanced context awareness
      const moodAnalysis = this.determineMood(text);
      console.log('Mood analysis:', moodAnalysis);
      
      // Generate AI explanation with more context
      const explanation = this.generateAIExplanation(
        moodAnalysis.primaryMood, 
        moodAnalysis.keywords, 
        moodAnalysis.themes, 
        this.extractContext(text),
        moodAnalysis.inputType,
        moodAnalysis.scenario
      );
      moodAnalysis.explanation = explanation;
      console.log('Generated explanation:', explanation);

      // Get musical qualities based on the mood
      const musicalQualities = this.getMusicalQualities(moodAnalysis.primaryMood);
      moodAnalysis.musicalQualities = musicalQualities;
      
      // Build a comprehensive search query based on the analysis
      let searchQuery = '';
      let searchResults: SpotifyTrack[] = [];
      
      // Create a more sophisticated search strategy based on input type
      if (moodAnalysis.inputType === 'mood') {
        // For mood-based inputs, use a combination of mood keywords and musical qualities
        const moodKeywords = [
          moodAnalysis.primaryMood,
          ...moodAnalysis.secondaryMoods,
          ...moodAnalysis.keywords,
          ...musicalQualities
        ].filter((value, index, self) => self.indexOf(value) === index); // Remove duplicates
        
        // Create a more specific query with genre hints
        const genreHints = this.getGenreHintsForMood(moodAnalysis.primaryMood);
        searchQuery = `${genreHints.join(' ')} ${moodKeywords.slice(0, 5).join(' ')}`;
      } else if (moodAnalysis.inputType === 'scenario' && moodAnalysis.scenario) {
        // For scenario-based inputs, use a combination of scenario details and mood
        const scenarioKeywords: string[] = [];
        
        if (moodAnalysis.scenario.activity) {
          scenarioKeywords.push(moodAnalysis.scenario.activity);
        }
        
        if (moodAnalysis.scenario.setting) {
          scenarioKeywords.push(moodAnalysis.scenario.setting);
        }
        
        if (moodAnalysis.scenario.timeOfDay) {
          scenarioKeywords.push(moodAnalysis.scenario.timeOfDay);
        }
        
        // Add mood and musical qualities
        scenarioKeywords.push(
          moodAnalysis.primaryMood,
          ...moodAnalysis.secondaryMoods,
          ...musicalQualities
        );
        
        // Add genre hints based on the scenario
        const genreHints = this.getGenreHintsForScenario(moodAnalysis.scenario);
        searchQuery = `${genreHints.join(' ')} ${scenarioKeywords.join(' ')}`;
      } else {
        // For mixed inputs, combine all relevant information
        const allKeywords = [
          ...moodAnalysis.keywords,
          moodAnalysis.primaryMood,
          ...moodAnalysis.secondaryMoods,
          ...moodAnalysis.themes,
          ...musicalQualities
        ].filter((value, index, self) => self.indexOf(value) === index);
        
        // Add genre hints based on the primary mood
        const genreHints = this.getGenreHintsForMood(moodAnalysis.primaryMood);
        searchQuery = `${genreHints.join(' ')} ${allKeywords.slice(0, 5).join(' ')}`;
      }
      
      // Try the optimized search query
      console.log('Searching with optimized query:', searchQuery);
      searchResults = await this.searchTracks(searchQuery);
      
      // If no results, try a more focused search with just the primary elements
      if (searchResults.length === 0) {
        console.log('Optimized search failed, trying focused search');
        const focusedQuery = [
          moodAnalysis.primaryMood,
          moodAnalysis.scenario?.activity,
          moodAnalysis.scenario?.setting
        ].filter(Boolean).join(' ');
        
        searchResults = await this.searchTracks(focusedQuery);
      }
      
      // If still no results, try a different approach with genre-based search
      if (searchResults.length === 0) {
        console.log('Focused search failed, trying genre-based search');
        const genreQuery = this.getGenreQueryForMood(moodAnalysis.primaryMood);
        searchResults = await this.searchTracks(genreQuery);
      }
      
      // If we still have no results, try a different approach with artist-based search
      if (searchResults.length === 0) {
        console.log('Genre-based search failed, trying artist-based search');
        const artistQuery = this.getArtistQueryForMood(moodAnalysis.primaryMood);
        searchResults = await this.searchTracks(artistQuery);
      }
      
      // If we still have no results, try a different approach with popular songs search
      if (searchResults.length === 0) {
        console.log('Artist-based search failed, trying popular songs search');
        const popularQuery = this.getPopularSongsQueryForMood(moodAnalysis.primaryMood);
        searchResults = await this.searchTracks(popularQuery);
      }
      
      // If we still have no results, try the fallback strategy
      if (searchResults.length === 0) {
        console.log('Initial search failed, trying fallback strategy');
        searchResults = await this.getFallbackRecommendations(moodAnalysis);
      }
      
      // Transform the results to recommendations
        console.log(`Found ${searchResults.length} tracks, transforming to recommendations`);
        const recommendations = await this.transformToRecommendations(searchResults, moodAnalysis);
        
        // Cache the results
        this.recommendationCache.set(cacheKey, {
          timestamp: Date.now(),
          recommendations
        });
        
        return recommendations;
    } catch (error) {
      console.error('Error in getRecommendationsFromText:', error);
      throw error;
    }
  }

  // Helper method to perform semantic analysis on the input text
  private performSemanticAnalysis(text: string): any {
    // Extract key concepts and entities from the text
    const words = text.toLowerCase().split(/\s+/);
    
    // Identify key concepts
    const concepts = this.extractKeyConcepts(text);
    
    // Identify entities (people, places, things)
    const entities = this.extractEntities(text);
    
    // Identify temporal context
    const temporalContext = this.extractTemporalContext(text);
    
    // Identify spatial context
    const spatialContext = this.extractSpatialContext(text);
    
    // Identify emotional context
    const emotionalContext = this.extractEmotionalContext(text);
    
    // Identify activity context
    const activityContext = this.extractActivityContext(text);
    
    // Identify social context
    const socialContext = this.extractSocialContext(text);
    
    // Identify musical preferences
    const musicalPreferences = this.extractMusicalPreferences(text);
    
    return {
      concepts,
      entities,
      temporalContext,
      spatialContext,
      emotionalContext,
      activityContext,
      socialContext,
      musicalPreferences
    };
  }

  // Helper method to extract key concepts from text
  private extractKeyConcepts(text: string): string[] {
    const concepts: string[] = [];
    
    // Define concept patterns
    const conceptPatterns = {
      relaxation: /relax|chill|calm|peace|tranquil|serene|quiet|gentle|soothing|peaceful/i,
      energy: /energy|power|strength|force|drive|motivation|powerful|strong|dynamic|intense/i,
      creativity: /creative|art|design|imagine|inspire|innovative|original|unique|artistic|creative/i,
      focus: /focus|concentrate|attention|mindful|alert|sharp|clear|precise|exact|accurate/i,
      celebration: /celebrate|party|festival|celebration|holiday|special|occasion|event|gathering/i,
      reflection: /reflect|think|contemplate|meditate|ponder|consider|thoughtful|introspective|mindful/i,
      adventure: /adventure|explore|discover|journey|travel|voyage|wander|roam|trek|expedition/i,
      romance: /romance|love|passion|intimate|romantic|date|valentine|heart|kiss|beautiful/i,
      nostalgia: /nostalgia|memory|remember|past|old|retro|vintage|throwback|yesterday|childhood/i,
      nature: /nature|outdoor|forest|mountain|ocean|beach|wilderness|natural|organic|earth/i
    };
    
    // Check for concept matches
    for (const [concept, pattern] of Object.entries(conceptPatterns)) {
      if (pattern.test(text)) {
        concepts.push(concept);
      }
    }
    
    return concepts;
  }

  // Helper method to extract entities from text
  private extractEntities(text: string): string[] {
    const entities: string[] = [];
    
    // Define entity patterns
    const entityPatterns = {
      people: /friend|family|person|people|someone|somebody|everyone|everybody|group|crowd/i,
      places: /home|house|room|apartment|office|work|school|university|college|library|park|beach|mountain|city|street/i,
      things: /book|music|song|track|album|playlist|instrument|guitar|piano|drums|bass|voice|sound|noise/i,
      activities: /study|work|exercise|run|gym|fitness|training|sport|athletic|active|strength|endurance|jog|swim|bike|yoga|meditate/i
    };
    
    // Check for entity matches
    for (const [entity, pattern] of Object.entries(entityPatterns)) {
      if (pattern.test(text)) {
        entities.push(entity);
      }
    }
    
    return entities;
  }

  // Helper method to extract temporal context from text
  private extractTemporalContext(text: string): string[] {
    const temporalContext: string[] = [];
    
    // Define temporal patterns
    const temporalPatterns = {
      morning: /morning|dawn|sunrise|breakfast|early|start|awake|fresh|new day|first thing|early hours/i,
      afternoon: /afternoon|noon|lunch|midday|middle of the day|daytime|day|sun|sunny|bright/i,
      evening: /evening|sunset|dusk|dinner|nightfall|twilight|late afternoon|early evening|after work|after school/i,
      night: /night|midnight|late|nighttime|dark|moon|stars|late night|evening|nightfall|after dark|bedtime/i,
      season: /spring|summer|fall|autumn|winter|season|year|month|week|day|hour|minute|second/i
    };
    
    // Check for temporal matches
    for (const [temporal, pattern] of Object.entries(temporalPatterns)) {
      if (pattern.test(text)) {
        temporalContext.push(temporal);
      }
    }
    
    return temporalContext;
  }

  // Helper method to extract spatial context from text
  private extractSpatialContext(text: string): string[] {
    const spatialContext: string[] = [];
    
    // Define spatial patterns
    const spatialPatterns = {
      indoor: /indoor|inside|interior|room|house|apartment|building|office|school|university|college|library|cafe|restaurant|bar|club|gym|studio/i,
      outdoor: /outdoor|outside|exterior|park|beach|mountain|forest|garden|yard|field|street|road|highway|path|trail|wilderness|nature/i,
      urban: /urban|city|town|village|downtown|uptown|suburb|neighborhood|district|metropolitan|metropolis|street|road|highway|path|trail/i,
      rural: /rural|country|countryside|farm|ranch|village|town|wilderness|nature|forest|mountain|ocean|lake|river|stream/i
    };
    
    // Check for spatial matches
    for (const [spatial, pattern] of Object.entries(spatialPatterns)) {
      if (pattern.test(text)) {
        spatialContext.push(spatial);
      }
    }
    
    return spatialContext;
  }

  // Helper method to extract emotional context from text
  private extractEmotionalContext(text: string): string[] {
    const emotionalContext: string[] = [];
    
    // Define emotional patterns
    const emotionalPatterns = {
      happy: /happy|joy|excited|cheerful|upbeat|fun|positive|uplifting|smile|laugh|bright|sunny|vibrant/i,
      sad: /sad|depressed|down|melancholy|blue|heartbroken|emotional|tears|crying|lonely|empty|dark|gloomy/i,
      angry: /angry|frustrated|mad|upset|annoyed|aggressive|furious|rage|hate|angst|intense|violent/i,
      calm: /calm|peaceful|relaxed|serene|tranquil|meditation|mindful|quiet|gentle|soft|soothing|peace/i,
      anxious: /anxious|nervous|worried|concerned|uneasy|uncomfortable|tense|stressed|overwhelmed|panicked|fear|afraid/i,
      confident: /confident|assured|certain|sure|positive|optimistic|hopeful|encouraged|empowered|strong|powerful/i
    };
    
    // Check for emotional matches
    for (const [emotional, pattern] of Object.entries(emotionalPatterns)) {
      if (pattern.test(text)) {
        emotionalContext.push(emotional);
      }
    }
    
    return emotionalContext;
  }

  // Helper method to extract activity context from text
  private extractActivityContext(text: string): string[] {
    const activityContext: string[] = [];
    
    // Define activity patterns
    const activityPatterns = {
      studying: /study|learn|read|work|focus|brainstorm|hackathon|research|academic|school|university|college|knowledge|intellectual/i,
      exercising: /workout|exercise|run|gym|fitness|training|sport|athletic|active|strength|endurance|jog|swim|bike|yoga|meditate/i,
      relaxing: /relax|chill|rest|meditate|yoga|unwind|decompress|calm|peace|tranquility|serenity|balance|zen/i,
      partying: /party|dance|club|celebration|festival|fun|upbeat|wild|crazy|loud|energetic|vibrant|lively|social|gathering|event/i,
      commuting: /commute|travel|drive|walk|journey|road|trip|voyage|wander|roam|transport|transit|bus|train|plane|metro/i,
      socializing: /hang|meet|social|friends|party|family|group|together|with|company|conversation|chat|talk/i,
      working: /work|job|office|desk|computer|laptop|meeting|project|task|deadline|professional|business|career/i,
      creative: /create|art|paint|draw|design|write|compose|music|song|poem|story|novel|blog|content|creative/i
    };
    
    // Check for activity matches
    for (const [activity, pattern] of Object.entries(activityPatterns)) {
      if (pattern.test(text)) {
        activityContext.push(activity);
      }
    }
    
    return activityContext;
  }

  // Helper method to extract social context from text
  private extractSocialContext(text: string): string[] {
    const socialContext: string[] = [];
    
    // Define social patterns
    const socialPatterns = {
      alone: /alone|by myself|solo|myself|individual|personal|private|solitude|quiet time|me time|self/i,
      with_friends: /friends|buddies|mates|pals|companions|with friends|group of friends|friend group|social circle/i,
      with_family: /family|relatives|parents|siblings|brothers|sisters|cousins|with family|family time|family gathering/i,
      in_crowd: /crowd|people|public|audience|spectators|onlookers|bystanders|strangers|others|everyone|everybody/i
    };
    
    // Check for social matches
    for (const [social, pattern] of Object.entries(socialPatterns)) {
      if (pattern.test(text)) {
        socialContext.push(social);
      }
    }
    
    return socialContext;
  }

  // Helper method to extract musical preferences from text
  private extractMusicalPreferences(text: string): string[] {
    const musicalPreferences: string[] = [];
    
    // Define musical preference patterns
    const musicalPreferencePatterns = {
      instrumental: /instrumental|no vocals|without lyrics|background|ambient|atmospheric|soundtrack|score|music only|just music/i,
      with_lyrics: /with lyrics|with vocals|with singing|with words|with voice|with voices|with singers|with vocalists/i,
      specific_genre: /rock|pop|jazz|classical|electronic|hip hop|r&b|soul|folk|country|metal|punk|indie|alternative|ambient|chill|lofi|dance|edm|house|techno|trance|dubstep|reggae|reggaeton|salsa|merengue|bachata|cumbia|tango|waltz|ballad|ballroom|swing|blues|gospel|spiritual|religious|christian|worship|praise|hymn|carol|caroling|carols|christmas|holiday|seasonal|summer|winter|spring|fall|autumn/i,
      specific_artist: /by|from|artist|band|group|singer|songwriter|composer|producer|dj|rapper|vocalist|musician|performer|act|ensemble|orchestra|choir|quartet|trio|duo|solo/i,
      specific_era: /classic|vintage|retro|old|new|modern|contemporary|current|recent|latest|upcoming|future|past|decade|century|millennium|generation|era|period|time|year|month|day/i
    };
    
    // Check for musical preference matches
    for (const [preference, pattern] of Object.entries(musicalPreferencePatterns)) {
      if (pattern.test(text)) {
        musicalPreferences.push(preference);
      }
    }
    
    return musicalPreferences;
  }

  // Helper method to get a popular songs query for a mood
  private getPopularSongsQueryForMood(mood: string): string {
    // Map moods to popular songs that are associated with that mood
    const moodSongMap: { [key: string]: string[] } = {
      'happy': ['Happy', 'Walking on Sunshine', 'I Gotta Feeling', 'Good Life', 'Can\'t Stop the Feeling'],
      'sad': ['Someone Like You', 'All of Me', 'Stay With Me', 'Say Something', 'The Sound of Silence'],
      'energetic': ['Eye of the Tiger', 'Stronger', 'Can\'t Hold Us', 'Power', 'Fighter'],
      'calm': ['Weightless', 'Claire de Lune', 'River Flows in You', 'Comptine d\'un autre été', 'Gymnopédie No.1'],
      'angry': ['Break Stuff', 'Given Up', 'Bodies', 'Killing in the Name', 'Bleed It Out'],
      'romantic': ['All of Me', 'Perfect', 'Just the Way You Are', 'Marry You', 'A Thousand Years'],
      'nostalgic': ['Sweet Home Alabama', 'Don\'t Stop Believin\'', 'Sweet Child O\' Mine', 'Bohemian Rhapsody', 'Hotel California'],
      'peaceful': ['Weightless', 'Claire de Lune', 'River Flows in You', 'Comptine d\'un autre été', 'Gymnopédie No.1'],
      'focused': ['Weightless', 'Claire de Lune', 'River Flows in You', 'Comptine d\'un autre été', 'Gymnopédie No.1'],
      'party': ['Uptown Funk', 'Can\'t Stop the Feeling', 'I Gotta Feeling', 'Get Lucky', 'Shake It Off'],
      'chill': ['Weightless', 'Claire de Lune', 'River Flows in You', 'Comptine d\'un autre été', 'Gymnopédie No.1'],
      'inspirational': ['Stronger', 'Fighter', 'Roar', 'Brave', 'Unwritten'],
      'cinematic': ['Time', 'Pirates of the Caribbean', 'Star Wars', 'Lord of the Rings', 'Inception'],
      'urban': ['Empire State of Mind', 'New York', 'City of Stars', 'Welcome to New York', 'Downtown'],
      'nature': ['Weightless', 'Claire de Lune', 'River Flows in You', 'Comptine d\'un autre été', 'Gymnopédie No.1'],
      'dreamy': ['Weightless', 'Claire de Lune', 'River Flows in You', 'Comptine d\'un autre été', 'Gymnopédie No.1'],
      'introspective': ['The Sound of Silence', 'Hurt', 'Mad World', 'Creep', 'Boulevard of Broken Dreams'],
      'neutral': ['Shape of You', 'Blinding Lights', 'Stay', 'As It Was', 'About Damn Time']
    };
    
    const songs = moodSongMap[mood.toLowerCase()] || ['Shape of You', 'Blinding Lights', 'Stay', 'As It Was', 'About Damn Time'];
    const randomSong = songs[Math.floor(Math.random() * songs.length)];
    
    return `track:${randomSong} year:2000-2024`;
  }

  private async transformToRecommendations(
    tracks: SpotifyTrack[],
    moodAnalysis: MoodAnalysis
  ): Promise<SpotifyRecommendation[]> {
    try {
      // Get seed tracks for recommendations
      const seedTracks = tracks.slice(0, 5).map(track => track.id);
      
      // Get recommendations from Spotify
      const recommendations = await this.getRecommendations(seedTracks, moodAnalysis.primaryMood);
      
      // Transform the recommendations
      return recommendations.map(track => ({
        id: track.id,
        title: track.name,
        artist: track.artist,
        album: track.album,
        albumArt: track.images[0]?.url || '',
        imageUrl: track.images[0]?.url || '',
        previewUrl: track.preview_url,
        spotifyUrl: track.external_url,
        mood: moodAnalysis.primaryMood,
        description: this.generateSpecificDescription(track, moodAnalysis),
        genres: [moodAnalysis.primaryMood],
        tempo: 120, // Default tempo
        genre: 'Various',
        moodAnalysis: moodAnalysis
      }));
    } catch (error) {
      console.error('Error transforming recommendations:', error);
      // If recommendations fail, return the search results directly
      return tracks.map(track => ({
        id: track.id,
        title: track.name,
        artist: track.artist,
        album: track.album,
        albumArt: track.images[0]?.url || '',
        imageUrl: track.images[0]?.url || '',
        previewUrl: track.preview_url,
        spotifyUrl: track.external_url,
        mood: moodAnalysis.primaryMood,
        description: this.generateSpecificDescription(track, moodAnalysis),
        genres: [moodAnalysis.primaryMood],
        tempo: 120,
        genre: 'Various',
        moodAnalysis: moodAnalysis
      }));
    }
  }

  /**
   * Gets the current track
   */
  public async getCurrentTrack(): Promise<SpotifyTrack | null> {
    try {
      // In a real implementation, this would call the Spotify API
      // For now, we'll return null
      return null;
    } catch (error) {
      console.error("Error getting current track:", error);
      return null;
    }
  }
  
  public async pausePlayback(): Promise<void> {
    try {
      const token = await this.getAccessToken();
      
      await axios.put('https://api.spotify.com/v1/me/player/pause', null, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
    } catch (error) {
      console.error('Error pausing playback:', error);
      throw error;
    }
  }
  
  public async resumePlayback(): Promise<void> {
    try {
      const token = await this.getAccessToken();
      
      await axios.put('https://api.spotify.com/v1/me/player/play', null, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
    } catch (error) {
      console.error('Error resuming playback:', error);
      throw error;
    }
  }
  
  public async skipToNextTrack(): Promise<void> {
    try {
      const token = await this.getAccessToken();
      
      await axios.post('https://api.spotify.com/v1/me/player/next', null, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
    } catch (error) {
      console.error('Error skipping to next track:', error);
      throw error;
    }
  }
  
  public async skipToPreviousTrack(): Promise<void> {
    try {
      const token = await this.getAccessToken();
      
      await axios.post('https://api.spotify.com/v1/me/player/previous', null, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
    } catch (error) {
      console.error('Error skipping to previous track:', error);
      throw error;
    }
  }

  private extractContext(input: string): Context {
    const context: Context = {};
    
    // Time of day patterns
    const timePatterns = {
      morning: /morning|dawn|sunrise|breakfast/i,
      afternoon: /afternoon|noon|lunch/i,
      evening: /evening|sunset|dusk/i,
      night: /night|midnight|late/i
    };
    
    // Activity patterns
    const activityPatterns = {
      studying: /study|learn|read|work|focus|brainstorm|hackathon/i,
      exercising: /workout|exercise|run|gym|fitness/i,
      relaxing: /relax|chill|rest|meditate|yoga/i,
      partying: /party|dance|celebration|festival/i,
      commuting: /commute|travel|drive|walk|journey/i,
      socializing: /hang|meet|social|friends|party/i
    };
    
    // Setting patterns
    const settingPatterns = {
      nature: /nature|outdoors|park|forest|beach|mountain/i,
      urban: /city|street|downtown|urban|building/i,
      home: /home|house|room|apartment|bedroom/i,
      office: /office|work|desk|studio/i,
      transport: /car|bus|train|plane|metro/i
    };
    
    // Check for time of day
    for (const [time, pattern] of Object.entries(timePatterns)) {
      if (pattern.test(input)) {
        context.timeOfDay = time;
        break;
      }
    }
    
    // Check for activity
    for (const [activity, pattern] of Object.entries(activityPatterns)) {
      if (pattern.test(input)) {
        context.activity = activity;
        break;
      }
    }
    
    // Check for setting
    for (const [setting, pattern] of Object.entries(settingPatterns)) {
      if (pattern.test(input)) {
        context.setting = setting;
        break;
      }
    }
    
    return context;
  }

  private generateSpecificDescription(track: SpotifyTrack, moodAnalysis: MoodAnalysis): string {
    // Use mood analysis information to generate description
    const { primaryMood, secondaryMoods, keywords } = moodAnalysis;
    
    // Create a more natural, Spotify-like description
    let description = '';
    
    // Start with a personalized introduction
    if (keywords.length > 0) {
      description = `Based on your ${keywords.slice(0, 2).join(' and ')} vibe, `;
    } else {
      description = `Based on your ${primaryMood} mood, `;
    }
    
    // Add track information
    description += `"${track.name}" by ${track.artist} `;
    
    // Add mood information
    description += `is a ${primaryMood} track`;
    
    // Add secondary moods if available
    if (secondaryMoods.length > 0) {
      description += ` with ${secondaryMoods.slice(0, 2).join(' and ')} elements`;
    }
    
    // Add a contextual recommendation
    if (primaryMood === 'focused' || primaryMood === 'calm') {
      description += `. Perfect for studying or working.`;
    } else if (primaryMood === 'energetic' || primaryMood === 'party') {
      description += `. Great for workouts or parties.`;
    } else if (primaryMood === 'chill' || primaryMood === 'peaceful') {
      description += `. Ideal for relaxing or unwinding.`;
    } else if (primaryMood === 'inspirational') {
      description += `. Perfect for motivation and creativity.`;
    } else if (primaryMood === 'cinematic') {
      description += `. Great for creating a dramatic atmosphere.`;
    } else if (primaryMood === 'urban') {
      description += `. Perfect for city vibes and nightlife.`;
    } else if (primaryMood === 'nature') {
      description += `. Ideal for outdoor activities and nature.`;
    } else if (primaryMood === 'dreamy') {
      description += `. Perfect for daydreaming and relaxation.`;
    } else if (primaryMood === 'introspective') {
      description += `. Great for reflection and mindfulness.`;
    } else {
      description += `. Perfect for your current vibe.`;
    }
    
    return description;
  }

  public async createPlaylist(name: string, description: string): Promise<string> {
    try {
      const token = await this.getAccessToken();
      
      // First get the user's ID
      const userResponse = await axios.get('https://api.spotify.com/v1/me', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      if (!userResponse.data || !userResponse.data.id) {
        console.error('Failed to get user ID:', userResponse);
        throw new Error('Could not get user ID from Spotify');
      }

      const userId = userResponse.data.id;
      console.log('Creating playlist for user:', userId);
      
      // Create the playlist
      const response = await axios.post(
        `https://api.spotify.com/v1/users/${userId}/playlists`,
        {
          name,
          description,
          public: false
        },
        {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        }
      );
      
      if (!response.data || !response.data.id) {
        console.error('Invalid playlist creation response:', response);
        throw new Error('Invalid response from Spotify when creating playlist');
      }

      console.log('Successfully created playlist:', response.data.id);
      return response.data.id;
    } catch (error) {
      console.error('Error creating playlist:', error);
      if (axios.isAxiosError(error)) {
        if (error.response?.status === 401 || error.response?.status === 403) {
          // Clear token and force new login
          localStorage.removeItem('spotify_access_token');
          this.accessToken = null;
          this.initiateLogin();
          throw new Error('Your session has expired or you need additional permissions. Please log in again.');
        }
      }
      throw new Error('Failed to create playlist. Please try logging in again.');
    }
  }

  public async addTracksToPlaylist(playlistId: string, trackUris: string[]): Promise<void> {
    try {
      const token = await this.getAccessToken();
      
      await axios.post(
        `https://api.spotify.com/v1/playlists/${playlistId}/tracks`,
        {
          uris: trackUris
        },
        {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        }
      );
    } catch (error) {
      console.error('Error adding tracks to playlist:', error);
      throw new Error('Failed to add tracks to playlist');
    }
  }

  public async createPlaylistFromRecommendations(recommendations: SpotifyRecommendation[]): Promise<string> {
    try {
      // Create a new playlist
      const playlistId = await this.createPlaylist(
        'Vibify Smart Radio Playlist',
        'Playlist created by Vibify Smart Radio based on your preferences'
      );
      
      // Get track URIs from recommendations
      const trackUris = recommendations.map(rec => {
        // Extract track ID from spotifyUrl
        const trackId = rec.spotifyUrl.split('/').pop();
        return `spotify:track:${trackId}`;
      });
      
      // Add tracks to the playlist
      await this.addTracksToPlaylist(playlistId, trackUris);
      
      return playlistId;
    } catch (error) {
      console.error('Error creating playlist from recommendations:', error);
      throw new Error('Failed to create playlist from recommendations');
    }
  }

  // Helper method to get genre hints for a mood
  private getGenreHintsForMood(mood: string): string[] {
    const moodGenreMap: { [key: string]: string[] } = {
      'happy': ['pop', 'dance', 'disco', 'funk', 'soul', 'r-n-b'],
      'sad': ['acoustic', 'piano', 'folk', 'indie', 'alternative'],
      'energetic': ['rock', 'metal', 'punk', 'electronic', 'dance'],
      'calm': ['ambient', 'classical', 'jazz', 'chill', 'meditation'],
      'angry': ['metal', 'rock', 'punk', 'grunge', 'industrial'],
      'romantic': ['r-n-b', 'soul', 'jazz', 'pop', 'indie'],
      'nostalgic': ['classic', 'rock', 'pop', 'folk', 'jazz'],
      'peaceful': ['ambient', 'classical', 'meditation', 'chill', 'jazz'],
      'focused': ['ambient', 'classical', 'electronic', 'chill', 'lofi', 'instrumental'],
      'party': ['dance', 'pop', 'electronic', 'hip-hop', 'house', 'edm'],
      'chill': ['lofi', 'chill', 'ambient', 'jazz', 'indie'],
      'inspirational': ['pop', 'rock', 'indie', 'electronic', 'ambient'],
      'cinematic': ['classical', 'ambient', 'electronic', 'orchestral', 'soundtrack'],
      'urban': ['hip-hop', 'r-n-b', 'soul', 'electronic', 'pop'],
      'nature': ['ambient', 'folk', 'acoustic', 'world', 'new-age'],
      'dreamy': ['ambient', 'electronic', 'chill', 'indie', 'dream-pop'],
      'introspective': ['ambient', 'acoustic', 'piano', 'indie', 'folk'],
      'neutral': ['pop', 'rock', 'indie', 'electronic', 'alternative']
    };
    
    return moodGenreMap[mood.toLowerCase()] || ['pop', 'rock', 'indie', 'electronic'];
  }

  // Helper method to get genre hints for a scenario
  private getGenreHintsForScenario(scenario: MoodAnalysis['scenario']): string[] {
    if (!scenario) return [];
    
    const scenarioGenreMap: { [key: string]: string[] } = {
      'studying': ['classical', 'jazz', 'ambient', 'lofi', 'instrumental'],
      'exercising': ['rock', 'hip hop', 'electronic', 'edm', 'workout'],
      'relaxing': ['ambient', 'classical', 'jazz', 'chill', 'meditation'],
      'partying': ['pop', 'dance', 'electronic', 'house', 'edm'],
      'commuting': ['rock', 'pop', 'indie', 'alternative', 'road trip'],
      'socializing': ['pop', 'indie', 'folk', 'acoustic', 'social'],
      'working': ['ambient', 'classical', 'jazz', 'lofi', 'focus'],
      'creative': ['ambient', 'electronic', 'indie', 'experimental', 'creative']
    };
    
    if (scenario.activity && scenarioGenreMap[scenario.activity]) {
      return scenarioGenreMap[scenario.activity];
    }
    
    return [];
  }

  // Helper method to get a genre-based query for a mood
  private getGenreQueryForMood(mood: string): string {
    const genreHints = this.getGenreHintsForMood(mood);
    const primaryGenre = genreHints[0];
    
    // Create a query that focuses on the genre and includes some mood keywords
    return `genre:${primaryGenre} ${mood} year:2000-2024`;
  }

  // Helper method to get an artist-based query for a mood
  private getArtistQueryForMood(mood: string): string {
    // Map moods to well-known artists that are associated with that mood
    const moodArtistMap: { [key: string]: string[] } = {
      'happy': ['Pharrell Williams', 'Bruno Mars', 'Daft Punk', 'The Beatles'],
      'sad': ['Adele', 'Ed Sheeran', 'Bon Iver', 'The Smiths'],
      'energetic': ['AC/DC', 'Linkin Park', 'The Prodigy', 'Daft Punk'],
      'calm': ['Brian Eno', 'Ludovico Einaudi', 'Max Richter', 'Nils Frahm'],
      'angry': ['Rage Against the Machine', 'System of a Down', 'Nine Inch Nails'],
      'romantic': ['John Legend', 'Adele', 'Ed Sheeran', 'Sam Smith'],
      'nostalgic': ['The Beatles', 'Queen', 'David Bowie', 'Fleetwood Mac'],
      'peaceful': ['Brian Eno', 'Ludovico Einaudi', 'Max Richter', 'Nils Frahm'],
      'focused': ['Brian Eno', 'Ludovico Einaudi', 'Max Richter', 'Nils Frahm'],
      'party': ['Daft Punk', 'Calvin Harris', 'David Guetta', 'The Weeknd'],
      'chill': ['Tycho', 'Bonobo', 'Nujabes', 'Zero 7'],
      'inspirational': ['Coldplay', 'U2', 'Imagine Dragons', 'OneRepublic'],
      'cinematic': ['Hans Zimmer', 'John Williams', 'Danny Elfman', 'Howard Shore'],
      'urban': ['Drake', 'The Weeknd', 'Kendrick Lamar', 'Childish Gambino'],
      'nature': ['Brian Eno', 'Ludovico Einaudi', 'Max Richter', 'Nils Frahm'],
      'dreamy': ['Tycho', 'Bonobo', 'Nujabes', 'Zero 7'],
      'introspective': ['Bon Iver', 'Radiohead', 'Sigur Rós', 'Explosions in the Sky'],
      'neutral': ['Coldplay', 'The Killers', 'Imagine Dragons', 'OneRepublic']
    };
    
    const artists = moodArtistMap[mood.toLowerCase()] || ['Coldplay', 'The Killers', 'Imagine Dragons'];
    const randomArtist = artists[Math.floor(Math.random() * artists.length)];
    
    return `artist:${randomArtist} year:2000-2024`;
  }

  /**
   * Gets song recommendations based on an image
   */
  public async getRecommendationsFromImage(imageData: string): Promise<SpotifyRecommendation[]> {
    try {
      // Analyze the image using AI
      const analysis = await this.analyzeImageWithAI(imageData);
      
      // Check if the confidence is too low
      if (analysis.confidence < 0.2) {
        throw new Error("Could not analyze the image with sufficient confidence. Please try a different image.");
      }
      
      // Build a search query based on the image analysis
      const searchQuery = this.buildColorBasedSearchQuery(analysis);
      
      // Get recommendations based on the search query
      const recommendations = await this.getRecommendations(searchQuery);
      
      // Limit to exactly 3 recommendations
      const limitedRecommendations = recommendations.slice(0, 3);
      
      // Enhance recommendations with context from the image analysis
      return limitedRecommendations.map(rec => ({
        ...rec,
        colors: analysis.colors,
        aesthetic: analysis.aesthetic,
        description: `A ${analysis.aesthetic} song that matches the ${analysis.mood} mood and ${analysis.colors.join(", ")} colors of your image.`
      }));
    } catch (error) {
      console.error("Error getting recommendations from image:", error);
      throw error;
    }
  }
  
  /**
   * Builds a search query based on color and aesthetic analysis
   */
  private buildColorBasedSearchQuery(analysis: {
    mood: string;
    colors: string[];
    aesthetic: string;
    visualFeatures: VisualFeatures;
  }): string {
    const { mood, colors, aesthetic, visualFeatures } = analysis;
    
    // Build the query parts
    const queryParts = [
      mood,
      aesthetic,
      ...colors
    ];
    
    // Add visual feature-based terms
    if (visualFeatures.brightness > 0.7) {
      queryParts.push("bright", "luminous");
    } else if (visualFeatures.brightness < 0.3) {
      queryParts.push("dark", "moody");
    }
    
    if (visualFeatures.contrast > 0.7) {
      queryParts.push("bold", "dramatic");
    } else if (visualFeatures.contrast < 0.3) {
      queryParts.push("subtle", "soft");
    }
    
    if (visualFeatures.saturation > 0.6) {
      queryParts.push("vibrant", "colorful");
    } else if (visualFeatures.saturation < 0.4) {
      queryParts.push("muted", "desaturated");
    }
    
    if (visualFeatures.warmth > 0.6) {
      queryParts.push("warm", "sunny");
    } else if (visualFeatures.warmth < 0.4) {
      queryParts.push("cool", "calm");
    }
    
    // Join the query parts
    return queryParts.join(" ");
  }
  
  /**
   * Maps a mood to a genre
   */
  private mapMoodToGenre(mood: string): string {
    const moodToGenreMap: Record<string, string> = {
      "peaceful": "ambient",
      "energetic": "rock",
      "dreamy": "dream pop",
      "happy": "pop",
      "melancholic": "indie",
      "nostalgic": "retro",
      "inspiring": "uplifting",
      "romantic": "r&b",
      "mysterious": "electronic",
      "playful": "pop"
    };
    
    return moodToGenreMap[mood] || "pop";
  }

  /**
   * Analyzes an image using AI/ML techniques to extract visual content
   * @param imageData Base64 encoded image data
   * @returns Promise with image analysis results
   */
  private async analyzeImageWithAI(imageData: string): Promise<{
    description: string;
    mood: string;
    colors: string[];
    aesthetic: string;
    confidence: number;
    visualFeatures: {
      brightness: number;
      contrast: number;
      saturation: number;
      warmth: number;
    };
  }> {
    // In a real implementation, this would call a computer vision API
    // For example: Google Cloud Vision API, Azure Computer Vision, or AWS Rekognition
    
    // Simulate API call delay
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    // Generate a unique hash from the image data to ensure different results for different images
    const imageHash = this.hashString(imageData);
    
    // Use the hash to seed our random number generator
    const seed = this.hashToNumber(imageHash);
    const rng = this.seededRandom(seed);
    
    // Analyze visual features based on the image data
    const visualFeatures = this.analyzeVisualFeatures(imageData, rng);
    
    // Determine image quality and adjust confidence accordingly
    const imageQuality = this.assessImageQuality(visualFeatures);
    const baseConfidence = 0.7 + (rng() * 0.3); // Random confidence between 0.7 and 1.0
    const confidence = Math.max(0.3, baseConfidence - (1 - imageQuality) * 0.5);
    
    // Define possible values for each attribute
    const moods = ["peaceful", "energetic", "dreamy", "happy", "melancholic", "nostalgic", "inspiring", "romantic", "mysterious", "playful"];
    const colorPalettes = [
      ["green", "blue", "golden", "white"],
      ["neon", "dark", "bright", "colorful"],
      ["blue", "purple", "swirling", "ethereal"],
      ["warm", "natural", "skin tones", "soft"],
      ["vibrant", "sunny", "tropical", "bright"],
      ["muted", "pastel", "soft", "gentle"],
      ["dark", "moody", "dramatic", "rich"],
      ["autumn", "warm", "earthy", "cozy"],
      ["winter", "cool", "crisp", "clear"],
      ["spring", "fresh", "light", "renewing"]
    ];
    const aesthetics = [
      "natural beauty",
      "urban vibrancy",
      "abstract expressionism",
      "natural portraiture",
      "coastal serenity",
      "garden tranquility",
      "mountain majesty",
      "city elegance",
      "artistic expression",
      "street authenticity",
      "renaissance classicism",
      "impressionist softness",
      "minimalist simplicity",
      "baroque richness",
      "romantic idealism"
    ];
    
    // Adjust selections based on visual features
    const moodIndex = this.selectMoodBasedOnVisualFeatures(visualFeatures, moods, rng);
    const paletteIndex = this.selectColorPaletteBasedOnVisualFeatures(visualFeatures, colorPalettes, rng);
    const aestheticIndex = this.selectAestheticBasedOnVisualFeatures(visualFeatures, aesthetics, rng);
    
    // Generate a unique description based on the selected attributes
    const description = this.generateColorBasedDescription(
      moods[moodIndex],
      colorPalettes[paletteIndex],
      aesthetics[aestheticIndex],
      visualFeatures
    );
    
    return {
      description,
      mood: moods[moodIndex],
      colors: colorPalettes[paletteIndex],
      aesthetic: aesthetics[aestheticIndex],
      confidence,
      visualFeatures
    };
  }
  
  /**
   * Generates a CLIP-inspired semantic embedding for an image
   * In a real implementation, this would use a vision-language model
   */
  private generateSemanticEmbedding(
    mood: string,
    colors: string[],
    objects: string[],
    scenes: string[],
    emotions: string[],
    aesthetic: string,
    knownImageInfo?: {
      title: string;
      artist?: string;
      tags: string[];
      culturalContext?: string;
    }
  ): string[] {
    // Combine all attributes into a semantic embedding
    const embedding = [
      mood,
      ...colors,
      ...objects,
      ...scenes,
      ...emotions,
      aesthetic
    ];
    
    // Add known image information if available
    if (knownImageInfo) {
      embedding.push(knownImageInfo.title);
      if (knownImageInfo.artist) {
        embedding.push(knownImageInfo.artist);
      }
      embedding.push(...knownImageInfo.tags);
    }
    
    // Add cultural and artistic terms based on the aesthetic
    const culturalTerms = this.getCulturalTermsForAesthetic(aesthetic);
    embedding.push(...culturalTerms);
    
    // Add musical terms based on the mood and emotions
    const musicalTerms = this.getMusicalTermsForMood(mood, emotions);
    embedding.push(...musicalTerms);
    
    // Remove duplicates and return
    return [...new Set(embedding)];
  }
  
  /**
   * Gets cultural and artistic terms for an aesthetic
   */
  private getCulturalTermsForAesthetic(aesthetic: string): string[] {
    const aestheticToTerms: Record<string, string[]> = {
      "natural beauty": ["organic", "harmony", "balance", "serenity", "tranquility", "peaceful", "calm", "gentle", "soft", "flowing"],
      "urban vibrancy": ["energy", "rhythm", "pulse", "movement", "dynamic", "vibrant", "lively", "busy", "active", "fast-paced"],
      "abstract expressionism": ["emotional", "expressive", "intense", "powerful", "dramatic", "bold", "spontaneous", "raw", "authentic", "passionate"],
      "natural portraiture": ["human", "personal", "intimate", "emotional", "expressive", "authentic", "genuine", "sincere", "direct", "honest"],
      "coastal serenity": ["peaceful", "tranquil", "calm", "serene", "relaxing", "refreshing", "soothing", "gentle", "flowing", "rhythmic"],
      "garden tranquility": ["peaceful", "serene", "tranquil", "calm", "gentle", "delicate", "fragile", "beautiful", "harmonious", "balanced"],
      "mountain majesty": ["powerful", "grand", "majestic", "impressive", "awe-inspiring", "dramatic", "bold", "strong", "stable", "enduring"],
      "city elegance": ["sophisticated", "refined", "elegant", "graceful", "polished", "precise", "controlled", "balanced", "harmonious", "cohesive"],
      "artistic expression": ["creative", "expressive", "imaginative", "innovative", "original", "unique", "personal", "authentic", "genuine", "sincere"],
      "street authenticity": ["raw", "authentic", "genuine", "real", "honest", "direct", "unfiltered", "unpolished", "natural", "spontaneous"]
    };
    
    return aestheticToTerms[aesthetic] || [];
  }
  
  /**
   * Gets musical terms for a mood and emotions
   */
  private getMusicalTermsForMood(mood: string, emotions: string[]): string[] {
    const moodToTerms: Record<string, string[]> = {
      "peaceful": ["ambient", "atmospheric", "ethereal", "floating", "gentle", "meditative", "minimal", "quiet", "serene", "tranquil"],
      "energetic": ["upbeat", "fast", "dynamic", "powerful", "strong", "vibrant", "lively", "active", "intense", "driving"],
      "dreamy": ["atmospheric", "ethereal", "floating", "hypnotic", "mesmerizing", "otherworldly", "spacey", "surreal", "textural", "washed-out"],
      "happy": ["cheerful", "upbeat", "bright", "sunny", "positive", "uplifting", "joyful", "light", "playful", "fun"],
      "melancholic": ["sad", "emotional", "introspective", "reflective", "thoughtful", "deep", "meaningful", "poignant", "touching", "moving"],
      "nostalgic": ["retro", "vintage", "classic", "timeless", "familiar", "warm", "comforting", "sentimental", "emotional", "reflective"],
      "inspiring": ["uplifting", "motivational", "encouraging", "empowering", "positive", "optimistic", "hopeful", "bright", "energetic", "dynamic"],
      "romantic": ["emotional", "passionate", "intimate", "tender", "sweet", "gentle", "warm", "soft", "delicate", "beautiful"],
      "mysterious": ["dark", "moody", "atmospheric", "enigmatic", "intriguing", "suspenseful", "dramatic", "intense", "powerful", "captivating"],
      "playful": ["fun", "light", "cheerful", "upbeat", "playful", "energetic", "lively", "dynamic", "bright", "sunny"]
    };
    
    // Get terms for the primary mood
    const primaryTerms = moodToTerms[mood] || [];
    
    // Get terms for the emotions
    const emotionTerms = emotions.flatMap(emotion => {
      // Find the closest mood for this emotion
      const closestMood = Object.keys(moodToTerms).find(m => 
        moodToTerms[m].some(term => term.includes(emotion.toLowerCase()))
      );
      
      return closestMood ? moodToTerms[closestMood] : [];
    });
    
    // Combine and remove duplicates
    return [...new Set([...primaryTerms, ...emotionTerms])];
  }
  
  /**
   * Analyzes visual features of an image
   */
  private analyzeVisualFeatures(imageData: string): VisualFeatures {
    // In a real implementation, this would use computer vision to analyze the image
    // For now, we'll generate random values based on the image hash
    
    const imageHash = this.hashString(imageData);
    const seed = this.hashToNumber(imageHash);
    const rng = this.seededRandom(seed);
    
    return {
      brightness: rng(),
      contrast: rng(),
      saturation: rng(),
      warmth: rng()
    };
  }
  
  /**
   * Generates a color-based description
   */
  private generateColorBasedDescription(
    mood: string,
    colors: string[],
    aesthetic: string,
    visualFeatures: {
      brightness: number;
      contrast: number;
      saturation: number;
      warmth: number;
    }
  ): string {
    // Get visual feature descriptions
    const brightnessDesc = visualFeatures.brightness > 0.7 ? "bright" : visualFeatures.brightness < 0.3 ? "dark" : "moderate";
    const contrastDesc = visualFeatures.contrast > 0.7 ? "high contrast" : visualFeatures.contrast < 0.3 ? "low contrast" : "moderate contrast";
    const saturationDesc = visualFeatures.saturation > 0.7 ? "vibrant" : visualFeatures.saturation < 0.3 ? "muted" : "moderate";
    const warmthDesc = visualFeatures.warmth > 0.7 ? "warm" : visualFeatures.warmth < 0.3 ? "cool" : "neutral";
    
    // Create a description based on the colors and aesthetic
    return `A ${brightnessDesc}, ${contrastDesc}, ${saturationDesc}, and ${warmthDesc} image with ${colors.join(", ")} colors, evoking a ${mood} mood with a ${aesthetic} aesthetic.`;
  }
  
  /**
   * Assesses image quality based on visual features
   * @param visualFeatures Visual features of the image
   * @returns Quality score between 0 and 1
   */
  private assessImageQuality(visualFeatures: {
    brightness: number;
    contrast: number;
    saturation: number;
    sharpness: number;
  }): number {
    // Calculate quality score based on visual features
    const { brightness, contrast, saturation, sharpness } = visualFeatures;
    
    // Penalize extreme values
    const brightnessScore = 1 - Math.abs(brightness - 0.5) * 2;
    const contrastScore = 1 - Math.abs(contrast - 0.5) * 2;
    const saturationScore = 1 - Math.abs(saturation - 0.5) * 2;
    const sharpnessScore = sharpness;
    
    // Weight the scores (sharpness is most important for quality)
    return (brightnessScore * 0.2 + contrastScore * 0.2 + saturationScore * 0.1 + sharpnessScore * 0.5);
  }
  
  /**
   * Selects a mood based on visual features
   */
  private selectMoodBasedOnVisualFeatures(
    visualFeatures: { brightness: number; contrast: number; saturation: number; sharpness: number; },
    moods: string[],
    rng: () => number
  ): number {
    const { brightness, contrast, saturation } = visualFeatures;
    
    // Map visual features to mood indices
    if (brightness > 0.7 && saturation > 0.6) {
      // Bright and colorful images tend to be happy or energetic
      return Math.floor(rng() * 2) + 3; // Index 3 or 4 (happy or energetic)
    } else if (brightness < 0.3 && contrast > 0.6) {
      // Dark and high contrast images tend to be mysterious or melancholic
      return Math.floor(rng() * 2) + 7; // Index 7 or 8 (mysterious or melancholic)
    } else if (brightness > 0.5 && saturation < 0.4) {
      // Bright but desaturated images tend to be peaceful or dreamy
      return Math.floor(rng() * 2); // Index 0 or 2 (peaceful or dreamy)
    } else if (contrast < 0.4) {
      // Low contrast images tend to be dreamy or peaceful
      return Math.floor(rng() * 2); // Index 0 or 2 (peaceful or dreamy)
    } else {
      // Default to random selection
      return Math.floor(rng() * moods.length);
    }
  }
  
  /**
   * Selects a color palette based on visual features
   */
  private selectColorPaletteBasedOnVisualFeatures(
    visualFeatures: { brightness: number; contrast: number; saturation: number; sharpness: number; },
    colorPalettes: string[][],
    rng: () => number
  ): number {
    const { brightness, saturation } = visualFeatures;
    
    // Map visual features to color palette indices
    if (brightness > 0.7 && saturation > 0.6) {
      // Bright and colorful images
      return 4; // Index 4 (vibrant, sunny, tropical, bright)
    } else if (brightness < 0.3) {
      // Dark images
      return 1; // Index 1 (neon, dark, bright, colorful)
    } else if (saturation < 0.4) {
      // Desaturated images
      return 5; // Index 5 (muted, pastel, soft, gentle)
    } else {
      // Default to random selection
      return Math.floor(rng() * colorPalettes.length);
    }
  }
  
  /**
   * Selects objects based on visual features
   */
  private selectObjectsBasedOnVisualFeatures(
    visualFeatures: { brightness: number; contrast: number; saturation: number; sharpness: number; },
    objectSets: string[][],
    rng: () => number
  ): number {
    const { sharpness, contrast } = visualFeatures;
    
    // Map visual features to object indices
    if (sharpness < 0.3) {
      // Blurry images might be abstract or artistic
      return 2; // Index 2 (patterns, shapes, forms, textures, lines)
    } else if (contrast > 0.7) {
      // High contrast images might be urban or architectural
      return 7; // Index 7 (cityscape, architecture, bridges, parks, monuments)
    } else {
      // Default to random selection
      return Math.floor(rng() * objectSets.length);
    }
  }
  
  /**
   * Selects a scene based on visual features
   */
  private selectSceneBasedOnVisualFeatures(
    visualFeatures: { brightness: number; contrast: number; saturation: number; sharpness: number; },
    sceneTypes: string[][],
    rng: () => number
  ): number {
    const { brightness, saturation } = visualFeatures;
    
    // Map visual features to scene indices
    if (brightness > 0.7 && saturation > 0.6) {
      // Bright and colorful images might be outdoor scenes
      return 0; // Index 0 (landscape, outdoors, nature)
    } else if (brightness < 0.3) {
      // Dark images might be urban night scenes
      return 1; // Index 1 (city, nightlife, urban)
    } else if (saturation < 0.4) {
      // Desaturated images might be abstract
      return 2; // Index 2 (abstract, artistic, conceptual)
    } else {
      // Default to random selection
      return Math.floor(rng() * sceneTypes.length);
    }
  }
  
  /**
   * Selects emotions based on visual features
   */
  private selectEmotionsBasedOnVisualFeatures(
    visualFeatures: { brightness: number; contrast: number; saturation: number; sharpness: number; },
    emotionSets: string[][],
    rng: () => number
  ): number {
    const { brightness, saturation } = visualFeatures;
    
    // Map visual features to emotion indices
    if (brightness > 0.7 && saturation > 0.6) {
      // Bright and colorful images evoke positive emotions
      return 3; // Index 3 (joy, happiness, connection)
    } else if (brightness < 0.3) {
      // Dark images might evoke mysterious emotions
      return 6; // Index 6 (mysterious, intrigued, wonder)
    } else if (saturation < 0.4) {
      // Desaturated images might evoke calm emotions
      return 0; // Index 0 (calm, peaceful, inspired)
    } else {
      // Default to random selection
      return Math.floor(rng() * emotionSets.length);
    }
  }
  
  /**
   * Selects an aesthetic based on visual features
   */
  private selectAestheticBasedOnVisualFeatures(
    visualFeatures: { brightness: number; contrast: number; saturation: number; sharpness: number; },
    aesthetics: string[],
    rng: () => number
  ): number {
    const { brightness, saturation, sharpness } = visualFeatures;
    
    // Map visual features to aesthetic indices
    if (brightness > 0.7 && saturation > 0.6) {
      // Bright and colorful images
      return 0; // Index 0 (natural beauty)
    } else if (brightness < 0.3) {
      // Dark images
      return 1; // Index 1 (urban vibrancy)
    } else if (saturation < 0.4) {
      // Desaturated images
      return 2; // Index 2 (abstract expressionism)
    } else if (sharpness < 0.3) {
      // Blurry images
      return 2; // Index 2 (abstract expressionism)
    } else {
      // Default to random selection
      return Math.floor(rng() * aesthetics.length);
    }
  }
  
  /**
   * Creates a simple hash from a string
   */
  private hashString(str: string): string {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32-bit integer
    }
    return Math.abs(hash).toString(16);
  }
  
  /**
   * Converts a hash to a number between 0 and 1
   */
  private hashToNumber(hash: number): number {
    return Math.abs(hash) / 2147483647; // 2^31 - 1
  }
  
  /**
   * Creates a seeded random number generator
   */
  private seededRandom(seed: string): () => number {
    // Convert the seed string to a number
    const numericSeed = parseInt(seed, 16);
    
    // Create a simple seeded random number generator
    let state = numericSeed;
    return () => {
      state = (state * 16807) % 2147483647;
      return (state - 1) / 2147483646;
    };
  }
  
  /**
   * Gets a random time of day
   */
  private getRandomTimeOfDay(): string {
    const times = ["morning", "afternoon", "evening", "night", "dawn", "dusk", "midday", "sunset", "sunrise", "twilight"];
    return times[Math.floor(Math.random() * times.length)];
  }
  
  /**
   * Gets a random season
   */
  private getRandomSeason(): string {
    const seasons = ["spring", "summer", "autumn", "winter"];
    return seasons[Math.floor(Math.random() * seasons.length)];
  }

  /**
   * Converts a hash string to a number
   */
  private hashToNumber(hash: string): string {
    // In a real implementation, this would use a proper hash function
    // For now, we'll just use the first 8 characters of the hash
    return hash.substring(0, 8);
  }

  /**
   * Converts a Spotify track to a recommendation
   */
  private convertSpotifyTrackToRecommendation(track: SpotifyTrack): SpotifyRecommendation {
    return {
      id: track.id,
      title: track.title,
      artist: track.artist,
      album: track.album,
      albumArt: track.albumArt,
      imageUrl: track.imageUrl,
      previewUrl: track.previewUrl,
      spotifyUrl: track.spotifyUrl,
      description: `A song by ${track.artist} from the album ${track.album}`,
      mood: "unknown",
      genres: [],
      tempo: 120
    };
  }
} 