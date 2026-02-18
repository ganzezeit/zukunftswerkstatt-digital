# Zukunftswerkstatt Digital — Gamified Education Platform

## Project Context
This is the development repo for Zukunftswerkstatt Digital. 
Original app (Mission Weltverbinder) is a gamified project week app for schools in Berlin.
This repo is the evolution toward a full modular education platform.
The original production app is in a SEPARATE repo — do NOT break existing functionality.

## Quick Start
```
npm install && npm run dev → http://localhost:3000
```

## Tech Stack
- React 18 + Vite (JavaScript, NO TypeScript yet)
- Firebase Realtime Database (NOT Firestore)  
- Firebase Storage (image uploads)
- Inline styles (no CSS framework)
- Netlify Functions (serverless API)
- Replicate API (AI image/video/music generation)
- Anthropic Claude API (translation + prompt enhancement)
- pdfjs-dist (PDF slides), qrcode.react (QR codes)

## Architecture
Single-page app, screen-based routing via state (no React Router).
App.jsx = central state manager (830 lines).
Firebase = shared state between devices (class-based sessions).
localStorage = device-local persistence (energy, progress).

## Step Types (Mission Types)
Top-level types in days.js steps:
- activity — Text + timer + glossary tooltips
- multi-step — Card sequence with sub-steps
- kahoot — External URL (Kahoot quiz link)
- meet — External URL (video call link)  
- einzelquiz — Individual pre/post assessment

SubTypes (inside multi-step):
- text — Text card with optional boardConfig
- video — MP4 player (startTime/endTime)
- slides — PDF slideshow (pdfjs-dist)
- kahoot — Kahoot link as sub-step
- landeskunde — Country info slides + quiz
- lernkarten — Matching card game

## Key Components
| Component | Lines | Purpose |
|-----------|-------|---------|
| App.jsx | 830 | Central state, screen routing |
| ArtStudio.jsx | 2642 | AI art/video/music generation |
| ArtRoomPage.jsx | 1691 | Multi-device art studio (QR) |
| QuizSession.jsx | 1582 | Live Kahoot-style quiz engine |
| QuizPage.jsx | 1491 | Student quiz view |
| BoardCreator.jsx | 1366 | Board configuration panel |
| QuickBoardDialog.jsx | 1177 | Collaborative Padlet-style board |
| ChatPage.jsx | 981 | Multilingual chat + real-time translation |
| EinzelquizPage.jsx | 951 | Individual assessment |
| BoardPage.jsx | 934 | Board student view |
| QuizCreator.jsx | 505 | Quiz builder (reusable for Creator) |
| EinzelquizCreator.jsx | 590 | Assessment builder (reusable) |
| WeeklyReport.jsx | 594 | Weekly report generator |

## Firebase Database Paths
```
classes/{name}/state — Game progress (energy, completedSteps)
classes/{name}/taskTimings — Step start/complete timestamps
boards/{code} — Collaborative board posts
boardLinks/{taskId} — taskId → board code mapping
savedBoards/{id} — Persistent board data
sessions/{id} — Live quiz sessions
savedQuizzes/{id} — Saved quiz templates
quizResults/{id} — Quiz results
einzelquizzes/{id} — Individual quiz data
einzelquizResults/{class}/{type} — Assessment results
chatRooms/{id} — Chat messages
artRooms/{code} — AI art gallery
```

## Template Structure (days.js)
The core data model. Each day has steps, each step has a type and content.
This is what the Workshop Creator will generate via UI.
See src/data/days.js for the full structure.

Key schema:
```
Day: { id, name, sub, emoji, color, iconImage, dayIntro?, steps[] }
Step: { id, title, icon, type, energyCost, desc?, content }
SubStep: { title, subType, text?, content?, boardConfig? }
BoardConfig: { taskId?, referenceTaskId?, title, columns?, mode?, buttonLabel }
```

## Netlify Functions (API)
- generate-image — Claude API (prompt enhancement) + Replicate (generation)
- generate-video — Claude API + Replicate
- generate-music — Replicate
- poll-image — Replicate async polling
- translate — Claude API translation (DE↔EN↔SW↔TR↔FR↔AR)

## Env Vars
- CLAUDE_API_KEY — Anthropic API
- REPLICATE_API_KEY — Replicate API

## Current Development Focus
Building the Workshop Creator — a no-code editor that lets non-programmers 
create gamified workshops using the existing step types.

Phase 1: Template Schema formalization (JSON Schema from days.js structure)
Phase 2: Dynamic template loading (Firebase instead of hardcoded days.js)
Phase 3: Creator MVP (visual editor reusing QuizCreator, BoardCreator, etc.)

## Rules
- Do NOT break existing app functionality
- Match existing code style (inline styles, functional components)
- German for domain terms (Projektwoche, Energizer, Einzelquiz)
- English for technical terms (state, handler, component)
- Minimal new dependencies — ask before adding npm packages
- All new features must work on tablets (mobile-first)
