# MCP Memory Bank - Reels Studio Magic

## Project Information
- **Name**: Reels Studio Magic
- **Type**: React + TypeScript Web Application
- **Repository**: https://github.com/lafabriq/reels-studio-magic
- **Framework**: React 18.3 + TypeScript 5.8
- **Build Tool**: Vite 5.4
- **Deployment**: GitHub Pages + GitHub Actions CI/CD

## Architecture
- **Frontend**: React with Shadcn/ui components (40+ components)
- **Styling**: Tailwind CSS 3.4 + Framer Motion
- **State Management**: React Query (TanStack)
- **Routing**: React Router 6
- **Forms**: React Hook Form + Zod validation
- **UI Components**: Radix UI based

## Key Features
- Transform characters into cartoons with audio from Instagram Reels
- Character uploader component
- Audio preview functionality
- Generation panel with progress tracking
- Responsive design with motion effects

## Development Setup
```bash
npm install          # Install 499 dependencies
npm run dev          # Start dev server (port 8080)
npm run build        # Production build
npm run preview      # Preview production build
npm run test         # Run tests (Vitest)
npm run lint         # Lint code (ESLint)
```

## Deployment
- **GitHub Actions**: Automatic CI/CD on push to main
- **GitHub Pages**: https://lafabriq.github.io/reels-studio-magic/
- **Build Output**: dist/ (564 KB)
- **Status**: Live and operational

## Project Structure
```
src/
├── pages/           # Main pages (Index, NotFound)
├── components/      # React components
│   ├── ReelUrlInput
│   ├── CharacterUploader
│   ├── AudioPreview
│   ├── GeneratePanel
│   └── ui/          # Shadcn UI components library
├── hooks/           # Custom React hooks
├── lib/             # Utilities
└── test/            # Tests (Vitest)
```

## Recent Commits
1. d893e03 - chore: add deployment status verification file
2. cf49c5c - chore: update dependencies lock file
3. 3d83ca4 - docs: add deployment guide for GitHub Pages
4. ddaad95 - feat: add GitHub Pages deployment workflow

## Context 7 Integration
- Enabled: Yes
- Project Setup Info: Enabled
- Auto Context: Yes
- Memory Storage: Persistent
