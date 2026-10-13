# Hearth — Phased Build Plan

The project is currently an empty starter. We will build Hearth in small, testable stages, verifying each before moving on. This plan covers all phases; each phase ends with a working, usable app.

## Design direction
- Monochrome: near-black, white, graphite, neutral grays; one restrained accent (warm ember orange, fitting "Hearth") for primary actions only.
- Typography: Geist / Geist Mono style pairing (no Inter/Poppins). Thin borders, small radii, minimal shadows, subtle transitions.
- Dark mode default, light mode available. Mobile-first: on phones the left and right panels become slide-over sheets; desktop gets the resizable three-panel layout with remembered sizes.
- No logo was provided — a simple typographic "Hearth" wordmark is used until you share one.

## Phase A — Foundation
- Enable Lovable Cloud (database, sign-in, file storage, server functions).
- Email + Google sign-in.
- Tables (all private per user): profiles/preferences, conversations (with soft delete for recovery), messages, tasks, memory entries, provider configs, creations/assets, render jobs, usage/error records (no prompt contents).
- Design tokens and base components.

## Phase B — Workspace
- Three-panel layout: left (logo, new chat, searchable history, compact tasks, creation library link, settings), center (chat + composer), right (companion detail panel).
- Conversations persist, search, rename, delete with recovery, export as Markdown/JSON.
- Tasks: create/edit, checkbox with strike-through animation, muted completed, due date, priority, duplicate prevention.
- Memory page: list, edit, delete, clear, search, export, auto-extraction toggle, note explaining it is stored in the cloud, not on-device.
- Onboarding wizard (8 steps from the brief, optional steps skippable).
- Settings shell.

## Phase C — AI infrastructure
- Built-in provider: Lovable AI (works immediately, no keys needed) so real answers work from day one.
- Bring-your-own-key adapters: OpenAI, Anthropic, Google Gemini, OpenAI-compatible endpoints. Each adapter declares capabilities (streaming, vision, tools, structured output, effort control, model discovery).
- Keys: saved server-side only, encrypted at rest with a server secret, never sent back to the browser (shown masked, e.g. "sk-...a91f"). "Test connection" with last-known status.
- Model catalogue: live discovery where providers allow, small maintained metadata list otherwise; searchable selector showing provider, ID, capabilities, status. Prices shown only when reliable.
- Auto router: explicit rule-based policy (task category, required capabilities, configured providers, effort) with a visible "why this model" note; manual override always available.
- Fallback policy (configurable): bounded retries, Retry-After respected, no retrying bad keys, announces any provider switch, never silently switches to a costlier or different-capability model.
- Chat features: streaming, stop, retry, regenerate, copy, Markdown with code highlighting and tables, response effort and length (global + per-chat override).
- Interactive cards: clarification questions and quizzes (scoring + explanations), rendered from validated structured data, never executed code.
- Companion panel fills with detailed answers (recipes, study plans, code explanations) from the same message — no duplicated messages.
- AI-suggested tasks and memory changes appear as approval cards; confidence threshold and on/off settings.
- Local runtimes (Ollama, LM Studio): endpoint field with a real connection test and clear explanation of browser HTTPS/CORS/mixed-content limits; nothing is marked connected unless tested.

## Phase D — Creation Studio
- Library: thumbnails, type, name, date, prompt/settings, job status, download, regenerate, delete with confirm, graceful handling of missing files.
- Images: real generation via Lovable AI image model (adapter allows adding OpenAI etc.), saved to storage, real downloads.
- 3D: AI produces a validated scene spec (geometry, materials, lights, camera, animation) rendered in an interactive React Three Fiber viewer. Exports: scene JSON, PNG snapshot, GLB (via the real three.js exporter).
- Documents: AI-structured content exported as real PDF, Markdown, TXT, HTML, JSON, CSV with preview, page count and file size.
- Video:
  - Workflow B (AI footage): real video generation through Lovable AI, job polling, stored result.
  - Workflow A (Remotion/FFmpeg motion graphics): full job interface, validated video spec, documented worker contract and adapter. Rendering is marked "Unavailable — no render worker connected" until you supply an external worker (Remotion/FFmpeg cannot run inside this app's server). No simulated renders.

## Phase E — Reliability
- Automated tests (mocked services): adapter normalization, routing and fallback, missing/invalid keys, rate-limit retries, cancellation, render-job status transitions, invalid scene specs, export output, task and memory rules.
- Security review and scan, rate limits on server endpoints, input validation everywhere.
- Mobile refinement pass.
- In-app "Status" page listing implemented features, pending integrations, known limitations.

## What you will need to supply later (optional)
- Your own OpenAI / Anthropic / Gemini keys, only if you want those providers in addition to Lovable AI.
- A Remotion/FFmpeg render worker URL + token for motion-graphics video.
- Your Hearth logo if you have one.

## Technical details
- TanStack Start; AI calls and key decryption only inside server functions; provider adapters in a single `providers/` module with a shared interface; router policy as pure functions (unit-tested).
- Keys encrypted with AES-GCM using a server-held secret; stored in a table with no client SELECT policy, accessed only via server functions.
- Streaming via a server route returning SSE; abort via AbortController.
- Storage bucket private; downloads via signed, expiring URLs.
- Scene and video specs validated with zod schemas.
- Built in the order A → E, verifying in the browser at each step.

## Working rules (added)
- Build and verify one phase at a time. This approval covers Phase A only; Phase B starts after you review the Phase A report.
- After each phase: report files changed, what actually works, tests run, failures, and remaining work.
- Check what Lovable Cloud and Lovable AI really support (live model list, image/video endpoints, streaming) before relying on them. Anything not confirmed stays marked "Unavailable".
- Credentials: encrypted with a managed server secret, kept out of client code, client-readable rows, logs and error messages; per-user checks and server-side validation on every credential action; decrypted keys never sent to the browser.
- Automated tests for authorization, cross-user isolation (conversations, credentials, memory, tasks, assets), routing, fallback, and secure downloads.
- The app clearly labels cloud-stored memory/history as different from the future desktop app's on-device memory.md and SQLite storage.
- Real functionality before decoration; no simulated successes of any kind.
- Modular, portable code: provider adapters, separate routing policy, validated creation specs, documented render-worker interface.

## Phase A scope for this run
1. Enable Lovable Cloud; turn on email/password and Google sign-in.
2. Migrations for all tables in the plan with row-level security on every row owned by a user; credentials table with no browser read access.
3. Generate the server encryption secret; encryption helper with unit tests.
4. Design tokens (monochrome + ember accent, fonts), sign-in page, minimal signed-in shell placeholder that shows only the account and a sign-out button.
5. Cross-user isolation test against the real database using two test accounts.
6. Browser check: sign up, sign in, reload keeps the session, sign out. Then report results.

## Phase A acceptance criteria
- Encryption key stored only in Lovable Cloud's managed secret store; never printed, logged, committed, or sent to the browser. If secure storage is unavailable, stop the encryption work and report it.
- Email/password and Google sign-in verified separately. If Google needs setup you haven't supplied, report it and don't mark it working.
- Two-account test against the real database: neither account can read, change, or delete the other's conversations, messages, tasks, memory, provider configs, creations, or assets. Separate check that the browser cannot read stored credentials.
- Encryption tests: round trip, wrong key, tampered ciphertext, missing secret. Only fake test keys.
- Browser checks: sign-up, sign-in, session kept after reload, sign-out.
- Signed-in shell: wordmark, account info, working sign-out. Nothing more.
- Final report: migrations and files changed, observed test results, failures, remaining setup, and a clear verified vs. unverified list. Then stop and wait for your review.
