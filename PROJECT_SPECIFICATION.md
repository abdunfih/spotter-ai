# Spotter.AI - Next.js Conversion Project Specification

## Project Overview

**Name:** Spotter.AI - Relative Biometrics v30
**Target:** Convert HTML/React standalone app to Next.js with TypeScript
**Tech Stack:**
- Next.js 14+ (App Router)
- TypeScript
- Tailwind CSS
- MediaPipe Pose (@mediapipe/pose, @mediapipe/camera_utils)
- React Context for state management

## Application Architecture

```
spotter-ai/
├── app/
│   ├── layout.tsx          # Root layout with providers
│   ├── page.tsx           # Home page (session selection)
│   ├── playlist/
│   │   └── [sessionId]/   # Playlist view for each session
│   │       └── page.tsx
│   ├── workout/
│   │   └── [sessionId]/[exerciseIndex]/
│   │       └── page.tsx   # Active workout view
│   └── globals.css        # Global styles + Tailwind
├── components/
│   ├── ui/
│   │   ├── SessionCard.tsx
│   │   ├── ExerciseListItem.tsx
│   │   ├── StepPill.tsx
│   │   └── ExitButton.tsx
│   ├── workout/
│   │   ├── VideoViewport.tsx
│   │   ├── PoseCanvas.tsx
│   │   ├── RepCounter.tsx
│   │   ├── RestOverlay.tsx
│   │   └── WorkoutControls.tsx
│   └── layout/
│       ├── Header.tsx
│       └── Navigation.tsx
├── hooks/
│   ├── usePoseDetection.ts
│   ├── useCamera.ts
│   ├── useWorkoutState.ts
│   └── useTimer.ts
├── lib/
│   ├── sessions.ts        # Workout session data
│   ├── pose-utils.ts      # Geometry/math utilities
│   └── biometrics-engine.ts # Relative Biometrics logic
├── types/
│   └── index.ts           # TypeScript type definitions
├── context/
│   └── WorkoutContext.tsx
├── public/
│   └── fonts/             # Custom fonts (Outfit, JetBrains Mono)
└── next.config.js
```

## Core Features

### 1. Workout Sessions
- **Lower Body:** Jumping Jacks → Strict Squats → Depth Lunges → Quad Recovery
- **Upper Body:** Jumping Jacks → Push-ups → Pike Focus → Arm Stretch
- **Core Section:** Jumping Jacks → Ab Crunches → Leg Raises → Cobra Hold
- **Cardio Burn:** Jumping Jacks → Burpees → Mountain Climbers → Deep Breaths

### 2. Exercise Phases
- **WARM:** High rep warm-up (30 reps, 1 set)
- **TRAIN:** Main exercises (12 reps, 3 sets)
- **COOL:** Recovery hold (30 seconds, 1 set)

### 3. AI Pose Detection Engine
- MediaPipe Pose for real-time body tracking
- Relative Biometrics v30 algorithm
- Exercise-specific logic:
  - `jack`: Jumping jacks detection
  - `squat`: Squat form analysis
  - `pushup`: Push-up rep counting
  - `hold`: Static hold detection

### 4. UI Components

#### Home Page (`app/page.tsx`)
- Cyber-grid background
- Session selection cards
- Neon green accent colors
- Responsive layout

#### Playlist View (`app/playlist/[sessionId]/page.tsx`)
- Exercise list with progress indicators
- Phase badges (WARM/TRAIN/COOL)
- Goal labels
- Start workout button

#### Workout View (`app/workout/[sessionId]/[exerciseIndex]/page.tsx`)
- Full-screen video viewport
- Pose overlay canvas
- Real-time rep counter
- Set progress
- Rest/cool-down timer
- AI status feedback
- Step navigation

## TypeScript Interfaces

```typescript
// types/index.ts

export type ExercisePhase = 'WARM' | 'TRAIN' | 'COOL';
export type ExerciseLogic = 'jack' | 'squat' | 'pushup' | 'hold' | 'crunch';

export interface Exercise {
  id: string;
  seq: number;
  name: string;
  phase: ExercisePhase;
  logic: ExerciseLogic;
  targetReps: number;
  targetSets: number;
  goalLabel: string;
}

export interface Session {
  key: string;
  title: string;
  list: Exercise[];
}

export interface WorkoutState {
  view: 'home' | 'playlist' | 'workout';
  session: Session | null;
  step: number;
  reps: number;
  currentSet: number;
  isResting: boolean;
  timerSec: number;
  status: string;
}

export interface PoseLandmark {
  x: number;
  y: number;
  z: number;
  visibility: number;
}
```

## Tailwind Theme Configuration

```typescript
// tailwind.config.ts
export default {
  theme: {
    extend: {
      colors: {
        neon: '#00ff41',
        bg: '#0a0a0a',
        stop: '#ef4444',
        recovery: '#00d1ff',
      },
      fontFamily: {
        sans: ['var(--font-outfit)', 'sans-serif'],
        mono: ['var(--font-jetbrains-mono)', 'monospace'],
      },
      backgroundImage: {
        'cyber-grid': 'radial-gradient(#00ff41 1px, transparent 0)',
      },
    },
  },
}
```

