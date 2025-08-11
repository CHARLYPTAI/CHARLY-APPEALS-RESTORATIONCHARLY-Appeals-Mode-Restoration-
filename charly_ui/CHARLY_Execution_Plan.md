# 📘 CHARLY 2.0 Execution Plan
This is the Claude Code–ready, prompt-by-prompt plan to complete CHARLY’s Jony Ive–inspired UI/UX.  
Each task includes:
- 🧠 Structured prompt
- 🧪 QA checklist
- ✅ Git commit command
- 📌 Status tracking (⬜ Not Started, 🟡 In Progress, ✅ Completed)

---

## 🔖 Master Prompt Tracker

## 🔖 Master Prompt Tracker

| ID  | Feature / Component                     | File(s) Affected                                          | Prompt Type             | Status        |
|-----|------------------------------------------|-----------------------------------------------------------|--------------------------|---------------|
| 1A  | Fix context props                        | `PortfolioContext.tsx`, `PortfolioMode.tsx`              | Prop Wiring              | ⬜ Completed
| 1B  | Recover broken render                    | `PortfolioMode.tsx`                                       | Full File Rewrite        | ⬜ Completed|
| 1C  | Add bulk filter logic                    | `PortfolioMode.tsx`                                       | Feature Add + QA         | ⬜ Not Started |
| 2A  | Fix flag toggle bug                      | `PortfolioContext.tsx`, `PortfolioMode.tsx`              | TypeScript Fix           | ⬜ Not Started |
| 2B  | Fix analyze button state logic           | `PortfolioContext.tsx`, `PortfolioMode.tsx`              | TS Fix + Wiring          | ⬜ Not Started |
| 3A  | Restore ResultsCanvas summary UI         | `ResultsCanvas.tsx`                                       | Full File Rewrite        | ⬜ Not Started |
| 3B  | Add success state after appeal           | `ResultsCanvas.tsx`                                       | Feature Add              | ⬜ Not Started |
| 3C  | Fix delta % visuals                      | `ResultsCanvas.tsx`                                       | Visual Fix               | ⬜ Not Started |
| 4A  | Normalize layout + grid spacing          | `PortfolioMode.tsx`                                       | Layout Refinement        | ⬜ Not Started |
| 4B  | Fix flag persistence across views        | `PortfolioContext.tsx`, `PortfolioMode.tsx`, `ResultsCanvas.tsx` | State Bug Fix             | ⬜ Not Started |
| 4C  | Add green shimmer loading indicator      | `PortfolioMode.tsx`, `ResultsCanvas.tsx`                 | Visual Enhancement       | ⬜ Not Started |
| 5A  | Wire CompareProperties to selection      | `PortfolioMode.tsx`, `CompareProperties.tsx`             | Prop Wiring              | ⬜ Not Started |
| 5B  | Confirm `analysisResults` structure      | `PortfolioContext.tsx`, `types/portfolio.ts`, `AnalysisPanel.tsx` | Type Refinement           | ⬜ Not Started |
| 5C  | Restore hover + select behavior in Results | `ResultsCanvas.tsx`, `PropertyCard.tsx`, `PortfolioContext.tsx` | Event Wiring              | ⬜ Not Started |
| 6A  | Stabilize Canvas mode routing            | `DashboardV3Working.tsx`, `CanvasOrchestrator.tsx`, `CanvasContext.tsx` | Routing Logic             | ⬜ Not Started |
| 6B  | Fix progressive disclosure interactions  | `PortfolioMode.tsx`, `CanvasDisclosure.tsx`, `Accordion.tsx` | UI Behavior Fix           | ⬜ Not Started |
| 6C  | Reset state on canvas mode switch        | `CanvasContext.tsx`, `PortfolioContext.tsx`              | Context Reset Logic      | ⬜ Not Started |
| 7A  | Final UI QA sweep                        | `PortfolioMode.tsx`, `ResultsCanvas.tsx`, `CanvasOrchestrator.tsx` | QA + UI Fix               | ⬜ Not Started |


