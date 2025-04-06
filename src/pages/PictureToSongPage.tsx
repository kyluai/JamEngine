import { useState } from 'react';
import { motion } from 'framer-motion';
import { Image, Upload } from 'lucide-react';
import { PromptInput } from '../components/prompt-input';
import { SpotifyService } from '../lib/spotify-service';
import { Features } from '../components/features';
import { Pricing } from '../components/pricing';
import { About } from '../components/about';

export function PictureToSongPage() {
  const [spotifyService] = useState(() => new SpotifyService());
  const [currentMood, setCurrentMood] = useState<string | undefined>(undefined);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);

  const handleMoodDetected = (mood: string) => {
    console.log('Mood detected in PictureToSongPage:', mood);
    setCurrentMood(mood);
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setSelectedImage(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  return (
    <div className="container mx-auto flex min-h-screen flex-col items-center px-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="mt-32 text-center"
      >
        <div className="mb-8 flex items-center justify-center gap-4">
          <Image className="h-12 w-12 text-primary" />
          <h1 className="text-5xl font-bold tracking-tight">Picture-to-Song Generator</h1>
        </div>
        <p className="mx-auto max-w-2xl text-lg text-muted-foreground">
          Upload an image and get song recommendations that match its mood and aesthetic.
          Our AI will analyze the visual elements and find the perfect soundtrack.
        </p>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.2 }}
        className="mt-12 w-full max-w-3xl"
      >
        <div className="mb-8 rounded-lg border border-dashed border-muted-foreground/25 p-8 text-center">
          <div className="mb-4 flex justify-center">
            {selectedImage ? (
              <img 
                src={selectedImage} 
                alt="Uploaded" 
                className="max-h-64 rounded-lg object-cover"
              />
            ) : (
              <div className="flex h-32 w-32 items-center justify-center rounded-full bg-muted">
                <Upload className="h-8 w-8 text-muted-foreground" />
              </div>
            )}
          </div>
          <label 
            htmlFor="image-upload" 
            className="inline-flex cursor-pointer items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90"
          >
            {selectedImage ? 'Change Image' : 'Upload Image'}
          </label>
          <input 
            id="image-upload" 
            type="file" 
            accept="image/*" 
            className="hidden" 
            onChange={handleImageUpload}
          />
          <p className="mt-2 text-sm text-muted-foreground">
            {selectedImage ? 'Image uploaded successfully!' : 'Click to upload an image'}
          </p>
        </div>

        <PromptInput 
          spotifyService={spotifyService} 
          onMoodDetected={handleMoodDetected}
        />
      </motion.div>

      <div className="mt-24 w-full">
        <Features />
        <Pricing />
        <About />
      </div>
    </div>
  );
} 