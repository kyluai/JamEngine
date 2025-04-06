import { useState } from 'react';
import { motion } from 'framer-motion';
import { Search, Music, Sparkles, ChevronDown, ChevronUp, Info, Clock, MapPin, Users, Activity, Headphones } from 'lucide-react';
import { Input } from './ui/input';
import { Button } from './ui/button';
import { SpotifyService, MoodAnalysis } from '../lib/spotify-service';
import { SpotifyRecommendation } from '../types/spotify';

interface PromptInputProps {
  spotifyService: SpotifyService;
  onMoodDetected?: (mood: string) => void;
  onRecommendationsReceived?: (recommendations: SpotifyRecommendation[], analysis: MoodAnalysis | null) => void;
}

export function PromptInput({ spotifyService, onMoodDetected, onRecommendationsReceived }: PromptInputProps) {
  const [inputText, setInputText] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [recommendations, setRecommendations] = useState<SpotifyRecommendation[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [moodAnalysis, setMoodAnalysis] = useState<MoodAnalysis | null>(null);
  const [isExplanationOpen, setIsExplanationOpen] = useState(false);
  const [isScenarioOpen, setIsScenarioOpen] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputText.trim()) return;

    setIsLoading(true);
    setError(null);
    setRecommendations([]);
    setMoodAnalysis(null);
    setIsExplanationOpen(false);
    setIsScenarioOpen(false);

    try {
      // Get recommendations which will also detect the mood internally
      const results = await spotifyService.getRecommendationsFromText(inputText);
      
      // Check if we have valid results
      if (results && results.length > 0) {
        // Extract the mood from the first recommendation if available
        if (onMoodDetected) {
          onMoodDetected(results[0].mood || '');
        }
        
        setRecommendations(results);
        
        // Call the onRecommendationsReceived callback if provided
        if (onRecommendationsReceived) {
          onRecommendationsReceived(results, moodAnalysis);
        }
      } else {
        setError('No recommendations found. Please try a different description.');
      }
    } catch (err) {
      console.error('Error getting recommendations:', err);
      if (err instanceof Error && err.message.includes('Please log in to Spotify')) {
        // Handle authentication error
        setError('Please log in to Spotify to get recommendations.');
      } else {
        setError(err instanceof Error ? err.message : 'Failed to get recommendations. Please try again.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  // Get emoji for mood
  const getMoodEmoji = (mood: string): string => {
    const moodEmojiMap: { [key: string]: string } = {
      'focused': '🎯',
      'party': '🔥',
      'chill': '😌',
      'happy': '😊',
      'sad': '😢',
      'energetic': '⚡',
      'relaxed': '😌',
      'inspirational': '✨',
      'introspective': '🤔',
      'nostalgic': '🕰️',
      'romantic': '❤️',
      'cinematic': '🎬',
      'urban': '🌆',
      'nature': '🌿',
      'dreamy': '💭',
      'angry': '😠',
      'peaceful': '🕊️',
      'neutral': '😐'
    };
    return moodEmojiMap[mood.toLowerCase()] || '🎵';
  };

  // Get emoji for input type
  const getInputTypeEmoji = (type: string): string => {
    const typeEmojiMap: { [key: string]: string } = {
      'mood': '😊',
      'scenario': '🌍',
      'mixed': '🔄'
    };
    return typeEmojiMap[type] || '🎵';
  };

  // Get emoji for energy level
  const getEnergyLevelEmoji = (level: string): string => {
    const levelEmojiMap: { [key: string]: string } = {
      'low': '🔋',
      'medium': '🔋🔋',
      'high': '🔋🔋🔋'
    };
    return levelEmojiMap[level] || '🔋';
  };

  // Get emoji for social context
  const getSocialContextEmoji = (context: string): string => {
    const contextEmojiMap: { [key: string]: string } = {
      'alone': '👤',
      'with_friends': '👥',
      'with_family': '👨‍👩‍👧‍👦',
      'in_crowd': '👥👥'
    };
    return contextEmojiMap[context] || '👤';
  };

  return (
    <div className="w-full">
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="relative">
          <textarea
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            placeholder="Tell me your vibe... (e.g., 'I'm walking through the city at night feeling like the main character')"
            className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
            rows={4}
            required
          />
          <div className="absolute right-3 top-3 text-muted-foreground">
            <Music className="h-5 w-5" />
          </div>
        </div>
        <button
            type="submit"
            disabled={isLoading}
          className="inline-flex h-10 items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground ring-offset-background transition-colors hover:bg-primary/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50"
        >
          {isLoading ? 'Getting Recommendations...' : 'Get Recommendations'}
        </button>
      </form>

      {error && (
        <div className="mt-4 rounded-lg bg-destructive/15 p-3 text-sm text-destructive">
          {error}
        </div>
      )}

      {moodAnalysis && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="mt-6 rounded-lg border bg-card p-4 text-card-foreground shadow-sm"
        >
          <div className="flex items-center gap-2 mb-2">
            <Sparkles className="h-5 w-5 text-primary" />
            <h3 className="font-semibold">Your Vibe Analysis</h3>
          </div>
          
          {/* Input Type Display */}
          <div className="flex items-center gap-2 mb-3 text-sm text-muted-foreground">
            <span>{getInputTypeEmoji(moodAnalysis.inputType)}</span>
            <span className="capitalize">{moodAnalysis.inputType} input detected</span>
          </div>
          
          {/* Primary Mood Display - Always show for mood-based inputs */}
          {moodAnalysis.inputType === 'mood' && (
            <>
              <div className="flex items-center gap-2 mb-4">
                <span className="text-2xl">{getMoodEmoji(moodAnalysis.primaryMood)}</span>
                <h2 className="text-xl font-bold capitalize">{moodAnalysis.primaryMood}</h2>
              </div>
              
              {/* Secondary Moods */}
              {moodAnalysis.secondaryMoods && moodAnalysis.secondaryMoods.length > 0 && (
                <div className="mb-4">
                  <p className="text-sm text-muted-foreground mb-1">Secondary moods:</p>
                  <div className="flex flex-wrap gap-2">
                    {moodAnalysis.secondaryMoods.map((mood, index) => (
                      <span key={index} className="inline-flex items-center gap-1 px-2 py-1 bg-muted rounded-full text-xs">
                        <span>{getMoodEmoji(mood)}</span>
                        <span className="capitalize">{mood}</span>
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </>
          )}
          
          {/* Keywords - Show for all input types */}
          {moodAnalysis.keywords && moodAnalysis.keywords.length > 0 && (
            <div className="mb-4">
              <p className="text-sm text-muted-foreground mb-1">Keywords:</p>
              <div className="flex flex-wrap gap-1">
                {moodAnalysis.keywords.slice(0, 5).map((keyword, index) => (
                  <span key={index} className="px-2 py-1 bg-primary/10 rounded-full text-xs">
                    {keyword}
                  </span>
                ))}
              </div>
            </div>
          )}
          
          {/* Scenario Details - Only show for scenario-based inputs */}
          {moodAnalysis.inputType === 'scenario' && moodAnalysis.scenario && (
            <div className="mt-4 mb-4">
              <button
                onClick={() => setIsScenarioOpen(!isScenarioOpen)}
                className="flex items-center gap-1 text-sm text-primary hover:text-primary/80 transition-colors"
              >
                {isScenarioOpen ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                <span>Scenario Details</span>
              </button>
              
              {isScenarioOpen && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  className="mt-2 p-3 bg-muted/30 rounded-md text-sm space-y-2"
                >
                  {moodAnalysis.scenario.activity && (
                    <div className="flex items-center gap-2">
                      <Activity className="h-4 w-4 text-primary" />
                      <span className="capitalize">{moodAnalysis.scenario.activity}</span>
                    </div>
                  )}
                  
                  {moodAnalysis.scenario.setting && (
                    <div className="flex items-center gap-2">
                      <MapPin className="h-4 w-4 text-primary" />
                      <span className="capitalize">{moodAnalysis.scenario.setting}</span>
                    </div>
                  )}
                  
                  {moodAnalysis.scenario.timeOfDay && (
                    <div className="flex items-center gap-2">
                      <Clock className="h-4 w-4 text-primary" />
                      <span className="capitalize">{moodAnalysis.scenario.timeOfDay}</span>
                    </div>
                  )}
                  
                  {moodAnalysis.scenario.energyLevel && (
                    <div className="flex items-center gap-2">
                      <span>{getEnergyLevelEmoji(moodAnalysis.scenario.energyLevel)}</span>
                      <span className="capitalize">{moodAnalysis.scenario.energyLevel} energy</span>
                    </div>
                  )}
                  
                  {moodAnalysis.scenario.socialContext && (
                    <div className="flex items-center gap-2">
                      <span>{getSocialContextEmoji(moodAnalysis.scenario.socialContext)}</span>
                      <span className="capitalize">{moodAnalysis.scenario.socialContext.replace('_', ' ')}</span>
                    </div>
                  )}
                  
                  {moodAnalysis.scenario.instrumentalPreference !== undefined && (
                    <div className="flex items-center gap-2">
                      <Headphones className="h-4 w-4 text-primary" />
                      <span>{moodAnalysis.scenario.instrumentalPreference ? 'Instrumental preferred' : 'With vocals preferred'}</span>
                    </div>
                  )}
                </motion.div>
              )}
            </div>
          )}
          
          {/* For mixed inputs, show both but in a more compact way */}
          {moodAnalysis.inputType === 'mixed' && (
            <>
              {/* Primary Mood Display */}
              <div className="flex items-center gap-2 mb-4">
                <span className="text-2xl">{getMoodEmoji(moodAnalysis.primaryMood)}</span>
                <h2 className="text-xl font-bold capitalize">{moodAnalysis.primaryMood}</h2>
              </div>
              
              {/* Scenario Details - Collapsed by default for mixed inputs */}
              {moodAnalysis.scenario && (
                <div className="mt-4 mb-4">
                  <button
                    onClick={() => setIsScenarioOpen(!isScenarioOpen)}
                    className="flex items-center gap-1 text-sm text-primary hover:text-primary/80 transition-colors"
                  >
                    {isScenarioOpen ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                    <span>Scenario Details</span>
                  </button>
                  
                  {isScenarioOpen && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      exit={{ opacity: 0, height: 0 }}
                      className="mt-2 p-3 bg-muted/30 rounded-md text-sm space-y-2"
                    >
                      {moodAnalysis.scenario.activity && (
                        <div className="flex items-center gap-2">
                          <Activity className="h-4 w-4 text-primary" />
                          <span className="capitalize">{moodAnalysis.scenario.activity}</span>
                        </div>
                      )}
                      
                      {moodAnalysis.scenario.setting && (
                        <div className="flex items-center gap-2">
                          <MapPin className="h-4 w-4 text-primary" />
                          <span className="capitalize">{moodAnalysis.scenario.setting}</span>
                        </div>
                      )}
                      
                      {moodAnalysis.scenario.timeOfDay && (
                        <div className="flex items-center gap-2">
                          <Clock className="h-4 w-4 text-primary" />
                          <span className="capitalize">{moodAnalysis.scenario.timeOfDay}</span>
                        </div>
                      )}
                      
                      {moodAnalysis.scenario.energyLevel && (
                        <div className="flex items-center gap-2">
                          <span>{getEnergyLevelEmoji(moodAnalysis.scenario.energyLevel)}</span>
                          <span className="capitalize">{moodAnalysis.scenario.energyLevel} energy</span>
                        </div>
                      )}
                      
                      {moodAnalysis.scenario.socialContext && (
                        <div className="flex items-center gap-2">
                          <span>{getSocialContextEmoji(moodAnalysis.scenario.socialContext)}</span>
                          <span className="capitalize">{moodAnalysis.scenario.socialContext.replace('_', ' ')}</span>
                        </div>
                      )}
                      
                      {moodAnalysis.scenario.instrumentalPreference !== undefined && (
                        <div className="flex items-center gap-2">
                          <Headphones className="h-4 w-4 text-primary" />
                          <span>{moodAnalysis.scenario.instrumentalPreference ? 'Instrumental preferred' : 'With vocals preferred'}</span>
                        </div>
                      )}
                    </motion.div>
                  )}
                </div>
              )}
            </>
          )}
          
          {/* Explanation Dropdown - Always show */}
          <div className="mt-2">
            <button
              onClick={() => setIsExplanationOpen(!isExplanationOpen)}
              className="flex items-center gap-1 text-sm text-primary hover:text-primary/80 transition-colors"
            >
              {isExplanationOpen ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
              <span>Why these songs?</span>
            </button>
            
            {isExplanationOpen && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="mt-2 p-3 bg-muted/30 rounded-md text-sm"
              >
                <p className="mb-2">{moodAnalysis.explanation}</p>
                
                {moodAnalysis.musicalQualities && moodAnalysis.musicalQualities.length > 0 && (
                  <div className="mt-2">
                    <p className="font-medium mb-1">Musical Qualities:</p>
                    <ul className="list-disc list-inside text-muted-foreground">
                      {moodAnalysis.musicalQualities.slice(0, 3).map((quality, index) => (
                        <li key={index}>{quality}</li>
                      ))}
                    </ul>
                  </div>
                )}
              </motion.div>
            )}
          </div>
        </motion.div>
      )}

      {recommendations.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mt-8 space-y-4"
        >
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-bold">Recommended Songs</h2>
            <div className="flex items-center gap-1 text-sm text-muted-foreground">
              <Sparkles className="h-4 w-4 text-primary" />
              <span>Curated for your vibe</span>
            </div>
          </div>
          
          <div className="grid gap-4 grid-cols-1 md:grid-cols-3">
            {recommendations.slice(0, 3).map((song, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
                className="rounded-lg border bg-card p-4 text-card-foreground shadow-sm"
              >
                <img
                  src={song.imageUrl}
                  alt={`${song.title} by ${song.artist}`}
                  className="mb-4 aspect-square w-full rounded-md object-cover"
                />
                <h3 className="font-semibold">{song.title}</h3>
                <p className="text-sm text-muted-foreground">{song.artist}</p>
                <div className="mt-4">
                  <a
                    href={song.spotifyUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex w-full items-center justify-center rounded-md bg-[#1DB954] px-3 py-2 text-sm font-medium text-white hover:bg-[#1DB954]/90"
                  >
                    Open in Spotify
                  </a>
                </div>
              </motion.div>
            ))}
          </div>
          
          {recommendations.length > 3 && (
            <div className="mt-4 text-center">
              <p className="text-sm text-muted-foreground">
                Showing top 3 diverse recommendations based on your vibe. 
                <button 
                  onClick={() => setRecommendations(prev => [...prev.slice(3), ...prev.slice(0, 3)])}
                  className="ml-1 text-primary hover:underline"
                >
                  Show different options
                </button>
              </p>
            </div>
          )}
        </motion.div>
      )}
    </div>
  );
}