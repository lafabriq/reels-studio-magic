import { useState } from "react";
import { motion } from "framer-motion";
import { Link, Loader2, CheckCircle2 } from "lucide-react";

interface ReelUrlInputProps {
  onSubmit: (url: string) => void;
  isLoading?: boolean;
  isLoaded?: boolean;
}

const ReelUrlInput = ({ onSubmit, isLoading, isLoaded }: ReelUrlInputProps) => {
  const [url, setUrl] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (url.trim()) onSubmit(url.trim());
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
    >
      <h2 className="font-display text-lg font-semibold mb-3 text-foreground">
        1. Вставь ссылку на Reel
      </h2>
      <form onSubmit={handleSubmit} className="flex gap-3">
        <div className="relative flex-1">
          <Link className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <input
            type="url"
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            placeholder="https://www.instagram.com/reel/..."
            className="w-full pl-10 pr-4 py-3 rounded-lg bg-secondary border border-border text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring font-body text-sm"
          />
        </div>
        <motion.button
          type="submit"
          disabled={!url.trim() || isLoading}
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          className="px-6 py-3 rounded-lg bg-primary text-primary-foreground font-display font-semibold text-sm disabled:opacity-40 disabled:cursor-not-allowed glow-primary transition-shadow"
        >
          {isLoading ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : isLoaded ? (
            <CheckCircle2 className="w-4 h-4" />
          ) : (
            "Загрузить"
          )}
        </motion.button>
      </form>
    </motion.div>
  );
};

export default ReelUrlInput;
