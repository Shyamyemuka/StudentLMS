import dynamic from 'next/dynamic';

// Dynamically import the components
const HandDrawing = dynamic(() => import('@/components/fun/hand-drawing'), { ssr: false });
const MoodAnalyzer = dynamic(() => import('@/components/fun/mood-analyzer'), { ssr: false });
const HandGestureSphere = dynamic(() => import('@/components/fun/hand-gesture-sphere'), { ssr: false });

export interface Game {
  id: string;
  name: string;
  description: string;
  image: string;
  type: 'python' | 'javascript';
  pythonFile?: string;
  component?: React.ComponentType;
}

export const GAMES: Game[] = [
  {
    id: 'hand-gesture-sphere',
    name: 'Hand Gesture 3D Sphere',
    description: 'Control a 3D sphere using hand gestures. Rotate and zoom with your hands!',
    image: '/images/games/hand-gesture.png',
    type: 'javascript',
    component: HandGestureSphere
  },
  {
    id: 'hand-drawing',
    name: 'Hand Drawing',
    description: 'Draw using hand movements! Track your hand to create beautiful drawings.',
    image: '/images/games/hand-drawing.png',
    type: 'javascript',
    component: HandDrawing
  },
  {
    id: 'mood-analyzer',
    name: 'Mood Analyzer',
    description: 'Analyze your mood using facial expressions! AI-powered emotion detection.',
    image: '/images/games/mood-analyzer.png',
    type: 'javascript',
    component: MoodAnalyzer
  },
];
