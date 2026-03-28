import { useState } from "react";
import { motion } from "framer-motion";
import { ExternalLink, AlertCircle, Loader2 } from "lucide-react";

interface AudioPreviewProps {
  reelUrl: string;
  embedUrl?: string;
  error?: string;
  isLoading?: boolean;
}

const AudioPreview = ({ reelUrl, embedUrl, error, isLoading }: AudioPreviewProps) => {
  const [iframeLoading, setIframeLoading] = useState(true);

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

  // ── Embed ready ────────────────────────────────────────────────────────────
  if (embedUrl) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="glass rounded-xl overflow-hidden"
      >
        {/* Instagram embed iframe */}
        <div className="relative bg-black" style={{ minHeight: 560 }}>
          {iframeLoading && (
            <div className="absolute inset-0 flex items-center justify-center z-10">
              <Loader2 className="w-8 h-8 text-primary animate-spin" />
            </div>
          )}
          <iframe
            src={embedUrl}
            title="Instagram Reel"
            width="100%"
            height="560"
            frameBorder="0"
            scrolling="no"
            allowTransparency
            allow="autoplay; encrypted-media; picture-in-picture"
            className="w-full block"
            onLoad={() => setIframeLoading(false)}
          />
        </div>

        {/* Actions bar */}
        <div className="flex items-center justify-between px-4 py-3 gap-3">
          <p className="text-xs text-muted-foreground font-body truncate min-w-0">{reelUrl}</p>
          <a
            href={reelUrl}
            target="_blank"
            rel="noreferrer noopener"
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-primary text-primary-foreground text-xs font-display font-semibold shrink-0 hover:opacity-90 transition-opacity"
          >
            <ExternalLink className="w-3.5 h-3.5" />
            Открыть
          </a>
        </div>
      </motion.div>
    );
  }

  return null;
};

export default AudioPreview;

