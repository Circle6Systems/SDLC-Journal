# CLAUDE.md -- Project Standards

These instructions govern all development work in this repository. They are mandatory and override default behavior.

---

## Project Overview

PeopleSafe SDLC Journal is a client-side encrypted journaling app for IT and cybersecurity professionals. It runs entirely in the browser (GitHub Pages) and as an Electron desktop app. All data is encrypted with AES-256-GCM before storage in IndexedDB. There is no backend.

- **Live site:** https://sdlc.circle6systems.com
- **GitHub org:** circle6systems
- **Visibility:** Public (required for free GitHub Pages hosting)

---

## Development Workflow

**All work must follow this sequence -- no exceptions.**

1. **Issues first.** Every code change must map to a documented GitHub issue. The issue must include a remediation/implementation plan before any code is written. Do not write code for work that isn't tracked in an issue.
2. **Tests before code.** Write tests for the expected behavior before writing implementation code (TDD). If the repo has no test infrastructure, set it up as the first task before any feature work.
3. **Plan, then implement.** Use plan mode to design the approach, get alignment, then execute. Do not start coding without a plan for non-trivial work.

---

## Branching & Commits

- Create feature branches from `main` (e.g., `sprint-1/critical-fixes`, `feature/user-auth`)
- One commit per issue for clean history
- Write concise commit messages that explain the "why", not just the "what"
- PR back to `main` when work is complete; do not merge without review

---

## Issue Standards

Every GitHub issue must include:

- **Problem/Objective**: What needs to change and why
- **Location**: Files, functions, or components affected
- **Implementation Plan**: Step-by-step remediation or implementation approach
- **Testing**: Specific test cases to write before implementation
- **Verification**: How to confirm the fix/feature works end-to-end

---

## Code Quality

- Do not write code without reading the existing codebase first
- Follow existing patterns and conventions in the repo
- This is a zero-dependency web app (no npm, no bundler for the web version). Keep it that way.
- Alpine.js is vendored in `js/vendor/` -- do not add CDN references
- All cryptographic operations must use the Web Crypto API (`crypto.subtle`)
- Validate inputs at system boundaries (user input, external APIs)
- Do not add features, refactoring, or "improvements" beyond what the issue specifies
- Keep solutions simple -- the right amount of complexity is the minimum needed

---

## Architecture Notes

- **No server-side code.** This is a static site. All logic runs in the browser.
- **No cookies, no analytics, no telemetry.** Privacy is the foundational requirement.
- **IndexedDB only.** Do not introduce localStorage, sessionStorage, or cookies for data storage.
- **CSP enforced.** Content Security Policy is set via meta tag in `index.html`. Any changes must be reviewed for security implications.
- **Electron desktop app** shares the same HTML/CSS/JS as the web version. Electron-specific code lives in `electron/`.

---

## Documentation

- `docs/status/` -- Status reports, session summaries, and lessons learned (date-prefixed, e.g., `2026-03-22-org-transfer-lessons-learned.md`)
- `docs/` -- Architecture, security, deployment, developer guide, and frontend docs
- Do not create documentation files unless explicitly requested
- Keep CLAUDE.md up to date as the project evolves

---

## What NOT to Do

- Do not write code for work that isn't tracked in a GitHub issue
- Do not write implementation code before tests
- Do not skip the plan-first workflow for non-trivial changes
- Do not push to `main` directly -- use feature branches and PRs
- Do not introduce server-side dependencies or external network requests
- Do not weaken the Content Security Policy without documented justification
- Do not store unencrypted user data in any browser storage mechanism
