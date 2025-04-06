import React, { useState } from 'react';
import { Box, Button, Typography, CircularProgress, Paper, Chip, Divider } from '@mui/material';
import { styled } from '@mui/material/styles';
import { SpotifyService } from '../lib/spotify-service';
import { SpotifyRecommendation } from '../types/spotify';

// Initialize the Spotify service
const spotifyService = new SpotifyService();

// Styled components
const UploadBox = styled('label')(({ theme }) => ({
  display: 'block',
  padding: theme.spacing(3),
  textAlign: 'center',
  cursor: 'pointer',
  border: `2px dashed ${theme.palette.divider}`,
  '&:hover': {
    borderColor: theme.palette.primary.main,
  },
}));

const ColorFeatureBar = styled(Box)(({ theme }) => ({
  display: 'flex',
  gap: theme.spacing(1),
  marginTop: theme.spacing(2),
}));

const ColorChip = styled(Chip)(({ theme }) => ({
  backgroundColor: theme.palette.background.paper,
}));

const SongCard = styled(Paper)(({ theme }) => ({
  padding: theme.spacing(2),
  marginTop: theme.spacing(2),
}));

const ColorFeatureLabel = styled(Typography)(({ theme }) => ({
  minWidth: '120px',
  marginRight: theme.spacing(2),
}));

const ColorFeatureValue = styled(Box)(({ theme }) => ({
  flexGrow: 1,
  height: '8px',
  borderRadius: theme.shape.borderRadius,
  backgroundColor: theme.palette.primary.main,
  transition: 'width 0.5s ease',
}));

const AestheticChip = styled(Chip)(({ theme }) => ({
  margin: theme.spacing(0.5),
  backgroundColor: 'rgba(255, 255, 255, 0.15)',
  '&:hover': {
    backgroundColor: 'rgba(255, 255, 255, 0.25)',
  },
}));

const SongImage = styled('img')({
  width: '100%',
  height: '200px',
  objectFit: 'cover',
  borderRadius: '8px',
  marginBottom: '16px',
});

const SongTitle = styled(Typography)(({ theme }) => ({
  fontWeight: 'bold',
  marginBottom: theme.spacing(1),
}));

const SongArtist = styled(Typography)(({ theme }) => ({
  color: theme.palette.text.secondary,
  marginBottom: theme.spacing(2),
}));

const SongDescription = styled(Typography)(({ theme }) => ({
  marginBottom: theme.spacing(2),
  flexGrow: 1,
}));

const SongMood = styled(Typography)(({ theme }) => ({
  marginBottom: theme.spacing(1),
  color: theme.palette.primary.main,
}));

const SongGenres = styled(Box)(({ theme }) => ({
  display: 'flex',
  flexWrap: 'wrap',
  gap: theme.spacing(0.5),
}));

const GenerateButton = styled(Button)(({ theme }) => ({
  marginTop: theme.spacing(2),
  padding: theme.spacing(1, 4),
  borderRadius: theme.shape.borderRadius * 2,
  boxShadow: theme.shadows[4],
  '&:hover': {
    boxShadow: theme.shadows[8],
  },
}));

