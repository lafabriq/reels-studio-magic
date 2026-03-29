# GitHub Copilot Instructions — Reels Studio Magic

## Стек
- **React 18** + **TypeScript 5.8** + **Vite 5.4**
- **Tailwind CSS 3.4** (тёмная тема через CSS-переменные в `src/index.css`)
- **Shadcn/ui** (компоненты в `src/components/ui/` — не редактировать без причины)
- **Framer Motion** для анимаций
- **React Router 6** с `basename={import.meta.env.BASE_URL}` — обязательно для GitHub Pages
- **React Query (TanStack)** для серверного состояния
- **React Hook Form + Zod** для форм

## Ключевая функция: загрузка видео из Instagram Reels

Вся логика — в `src/hooks/use-reel-fetcher.ts`.

Схема:
1. **Turnstile** (Cloudflare invisible widget) → токен
2. `POST /session` на `https://cobalt-backend.canine.tools/` → JWT
3. `POST /` с `Authorization: Bearer <jwt>` → ссылка на видео
4. Видео отображается в `src/components/AudioPreview.tsx`

⚠️ `api.cobalt.tools` требует платный ключ — использовать `cobalt-backend.canine.tools`.  
⚠️ Все cobalt-инстансы требуют JWT через Turnstile — без него API вернёт `error.api.auth.jwt.missing`.

## Структура проекта
```
src/
├── pages/
│   ├── Index.tsx          # Главная страница — оркестрирует компоненты
│   └── NotFound.tsx       # 404
├── components/
│   ├── ReelUrlInput.tsx   # Ввод ссылки на Reel
│   ├── AudioPreview.tsx   # Видеоплеер (3 состояния: loading / error / video)
│   ├── CharacterUploader.tsx
│   ├── GeneratePanel.tsx
│   └── ui/                # Shadcn компоненты (не трогать)
├── hooks/
│   ├── use-reel-fetcher.ts  # Главный хук: Turnstile → JWT → cobalt → video
│   └── use-mobile.tsx
└── lib/utils.ts
```

## Деплой
- `git push origin main` → GitHub Actions автоматически деплоит на GitHub Pages
- Workflow: `.github/workflows/deploy.yml`
- Использовать `actions/deploy-pages@v4` (не v2 — устарел!)
- Репозиторий должен быть **публичным**; Pages Source = **GitHub Actions**
- Live: https://lafabriq.github.io/reels-studio-magic/

## Команды
```bash
npm run dev    # http://localhost:8080
npm run build  # production build → dist/
npm test       # vitest
npm run lint   # eslint (0 errors, 7 warnings допустимо)
```

## Правила кода
- Использовать `type` вместо пустых `interface` (линтер запрещает `no-empty-object-type`)
- Не использовать `require()` в `.ts`/`.tsx` — только ESM import
- Все новые хуки — в `src/hooks/`
- Имена файлов компонентов: PascalCase; хуков: kebab-case с префиксом `use-`
- Тёмная тема через CSS-переменные (`--primary`, `--background`, etc.) — не хардкодить цвета
- Анимации через `framer-motion`, не через CSS transitions напрямую

## Известные проблемы / gotchas
- `BrowserRouter` без `basename` → 404 на GitHub Pages (уже исправлено)
- `cobalt-backend.canine.tools` — сторонний инстанс, может упасть. Если упадёт — искать замену на https://instances.cobalt.best/ (фильтровать по turnstile + CORS)
- Turnstile `size: "invisible"` работает только на реальном домене (не `localhost`)