---

## 🧩 Prompt 1A: Fix Context Props in `PortfolioContext.tsx`

**🧠 Prompt Type:** Prop/Context Wiring  
**📂 File(s):**  
- `src/contexts/PortfolioContext.tsx`  
- `src/pages/PortfolioMode.tsx`

### 📝 Claude Prompt

```plaintext
Open:
code src/contexts/PortfolioContext.tsx
code src/pages/PortfolioMode.tsx

Claude, please inspect both files.

The context provider is missing key props used by `PortfolioMode`:
- sortedAndFilteredProperties
- filterStatus
- setShowAddPropertyModal
- compareProperties
- isAnalyzing
- onAnalyzeProperties
- onFlagProperty

Please wire these props correctly:
- Ensure they are created, exported, typed, and consumed in `PortfolioMode`
- Do not invent new props or logic
- Do not use `any` – use existing interfaces
- Do not delete unrelated props or values
✅ QA Checklist
 TS compiles: npm run build

 Tests pass: npm test

 Verified in UI: PortfolioMode renders without error

 Confirmed no any or magic state was introduced

 All wired props match actual usage

 Claude did not hallucinate logic

💾 Git Commit Command
bash
Copy
Edit
git status
git add src/contexts/PortfolioContext.tsx src/pages/PortfolioMode.tsx
git commit -m "✅ 1A – Fix: PortfolioContext props wired to PortfolioMode"
📌 Status: ⬜ Completed


🧩 Prompt 1B: Restore PortfolioMode.tsx Rendering
🧠 Prompt Type: Full File Rewrite
📂 File(s): src/pages/PortfolioMode.tsx

📝 Claude Prompt
plaintext
Copy
Edit
Open:
code src/pages/PortfolioMode.tsx

Claude, this file fails to render properly due to broken context wiring and missing state.

Please:
- Rewrite `PortfolioMode.tsx` while preserving the Jony Ive UI layout
- Keep structure, floating shadows, progressive disclosure, and action buttons
- Do not remove any key logic (bulk action, analysis, flagging)
- Refactor only what’s necessary to restore clean rendering

Constraints:
- Use Tailwind and shadcn/ui only
- Ensure imports match file tree
- Use props/context from `PortfolioContext`
✅ QA Checklist
 File renders visually with no console errors

 Canvas UI structure is preserved

 All buttons and interactions are still present

 No logic removed or commented out

 Imports are clean, valid, and used

 TS passes: npm run build

💾 Git Commit
bash
Copy
Edit
git add src/pages/PortfolioMode.tsx
git commit -m "✅ 1B – Fix: PortfolioMode.tsx rendering + context integration"
📌 Status: ⬜ Completed


🧩 Prompt 1C: Add Filtering Logic to Portfolio Table
🧠 Prompt Type: Feature Add + QA
📂 File(s): src/pages/PortfolioMode.tsx

📝 Claude Prompt
plaintext
Copy
Edit
Open:
code src/pages/PortfolioMode.tsx

Claude, please add UI logic to support filtering properties by:
- Status (flagged, reviewed, analyzed)
- Ownership type (single, portfolio)
- Manual tags (optional later)

Use shadcn/ui ToggleGroup or similar to render clean UI filters.

Constraints:
- Filtering must occur against `sortedAndFilteredProperties`
- Do not mutate original list
- Preserve UI responsiveness

Style:
- Follow CHARLY UI design: Apple blue, floating shadows, SF Pro
- Filters must appear in Canvas header panel

Add relevant types, handlers, and update JSX.
✅ QA Checklist
 Toggle group UI renders

 Clicking each toggle filters visible properties

 Original data is untouched

 Uses existing filterStatus logic from context

 Verified in browser with different filter states

💾 Git Commit
bash
Copy
Edit
git add src/pages/PortfolioMode.tsx
git commit -m "✅ 1C – Add: Property filtering logic in PortfolioMode"
📌 Status: ⬜ Not Started


🧠 Prompt Writing Rules (Recap)
Always open the file(s) with code command first

One prompt at a time – no skipping

Copy/paste prompt exactly as shown

Run tests and build before commit

Use second Claude window to review diffs

Mark ✅ only when all checklist items pass

🔚 End of Starter Template
Add more prompt blocks below as needed.


## 🧩 Prompt 2A: Fix `onFlagProperty` Logic in Context

**🧠 Prompt Type:** TypeScript Fix  
**📂 File(s):**  
- `src/contexts/PortfolioContext.tsx`  
- `src/pages/PortfolioMode.tsx`

### 📝 Claude Prompt

```plaintext
Open:
code src/contexts/PortfolioContext.tsx
code src/pages/PortfolioMode.tsx

