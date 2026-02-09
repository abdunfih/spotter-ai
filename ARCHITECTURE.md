# Spotter.AI - Architecture Diagram

## Component Hierarchy

```mermaid
graph TD
    App[Root Layout] --> WorkoutProvider
    WorkoutProvider --> HomePage
    WorkoutProvider --> PlaylistPage
    WorkoutProvider --> WorkoutPage

    HomePage --> Header
    HomePage --> SessionCards

    PlaylistPage --> BackButton
    PlaylistPage --> SessionTitle
    PlaylistPage --> ExerciseList
    ExerciseList --> ExerciseItems
    PlaylistPage --> StartButton

    WorkoutPage --> ExitButton
    WorkoutPage --> VideoViewport
    VideoViewport --> VideoFeed
    VideoViewport --> PoseCanvas
    WorkoutPage --> RestOverlay
    WorkoutPage --> CounterDisplay
    WorkoutPage --> BottomPanel
    BottomPanel --> StepPills
    BottomPanel --> AIStatus
    BottomPanel --> SkipButton
```

## Data Flow

```mermaid
sequenceDiagram
    participant User
    participant HomePage
    participant PlaylistPage
    participant WorkoutPage
    participant PoseEngine
    participant Context

    User->>HomePage: Select Session
    HomePage->>Context: setSession
    HomePage->>PlaylistPage: Navigate

    User->>PlaylistPage: Click Start
    PlaylistPage->>Context: setView('workout')
    PlaylistPage->>WorkoutPage: Navigate

    loop Workout Loop
        WorkoutPage->>PoseEngine: Initialize
        PoseEngine->>Context: onResults
        Context->>WorkoutPage: Update Reps
        WorkoutPage->>User: Show Rep Count

        alt Reps Complete
            Context->>WorkoutPage: Set Resting
            WorkoutPage->>RestOverlay: Show Timer
            RestOverlay->>Context: Timer Complete
            Context->>WorkoutPage: Next Exercise
        end
    end
```

## State Management

```mermaid
stateDiagram-v2
    [*] --> HomeView

    HomeView --> PlaylistView: Select Session
    PlaylistView --> HomeView: Go Back
    PlaylistView --> WorkoutView: Start Workout

    WorkoutView --> WorkoutView: Rep Complete
    WorkoutView --> RestView: Set Complete
    RestView --> WorkoutView: Next Exercise

    RestView --> PlaylistView: All Exercises Done
    WorkoutView --> HomeView: Exit
    RestView --> HomeView: Exit
```

## File Structure

```
spotter-ai/
├── app/
│   ├── globals.css
│   ├── layout.tsx
│   ├── page.tsx                    # Home
│   └── workout/
│       └── [sessionId]/
│           └── [exerciseIndex]/
│               └── page.tsx        # Workout View
├── components/
│   ├── workout/
│   │   ├── CounterDisplay.tsx
│   │   ├── PoseCanvas.tsx
│   │   ├── RestOverlay.tsx
│   │   ├── VideoViewport.tsx
│   │   └── WorkoutControls.tsx
│   └── ui/
│       ├── BackButton.tsx
│       ├── ExitButton.tsx
│       ├── SessionCard.tsx
│       └── StepPill.tsx
├── context/
│   └── WorkoutContext.tsx
├── hooks/
│   ├── useCamera.ts
│   ├── usePoseDetection.ts
│   ├── useTimer.ts
│   └── useWorkoutState.ts
├── lib/
│   ├── biometrics-engine.ts
│   ├── pose-utils.ts
│   └── sessions.ts
├── types/
│   └── index.ts
└── public/
    └── fonts/
```
