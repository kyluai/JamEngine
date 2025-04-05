import { MusicServiceFactory, ServiceType } from './music-service-factory';

class MusicServiceError extends Error {
  constructor(message: string, public serviceType?: ServiceType) {
    super(message);
    this.name = 'MusicServiceError';
  }
}

async function initializeMusicServices() {
  try {
    const factory = MusicServiceFactory.getInstance();
    const enabledServices = factory.getEnabledServices();

    if (enabledServices.length === 0) {
      throw new MusicServiceError('No music services are enabled. Please check your .env file configuration.');
    }

    console.log('Enabled services:', enabledServices);

    for (const serviceType of enabledServices) {
      try {
        const service = factory.getService(serviceType);
        
        if (!service.isAuthenticated()) {
          const loginUrl = service.initiateLogin();
          console.log(`\n${serviceType} Authentication Required:`);
          console.log(`1. Visit this URL to authenticate: ${loginUrl}`);
          console.log(`2. After authentication, you'll be redirected back to the application`);
          console.log(`3. The service will automatically handle the authentication callback\n`);
        } else {
          console.log(`${serviceType} is already authenticated`);
        }
      } catch (error) {
        if (error instanceof MusicServiceError) {
          console.error(`Error with ${serviceType}:`, error.message);
        } else {
          console.error(`Unexpected error with ${serviceType}:`, error);
        }
      }
    }
  } catch (error) {
    if (error instanceof MusicServiceError) {
      console.error('Configuration Error:', error.message);
    } else {
      console.error('Unexpected Error:', error);
    }
  }
}

async function searchAcrossServices(query: string) {
  if (!query || query.trim().length === 0) {
    throw new MusicServiceError('Search query cannot be empty');
  }

  try {
    const factory = MusicServiceFactory.getInstance();
    const results = await factory.searchAllServices(query);
    
    if (results.size === 0) {
      console.log('No results found across any services');
      return;
    }

    for (const [serviceType, tracks] of results.entries()) {
      if (tracks.length === 0) {
        console.log(`\nNo results found on ${serviceType}`);
        continue;
      }

      console.log(`\nResults from ${serviceType} (${tracks.length} tracks):`);
      tracks.forEach((track, index) => {
        console.log(`${index + 1}. ${track.title} by ${track.artist}`);
      });
    }
  } catch (error) {
    if (error instanceof MusicServiceError) {
      console.error('Search Error:', error.message);
    } else {
      console.error('Unexpected Error during search:', error);
    }
  }
}

async function getRecommendations(text: string) {
  if (!text || text.trim().length === 0) {
    throw new MusicServiceError('Recommendation text cannot be empty');
  }

  try {
    const factory = MusicServiceFactory.getInstance();
    const recommendations = await factory.getRecommendationsFromAllServices(text);
    
    if (recommendations.size === 0) {
      console.log('No recommendations found across any services');
      return;
    }

    for (const [serviceType, tracks] of recommendations.entries()) {
      if (tracks.length === 0) {
        console.log(`\nNo recommendations found on ${serviceType}`);
        continue;
      }

      console.log(`\nRecommendations from ${serviceType} (${tracks.length} tracks):`);
      tracks.forEach((track, index) => {
        console.log(`${index + 1}. ${track.title} by ${track.artist}`);
        console.log(`   Mood: ${track.mood}, Confidence: ${track.confidence}%`);
        if (track.description) {
          console.log(`   Description: ${track.description}`);
        }
      });
    }
  } catch (error) {
    if (error instanceof MusicServiceError) {
      console.error('Recommendation Error:', error.message);
    } else {
      console.error('Unexpected Error during recommendations:', error);
    }
  }
}

// Example usage with error handling
async function main() {
  try {
    await initializeMusicServices();
    
    // Example search with error handling
    try {
      await searchAcrossServices('Your favorite song');
    } catch (error) {
      console.error('Search failed:', error);
    }

    // Example recommendations with error handling
    try {
      await getRecommendations('I want some upbeat pop music for a party');
    } catch (error) {
      console.error('Recommendations failed:', error);
    }
  } catch (error) {
    console.error('Application failed to start:', error);
  }
}

main(); 