import { useState, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Plus, X, ImagePlus } from "lucide-react";

export interface Character {
  id: string;
  name: string;
  imageUrl: string;
  file: File;
}

interface CharacterUploaderProps {
  characters: Character[];
  onChange: (characters: Character[]) => void;
}

const CharacterUploader = ({ characters, onChange }: CharacterUploaderProps) => {
  const fileRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;
    const newChars: Character[] = Array.from(files).map((file) => ({
      id: crypto.randomUUID(),
      name: file.name.replace(/\.[^.]+$/, ""),
      imageUrl: URL.createObjectURL(file),
      file,
    }));
    onChange([...characters, ...newChars]);
    if (fileRef.current) fileRef.current.value = "";
  };

  const removeCharacter = (id: string) => {
    onChange(characters.filter((c) => c.id !== id));
  };

  const updateName = (id: string, name: string) => {
    onChange(characters.map((c) => (c.id === id ? { ...c, name } : c)));
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: 0.1 }}
    >
      <h2 className="font-display text-lg font-semibold mb-3 text-foreground">
        2. Загрузи персонажей
      </h2>
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
        <AnimatePresence>
          {characters.map((char) => (
            <motion.div
              key={char.id}
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.8 }}
              className="relative group rounded-xl overflow-hidden bg-secondary border border-border aspect-square"
            >
              <img
                src={char.imageUrl}
                alt={char.name}
                className="w-full h-full object-cover"
              />
              <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-background/90 to-transparent p-2">
                <input
                  value={char.name}
                  onChange={(e) => updateName(char.id, e.target.value)}
                  className="w-full bg-transparent text-xs text-foreground font-body focus:outline-none border-b border-border/50 focus:border-primary pb-0.5"
                />
              </div>
              <button
                onClick={() => removeCharacter(char.id)}
                className="absolute top-1.5 right-1.5 w-6 h-6 rounded-full bg-destructive/80 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
              >
                <X className="w-3 h-3 text-destructive-foreground" />
              </button>
            </motion.div>
          ))}
        </AnimatePresence>

        <motion.button
          whileHover={{ scale: 1.03 }}
          whileTap={{ scale: 0.97 }}
          onClick={() => fileRef.current?.click()}
          className="rounded-xl border-2 border-dashed border-border hover:border-primary/50 aspect-square flex flex-col items-center justify-center gap-2 text-muted-foreground hover:text-primary transition-colors"
        >
          <ImagePlus className="w-6 h-6" />
          <span className="text-xs font-body">Добавить</span>
        </motion.button>
      </div>
      <input
        ref={fileRef}
        type="file"
        accept="image/*"
        multiple
        onChange={handleFileSelect}
        className="hidden"
      />
    </motion.div>
  );
};

export default CharacterUploader;