const PictureToSongPage: React.FC = () => {
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [analyzing, setAnalyzing] = useState(false);
  const [recommendations, setRecommendations] = useState<SpotifyRecommendation[]>([]);
  const [imageAnalysis, setImageAnalysis] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  const handleImageSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        setSelectedImage(e.target?.result as string);
        setRecommendations([]);
        setImageAnalysis(null);
        setError(null);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleAnalyze = async () => {
    if (!selectedImage) return;
    
    setAnalyzing(true);
    setError(null);
    
    try {
      const results = await spotifyService.getRecommendationsFromImage(selectedImage);
      setRecommendations(results);
      
      // Extract image analysis from the first recommendation's description
      if (results.length > 0) {
        const firstResult = results[0];
        setImageAnalysis({
          mood: firstResult.mood,
          colors: firstResult.colors || [],
          aesthetic: firstResult.aesthetic || '',
          visualFeatures: {
            brightness: 0.7,
            contrast: 0.6,
            saturation: 0.8,
            warmth: 0.5
          }
        });
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred while analyzing the image');
    } finally {
      setAnalyzing(false);
    }
  };

  const renderColorFeatures = () => {
    if (!imageAnalysis) return null;
    
    const { visualFeatures } = imageAnalysis;
    
    return (
      <Box sx={{ mb: 4 }}>
        <Typography variant="h6" gutterBottom>
          Visual Features
        </Typography>
        <ColorFeatureBar>
          <ColorFeatureLabel>Brightness</ColorFeatureLabel>
          <ColorFeatureValue sx={{ width: `${visualFeatures.brightness * 100}%` }} />
        </ColorFeatureBar>
        <ColorFeatureBar>
          <ColorFeatureLabel>Contrast</ColorFeatureLabel>
          <ColorFeatureValue sx={{ width: `${visualFeatures.contrast * 100}%` }} />
        </ColorFeatureBar>
        <ColorFeatureBar>
          <ColorFeatureLabel>Saturation</ColorFeatureLabel>
          <ColorFeatureValue sx={{ width: `${visualFeatures.saturation * 100}%` }} />
        </ColorFeatureBar>
        <ColorFeatureBar>
          <ColorFeatureLabel>Warmth</ColorFeatureLabel>
          <ColorFeatureValue sx={{ width: `${visualFeatures.warmth * 100}%` }} />
        </ColorFeatureBar>
      </Box>
    );
  };

  const renderColors = () => {
    if (!imageAnalysis?.colors?.length) return null;
    
    return (
      <Box sx={{ mb: 4 }}>
        <Typography variant="h6" gutterBottom>
          Colors
        </Typography>
        <Box sx={{ display: 'flex', flexWrap: 'wrap' }}>
          {imageAnalysis.colors.map((color: string, index: number) => (
            <ColorChip key={index} label={color} />
          ))}
        </Box>
      </Box>
    );
  };

  const renderAesthetic = () => {
    if (!imageAnalysis?.aesthetic) return null;
    
    return (
      <Box sx={{ mb: 4 }}>
        <Typography variant="h6" gutterBottom>
          Aesthetic
        </Typography>
        <AestheticChip label={imageAnalysis.aesthetic} />
      </Box>
    );
  };

  const renderRecommendations = () => {
    if (recommendations.length === 0) return null;

    return (
      <Box sx={{ mt: 4 }}>
        <Typography variant="h6" gutterBottom>
          Recommended Songs
        </Typography>
        {recommendations.map((recommendation, index) => (
          <SongCard key={index}>
            <Typography variant="subtitle1">{recommendation.title}</Typography>
            <Typography variant="body2" color="text.secondary">
              {recommendation.artist}
            </Typography>
            <Typography variant="body2" sx={{ mt: 1 }}>
              {recommendation.description}
            </Typography>
            {renderColorFeatures()}
            {renderColors()}
            {renderAesthetic()}
          </SongCard>
        ))}
      </Box>
    );
  };

  return (
    <Box sx={{ p: 3, maxWidth: 800, mx: 'auto' }}>
      <Typography variant="h4" gutterBottom>
        Image to Song Generator
      </Typography>
      <Typography variant="body1" paragraph>
        Upload an image to get song recommendations based on its colors and aesthetic.
      </Typography>

      <UploadBox htmlFor="image-upload">
        <input
          id="image-upload"
          type="file"
          accept="image/*"
          onChange={handleImageSelect}
          style={{ display: 'none' }}
        />
        {selectedImage ? (
          <img
            src={selectedImage}
            alt="Selected"
            style={{ maxWidth: '100%', maxHeight: 300 }}
          />
        ) : (
          <Typography>
            Click to upload an image
          </Typography>
        )}
      </UploadBox>

      {selectedImage && (
        <Box sx={{ mt: 2, textAlign: 'center' }}>
          <Button
            variant="contained"
            onClick={handleAnalyze}
            disabled={analyzing}
          >
            {analyzing ? (
              <>
                <CircularProgress size={24} sx={{ mr: 1 }} />
                Analyzing...
              </>
            ) : (
              'Analyze Image'
            )}
          </Button>
        </Box>
      )}

      {error && (
        <Typography color="error" sx={{ mt: 2 }}>
          {error}
        </Typography>
      )}

      {renderRecommendations()}
    </Box>
  );
};

export default PictureToSongPage; 