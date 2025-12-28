# Branch Protection Setup Guide

## Required Branch Protection Rules for `main`

To complete Week 1 requirements, configure the following in your GitHub repository:

### Steps:

1. Go to: https://github.com/tripavail92-byte/tripavailweb/settings/branches
2. Click "Add branch protection rule"
3. Set **Branch name pattern**: `main`

### Required Settings:

#### ✅ Require a pull request before merging

- [x] Require approvals: **1**
- [x] Dismiss stale pull request approvals when new commits are pushed
- [x] Require review from Code Owners (optional)

#### ✅ Require status checks to pass before merging

- [x] Require branches to be up to date before merging
- **Required status checks:**
  - `commitlint` (will be available after first workflow run)
  - Add additional checks as CI/CD expands (tests, linting, build)

#### ✅ Require conversation resolution before merging

- [x] All conversations must be resolved

#### ✅ Require linear history

- [x] Prevent merge commits (rebase/squash only)

#### ✅ Include administrators

- [x] Apply rules to repository admins (optional but recommended)

#### ✅ Restrict who can push to matching branches

- Leave empty for now (allows all collaborators)

#### ✅ Allow force pushes

- [ ] Do not allow force pushes (keep disabled)

#### ✅ Allow deletions

- [ ] Do not allow branch deletion (keep disabled)

### Additional Recommendations:

**For feature branches (e.g., `feat/*`, `fix/*`):**

- No protection needed initially
- Add as team grows

**For production/staging branches:**

- Add separate rules requiring deployment checks
- Restrict direct pushes to CI/CD systems only

---

## Quick Verification Checklist

After setup:

- [ ] Branch protection rule for `main` created
- [ ] Pull requests require 1 approval
- [ ] Commitlint check required to pass
- [ ] Force pushes disabled
- [ ] Branch deletion disabled
- [ ] Create a test PR to verify rules work

---

_Last updated: Dec 25, 2025_