Claude, the `onFlagProperty` handler is defined in context but isn't functioning properly in `PortfolioMode`.

Symptoms:
- Flagging a property does not update UI state
- The value isn't persisted or toggled correctly

Please:
- Fix `onFlagProperty` logic so it toggles the flagged status of a property in place
- Ensure the function is typed and safe
- Validate that state is correctly updated and triggers a re-render

Constraints:
- Do not mutate state directly
- Use functional updates for `setPortfolioData`
- Do not invent new state or use `any`
- Do not remove existing handlers or unrelated values
✅ QA Checklist
 onFlagProperty updates flagged state in PortfolioContext

 Flag state toggles visually in PortfolioMode

 TS passes: npm run build

 No console errors on click

 No hallucinated state, props, or imports

💾 Git Commit
bash
Copy
Edit
git add src/contexts/PortfolioContext.tsx src/pages/PortfolioMode.tsx
git commit -m "✅ 2A – Fix: onFlagProperty toggle logic and UI sync"
📌 Status: ⬜ Not Started


🧩 Prompt 2B: Fix onAnalyzeProperties State Toggle
🧠 Prompt Type: TypeScript Fix + Wiring
📂 File(s):

src/contexts/PortfolioContext.tsx

src/pages/PortfolioMode.tsx

📝 Claude Prompt
plaintext
Copy
Edit
Open:
code src/contexts/PortfolioContext.tsx
code src/pages/PortfolioMode.tsx

Claude, the `onAnalyzeProperties` function does not properly toggle the analyzing state.

Symptoms:
- `isAnalyzing` state never flips to `true`
- No visible processing spinner or UI feedback
- Analysis results are not showing up

Please:
- Fix the `onAnalyzeProperties` handler to properly:
  1. Set `isAnalyzing = true`
  2. Perform async analysis (use delay or mock if needed)
  3. Store result in `analysisResults`
  4. Set `isAnalyzing = false`

Constraints:
- Preserve state shape
- Do not bypass async flow
- Do not use `any`
- Respect existing context model

Confirm:
- UI shows shimmer state
- Results panel populates correctly
✅ QA Checklist
 isAnalyzing toggles as expected

 UI displays loading shimmer during analysis

 analysisResults state is populated and accessible

 TS build passes

 Test results match expected structure

💾 Git Commit
bash
Copy
Edit
git add src/contexts/PortfolioContext.tsx src/pages/PortfolioMode.tsx
git commit -m "✅ 2B – Fix: Analyze button and loading state logic"
📌 Status: ⬜ Not Started


🧩 Prompt 3A: Restore ResultsCanvas.tsx and Summary Display
🧠 Prompt Type: Full File Rewrite
📂 File(s): src/pages/ResultsCanvas.tsx

📝 Claude Prompt
plaintext
Copy
Edit
Open:
code src/pages/ResultsCanvas.tsx

Claude, this canvas page is broken and currently renders a blank state.

