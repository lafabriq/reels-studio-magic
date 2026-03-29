# MCP Memory Bank - Reels Studio Magic

_Last updated: 2026-03-27_

## Project Information
- **Name**: Reels Studio Magic
- **Type**: React + TypeScript Web Application (статический фронтенд, бэкенда нет)
- **Repository**: https://github.com/lafabriq/reels-studio-magic (public)
- **Framework**: React 18.3 + TypeScript 5.8
- **Build Tool**: Vite 5.4
- **Deployment**: GitHub Pages + GitHub Actions CI/CD
- **Live URL**: https://lafabriq.github.io/reels-studio-magic/

## Architecture
- **Frontend**: React с компонентами Shadcn/ui (40+ компонентов из Radix UI)
- **Styling**: Tailwind CSS 3.4 + CSS-переменные (тёмная тема) + Framer Motion анимации
- **State Management**: React Query (TanStack) + локальный useState
- **Routing**: React Router 6 с `basename={import.meta.env.BASE_URL}` (важно для GitHub Pages!)
- **Forms**: React Hook Form + Zod validation
- **Package manager**: npm (bun.lockb есть, но npm используется в CI)

## Core Feature: Instagram Reels Loader
Пользователь вставляет ссылку на Reel → видео загружается и показывается прямо на сайте.

### Схема работы (src/hooks/use-reel-fetcher.ts)
```
Ссылка на Reel
    ↓
1. Cloudflare Turnstile (invisible widget, sitekey: 0x4AAAAAABBCV3tPrCXT9h2H)
    → решается автоматически (~2-5 сек)
    ↓
2. POST /session на cobalt instance (canine.tools)
    Header: cf-turnstile-response: <token>
    → получаем JWT Bearer токен
    ↓
3. POST / на cobalt instance
    Header: Authorization: Bearer <jwt>
    Body: { url: "<instagram_reel_url>" }
    → получаем { status: "tunnel"|"redirect"|"picker", url: "..." }
    ↓
4. Показываем <video src=...> плеер + кнопку скачать
```

### Cobalt instance
- **API**: `https://cobalt-backend.canine.tools/`
- **CORS**: `access-control-allow-origin: *` (работает из браузера)
- **Auth**: Cloudflare Turnstile → JWT Bearer
- **Версия cobalt**: 11.6
- **Uptime**: ~96%
- ⚠️ Это публичный сторонний инстанс — может упасть. Fallback: собственный Cloudflare Worker.

## Компоненты
| Файл | Назначение |
|------|-----------|
| `src/pages/Index.tsx` | Главная страница, оркестрирует все компоненты |
| `src/components/ReelUrlInput.tsx` | Поле ввода ссылки + кнопка «Загрузить» |
| `src/components/AudioPreview.tsx` | Видеоплеер (loading / error / video states) |
| `src/components/CharacterUploader.tsx` | Загрузка персонажей |
| `src/components/GeneratePanel.tsx` | Панель генерации мультфильма (пока simulate) |
| `src/hooks/use-reel-fetcher.ts` | Вся логика получения видео через cobalt API |

## Development Setup
```bash
npm install          # Установить зависимости (~500 пакетов)
npm run dev          # Dev-сервер → http://localhost:8080/
npm run build        # Production build → dist/
npm run test         # Тесты (Vitest)
npm run lint         # ESLint (0 errors, 7 warnings — не блокируют)
```

## Deployment
- Workflow: `.github/workflows/deploy.yml`
- Action versions: `actions/deploy-pages@v4` (v2 не работает — устарел!)
- Триггер: push в main
- GitHub Pages Source: GitHub Actions (не ветка!)
- Репозиторий должен быть **Public** (иначе Pages не работает на бесплатном плане)

## Исправленные проблемы (история)
1. `tailwind.config.ts` — заменён `require()` на ESM import (lint error)
2. `ui/command.tsx`, `ui/textarea.tsx` — пустые интерфейсы → type alias (lint error)
3. `deploy-pages@v2` → `@v4` (старая версия не работает с новым API GitHub)
4. `BrowserRouter` без `basename` → показывал 404 на GitHub Pages
5. `api.cobalt.tools` требует JWT → переключились на `cobalt-backend.canine.tools` с Turnstile auth

## Context 7 Integration
- Enabled: Yes
- Auto Context: Yes
- Memory Storage: Persistent (.mcp-memory/project-context.md)
