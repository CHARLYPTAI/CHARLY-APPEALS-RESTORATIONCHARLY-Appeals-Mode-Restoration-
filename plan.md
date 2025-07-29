# CHARLY 2.0 UI Recovery & Reintegration Plan

## Core Philosophy
Invisible Excellence. Restore CHARLY’s adaptive, intelligent UI canvas using progressive disclosure and Jony Ive–style design fidelity. Eliminate all frontend ambiguity, and reconnect the full Appeals Mode to backend data.

## Execution Objectives
- Replace broken or missing Appeals UI with the correct 1802-line master version.
- Restore full routing, tab control, and CanvasOrchestrator transition logic.
- Connect all 5 modes (Portfolio, Analysis, Intelligence, Appeals, Results) into a single adaptive canvas.
- Implement Apple-style design system with Tailwind grid, SF Pro typography, and intelligent motion.

## High-Level Flow
1. Read missing or corrupted Appeals.tsx from components and/or pages.
2. Confirm correct 1802-line version and reconnect all imports, hooks, and modes.
3. Rebuild the `CanvasOrchestrator` to intelligently switch modes with crossfade.
4. Restore Suspense and lazy loading for all 5 modes.
5. Verify and fix navigation to `/appeals`, including keyboard + deep links.
6. Reconnect packet generation backend API to this restored UI.
7. Audit all props, types, and store interactions for TS compliance.
8. Trigger end-to-end render from Dashboard → Appeals → Packet submission.