Please:
- Restore `ResultsCanvas.tsx` so it renders summary results cleanly
- Include total cases appealed, success rates, total $ reduced
- Reuse existing context state (e.g. `analysisResults` or `appealResults`)
- Match Jony Ive–style layout: floating card grid, soft typography, SF Pro
- Include sparkline or bar indicator (use placeholder if needed)

Constraints:
- Do not fabricate data
- Pull real values from context or mock if not yet wired
- Use Tailwind + shadcn/ui only
- Respect CHARLY design language (Apple blue, 64px grid, progressive disclosure)

Include comments to clarify layout sections.
✅ QA Checklist
 Canvas renders cleanly with summary metrics

 No console errors

 Uses real data or mocks with clear markers

 Responsive layout follows CHARLY grid and colors

 Build passes

💾 Git Commit
bash
Copy
Edit
git add src/pages/ResultsCanvas.tsx
git commit -m "✅ 3A – Restore ResultsCanvas.tsx with summary UI"
📌 Status: ⬜ Not Started


## 🧩 Prompt 3B: Add Success State to ResultsCanvas

**🧠 Prompt Type:** Feature Add + UI Wiring  
**📂 File(s):** `src/pages/ResultsCanvas.tsx`

### 📝 Claude Prompt

```plaintext
Open:
code src/pages/ResultsCanvas.tsx

Claude, please enhance `ResultsCanvas.tsx` by adding a visual "Success" state once an appeal is marked completed.

Requirements:
- Show success confirmation (e.g. green check, confetti, or "Appeal Submitted")
- Pull data from `appealResults` or placeholder context state
- Animate in (0.3s fade/slide) using Tailwind transitions
- Add a “Return to Dashboard” button using shadcn/ui

Constraints:
- No fake data — use real flags from context
- Use CHARLY colors: success green #34C759, Apple blue #007AFF
- Avoid blocking UI; use a floating card or overlay

Do not break existing summary layout.
✅ QA Checklist
 Appealed cases trigger success display

 Success state shows animation

 “Return” button links back to DashboardV3Working.tsx

 Tailwind transitions used

 UI responsive + clean

💾 Git Commit
bash
Copy
Edit
git add src/pages/ResultsCanvas.tsx
git commit -m "✅ 3B – Add: Appeal success state to ResultsCanvas"
📌 Status: ⬜ Not Started


🧩 Prompt 3C: Fix % Delta Visuals in Results View
🧠 Prompt Type: TypeScript Fix + Visual Update
📂 File(s): src/pages/ResultsCanvas.tsx

📝 Claude Prompt
plaintext
Copy
Edit
Open:
code src/pages/ResultsCanvas.tsx

Claude, the delta/variance visuals in `ResultsCanvas` are broken.

Fix:
- Percent differences should calculate from `original_value` and `final_value`
- Format to ±X% with green/red color coding
- Add bar indicator or minimalist sparkline (shadcn/ui or Tailwind SVG)

Constraints:
- Do not hardcode values
- Use utility function if available (e.g. `calculatePercentDelta`)
- Follow CHARLY visual standards:
  - Red = increase (negative outcome)
  - Green = decrease (positive outcome)

Add comments to explain logic.
✅ QA Checklist
 Delta % calculates accurately

 Visual bars or colors match direction (+ / -)

 No hardcoded data or styling

 TS build passes

💾 Git Commit
bash
Copy
Edit
git add src/pages/ResultsCanvas.tsx
git commit -m "✅ 3C – Fix: Delta % visuals with real data + UI indicators"
📌 Status: ⬜ Not Started


🧩 Prompt 4A: Fix Canvas UI Spacing and Alignment
🧠 Prompt Type: Layout Refinement
📂 File(s): All Canvas UI files (start with PortfolioMode.tsx)

📝 Claude Prompt
plaintext
Copy
Edit
Open:
code src/pages/PortfolioMode.tsx

Claude, the UI spacing, padding, and alignment is inconsistent across CHARLY's Canvas views.

Please:
- Align all sections to 64px grid system
- Apply consistent spacing between:
  - Header + filter bars
  - Table cells
  - Modal triggers
- Ensure Canvas panels have floating shadows (`shadow-[0px_2px_10px_rgba(0,0,0,0.04)]`)
- Ensure no excessive padding (p-4 max), no nested margins

Constraints:
- Do not break existing layout structure
- Use Tailwind utility classes only
- Match Jony Ive design system (invisible excellence, structured rhythm)

Apply this standard only to `PortfolioMode.tsx` for now.
✅ QA Checklist
 Header, filters, and table aligned to grid

 Shadows applied to all cards/panels

 Padding normalized to max p-4

 No broken layouts or scroll issues

 View is pixel-snapped and consistent

💾 Git Commit
bash
Copy
Edit
git add src/pages/PortfolioMode.tsx
git commit -m "✅ 4A – Polish: Canvas layout and spacing aligned to grid"
📌 Status: ⬜ Not Started


## 🧩 Prompt 4B: Fix Flagging State Persistence Across Modes

**🧠 Prompt Type:** State Bug Fix  
**📂 File(s):** `PortfolioContext.tsx`, `PortfolioMode.tsx`, `ResultsCanvas.tsx`

### 📝 Claude Prompt

```plaintext
Open:
code src/contexts/PortfolioContext.tsx
code src/pages/PortfolioMode.tsx
code src/pages/ResultsCanvas.tsx

