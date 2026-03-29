import { motion } from "framer-motion";
import { Download, AlertCircle, Loader2, Play } from "lucide-react";

interface AudioPreviewProps {
  reelUrl: string;
  videoUrl?: string;
  error?: string;
  isLoading?: boolean;
}

const AudioPreview = ({ reelUrl, videoUrl, error, isLoading }: AudioPreviewProps) => {
  // ── Loading state ──────────────────────────────────────────────────────────
  if (isLoading) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="glass rounded-xl p-6 flex flex-col items-center gap-3"
      >
        <Loader2 className="w-8 h-8 text-primary animate-spin" />
        <p className="text-sm text-muted-foreground font-body">Загружаем видео…</p>
      </motion.div>
    );
  }

  // ── Error state ────────────────────────────────────────────────────────────
  if (error) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="glass rounded-xl p-4 flex items-start gap-3 border border-destructive/40"
      >
        <AlertCircle className="w-5 h-5 text-destructive shrink-0 mt-0.5" />
        <div>
          <p className="text-sm font-semibold text-foreground font-display">Не удалось загрузить</p>
          <p className="text-xs text-muted-foreground font-body mt-0.5">{error}</p>
        </div>
      </motion.div>
    );
  }

  // ── Video ready ────────────────────────────────────────────────────────────
  if (videoUrl) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="glass rounded-xl overflow-hidden"
      >
        <div className="relative bg-black rounded-t-xl overflow-hidden" style={{ aspectRatio: "9/16", maxHeight: 480 }}>
          <video
            src={videoUrl}
            controls
            playsInline
            className="w-full h-full object-contain"
          />
        </div>
        <div className="flex items-center justify-between px-4 py-3 gap-3">
          <div className="flex items-center gap-2 min-w-0">
            <Play className="w-4 h-4 text-primary shrink-0" />
            <p className="text-xs text-muted-foreground font-body truncate">{reelUrl}</p>
          </div>
          <a
            href={videoUrl}
            download
            target="_blank"
            rel="noreferrer"
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-primary text-primary-foreground text-xs font-display font-semibold shrink-0 hover:opacity-90 transition-opacity"
          >
            <Download className="w-3.5 h-3.5" />
            Скачать
          </a>
        </div>
      </motion.div>
    );
  }

  return null;
};

export default AudioPreview;

