# Lessons Learned: Repository Transfer to circle6systems

**Date:** 2026-03-22
**Issue:** [#3 - Repository transferred from jeff-is-working to circle6systems](https://github.com/Circle6Systems/SDLC-Journal/issues/3)
**Type:** Infrastructure / Org Migration

---

## What Happened

The SDLC-Journal repository was transferred from the `jeff-is-working` personal GitHub account to the `circle6systems` organization. This included migrating the live GitHub Pages site at `sdlc.circle6systems.com`.

## What Went Well

1. **GitHub Pages config survived the transfer intact.** The custom domain, HTTPS certificate, and workflow-based build configuration all carried over automatically. No manual Pages reconfiguration was needed beyond enforcing HTTPS.

2. **DNS was already correct.** The CNAME for `sdlc.circle6systems.com` was already pointing to `circle6systems.github.io` rather than `jeff-is-working.github.io`. This meant zero DNS propagation delay and no downtime window for end users.

3. **User data was never at risk.** The app stores all data in IndexedDB, which is scoped to the origin (`https://sdlc.circle6systems.com`). Since the custom domain did not change, all existing user data -- encrypted journal entries, passphrases, key salts, and rollups -- remained fully intact and accessible. No cookies are used.

4. **GitHub automatically sets up redirects.** The old URL `github.com/jeff-is-working/SDLC-Journal` now redirects to `github.com/circle6systems/SDLC-Journal`, so any existing links to the repo (in bookmarks, docs, or package references) continue to work.

5. **The transfer API call was straightforward.** A single `POST` to `repos/{owner}/{repo}/transfer` with the `new_owner` field handled the entire operation.

## What Could Have Gone Wrong (and Mitigations)

1. **DNS mismatch.** If the CNAME had pointed to `jeff-is-working.github.io`, the site would have gone down after transfer until DNS was updated and propagated. **Mitigation:** Always verify DNS records before transferring a repo with GitHub Pages.

2. **Cookie-based auth loss.** If the app had used cookies instead of IndexedDB, a domain change could have logged out all users and potentially lost session data. **Mitigation:** Before any domain-affecting migration, audit the app's client-side storage mechanisms (`document.cookie`, `localStorage`, `sessionStorage`, `indexedDB`).

3. **GitHub Actions workflow permissions.** Organization-level Actions settings can differ from personal account settings. If `circle6systems` had restricted Actions or Pages deployments, the workflow could have failed silently. **Mitigation:** Verify org-level Actions and Pages permissions before transfer.

4. **HTTPS certificate reissuance.** In some transfer scenarios, GitHub may need to reissue the HTTPS certificate for the custom domain. In this case, the existing cert (valid through 2026-05-29) carried over. **Mitigation:** Monitor HTTPS cert status after transfer; be prepared for a brief period without HTTPS if reissuance is needed.

## Decisions Made

- **Kept the repo public.** The SDLC Journal is a community mental health resource hosted on GitHub Pages free tier, which requires public repos. This is an intentional exception to the workspace standard of private-by-default.
- **Did not add CLAUDE.md to the repo during this operation.** The repo predates the current template standards. Adding project-level CLAUDE.md and bringing the repo into full compliance is a separate task.

## Action Items

- [ ] Verify the live site is serving correctly at `https://sdlc.circle6systems.com` after workflow deployment completes
- [ ] Consider creating a CLAUDE.md for this repo to bring it into compliance with current workspace standards
- [ ] Close issue #3 after verification is complete

## Key Takeaway

When transferring a repo with a live GitHub Pages site on a custom domain, the critical question is: **does the custom domain change?** If it does not (as in this case), user-facing impact is effectively zero -- IndexedDB, localStorage, cookies, and all origin-scoped browser storage remain bound to the same origin. The repo transfer is invisible to end users. Always audit client-side storage mechanisms and DNS configuration before initiating the transfer.
