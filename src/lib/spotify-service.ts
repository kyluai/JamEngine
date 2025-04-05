import axios from 'axios';

export interface SpotifyTrack {
  id: string;
  name: string;
  artist: string;
  album: string;
  images: { url: string }[];
  preview_url: string | null;
  external_url: string;
}

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

export interface SpotifyRecommendation {
  title: string;
  artist: string;
  album: string;
  imageUrl: string;
  previewUrl: string | null;
  spotifyUrl: string;
  mood: string;
  description: string;
  tempo: number;
  genre: string;
  moodAnalysis?: MoodAnalysis;
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
  private recommendationCache: Map<string, { timestamp: number, recommendations: SpotifyRecommendation[] }> = new Map();
  private readonly CACHE_EXPIRY_MS = 30 * 60 * 1000; // 30 minutes

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

  public async searchTracks(query: string): Promise<SpotifyTrack[]> {
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
    // Extract key terms that would be most relevant for Spotify search
    const words = text.toLowerCase().split(/\s+/);
    
    // Remove common words that don't help with search
    const stopWords = ['the', 'a', 'an', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for', 'of', 'with', 'by'];
    const filteredWords = words.filter(word => !stopWords.includes(word) && word.length > 2);
    
    // Prioritize mood words and activity words
    const moodWords = ['happy', 'sad', 'energetic', 'calm', 'angry', 'romantic', 'nostalgic', 'peaceful', 
                       'focused', 'party', 'chill', 'inspirational', 'cinematic', 'urban', 'nature', 
                       'dreamy', 'introspective', 'relaxed', 'upbeat', 'melancholic', 'uplifting'];
    
    const activityWords = ['study', 'work', 'exercise', 'meditate', 'run', 'walk', 'drive', 'travel', 
                           'read', 'write', 'code', 'paint', 'draw', 'dance', 'sing', 'play'];
    
    // Sort words by priority (mood and activity words first)
    const sortedWords = [...filteredWords].sort((a, b) => {
      const aIsMood = moodWords.some(mood => a.includes(mood));
      const bIsMood = moodWords.some(mood => b.includes(mood));
      if (aIsMood && !bIsMood) return -1;
      if (!aIsMood && bIsMood) return 1;
      
      const aIsActivity = activityWords.some(activity => a.includes(activity));
      const bIsActivity = activityWords.some(activity => b.includes(activity));
      if (aIsActivity && !bIsActivity) return -1;
      if (!aIsActivity && bIsActivity) return 1;
      
      return 0;
    });
    
    // Take the top 5 most relevant words
    const relevantWords = sortedWords.slice(0, 5);
    
    // Join with spaces to create the search query
    return relevantWords.join(' ');
  }

  private async getRecommendations(seedTracks: string[], mood: string): Promise<SpotifyTrack[]> {
    try {
      const token = await this.getAccessToken();
      
      // Validate seed tracks
      if (!seedTracks || seedTracks.length === 0) {
        console.log('No seed tracks provided for recommendations');
        return [];
      }
      
      // Get audio features for the mood
      const energy = this.getEnergyFromMood(mood);
      const valence = this.getValenceFromMood(mood);
      const danceability = this.getDanceabilityFromMood(mood);
      
      // Get genres for the mood
      const genres = this.getGenresForMood(mood, ['pop', 'rock', 'electronic', 'dance']);
      
      // Create a query string with the seed tracks
      const seedTracksQuery = seedTracks.join(',');
      
      // Add some randomization to the parameters to get different results each time
      const randomEnergy = energy + (Math.random() * 0.2 - 0.1); // ±0.1 variation
      const randomValence = valence + (Math.random() * 0.2 - 0.1); // ±0.1 variation
      const randomDanceability = danceability + (Math.random() * 0.2 - 0.1); // ±0.1 variation
      
      // Use the recommendations endpoint
      const response = await axios.get('https://api.spotify.com/v1/recommendations', {
        headers: {
          'Authorization': `Bearer ${token}`
        },
        params: {
          seed_tracks: seedTracksQuery,
          limit: 20,
          market: 'US',
          target_energy: randomEnergy,
          target_valence: randomValence,
          target_danceability: randomDanceability,
          min_popularity: 20, // Include some less popular tracks for variety
          max_popularity: 100
        }
      });
      
      if (!response.data.tracks || response.data.tracks.length === 0) {
        console.log('No recommendations found for seed tracks:', seedTracks);
        return [];
      }
      
      console.log(`Found ${response.data.tracks.length} recommendations for seed tracks:`, seedTracks);
      
      // Transform the recommendations to our format
      return response.data.tracks.map((track: any) => ({
        id: track.id,
        name: track.name,
        artist: track.artists[0].name,
        album: track.album.name,
        images: track.album.images,
        preview_url: track.preview_url,
        external_url: track.external_urls.spotify
      }));
    } catch (error) {
      console.error('Error getting recommendations:', error);
      
      if (axios.isAxiosError(error)) {
        console.error('Spotify API error:', {
          status: error.response?.status,
          message: error.response?.data?.error?.message || error.message,
          details: error.response?.data
        });
        
        if (error.response?.status === 401) {
          this.initiateLogin();
          throw new Error('Your session has expired. Please log in again.');
        }
        
        if (error.response?.status === 404) {
          console.log('Recommendations not found, falling back to search');
          // If recommendations fail, try searching for tracks based on the mood
          return this.searchTracks(mood);
        }
      }
      
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

  async getRecommendationsFromText(text: string): Promise<SpotifyRecommendation[]> {
    // Check cache first
    const cacheKey = text.toLowerCase().trim();
    const cachedResult = this.recommendationCache.get(cacheKey);
    if (cachedResult && Date.now() - cachedResult.timestamp < this.CACHE_EXPIRY_MS) {
      console.log('Returning cached recommendations for:', text);
      return cachedResult.recommendations;
    }

    try {
      // Analyze the mood from the text
      const moodAnalysis = this.determineMood(text);
      console.log('Mood analysis:', moodAnalysis);
      
      // Generate AI explanation
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
      
      // Adjust search strategy based on input type
      let searchQuery = text;
      let searchResults: SpotifyTrack[] = [];
      
      if (moodAnalysis.inputType === 'mood') {
        // For mood-based inputs, prioritize emotional keywords
        console.log('Mood-based input detected, prioritizing emotional keywords');
        const moodKeywords = [...moodAnalysis.keywords, moodAnalysis.primaryMood, ...moodAnalysis.secondaryMoods];
        searchQuery = moodKeywords.slice(0, 3).join(' ');
      } else if (moodAnalysis.inputType === 'scenario' && moodAnalysis.scenario) {
        // For scenario-based inputs, prioritize activity and setting
        console.log('Scenario-based input detected, prioritizing activity and setting');
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
        
        // Add mood keywords as secondary priority
        scenarioKeywords.push(moodAnalysis.primaryMood);
        
        searchQuery = scenarioKeywords.join(' ');
      }
      
      // First, try to search with the optimized query
      console.log('Searching with optimized query:', searchQuery);
      searchResults = await this.searchTracks(searchQuery);
      
      // If no results, fall back to direct text search
      if (searchResults.length === 0) {
        console.log('Optimized search failed, trying with direct text');
        searchResults = await this.searchTracks(text);
      }
      
      // If still no results, try with just the primary mood
      if (searchResults.length === 0) {
        console.log('Direct search failed, trying with just the primary mood');
        searchResults = await this.searchTracks(moodAnalysis.primaryMood);
      }
      
      // If we have results, transform them to recommendations
      if (searchResults.length > 0) {
        console.log(`Found ${searchResults.length} tracks, transforming to recommendations`);
        const recommendations = await this.transformToRecommendations(searchResults, moodAnalysis);
        
        // Cache the results
        this.recommendationCache.set(cacheKey, {
          timestamp: Date.now(),
          recommendations
        });
        
        return recommendations;
      }
      
      // If we still have no results, throw an error
      throw new Error('No tracks found for your input. Please try a different description.');
    } catch (error) {
      console.error('Error in getRecommendationsFromText:', error);
      throw error;
    }
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
        title: track.name,
        artist: track.artist,
        album: track.album,
        imageUrl: track.images[0]?.url || '',
        previewUrl: track.preview_url,
        spotifyUrl: track.external_url,
        mood: moodAnalysis.primaryMood,
        description: this.generateSpecificDescription(track, moodAnalysis),
        tempo: 120, // Default tempo
        genre: 'Various',
        moodAnalysis: moodAnalysis
      }));
    } catch (error) {
      console.error('Error transforming recommendations:', error);
      // If recommendations fail, return the search results directly
      return tracks.map(track => ({
        title: track.name,
        artist: track.artist,
        album: track.album,
        imageUrl: track.images[0]?.url || '',
        previewUrl: track.preview_url,
        spotifyUrl: track.external_url,
        mood: moodAnalysis.primaryMood,
        description: this.generateSpecificDescription(track, moodAnalysis),
        tempo: 120,
        genre: 'Various',
        moodAnalysis: moodAnalysis
      }));
    }
  }

  public async getCurrentTrack(): Promise<CurrentTrack> {
    try {
      console.log('getCurrentTrack called');
      const token = await this.getAccessToken();
      console.log('Access token obtained for getCurrentTrack');
      
      const response = await axios.get('https://api.spotify.com/v1/me/player/currently-playing', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      console.log('getCurrentTrack response status:', response.status);
      
      if (response.status === 204) {
        console.log('No track currently playing (204 status)');
        throw new Error('No track currently playing');
      }
      
      const track = response.data.item;
      const isPlaying = response.data.is_playing;
      const progress = response.data.progress_ms;
      const duration = track.duration_ms;
      
      console.log('Track data:', { 
        name: track.name, 
        artist: track.artists[0].name,
        isPlaying,
        progress,
        duration
      });
      
      return {
        name: track.name,
        artist: track.artists[0].name,
        album: track.album.name,
        imageUrl: track.album.images[0]?.url || '',
        isPlaying,
        progress,
        duration
      };
    } catch (error) {
      console.error('Error getting current track:', error);
      throw error;
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
} 