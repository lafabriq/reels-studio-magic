import { motion } from "framer-motion";
import { Music, Volume2 } from "lucide-react";

interface AudioPreviewProps {
  reelUrl: string;
}

const AudioPreview = ({ reelUrl }: AudioPreviewProps) => {
  // Fake waveform bars for visual effect
  const bars = Array.from({ length: 40 }, (_, i) => ({
    height: 20 + Math.sin(i * 0.5) * 15 + Math.random() * 20,
    delay: i * 0.02,
  }));

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="glass rounded-xl p-4"
    >
      <div className="flex items-center gap-2 mb-3">
        <Music className="w-4 h-4 text-primary" />
        <span className="text-xs font-display font-semibold text-foreground">Аудио дорожка</span>
        <Volume2 className="w-3.5 h-3.5 text-muted-foreground ml-auto" />
      </div>
      <div className="flex items-end gap-[2px] h-12">
        {bars.map((bar, i) => (
          <motion.div
            key={i}
            initial={{ height: 4 }}
            animate={{ height: bar.height }}
            transition={{ duration: 0.4, delay: bar.delay, type: "spring", damping: 15 }}
            className="flex-1 rounded-full bg-gradient-to-t from-primary/60 to-primary"
          />
        ))}
      </div>
      <p className="text-[10px] text-muted-foreground mt-2 truncate font-body">{reelUrl}</p>
    </motion.div>
  );
};

export default AudioPreview;
