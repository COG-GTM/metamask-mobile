# MetaMask Mobile Triage Plan

Repository: `COG-GTM/metamask-mobile`  
Linear Project: `MetaMask Mobile` (Team: Cog GTM)  
Generated: 2026-07-13

## Unassigned Issues Bucketed into 5 Phases

| Phase | Label | Issue | Title | Priority | Linear |
|---|---|---|---|---|---|
| 1 | P0 incident | COG-852 | App crashes on wallet unlock when `SecureKeychain` has no credentials | Urgent | [COG-852](https://linear.app/cog-gtm/issue/COG-852/p0-app-crashes-on-wallet-unlock-when-securekeychain-has-no-credentials) |
| 2 | P1 bug | COG-853 | ENS reverse lookup cache misses due to mixed `chainId`/`networkId` cache keys | High | [COG-853](https://linear.app/cog-gtm/issue/COG-853/p1-ens-reverse-lookup-cache-misses-due-to-mixed-chainidnetworkid-cache) |
| 3 | P2 feature | COG-854 | Add non-EVM token balance support for Solana in `useGetFormattedTokensPerChain` | Medium | [COG-854](https://linear.app/cog-gtm/issue/COG-854/p2-add-non-evm-token-balance-support-for-solana-in) |
| 4 | Refactor | COG-855 | Migrate `ENSUtils.js` to TypeScript | Low | [COG-855](https://linear.app/cog-gtm/issue/COG-855/refactor-migrate-ensutilsjs-to-typescript) |
| 5 | Docs | COG-856 | Document JS→TS migration pattern for utility modules | Low | [COG-856](https://linear.app/cog-gtm/issue/COG-856/docs-document-jsts-migration-pattern-for-utility-modules) |

## Prerequisite

The repository's `yarn install` is currently blocked because `react-native-tcp` is pinned to a deleted `aprock/react-native-tcp` GitHub commit. Before the phase work can be validated, create a prerequisite PR that replaces it with `react-native-tcp@4.0.0` (npm). Child sessions will branch from the `devin/fix-react-native-tcp-dep` branch so `yarn install` succeeds.

## Phase Order & Gating

Phases run sequentially. The next phase is only started after the current phase is **resolved**, meaning:

1. The child Devin session has completed.
2. A PR is open for the phase.
3. The validation pipeline (`yarn lint`, `yarn test --findRelatedTests <file>`, `tsc --noEmit`) has passed.
4. The Linear issue is moved to a post-work status (`In Review` or `Done` as appropriate).
5. A Slack summary is sent as a DM to Ananth Veluvali.
6. P0 and P1 additionally include Detox E2E visual proof (screenshots), run by the parent session on the PR branch after the child session reports success.

Within a phase, if there were multiple independent issues, child sessions would be spawned in parallel; each phase here has a single issue, so one child session is created per phase.

## Child Session Template

Each child session is given the issue title, the full Linear description, the acceptance criteria, and the following instructions:

- **Repository:** `COG-GTM/metamask-mobile`
- **Branch:** create a new `devin/<issue-id>-<slug>` branch from `devin/fix-react-native-tcp-dep`.
- **Scope:** implement the minimal fix, feature, refactor, or doc described in the Linear issue.
- **Validation:** run in the root of the repo:
  ```bash
  tsc --noEmit
  yarn test --findRelatedTests <primary-affected-file>
  yarn lint
  ```
  If `tsc --noEmit` is too slow, run `yarn lint:tsc` where appropriate. Detox E2E visual proof is run by the parent session after the PR is created.
- **PR:** create a PR into `main` using `fetch_pr_template` and `git_create_pr`. Include the issue title and "Fixes COG-XXX" in the body.
- **Linear update:** move the issue to `In Review` and add a comment with the PR link.
- **Slack summary:** return a concise markdown summary in the structured output. The parent session will send it as a Slack DM to `Ananth Veluvali` (`@ananth.veluvali`).

## Structured Output Schema

Each child session must produce the following JSON in its structured output:

```json
{
  "issue_id": "COG-XXX",
  "phase": "P0|P1|P2|refactor|docs",
  "pr_url": "https://github.com/COG-GTM/metamask-mobile/pull/NNN",
  "branch": "devin/...",
  "linear_status": "In Review|Done",
  "validation_summary": "tsc/lint/test passed; any failures noted",
  "detox_proof": "screenshot path or 'N/A'",
  "slack_summary": "one-paragraph markdown summary of the change and PR"
}
```

## Phase-specific Validation

| Phase | Primary file | Test command | Detox proof |
|---|---|---|---|
| P0 | `app/core/SecureKeychain.js` | `yarn test --findRelatedTests app/core/SecureKeychain` | **Required** — wallet unlock / empty keychain smoke test |
| P1 | `app/util/ENSUtils.js` | `yarn test --findRelatedTests app/util/ENSUtils` | **Required** — address/ENS lookup smoke test |
| P2 | `app/components/hooks/useGetFormattedTokensPerChain.tsx` | `yarn test --findRelatedTests app/components/hooks/useGetFormattedTokensPerChain` | Not required |
| Refactor | `app/util/ENSUtils.js` → `app/util/ENSUtils.ts` | `yarn test --findRelatedTests app/util/ENSUtils` | Not required |
| Docs | `docs/js-to-ts-migration.md` | `tsc --noEmit` and `yarn lint` | Not required |

## Slack & Linear Coordination

- After each phase resolves, the parent sends the child’s `slack_summary` as a Slack DM to Ananth Veluvali (`U0BBYUV5L7K`) using the `COG_GTM_DEMO_SLACK_BOT_TOKEN`.
- The parent updates the Linear issue to `In Review` (or `Done` for docs) and adds the PR link as a comment.
- If a child session cannot complete a phase, the workflow pauses and reports the blocker to the user before proceeding.

## Execution Log

- [ ] P0 resolved
- [ ] P1 resolved
- [ ] P2 resolved
- [ ] Refactor resolved
- [ ] Docs resolved