Claude, flagged properties are not persisting across modes (e.g., Portfolio → Results).

Symptoms:
- Flags appear in one view but disappear when switching
- Flag toggles inconsistently between components

Please:
- Fix `flagged` property persistence across Canvas views
- Store `flagged` status in shared context (`portfolioData` or `propertyMetadata`)
- Ensure flag state is respected when switching between modes

Constraints:
- Do not use local state in any Canvas file
- Keep the `onFlagProperty` handler centralized
- Do not mutate directly — use functional updates

Validate that flag icons reflect accurate state in both views.
✅ QA Checklist
 Flagged state persists across mode switches

 onFlagProperty is context-driven

 Flag UI renders consistently in both views

 No local state overrides shared data

 Tests pass

💾 Git Commit
bash
Copy
Edit
git add src/contexts/PortfolioContext.tsx src/pages/PortfolioMode.tsx src/pages/ResultsCanvas.tsx
git commit -m "✅ 4B – Fix: Flag state persistence across canvas modes"
📌 Status: ⬜ Not Started


🧩 Prompt 4C: Add Green Loading Shimmer State
🧠 Prompt Type: Visual Enhancement
📂 File(s): PortfolioMode.tsx, ResultsCanvas.tsx, maybe components/ui/LoadingBlock.tsx

📝 Claude Prompt
plaintext
Copy
Edit
Open:
code src/pages/PortfolioMode.tsx
code src/pages/ResultsCanvas.tsx

Claude, please add a loading shimmer (green success color) to key data panels during processing.

Requirements:
- Use Tailwind shimmer utility or skeleton pattern
- Color: CHARLY green `#34C759`
- Apply to:
  - Portfolio property grid when analyzing
  - ResultsCanvas when loading appeal outcome
- Use `isAnalyzing` or `isLoading` flags from context

Constraints:
- Do not block interaction with overlay
- Animate in/out with 0.3s transition
- Use separate `LoadingBlock` or wrapper div where possible

Do not apply shimmer globally.
✅ QA Checklist
 Shimmer appears during async load states

 Shimmer uses correct green and animation

 No layout shift on shimmer in/out

 Replaces only affected content panels

 Uses shared loading flags from context

💾 Git Commit
bash
Copy
Edit
git add src/pages/PortfolioMode.tsx src/pages/ResultsCanvas.tsx
git commit -m "✅ 4C – Add: Green shimmer loading indicator to canvas"
📌 Status: ⬜ Not Started


🧩 Prompt 5A: Reconnect CompareProperties to Selected State
🧠 Prompt Type: Prop Wiring + Feature Hookup
📂 File(s): PortfolioMode.tsx, CompareProperties.tsx

