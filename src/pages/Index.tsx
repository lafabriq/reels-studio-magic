import { useState } from "react";
import { Link } from "react-router-dom";

const Index = () => {
  const [url, setUrl] = useState("");
  const [videoUrl, setVideoUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleFetch = async () => {
    if (!url.trim()) return;
    setLoading(true);
    setError(null);
    setVideoUrl(null);
    // TODO: backend call
    setLoading(false);
    setError("бэкенд ещё не подключён");
  };

  return (
    <div className="min-h-screen bg-white">
      {/* Logo */}
      <header className="p-8 flex items-center justify-between">
        <span className="text-xs font-light text-neutral-700 tracking-[0.3em] lowercase select-none">
          la content fabrique
        </span>
        <Link
          to="/carousel"
          className="px-4 py-2 text-xs tracking-widest uppercase bg-neutral-900 text-white hover:bg-neutral-700 transition-colors"
        >
          Carousel Generator
        </Link>
      </header>

      <main className="max-w-xl mx-auto px-6 pt-16 space-y-8">

        {/* Zone 1 — URL input */}
        <div className="space-y-3">
          <p className="text-xs tracking-widest text-neutral-400 uppercase">reel url</p>
          <div className="flex gap-3">
            <input
              type="text"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleFetch()}
              placeholder="https://www.instagram.com/reel/..."
              className="flex-1 border border-neutral-200 rounded-none px-4 py-3 text-sm text-neutral-800 placeholder-neutral-300 outline-none focus:border-neutral-500 transition-colors"
            />
            <button
              onClick={handleFetch}
              disabled={loading || !url.trim()}
              className="px-6 py-3 text-xs tracking-widest uppercase bg-neutral-900 text-white disabled:opacity-30 hover:bg-neutral-700 transition-colors"
            >
              {loading ? "..." : "get"}
            </button>
          </div>
          {error && (
            <p className="text-xs text-red-400">{error}</p>
          )}
        </div>

        {/* Zone 2 — Video */}
        {videoUrl && (
          <div className="space-y-3">
            <p className="text-xs tracking-widest text-neutral-400 uppercase">video</p>
            <video
              src={videoUrl}
              controls
              className="w-full border border-neutral-100"
            />
          </div>
        )}

      </main>
    </div>
  );
};

export default Index;
