import { motion } from "framer-motion";
import { Sparkles, Film, Clock, Wand2 } from "lucide-react";

interface GeneratePanelProps {
  canGenerate: boolean;
  onGenerate: () => void;
  isGenerating: boolean;
  progress: number;
}

const GeneratePanel = ({ canGenerate, onGenerate, isGenerating, progress }: GeneratePanelProps) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: 0.2 }}
      className="glass rounded-2xl p-6"
    >
      <h2 className="font-display text-lg font-semibold mb-4 text-foreground">
        3. Сгенерировать мультфильм
      </h2>

      <div className="grid grid-cols-3 gap-4 mb-6">
        <div className="flex flex-col items-center gap-1.5 p-3 rounded-xl bg-secondary/50">
          <Film className="w-5 h-5 text-primary" />
          <span className="text-xs text-muted-foreground font-body">9:16</span>
          <span className="text-[10px] text-muted-foreground">Reels формат</span>
        </div>
        <div className="flex flex-col items-center gap-1.5 p-3 rounded-xl bg-secondary/50">
          <Sparkles className="w-5 h-5 text-accent" />
          <span className="text-xs text-muted-foreground font-body">AI</span>
          <span className="text-[10px] text-muted-foreground">Анимация</span>
        </div>
        <div className="flex flex-col items-center gap-1.5 p-3 rounded-xl bg-secondary/50">
          <Clock className="w-5 h-5 text-primary" />
          <span className="text-xs text-muted-foreground font-body">~30с</span>
          <span className="text-[10px] text-muted-foreground">Длительность</span>
        </div>
      </div>

      {isGenerating && (
        <div className="mb-4">
          <div className="flex justify-between text-xs text-muted-foreground mb-1.5 font-body">
            <span>Генерация...</span>
            <span>{Math.round(progress)}%</span>
          </div>
          <div className="h-2 rounded-full bg-secondary overflow-hidden">
            <motion.div
              className="h-full rounded-full bg-gradient-to-r from-primary to-accent"
              initial={{ width: 0 }}
              animate={{ width: `${progress}%` }}
              transition={{ duration: 0.3 }}
            />
          </div>
        </div>
      )}

      <motion.button
        whileHover={canGenerate ? { scale: 1.02 } : {}}
        whileTap={canGenerate ? { scale: 0.98 } : {}}
        onClick={onGenerate}
        disabled={!canGenerate || isGenerating}
        className="w-full py-3.5 rounded-xl bg-gradient-to-r from-primary to-accent text-primary-foreground font-display font-bold text-sm flex items-center justify-center gap-2 disabled:opacity-40 disabled:cursor-not-allowed glow-primary transition-shadow"
      >
        <Wand2 className="w-4 h-4" />
        {isGenerating ? "Генерируем..." : "Создать Reel"}
      </motion.button>
    </motion.div>
  );
};

export default GeneratePanel;