📝 Claude Prompt
plaintext
Copy
Edit
Open:
code src/pages/PortfolioMode.tsx
code src/components/CompareProperties.tsx

Claude, the CompareProperties feature is not hooked to actual user-selected properties.

Tasks:
- Wire `selectedProperties` from context or UI table selection state
- Pass it into `CompareProperties` component via props
- Display side-by-side detail view only if 2+ properties are selected

Constraints:
- Use context value or selection array from `PortfolioMode`
- Do not mock values or create fake comparisons
- Follow progressive disclosure: comparison panel should be hidden unless triggered

UI should feel invisible and adaptive.
✅ QA Checklist
 Selecting 2+ properties triggers Compare UI

 Compare block receives real selected property data

 Comparison layout clean, spaced, aligned

 Build and typecheck pass

💾 Git Commit
bash
Copy
Edit
git add src/pages/PortfolioMode.tsx src/components/CompareProperties.tsx
git commit -m "✅ 5A – Wire: CompareProperties to user-selected state"
📌 Status: ⬜ Not Started


## 🧩 Prompt 5B: Confirm and Clean `AnalysisResults` Structure

**🧠 Prompt Type:** Type Refinement + Context Cleanup  
**📂 File(s):** `PortfolioContext.tsx`, `types/portfolio.ts`, `AnalysisPanel.tsx`

### 📝 Claude Prompt

```plaintext
Open:
code src/contexts/PortfolioContext.tsx
code src/types/portfolio.ts
code src/components/AnalysisPanel.tsx

Claude, we need to confirm that `analysisResults` is:
- Fully typed
- Clearly structured
- Usable across multiple modes

Tasks:
- Define and export a shared `AnalysisResult` type
- Ensure all updates to `analysisResults` match this interface
- Remove any `any` or implicit object shapes
- Update consuming components (like `AnalysisPanel.tsx`) to use typed data

Constraints:
- Types must live in `types/portfolio.ts`
- Use array of result objects keyed by `propertyId`
- No mock values or fake types
✅ QA Checklist
 Shared AnalysisResult type created and imported

 analysisResults context is fully typed and structured

 Consumers use correct type/interface

 No lingering any or inline object definitions

💾 Git Commit
bash
Copy
Edit
git add src/types/portfolio.ts src/contexts/PortfolioContext.tsx src/components/AnalysisPanel.tsx
git commit -m "✅ 5B – Clean: Typed structure for analysisResults across context"
📌 Status: ⬜ Not Started


🧩 Prompt 5C: Restore Hover/Select Feedback in Results Canvas
🧠 Prompt Type: Event Wiring + Cross-Mode Behavior
📂 File(s): ResultsCanvas.tsx, PortfolioContext.tsx, PropertyCard.tsx

📝 Claude Prompt
plaintext
Copy
Edit
Open:
code src/pages/ResultsCanvas.tsx
code src/contexts/PortfolioContext.tsx
code src/components/PropertyCard.tsx

Claude, hovering or clicking a property in `ResultsCanvas` should:
- Trigger highlight/select feedback
- Update selected state in context
- Allow jumping back to PortfolioMode with preselected view

Tasks:
- Wire `onPropertySelect(propertyId)` context function
- Highlight hovered property
- Persist selection across canvas switch
- Link “View property details” to `PortfolioMode` scroll/focus

Constraints:
- No new global state — use existing selection mechanism
- Event must fire from `PropertyCard` and update context
- Smooth transitions only (no page reload or route flash)
✅ QA Checklist
 Hover highlights active property

 Click updates selection in context

 Navigation to PortfolioMode scrolls to selected card

 Clean transitions with no flicker

 TS + runtime verified

💾 Git Commit
bash
Copy
Edit
git add src/pages/ResultsCanvas.tsx src/components/PropertyCard.tsx src/contexts/PortfolioContext.tsx
git commit -m "✅ 5C – Fix: Hover + select state wiring across Results > Portfolio"
📌 Status: ⬜ Not Started


🧩 Prompt 6A: Stabilize Canvas Mode Routing + Reactive Transitions
🧠 Prompt Type: Router + State Sync
📂 File(s): DashboardV3Working.tsx, CanvasOrchestrator.tsx, CanvasContext.tsx

📝 Claude Prompt
plaintext
Copy
Edit
Open:
code src/pages/DashboardV3Working.tsx
code src/components/v2/CanvasOrchestrator.tsx
code src/components/v2/CanvasContext.tsx

Claude, the routing system that switches Canvas modes has bugs:
- Sometimes mode doesn’t update when URL changes
- Navigation triggers full reload
- Back button fails to restore correct mode

Fix:
- Fully sync `CanvasMode` with router path (e.g., /portfolio, /results)
- Ensure transitions are smooth and reactive
- Prevent default page reloads when navigating within the app

Constraints:
- Use React Router (no window.location)
- Use `useNavigate`, `useLocation`, `useEffect` combo to sync state
- Canvas transitions should animate between modes
- Set default mode on page load (fallback to /portfolio if no match)
✅ QA Checklist
 CanvasMode updates on URL change

 Navigating via button does not reload page

 Back/forward browser buttons restore correct view

 Default mode works cleanly

 Transitions are animated

💾 Git Commit
bash
Copy
Edit
git add src/pages/DashboardV3Working.tsx src/components/v2/CanvasOrchestrator.tsx src/components/v2/CanvasContext.tsx
git commit -m "✅ 6A – Fix: Router and Canvas mode sync with animated transitions"
📌 Status: ⬜ Not Started


## 🧩 Prompt 6B: Fix Progressive Disclosure Interaction Bugs

**🧠 Prompt Type:** UI Behavior Fix  
**📂 File(s):** `PortfolioMode.tsx`, `CanvasDisclosure.tsx`, `components/ui/Accordion.tsx`

### 📝 Claude Prompt

```plaintext
Open:
code src/pages/PortfolioMode.tsx
code src/components/CanvasDisclosure.tsx
code src/components/ui/Accordion.tsx

