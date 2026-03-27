# Branch Protection — `main`

Branch protection for `main` is configured via a **GitHub Ruleset** (Settings > Branches > Rulesets).

## Rules enabled

- **Require a pull request before merging** — direct pushes to `main` are blocked
- **Require approvals (1)** — at least one review required before merge
- **Block force pushes** — `git push --force` and `git push -f` are rejected
- **Do not allow bypassing the above settings** — applies to all roles including admins
- **Required status check: ESLint & Prettier** — CI must pass before merge

## Verification

Direct push and force push to `main` were tested and both rejected by GitHub with:

```
remote: error: GH013: Repository rule violations found for refs/heads/main.
remote: - Changes must be made through a pull request.
```

See screenshot in PR #<!-- PR number --> for proof.
