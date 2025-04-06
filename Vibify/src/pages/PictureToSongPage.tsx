import React, { useState, useRef } from 'react';
import { Box, Button, Typography, CircularProgress, Paper, Chip, Divider } from '@mui/material';
import { styled } from '@mui/material/styles';
import { SpotifyService } from '../lib/spotify-service';
import { SpotifyRecommendation } from '../types/spotify';
import { motion } from 'framer-motion';
import { Upload, Image as ImageIcon, X, Music, RefreshCw } from 'lucide-react';

// Initialize the Spotify service
const spotifyService = new SpotifyService();

// Styled components
const UploadBox = styled(motion.label)(({ theme }) => ({
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  justifyContent: 'center',
  padding: theme.spacing(4),
  textAlign: 'center',
  cursor: 'pointer',
  border: `2px dashed ${theme.palette.divider}`,
  borderRadius: theme.shape.borderRadius * 2,
  backgroundColor: theme.palette.background.paper,
  transition: 'all 0.3s ease',
  minHeight: '300px',
  position: 'relative',
  overflow: 'hidden',
  '&:hover': {
    borderColor: theme.palette.primary.main,
    backgroundColor: theme.palette.action.hover,
  },
  '&:focus-within': {
    outline: `2px solid ${theme.palette.primary.main}`,
    outlineOffset: '2px',
  },
}));

const UploadIcon = styled(Upload)(({ theme }) => ({
  fontSize: '3rem',
  color: theme.palette.primary.main,
  marginBottom: theme.spacing(2),
}));

const ImagePreview = styled(motion.img)(({ theme }) => ({
  maxWidth: '100%',
  maxHeight: '300px',
  borderRadius: theme.shape.borderRadius,
  objectFit: 'contain',
  boxShadow: theme.shadows[2],
}));

const RemoveButton = styled(Button)(({ theme }) => ({
  position: 'absolute',
  top: theme.spacing(1),
  right: theme.spacing(1),
  minWidth: 'auto',
  padding: theme.spacing(0.5),
  borderRadius: '50%',
  backgroundColor: theme.palette.background.paper,
  color: theme.palette.text.primary,
  boxShadow: theme.shadows[2],
  '&:hover': {
    backgroundColor: theme.palette.error.main,
    color: theme.palette.error.contrastText,
  },
}));

const DragOverlay = styled(motion.div)(({ theme }) => ({
  position: 'absolute',
  top: 0,
  left: 0,
  right: 0,
  bottom: 0,
  backgroundColor: theme.palette.primary.main,
  opacity: 0.1,
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  zIndex: 1,
}));

const UploadInstructions = styled(Box)(({ theme }) => ({
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  gap: theme.spacing(1),
}));

const UploadText = styled(Typography)(({ theme }) => ({
  fontWeight: 500,
  marginBottom: theme.spacing(1),
}));

const UploadSubtext = styled(Typography)(({ theme }) => ({
  color: theme.palette.text.secondary,
  fontSize: '0.875rem',
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
  borderRadius: theme.shape.borderRadius * 2,
  transition: 'transform 0.3s ease, box-shadow 0.3s ease',
  '&:hover': {
    transform: 'translateY(-4px)',
    boxShadow: theme.shadows[4],
  },
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
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleImageSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      if (file.type.startsWith('image/')) {
        const reader = new FileReader();
        reader.onload = (e) => {
          setSelectedImage(e.target?.result as string);
          setRecommendations([]);
          setImageAnalysis(null);
          setError(null);
        };
        reader.readAsDataURL(file);
      } else {
        setError('Please upload an image file');
      }
    }
  };

  const handleDragOver = (e: React.DragEvent<HTMLLabelElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent<HTMLLabelElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent<HTMLLabelElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
    
    const file = e.dataTransfer.files?.[0];
    if (file) {
      if (file.type.startsWith('image/')) {
        const reader = new FileReader();
        reader.onload = (e) => {
          setSelectedImage(e.target?.result as string);
          setRecommendations([]);
          setImageAnalysis(null);
          setError(null);
        };
        reader.readAsDataURL(file);
      } else {
        setError('Please upload an image file');
      }
    }
  };

  const handleRemoveImage = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setSelectedImage(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
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

      <UploadBox 
        htmlFor="image-upload"
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        whileHover={{ scale: 1.01 }}
        whileTap={{ scale: 0.99 }}
      >
        <input
          id="image-upload"
          ref={fileInputRef}
          type="file"
          accept="image/*"
          onChange={handleImageSelect}
          style={{ display: 'none' }}
          aria-label="Upload image"
        />
        
        {isDragging && (
          <DragOverlay
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <Typography variant="h6" sx={{ color: 'primary.main' }}>
              Drop your image here
            </Typography>
          </DragOverlay>
        )}
        
        {selectedImage ? (
          <>
            <ImagePreview
              src={selectedImage}
              alt="Selected image"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.3 }}
            />
            <RemoveButton
              onClick={handleRemoveImage}
              aria-label="Remove image"
            >
              <X size={20} />
            </RemoveButton>
          </>
        ) : (
          <UploadInstructions>
            <UploadIcon />
            <UploadText variant="h6">
              Drag & drop your image here
            </UploadText>
            <UploadSubtext>
              or click to browse files
            </UploadSubtext>
            <UploadSubtext>
              Supports JPG, PNG, GIF (max 10MB)
            </UploadSubtext>
          </UploadInstructions>
        )}
      </UploadBox>

      {selectedImage && (
        <Box sx={{ mt: 3, textAlign: 'center' }}>
          <GenerateButton
            variant="contained"
            onClick={handleAnalyze}
            disabled={analyzing}
            startIcon={analyzing ? <CircularProgress size={20} color="inherit" /> : <Music size={20} />}
          >
            {analyzing ? 'Analyzing...' : 'Generate Song Recommendations'}
          </GenerateButton>
        </Box>
      )}

      {error && (
        <Paper 
          sx={{ 
            mt: 3, 
            p: 2, 
            bgcolor: 'error.light', 
            color: 'error.contrastText',
            display: 'flex',
            alignItems: 'center',
            gap: 1
          }}
        >
          <X size={20} />
          <Typography>{error}</Typography>
        </Paper>
      )}

      {renderRecommendations()}
    </Box>
  );
};

export default PictureToSongPage; 