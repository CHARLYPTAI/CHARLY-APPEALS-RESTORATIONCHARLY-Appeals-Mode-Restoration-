# CHARLY — Jony Ive UI/UX Spec

## Principles

* Clarity > cleverness; minimal chrome; generous whitespace.
* One primary action per view.
* Motion as meaning (180ms ease-out enter; 140ms ease-in exit).
* Readability at speed; data density only where useful.
* Monochrome base + one accent.

## Design Tokens

* Colors:
  --bg: #FFFFFF; --ink: #0B0B0C; --muted: #6B7280; --line: #E5E7EB;
  --accent: #0EA5E9; --accent-ink: #0A0F14; --success: #10B981; --warn: #F59E0B; --error: #EF4444
* Type: SF Pro Text/system; scale 12/14/16/18/20/24/30/36
* Radius: 12px cards; 8px small; subtle shadows; 2px accent focus ring
* Spacing: 4, 8, 12, 16, 24, 32, 48, 64 (grid=8)

## Information Architecture (two apps)

* commercial.charlyapp.com (B2B)
  Routes:
  1. Dashboard — portfolio KPIs, deadlines, savings, quick actions
  2. Portfolio — bulk upload, table, filters, export
  3. Workfile (wizard): upload → validate → decision → packet
  4. Reports — Appeal Dossier, Portfolio CFO Summary
  5. Jurisdictions — rules finder; deadlines; filing method
  6. Admin — SSO/SAML config, tokens, webhooks, SLAs, white-label

* residential.charlyapp.com (B2C)
  Routes:
  1. Home — "Instant check" hero; social proof
  2. Workfile (wizard): photo/upload → validate → decision → checkout
  3. Reports — Audit Lite, Appeal Dossier, Fair/Under
  4. Jurisdiction info — simple finder
  5. Settings — profile, billing, receipts

## Signature Components

* AppShell (TopBar, Rail, Content, Toaster)
* Card (Title, Meta, Action)
* DataTable (sticky header, filters, CSV export)
* UploadTray (drag/drop, signed URLs, status, retry)
* ValidationPanel (schema errors, diffs, inline fixes)
* DecisionCard (Over/Fair/Under badge, confidence, savings est., deadline)
* JurisdictionBadge (efile yes/no, fee, window)
* ReportComposer (cover, exhibits, attachments)
* PaymentButton (Stripe/Apple Pay)
* SSOSettings (Commercial)

## Critical Flows

* Commercial: Portfolio upload → prioritized actions in ≤60s → white-label PDF
* Residential: Photo or file → instant decision → checkout
* Both: upload status + toasts; normalized JSON preview; decision + rationale + band; report render

## Accessibility & Performance

* WCAG AA, focus visible, reduced motion, labels always present
* Hit areas ≥40px; contrast ≥4.5:1; keyboardable tables
* P50/P95: Dashboard 120/300ms; Workfile 200/600ms; LCP <2.0s; CLS <0.1

## Stack

* Next.js App Router + RSC; TS strict; Tailwind or CSS Modules; Headless UI
* Forms: React Hook Form + Zod; server AJV mirrors Zod schemas
* State: Server actions + SWR; tenant isolation
* Telemetry: OpenTelemetry web + Sentry; Web Vitals → /metrics