# Deployment Guide - Reels Studio Magic

## GitHub Pages Deployment

### Automatic Deployment Setup

The project is configured with GitHub Actions to automatically build and deploy to GitHub Pages on every push to the `main` branch.

### Configuration Files

1. **`.github/workflows/deploy.yml`** - GitHub Actions workflow that:
   - Checks out the code
   - Installs dependencies
   - Builds the project with `npm run build`
   - Uploads the `dist/` folder to GitHub Pages
   - Deploys automatically

2. **`vite.config.ts`** - Updated with correct base path:
   - Production: `/reels-studio-magic/`
   - Development: `/` (local testing)

### Enable GitHub Pages

1. Go to: https://github.com/lafabriq/reels-studio-magic/settings/pages
2. Under "Source", select **"GitHub Actions"**
3. Click "Save"

### Access Your Deployed App

After enabling GitHub Pages, your app will be available at:
```
https://lafabriq.github.io/reels-studio-magic/
```

### Manual Deployment

To build and deploy manually:

```bash
# Install dependencies
npm install

# Build the project
npm run build

# The dist/ folder is ready for deployment
```

### Troubleshooting

- **Pages not showing**: Check that GitHub Pages is enabled in repository settings
- **Blank page**: Ensure base path in vite.config.ts matches your repository name
- **Build fails**: Check GitHub Actions logs in the "Actions" tab of your repository

## Local Development

```bash
npm run dev      # Start development server on http://localhost:8080
npm run build    # Build for production
npm run preview  # Preview production build locally
```