Claude, progressive disclosure sections in Canvas UIs are behaving incorrectly:
- Accordion sections sometimes fail to open/close
- Nested disclosures trigger visual flicker
- Disclosure state is not preserved across rerenders

Tasks:
- Fix disclosure logic for:
  - Accordion expand/collapse
  - CanvasDisclosure step toggling
- Ensure clean transitions (0.3s ease)
- Preserve open state if user navigates away and back

Constraints:
- No magic state — disclosure status must come from context or controlled props
- Do not use `any` or mutate state directly
- Do not create new components unless needed

Match Jony Ive micro-interaction guidelines: subtle, responsive, and clean.
✅ QA Checklist
 Disclosure transitions work consistently

 State is preserved across re-renders

 No flicker or double-render issues

 CSS transitions animate cleanly

 UI feels polished and invisible

💾 Git Commit
bash
Copy
Edit
git add src/components/CanvasDisclosure.tsx src/pages/PortfolioMode.tsx src/components/ui/Accordion.tsx
git commit -m "✅ 6B – Fix: Disclosure logic, animation, and state preservation"
📌 Status: ⬜ Not Started


🧩 Prompt 6C: Ensure Default State Resets on Mode Switch
🧠 Prompt Type: Context Reset Logic
📂 File(s): CanvasContext.tsx, PortfolioContext.tsx, DashboardV3Working.tsx

📝 Claude Prompt
plaintext
Copy
Edit
Open:
code src/components/v2/CanvasContext.tsx
code src/contexts/PortfolioContext.tsx
code src/pages/DashboardV3Working.tsx

Claude, when switching between Canvas modes, some stale state remains:
- Selected properties stay selected in new mode
- `isAnalyzing` persists incorrectly
- Filters or UI toggles don’t reset

