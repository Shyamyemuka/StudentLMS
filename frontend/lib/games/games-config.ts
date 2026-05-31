import dynamic from 'next/dynamic';

// Dynamically import the components
const HandGestureSphere = dynamic(() => import('@/components/fun/hand-gesture-sphere'), { ssr: false });
const HandDrawing = dynamic(() => import('@/components/fun/hand-drawing'), { ssr: false });
const MoodAnalyzer = dynamic(() => import('@/components/fun/mood-analyzer'), { ssr: false });
const MathBlitz = dynamic(() => import('@/components/fun/math-blitz'), { ssr: false });
const CodeRacer = dynamic(() => import('@/components/fun/code-racer'), { ssr: false });
const Subway = dynamic(() => import('@/components/fun/subway'), { ssr: false });

export interface Game {
  id: string;
  name: string;
  description: string;
  image: string;
  type: 'python' | 'javascript';
  pythonFile?: string;
  component?: React.ComponentType;
  isLeaderboardEligible?: boolean;
}

export const GAMES: Game[] = [
  {
    id: 'subway',
    name: 'Cyber Subway Surfer 🏃',
    description: 'Avoid oncoming trains, jump over roadblocks, and slide under barriers in this high-speed cyberpunk runner speed run! Record your score on the leaderboard!',
    image: '/images/games/subway.png',
    type: 'javascript',
    component: Subway,
    isLeaderboardEligible: true
  },
  {
    id: 'math-blitz',
    name: 'Math Blitz ⚡',
    description: 'Fast-paced mental math sprint! Answer as many math problems as you can in 60 seconds with multipliers for streaks.',
    image: '/images/games/math-blitz.png',
    type: 'javascript',
    component: MathBlitz,
    isLeaderboardEligible: true
  },
  {
    id: 'code-racer',
    name: 'Code Racer 🏎️',
    description: 'Type out blocks of code as fast and accurately as possible under the timer. Race for the top typing WPM!',
    image: '/images/games/code-racer.png',
    type: 'javascript',
    component: CodeRacer,
    isLeaderboardEligible: true
  },
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
