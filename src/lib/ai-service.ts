import axios from 'axios';

interface SongRecommendation {
  title: string;
  artist: string;
  mood: string;
  confidence: number;
}

export class AIService {
  private moods = ['happy', 'sad', 'energetic', 'calm', 'romantic'];
  private mockSongs = {
    happy: [
      { title: 'Happy', artist: 'Pharrell Williams', mood: 'happy', confidence: 0.95 },
      { title: 'Good Vibrations', artist: 'Beach Boys', mood: 'happy', confidence: 0.85 },
      { title: 'Walking on Sunshine', artist: 'Katrina & The Waves', mood: 'happy', confidence: 0.80 }
    ],
    sad: [
      { title: 'Someone Like You', artist: 'Adele', mood: 'sad', confidence: 0.90 },
      { title: 'All By Myself', artist: 'Celine Dion', mood: 'sad', confidence: 0.85 },
      { title: 'Yesterday', artist: 'The Beatles', mood: 'sad', confidence: 0.80 }
    ],
    energetic: [
      { title: 'Eye of the Tiger', artist: 'Survivor', mood: 'energetic', confidence: 0.95 },
      { title: 'Stronger', artist: 'Kanye West', mood: 'energetic', confidence: 0.85 },
      { title: 'Can\'t Hold Us', artist: 'Macklemore & Ryan Lewis', mood: 'energetic', confidence: 0.80 }
    ],
    calm: [
      { title: 'Weightless', artist: 'Marconi Union', mood: 'calm', confidence: 0.90 },
      { title: 'River Flows in You', artist: 'Yiruma', mood: 'calm', confidence: 0.85 },
      { title: 'Clair de Lune', artist: 'Claude Debussy', mood: 'calm', confidence: 0.80 }
    ],
    romantic: [
      { title: 'All of Me', artist: 'John Legend', mood: 'romantic', confidence: 0.95 },
      { title: 'Perfect', artist: 'Ed Sheeran', mood: 'romantic', confidence: 0.90 },
      { title: 'At Last', artist: 'Etta James', mood: 'romantic', confidence: 0.85 }
    ]
  };

  private analyzeMood(text: string): string {
    const lowerText = text.toLowerCase();
    
    // Simple keyword-based mood analysis
    if (lowerText.includes('happy') || lowerText.includes('joy') || lowerText.includes('excited')) {
      return 'happy';
    } else if (lowerText.includes('sad') || lowerText.includes('depressed') || lowerText.includes('lonely')) {
      return 'sad';
    } else if (lowerText.includes('energetic') || lowerText.includes('pump') || lowerText.includes('workout')) {
      return 'energetic';
    } else if (lowerText.includes('calm') || lowerText.includes('peaceful') || lowerText.includes('relax')) {
      return 'calm';
    } else if (lowerText.includes('romantic') || lowerText.includes('love') || lowerText.includes('date')) {
      return 'romantic';
    }
    
    // Default to happy if no specific mood is detected
    return 'happy';
  }

  async getSongRecommendations(prompt: string): Promise<SongRecommendation[]> {
    const mood = this.analyzeMood(prompt);
    return this.mockSongs[mood as keyof typeof this.mockSongs] || this.mockSongs.happy;
  }
} 