Please:
- Add centralized logic to reset relevant state when CanvasMode changes
- Reset:
  - `selectedProperties`
  - `filterStatus`
  - `isAnalyzing`
  - Disclosure states (if applicable)
- Use `useEffect` in CanvasContext or CanvasOrchestrator

Constraints:
- Reset only mode-specific state (do not clear user/session/global config)
- Trigger reset on mode switch, not page reload

Confirm that mode transitions start with clean state.
✅ QA Checklist
 Switching modes resets context state

 No stale props or filters carry over

 Canvas renders with default disclosure state

 No race conditions or UI glitches

 TS + tests pass

💾 Git Commit
bash
Copy
Edit
git add src/components/v2/CanvasContext.tsx src/contexts/PortfolioContext.tsx
git commit -m "✅ 6C – Fix: Reset mode-specific state on canvas switch"
📌 Status: ⬜ Not Started


🧩 Prompt 7A: Final UI QA Sweep – Canvas + Transitions
🧠 Prompt Type: QA Inspection + UI Fix
📂 File(s): Entire Canvas UI (PortfolioMode.tsx, ResultsCanvas.tsx, etc.)

📝 Claude Prompt
plaintext
Copy
Edit
Open:
code src/pages/PortfolioMode.tsx
code src/pages/ResultsCanvas.tsx
code src/components/v2/CanvasOrchestrator.tsx

Claude, we’re doing a final pre-launch UI pass for CHARLY’s Canvas system.

Please:
- Review all Canvas pages for spacing, visual drift, layout overflow
- Confirm:
  - 64px grid spacing throughout
  - All cards/components are aligned
  - Buttons use shadcn/ui and CHARLY color tokens
  - No residual debug styles or commented code
- Validate micro-interactions (hover, click, accordion) all work cleanly

Constraints:
- Do not refactor logic
- Do not introduce visual regressions
- Only adjust CSS, Tailwind classes, and layout if misaligned

Provide one final commit to prep for UI lock.
✅ QA Checklist
 No floating or misaligned components

 All shadows, spacing, and fonts match design system

 No debug elements or placeholders remain

 Interactions feel smooth and intentional

 Final visual QA passes

💾 Git Commit
bash
Copy
Edit
git add src/pages src/components
git commit -m "✅ 7A – Final UI QA sweep across all Canvas modes"
📌 Status: ⬜ Not Started


---

## 📎 Backlog Prompts

These are out-of-scope for current execution but must be addressed before launch.

### 🧾 Prompt R1: TypeScript Cleanup – AdvancedReporting.tsx

**🧠 Prompt Type:** TypeScript Fix + Structural Type Audit  
**📂 File:** `src/components/AdvancedReporting.tsx`  

### 📝 Claude Prompt

\`\`\`plaintext
Open:
code src/components/AdvancedReporting.tsx

Claude, this file contains deep TypeScript validation issues that must be fixed without altering existing logic or structure.

Fix all of the following:
- Properties \`template_name\` and \`file_size\` are missing from \`ReportJob\` union types
- Several places show “No overload matches this call” — correct these without removing logic
- Ensure final type signatures are strict, clean, and match real usage
- Do not replace unknown types with \`any\`
- Do not remove props or simplify existing logic

Constraints:
- Do not break or rewrite working logic
- Do not touch other files
- Must pass \`npm run build\` and \`npm test\`

✅ QA Checklist
 TypeScript passes: no remaining validation errors  
 No logic deleted or simplified  
 All props fully typed, no \`any\`  
 Component renders and behaves as expected  
 Claude made no structural rewrites
\`\`\`

### 💾 Git Commit

\`\`\`bash
git add src/components/AdvancedReporting.tsx
git commit -m "✅ R1 – TypeScript fix: AdvancedReporting.tsx type validation cleanup"
git push
\`\`\`

📌 Status: ⬜ Not Started
