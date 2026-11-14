---
name: pr-protocol
description: Pull request protocol for this repo — pre-flight checks mirroring CI, the house PR title and body format (Summary / Changes / Why / How to test / Risk and rollback / Notes for reviewers), gh pr create usage, no AI attribution, and merge/cleanup rules. Use whenever opening, updating, or merging a PR here.
---

# PR protocol

Make the commits first by following the `commits` skill. Its rules apply here too:
- The author is `rifatbond007` only.
- **No co-author trailers, no "Generated with …" footer, and no attribution line anywhere in the PR**, including the Claude Code and puku-cli footers.

## 1. Pre-flight (same checks as `.github/workflows/ci.yml`)

CI on PRs to `main` runs five jobs: lint, typecheck/build, test, frontend build and api-test.

1. Run the `verify-service` skill. Keep the result lines it reports, since **How to test** quotes them.
2. If the branch touches auth, identity, payments or any `:id` route, run the `security-reviewer` agent on the diff. Fix CONFIRMED findings, or list them under Notes for reviewers.
3. If the branch touches routes, `frontend/src/lib/api.ts`, calls between services or events, run the `contract-checker` agent on the diff. Fix anything BROKEN.
- If an endpoint's status code or behaviour changes, update `scripts/api-test.sh` to match. CI's api-test job will fail otherwise.
- Never claim a check passed if you didn't run it. Say which ones you didn't run (see "Not run" below).

## 2. Branch and push

- Never work on `main`. Name the branch `<type>/<kebab-summary>`.
- Rebase onto `origin/main` if it has moved.
- Push with `git push -u origin <branch>`. Push only when the user asked for a PR or a push.
- Make **one scoped commit per distinct fix** (e.g. `fix(gateway): …`, `fix(payment): …`, `test(payment): …`) rather than one big commit. The PR's Changes list mirrors these commits.

## 3. Title

```
PR: <type>(<scope>): <short summary>
```

- **Keep it simple and minimal.** Aim for 60 characters or fewer, and never more than 65. Name the gist in a few words; the full list of outcomes goes in the Summary, not the title.
- Write everything after the `PR:` prefix in lowercase, with no trailing period. At most two or three items, joined with "and".
- If the changes span services, use the broadest fitting scope (`services`, `security`, `checkout`).
- Good: `PR: fix(security): strip spoofed headers and guard refunds`, `PR: perf(schemas): add composite indexes on hot read paths`
- Too long: `PR: fix(security): gateway drops spoofed identity headers, refunds need an admin and payment reads check the owner`

## 4. Body format

Use exactly these sections, in this order. Write plain, concrete prose. Quote the real values, messages, routes and numbers, with no emojis or hype, and no footer.

```markdown
## Summary
<One paragraph. Say how many things are fixed or added, then describe each as an
observable before→after outcome, e.g. "requests to public routes no longer carry
a client-supplied x-user-role, so a forged admin header is dropped at the
gateway". No file names here.>

## Changes
- <area>: <what changed, concretely — name the function/route/middleware in
  `backticks`, quote values — and "instead of <old behaviour>"> (<issue link if any>)
- <area>: ...
- tests: <what the new/updated tests cover>

## Why
<One paragraph that gives the root cause for each change, in the same order as
Changes. Explain why the old code was wrong and what that led to (the failure
scenario). For security issues, describe the class of the hole, not an exploit
recipe.>

## How to test
1. `<command>` -> <actual result with counts, e.g. "14 passed, 2 suites">
2. `<command>` -> <result>
3. <manual step, arrows for navigation/requests> -> <exact expected response,
   status code, or UI text>
4. ...

**Not run:** <the checks you didn't run and why (e.g. api-test needs the full
stack). Also say what the manual checks ran against (local stack, which users or
roles) and confirm nothing destructive was written.>

## Risk and rollback
<Low | Medium | High>: <what kind of change it is>. <State explicitly whether it
adds new service calls, env vars, migrations or event contracts.> Roll back by
reverting the merge commit<, plus any extra step such as reverting a migration>.

## Notes for reviewers
- <issue/ticket links, if any>
- <related problems found but left out of scope, and where the real fix belongs>
- <constraints that forced a choice, e.g. a frozen file or a shared contract>
- <anything deliberately left inert or partial, and why>
```

Style rules for the body:
- **Summary** is about outcomes, **Changes** about mechanics, and **Why** about root causes. Keep each to its own job.
- Each Changes bullet starts with a lowercase area tag: a service name (`gateway`, `payment`, `cart`, …) or `frontend`, `ci`, `tests`, `docs`.
- Use `->` for "results in" in How to test steps. Number every step.
- Don't leave a section empty. If there are no reviewer notes, write a single bullet such as "- No follow-ups.".

## 5. Create it

```bash
gh pr create --base main --head <branch> \
  --title "PR: <type>(<scope>): <outcomes>" \
  --body-file - <<'EOF'
## Summary
...
EOF
```

- Before running `gh pr create`, show the user the title and body unless they've already approved opening the PR.
- Use `--draft` if checks are failing or the work is partial.
- Give the user the PR URL.

## 6. After opening

- Check CI with `gh pr checks <num>`. If a job fails, read the log with `gh run view <run-id> --log-failed`, then push a fix commit to the same branch. Don't force-push unless the user asks.
- If the fix changes what the PR does, update the body with `gh pr edit <num> --body-file -` so Changes and How to test still match.
- Merge only when the user says to: `gh pr merge <num> --squash --delete-branch`. Then run `git checkout main && git pull --ff-only` and delete the local branch.
