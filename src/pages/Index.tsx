import { useState, useCallback } from "react";
import { motion } from "framer-motion";
import { Clapperboard } from "lucide-react";
import ReelUrlInput from "@/components/ReelUrlInput";
import CharacterUploader, { type Character } from "@/components/CharacterUploader";
import AudioPreview from "@/components/AudioPreview";
import GeneratePanel from "@/components/GeneratePanel";
import { useReelFetcher } from "@/hooks/use-reel-fetcher";

const Index = () => {
  const [reelUrl, setReelUrl] = useState("");
  const [characters, setCharacters] = useState<Character[]>([]);
  const [isGenerating, setIsGenerating] = useState(false);
  const [progress, setProgress] = useState(0);

  const { fetchReel, reset, isLoading: isLoadingReel, data: reelData, error: reelError } = useReelFetcher();

  const reelLoaded = !!reelData;

  const handleReelSubmit = useCallback((url: string) => {
    setReelUrl(url);
    reset();
    fetchReel(url);
  }, [fetchReel, reset]);

  const handleGenerate = useCallback(() => {
    setIsGenerating(true);
    setProgress(0);
    // Simulate generation progress
    const interval = setInterval(() => {
      setProgress((p) => {
        if (p >= 100) {
          clearInterval(interval);
          setIsGenerating(false);
          return 100;
        }
        return p + Math.random() * 8;
      });
    }, 300);
  }, []);

  const canGenerate = reelLoaded && characters.length > 0 && !isGenerating;

  return (
    <div className="min-h-screen bg-background relative overflow-hidden">
      {/* Ambient background effects */}
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute top-[-20%] left-[-10%] w-[500px] h-[500px] rounded-full bg-primary/5 blur-[120px]" />
        <div className="absolute bottom-[-20%] right-[-10%] w-[400px] h-[400px] rounded-full bg-accent/5 blur-[120px]" />
      </div>

      <div className="relative z-10 max-w-2xl mx-auto px-4 py-8 sm:py-12">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-10"
        >
          <div className="inline-flex items-center gap-2 mb-3">
            <Clapperboard className="w-8 h-8 text-primary" />
            <h1 className="font-display text-3xl sm:text-4xl font-bold gradient-text">
              Reels Studio
            </h1>
          </div>
          <p className="text-sm text-muted-foreground font-body max-w-md mx-auto">
            Превращай персонажей в мультфильмы с аудио из Instagram Reels
          </p>
        </motion.div>

        {/* Steps */}
        <div className="space-y-6">
          <ReelUrlInput
            onSubmit={handleReelSubmit}
            isLoading={isLoadingReel}
            isLoaded={reelLoaded}
          />

          {(reelLoaded || reelError || isLoadingReel) && (
            <AudioPreview
              reelUrl={reelUrl}
              videoUrl={reelData?.videoUrl}
              error={reelError ?? undefined}
              isLoading={isLoadingReel}
            />
          )}

          <CharacterUploader characters={characters} onChange={setCharacters} />

          <GeneratePanel
            canGenerate={canGenerate}
            onGenerate={handleGenerate}
            isGenerating={isGenerating}
            progress={progress}
          />
        </div>
      </div>
    </div>
  );
};

export default Index;