## Global CSS Variables

```css
/* app/globals.css */
:root {
  --neon: #00ff41;
  --bg: #0a0a0a;
  --stop: #ef4444;
  --recovery: #00d1ff;
}

.glass {
  background: rgba(255, 255, 255, 0.05);
  backdrop-filter: blur(20px);
  border-top: 1px solid rgba(255, 255, 255, 0.1);
}

.active-pill {
  background: var(--neon) !important;
  color: black !important;
  font-weight: 900;
  box-shadow: 0 0 25px var(--neon);
}
```

## Key Implementation Details

### 1. Pose Detection Hook

```typescript
// hooks/usePoseDetection.ts
import { useCallback, useRef, useState } from 'react';
import { Pose, Results } from '@mediapipe/pose';

export function usePoseDetection(onResults: (results: Results) => void) {
  const poseRef = useRef<Pose | null>(null);
  const [isReady, setIsReady] = useState(false);

  const initialize = useCallback(async () => {
    const pose = new Pose({
      locateFile: (file) => `https://cdn.jsdelivr.net/npm/@mediapipe/pose/${file}`,
    });
    
    pose.setOptions({
      modelComplexity: 0,
      smoothLandmarks: true,
      minDetectionConfidence: 0.6,
      minTrackingConfidence: 0.6,
    });
    
    pose.onResults(onResults);
    poseRef.current = pose;
    setIsReady(true);
  }, [onResults]);

  return { poseRef, isReady, initialize };
}
```

### 2. Biometrics Engine

```typescript
// lib/biometrics-engine.ts
export function getAngle(a: PoseLandmark, b: PoseLandmark, c: PoseLandmark): number {
  const radians = Math.atan2(c.y - b.y, c.x - b.x) - Math.atan2(a.y - b.y, a.x - b.x);
  const angle = Math.abs(radians * 180.0 / Math.PI);
  return angle > 180 ? 360 - angle : angle;
}

export function detectJackState(landmarks: PoseLandmark[], shoulderWidth: number) {
  const ankleDist = Math.abs(landmarks[27].x - landmarks[28].x);
  const handsY = (landmarks[15].y + landmarks[16].y) / 2;
  const noseY = landmarks[0].y;

  const isNeutral = ankleDist < shoulderWidth * 1.2 && handsY > landmarks[11].y;
  const isPeak = ankleDist > shoulderWidth * 1.5 && handsY < noseY;

  return { isNeutral, isPeak };
}
```

### 3. Workout Context

```typescript
// context/WorkoutContext.tsx
interface WorkoutContextType {
  session: Session | null;
  step: number;
  reps: number;
  currentSet: number;
  isResting: boolean;
  status: string;
  // ... methods
}

export function WorkoutProvider({ children }) {
  const [session, setSession] = useState<Session | null>(null);
  const [step, setStep] = useState(0);
  const [reps, setReps] = useState(0);
  const [currentSet, setCurrentSet] = useState(1);
  const [isResting, setIsResting] = useState(false);
  const [status, setStatus] = useState('ALIGNING...');

  // ... implementation
}
```

## Implementation Phases

### Phase 1: Project Setup
1. Initialize Next.js with TypeScript and Tailwind
2. Configure tailwind.config.ts with custom theme
3. Set up fonts (Outfit, JetBrains Mono)
4. Create basic folder structure

### Phase 2: Core Infrastructure
1. Define TypeScript interfaces
2. Create session data module
3. Implement React Context for workout state
4. Set up MediaPipe pose detection

### Phase 3: Components
1. Build UI components (SessionCard, StepPill, etc.)
2. Create workout components (VideoViewport, PoseCanvas, RepCounter)
3. Implement rest overlay and timer
4. Add workout controls

### Phase 4: Pages
1. Home page with session selection
2. Playlist view with exercise list
3. Active workout view with full functionality

### Phase 5: Polish
1. Add animations and transitions
2. Ensure responsive design
3. Test on various devices
4. Optimize performance

## Dependencies

```json
{
  "dependencies": {
    "next": "14.x",
    "react": "18.x",
    "react-dom": "18.x",
    "@mediapipe/pose": "^0.5.x",
    "@mediapipe/camera_utils": "^0.3.x",
    "clsx": "^2.x",
    "tailwind-merge": "^2.x"
  },
  "devDependencies": {
    "typescript": "^5.x",
    "tailwindcss": "^3.x",
    "autoprefixer": "^10.x",
    "postcss": "^8.x"
  }
}
```

## Next Steps

1. Approve this specification
2. Switch to Code mode to initialize the project
3. Follow the implementation phases sequentially
4. Test each component before moving to the next phase
