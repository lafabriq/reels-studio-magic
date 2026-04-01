export type SlideType = 'hero' | 'problem' | 'solution' | 'features' | 'details' | 'howto' | 'cta';

export type FeatureItem = { icon: string; label: string; description: string };
export type StepItem = { title: string; description: string };

export type SlideData = {
  id: string;
  type: SlideType;
  bgMode: 'light' | 'dark' | 'gradient';
  tag: string;
  heading: string;
  body: string;
  features?: FeatureItem[];
  steps?: StepItem[];
  ctaText?: string;
  pills?: string[];
};

export type FontPairKey = 'editorial' | 'modern' | 'warm' | 'technical' | 'bold' | 'classic' | 'rounded';

export type FontPair = {
  label: string;
  heading: string;
  body: string;
  headingWeight: number;
  googleUrl: string;
};

export const FONT_PAIRS: Record<FontPairKey, FontPair> = {
  editorial: {
    label: 'Editorial / premium',
    heading: 'Playfair Display',
    body: 'DM Sans',
    headingWeight: 600,
    googleUrl: 'https://fonts.googleapis.com/css2?family=Playfair+Display:wght@400;600;700&family=DM+Sans:wght@300;400;500;600&display=swap',
  },
  modern: {
    label: 'Modern / clean',
    heading: 'Plus Jakarta Sans',
    body: 'Plus Jakarta Sans',
    headingWeight: 700,
    googleUrl: 'https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@300;400;500;600;700&display=swap',
  },
  warm: {
    label: 'Warm / approachable',
    heading: 'Lora',
    body: 'Nunito Sans',
    headingWeight: 600,
    googleUrl: 'https://fonts.googleapis.com/css2?family=Lora:wght@400;600;700&family=Nunito+Sans:wght@300;400;500;600&display=swap',
  },
  technical: {
    label: 'Technical / sharp',
    heading: 'Space Grotesk',
    body: 'Space Grotesk',
    headingWeight: 600,
    googleUrl: 'https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@300;400;500;600;700&display=swap',
  },
  bold: {
    label: 'Bold / expressive',
    heading: 'Fraunces',
    body: 'Outfit',
    headingWeight: 600,
    googleUrl: 'https://fonts.googleapis.com/css2?family=Fraunces:wght@400;600;700&family=Outfit:wght@300;400;500;600&display=swap',
  },
  classic: {
    label: 'Classic / trustworthy',
    heading: 'Libre Baskerville',
    body: 'Work Sans',
    headingWeight: 700,
    googleUrl: 'https://fonts.googleapis.com/css2?family=Libre+Baskerville:wght@400;700&family=Work+Sans:wght@300;400;500;600&display=swap',
  },
  rounded: {
    label: 'Rounded / friendly',
    heading: 'Bricolage Grotesque',
    body: 'Bricolage Grotesque',
    headingWeight: 700,
    googleUrl: 'https://fonts.googleapis.com/css2?family=Bricolage+Grotesque:wght@300;400;500;600;700&display=swap',
  },
};

export type BrandConfig = {
  name: string;
  handle: string;
  primaryColor: string;
  useInitialLogo: boolean;
  fontPair: FontPairKey;
};

export function createDefaultSlides(): SlideData[] {
  return [
    {
      id: '1', type: 'hero', bgMode: 'light',
      tag: 'INTRODUCING',
      heading: 'Your bold headline that stops the scroll',
      body: 'A compelling subheadline that makes them want to swipe →',
    },
    {
      id: '2', type: 'problem', bgMode: 'dark',
      tag: 'THE PROBLEM',
      heading: "What's broken right now",
      body: 'Describe the pain point your audience experiences every single day.',
      pills: ['Old way #1', 'Old way #2', 'Old way #3'],
    },
    {
      id: '3', type: 'solution', bgMode: 'gradient',
      tag: 'THE SOLUTION',
      heading: "Here's what changes everything",
      body: '"A powerful quote or statement that captures your value proposition perfectly"',
    },
    {
      id: '4', type: 'features', bgMode: 'light',
      tag: 'WHAT YOU GET',
      heading: 'Built for results',
      body: '',
      features: [
        { icon: '⚡', label: 'Feature One', description: 'Quick explanation of this feature' },
        { icon: '🎯', label: 'Feature Two', description: 'Quick explanation of this feature' },
        { icon: '✨', label: 'Feature Three', description: 'Quick explanation of this feature' },
        { icon: '🔒', label: 'Feature Four', description: 'Quick explanation of this feature' },
      ],
    },
    {
      id: '5', type: 'details', bgMode: 'dark',
      tag: 'DETAILS',
      heading: 'What makes it different',
      body: 'Dive deeper into specs, customization options, or differentiators that set you apart from the rest.',
    },
    {
      id: '6', type: 'howto', bgMode: 'light',
      tag: 'HOW IT WORKS',
      heading: 'Get started in 3 steps',
      body: '',
      steps: [
        { title: 'Step one title', description: 'Brief explanation of first step' },
        { title: 'Step two title', description: 'Brief explanation of second step' },
        { title: 'Step three title', description: 'Brief explanation of third step' },
      ],
    },
    {
      id: '7', type: 'cta', bgMode: 'gradient',
      tag: 'GET STARTED',
      heading: 'Ready to transform your workflow?',
      body: 'Join thousands who already made the switch.',
      ctaText: 'Start Free →',
    },
  ];
}
