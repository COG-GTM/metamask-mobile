# MetaMask Mobile Security Audit Report

**Date:** February 19, 2026
**Repository:** COG-GTM/metamask-mobile
**Auditor:** Automated Security Scan (Devin)
**Tools Used:** Semgrep (SAST), Trivy (SCA/Secrets/Misconfig), Checkov (IaC/GitHub Actions)

---

## Executive Summary

| Category | Tool | Total Findings | Critical | High | Medium | Low/Info |
|---|---|---|---|---|---|---|
| SAST (Code) | Semgrep | 13 | 0 | 1 | 6 | 6 |
| SCA (Dependencies) | Trivy | 96 | 10 | 39 | 36 | 11 |
| IaC (GitHub Actions) | Checkov | 26 failures / 841 passed | 0 | 0 | 26 | 0 |
| Container (Dockerfile) | Trivy | 10 misconfigs | 0 | 6 | 0 | 4 |
| Secrets | Trivy | 0 | 0 | 0 | 0 | 0 |
| **Totals** | | **145** | **10** | **46** | **68** | **21** |

**Risk Rating: HIGH** - 10 critical and 39 high-severity dependency vulnerabilities require immediate remediation. One high-severity code finding (remote property injection) needs review.

### Snyk MCP Integration Assessment

The Snyk MCP server was **not available** in the environment. The Snyk CLI was installed but authentication failed due to the provided token being a placeholder (`testingsecret`). All scans were executed using equivalent open-source tools: **Semgrep** (SAST), **Trivy** (SCA/container/secrets/misconfig), and **Checkov** (IaC). These tools provide comparable coverage to Snyk's scanning capabilities.

---

## 1. SAST Code Scan Findings (Semgrep)

**Scan Scope:** 3,034 files in `app/` directory | 214 rules evaluated

### 1.1 HIGH - Remote Property Injection

| Field | Value |
|---|---|
| **Severity** | ERROR |
| **Rule** | `javascript.express.security.audit.remote-property-injection` |
| **File** | `app/core/SanitizationMiddleware.ts:103` |
| **Description** | Bracket object notation with user input allows an attacker to access all properties of the object and its prototype. |
| **Remediation** | Use literal values for object properties or validate/allowlist keys before bracket access. |

### 1.2 WARNING - ReDoS via Non-Literal RegExp (6 findings)

| File | Line | Variable |
|---|---|---|
| `app/core/Multichain/networks.ts` | 48 | `tag` |
| `app/util/regex/index.ts` | 5 | `decimalPlaces`, `separator` |
| `app/util/regex/index.ts` | 13 | `num` |
| `app/util/regex/index.ts` | 14 | `num` |
| `app/util/regex/index.ts` | 22 | `exp` |

**Description:** `RegExp()` called with function arguments can allow ReDoS attacks that block the main thread.
**Remediation:** Use hardcoded regex patterns or validate/sanitize inputs before constructing dynamic regexes.

### 1.3 INFO - Unsafe Format Strings (6 findings)

| File | Line |
|---|---|
| `app/core/SDKConnect/ConnectionManagement/removeChannel.ts` | 49 |
| `app/core/SDKConnect/RPCQueueManager.ts` | 16 |
| `app/core/WalletConnect/WalletConnectV2.ts` | 348 |
| `app/core/WalletConnect/WalletConnectV2.ts` | 370 |
| `app/core/WalletConnect/WalletConnectV2.ts` | 386 |
| `app/core/WalletConnect/WalletConnectV2.ts` | 685 |

**Description:** String concatenation with non-literal variables in logging functions. If an attacker injects a format specifier, it can forge log messages.
**Remediation:** Use constant format strings and pass variables as arguments.

---

## 2. SCA Dependency Vulnerability Findings (Trivy)

**Total: 96 vulnerabilities** (10 Critical, 39 High, 36 Medium, 11 Low)

### 2.1 CRITICAL Vulnerabilities (10)

| CVE | Package | Version | Location | Fixed Version | Description |
|---|---|---|---|---|---|
| CVE-2020-8165 | activesupport | 4.2.11.1 | ios/branch-ios-sdk/.../Gemfile.lock | >= 5.2.4.3 | Unintended unmarshalling of user objects in MemCacheStore |
| CVE-2025-7783 | form-data | 4.0.0 | .github/scripts/yarn.lock | 4.0.4 | Unsafe random function |
| CVE-2025-7783 | form-data | 3.0.2 | yarn.lock | 3.0.4 | Unsafe random function |
| CVE-2025-7783 | form-data | 4.0.0 | yarn.lock | 4.0.4 | Unsafe random function |
| CVE-2025-7783 | form-data | 4.0.1 | yarn.lock | 4.0.4 | Unsafe random function |
| CVE-2025-9287 | cipher-base | 1.0.4 | yarn.lock | 1.0.5 | Hash manipulation vulnerability |
| CVE-2025-46658 | cocoapods | 1.8.4 | ios/branch-ios-sdk/.../Gemfile.lock | >= 1.16.0 | API token exfiltration via malicious Podspec |
| CVE-2025-46658 | cocoapods | 1.11.2 | node_modules/lottie-ios/Gemfile.lock | >= 1.16.0 | API token exfiltration via malicious Podspec |
| CVE-2025-46658 | cocoapods | 1.11.2 | node_modules/lottie-react-native/Gemfile.lock | >= 1.16.0 | API token exfiltration via malicious Podspec |
| CVE-2025-46657 | cocoapods-trunk | 1.4.1 | ios/branch-ios-sdk/.../Gemfile.lock | >= 1.7.0 | Session token MITM exposure |

### 2.2 HIGH Vulnerabilities (Top 20 unique)

| CVE | Package | Version | Location | Fixed Version | Title |
|---|---|---|---|---|---|
| CVE-2025-27152 | axios | 1.7.5 | .github/scripts/yarn.lock | 1.8.2 | SSRF and Credential Leakage via Absolute URL |
| CVE-2025-58754 | axios | 1.7.5, 1.8.2 | .github/scripts/yarn.lock, yarn.lock | 1.12.0 | DoS via lack of data size check |
| CVE-2026-25639 | axios | 1.7.5, 1.8.2 | .github/scripts/yarn.lock, yarn.lock | 1.13.5 | DoS via __proto__ key in mergeConfig |
| CVE-2023-22796 | activesupport | 4.2.11.1, 6.1.4.1 | Multiple Gemfile.lock files | >= 7.0.4.1 | Regular Expression Denial of Service |
| CVE-2022-21223 | cocoapods-downloader | 1.2.2, 1.5.1 | Multiple Gemfile.lock files | >= 1.6.2 | Command injection |
| CVE-2022-24440 | cocoapods-downloader | 1.2.2, 1.5.1 | Multiple Gemfile.lock files | >= 1.6.3 | Command injection |
| CVE-2020-10663 | json | 2.2.0 | ios/branch-ios-sdk/.../Gemfile.lock | >= 2.3.0 | Unsafe object creation |
| CVE-2026-26278 | fast-xml-parser | 4.4.1 | yarn.lock | 5.3.6 | DoS through entity expansion in DOCTYPE |
| CVE-2025-64756 | glob | 10.3.3, 10.4.5 | yarn.lock | 10.5.0 | Command Injection via Malicious Filenames |
| CVE-2026-23527 | h3 | 1.9.0 | yarn.lock | 1.15.5 | HTTP Request Smuggling |
| CVE-2026-26996 | minimatch | 3.1.2 | yarn.lock | 10.2.1 | ReDoS via repeated wildcards |
| CVE-2024-21907 | Newtonsoft.Json | 10.0.3 | node_modules/react-native-fs/.../packages.config | 13.0.1 | Improper Handling of Exceptional Conditions |
| CVE-2024-49761 | rexml | 3.2.5 | Multiple Gemfile.lock files | >= 3.3.9 | ReDoS vulnerability |
| CVE-2022-31163 | tzinfo | 1.2.5 | ios/branch-ios-sdk/.../Gemfile.lock | >= 1.2.10 | Arbitrary code execution |
| CVE-2019-13574 | mini_magick | 4.5.1 | ios/branch-ios-sdk/.../Gemfile.lock | >= 4.9.4 | Remote code execution |
| CVE-2021-32740 | addressable | 2.6.0 | ios/branch-ios-sdk/.../Gemfile.lock | >= 2.8.0 | ReDoS in templates |
| CVE-2024-12905 | tar-fs | 3.0.4 | yarn.lock | 3.0.7 | Path traversal via malicious tar file |
| CVE-2025-48387 | tar-fs | 3.0.4 | yarn.lock | 3.0.9 | Extract can write outside specified dir |
| CVE-2025-59343 | tar-fs | 3.0.4 | yarn.lock | 3.1.1 | Symlink validation bypass |
| CVE-2025-12758 | validator | 13.7.0 | yarn.lock | 13.15.22 | Incomplete Filtering of Special Elements |

### 2.3 Notable MEDIUM Vulnerabilities

| CVE | Package | Description |
|---|---|---|
| GHSA-qj3p-xc97-xw74 | @metamask/sdk-communication-layer@0.29.0-wallet | Exposed via malicious debug@4.4.2 dependency |
| CVE-2025-69873 | ajv@8.11.0, 8.17.1 | ReDoS via $data reference |
| CVE-2025-64718 | js-yaml@3.14.1, 4.1.0 | Prototype pollution in merge |
| CVE-2025-13465 | lodash@4.17.21 | Prototype pollution in _.unset and _.omit |
| CVE-2025-66030 | node-forge@1.3.1 | Integer Overflow allows OID-based security bypass |
| CVE-2025-22150 | undici@5.28.4 | Uses Insufficiently Random Values |

---

## 3. Infrastructure Findings

### 3.1 Dockerfile Analysis (`scripts/docker/Dockerfile`)

| Severity | Issue | Details |
|---|---|---|
| **HIGH** | apt-get missing `--no-install-recommends` | Line 4-10: `apt-get install -y` without `--no-install-recommends` increases attack surface |
| **LOW** | No HEALTHCHECK defined | No HEALTHCHECK instruction present |
| **INFO** | Non-root user configured | Line 38: `USER $UID:$GID` - correctly switches from root (good practice) |
| **INFO** | SHA-pinned git dependencies | Lines 43-44: rbenv and ruby-build use pinned commit hashes (good practice) |

### 3.2 GitHub Actions Workflow Findings (Checkov)

**841 checks passed, 26 failed**

#### CKV_GHA_7 - Missing Permissions Declaration (3 failures)

Workflows with write-all default permissions:

| Workflow | Lines |
|---|---|
| `create-release-pr-v2.yml` | 6-16 |
| `update-latest-build-version.yml` | 14-18 |
| `create-cherry-pick-pr.yml` | 6-16 |

**Remediation:** Add explicit `permissions` block with least-privilege scoping to each job.

#### CKV2_GHA_1 - Missing Workflow Permissions (23 failures)

All of the following workflows lack top-level `permissions` declarations:

| Workflow |
|---|
| `check-attributions.yml` |
| `security-code-scanner.yml` |
| `check-pr-labels.yml` |
| `changelog-check.yml` |
| `create-bug-report.yml` |
| `cla.yml` |
| `docker.yml` |
| `fitness-functions.yml` |
| `stale-issue-pr.yml` |
| `update-attributions.yml` |
| `create-release-pr-v2.yml` |
| `update-latest-build-version.yml` |
| `create-cherry-pick-pr.yml` |
| `check-template-and-add-labels.yml` |
| `bitrise-e2e-gate.yml` |
| `close-bug-report.yml` |
| `add-team-label.yml` |
| `publish-slack-release-testing-status.yml` |
| `run-bitrise-e2e-check.yml` |
| `add-release-label.yml` |
| `remove-labels-after-pr-closed.yml` |
| `ci.yml` |
| `pr-title-linter.yml` |

**Remediation:** Add a top-level `permissions: read-all` or explicit per-job permissions to each workflow.

### 3.3 Additional Dockerfile Misconfigurations (node_modules)

| File | Severity | Issue |
|---|---|---|
| `node_modules/opencv-bindings/.devcontainer/Dockerfile` | HIGH | Runs as root user |
| `node_modules/react-native-camera/Dockerfile` | HIGH | Runs as root user |
| `node_modules/recast/.devcontainer/Dockerfile` | HIGH | Runs as root user |
| `node_modules/recast/.devcontainer/base.Dockerfile` | HIGH | Runs as root user |

> Note: node_modules Dockerfiles are from third-party packages and not directly controllable.

---

## 4. SBOM (Software Bill of Materials) Status

SBOM generation via CycloneDX and Trivy was attempted but could not complete due to:
- CycloneDX requires `package-lock.json` (repo uses `yarn.lock`)
- Trivy SBOM mode does not support direct yarn.lock parsing

**Recommendation:** Use `yarn info --json` or integrate Snyk SBOM generation in CI with proper authentication to generate CycloneDX/SPDX-formatted SBOMs as part of the build pipeline.

---

## 5. Synthesized Remediation Plan

### Priority 1: CRITICAL (Immediate - within 1 week)

| # | Action | Packages | CVEs | Effort |
|---|---|---|---|---|
| 1 | **Update `form-data`** to >=3.0.4 / >=4.0.4 | form-data@3.0.2, 4.0.0, 4.0.1 | CVE-2025-7783 | Low - yarn upgrade |
| 2 | **Update `cipher-base`** to >=1.0.5 | cipher-base@1.0.4 | CVE-2025-9287 | Low - yarn upgrade |
| 3 | **Update `cocoapods`** in Gemfile.lock files | cocoapods@1.8.4, 1.11.2 | CVE-2025-46658 | Medium - Gemfile update + bundle install |
| 4 | **Update `activesupport`** in ios/branch-ios-sdk | activesupport@4.2.11.1 | CVE-2020-8165 | Medium - Gemfile update |
| 5 | **Update `cocoapods-trunk`** | cocoapods-trunk@1.4.1 | CVE-2025-46657 | Low - bundle update |

### Priority 2: HIGH Code Issues (Within 2 weeks)

| # | Action | Location | Details |
|---|---|---|---|
| 6 | **Fix remote property injection** | `app/core/SanitizationMiddleware.ts:103` | Replace bracket notation with validated/allowlisted key access |
| 7 | **Update `axios`** to >=1.13.5 | yarn.lock, .github/scripts/yarn.lock | Fixes SSRF, DoS, prototype pollution |
| 8 | **Update `cocoapods-downloader`** to >=1.6.3 | Multiple Gemfile.lock files | Command injection fix |
| 9 | **Update `tar-fs`** to >=3.1.1 | yarn.lock | Path traversal and symlink bypass fixes |
| 10 | **Update `glob`** to >=10.5.0 | yarn.lock | Command injection via filenames |
| 11 | **Update `fast-xml-parser`** to >=5.3.6 | yarn.lock | DoS via entity expansion |
| 12 | **Update `h3`** to >=1.15.5 | yarn.lock | HTTP request smuggling |
| 13 | **Update `validator`** to >=13.15.22 | yarn.lock | Incomplete filtering of special elements |

### Priority 3: MEDIUM Dependency Updates (Within 1 month)

| # | Action | Packages |
|---|---|---|
| 14 | Update `lodash` to >=4.17.23 | Prototype pollution fix |
| 15 | Update `js-yaml` to >=4.1.1 | Prototype pollution in merge |
| 16 | Update `ajv` to >=8.18.0 | ReDoS fix |
| 17 | Update `node-forge` to >=1.3.2 | Integer overflow fix |
| 18 | Update `undici` to >=5.28.5 | Insufficient randomness fix |
| 19 | Update `@metamask/sdk-communication-layer` to >=0.33.1 | Malicious debug dependency |
| 20 | Update `@octokit/*` packages | ReDoS fixes in .github/scripts |

### Priority 4: Infrastructure Hardening (Within 1 month)

| # | Action | Details |
|---|---|---|
| 21 | **Add `--no-install-recommends`** to Dockerfile | `scripts/docker/Dockerfile` line 5 |
| 22 | **Add HEALTHCHECK** to Dockerfile | `scripts/docker/Dockerfile` |
| 23 | **Add explicit permissions** to all 23 GitHub Actions workflows | Use `permissions: read-all` at workflow level |
| 24 | **Pin action versions** in `docker.yml` | `actions/checkout@v3` should use a commit SHA |

### Priority 5: Code Quality Improvements (Within 2 months)

| # | Action | Location |
|---|---|---|
| 25 | Replace dynamic RegExp with hardcoded patterns | `app/util/regex/index.ts` (5 instances) |
| 26 | Replace dynamic RegExp in networks | `app/core/Multichain/networks.ts:48` |
| 27 | Use constant format strings in logging | `app/core/WalletConnect/WalletConnectV2.ts` (4 instances) |
| 28 | Use constant format strings in SDK logging | `app/core/SDKConnect/` (2 instances) |

### Priority 6: Process Improvements

| # | Action | Details |
|---|---|---|
| 29 | **Set up Snyk integration** with valid API token | Enable continuous monitoring via Snyk MCP or CI integration |
| 30 | **Generate SBOM** in CI pipeline | Add CycloneDX or SPDX SBOM generation step to CI |
| 31 | **Update Branch SDK** | `ios/branch-ios-sdk/` contains severely outdated dependencies (activesupport@4.2.11.1, etc.) |
| 32 | **Audit node_modules Dockerfiles** | Consider alternatives to packages shipping insecure Dockerfiles |

---

## Appendix A: Scan Configuration

### Semgrep (SAST)
- Config: `auto` (Semgrep registry rules)
- Scope: `app/` directory, `.ts/.tsx/.js/.jsx` files
- Exclusions: `node_modules`, `*.test.*`, `e2e/`, `.storybook/`
- Rules evaluated: 214
- Files scanned: 3,034

### Trivy (SCA + Misconfig + Secrets)
- Version: 0.69.1
- Scanners: vuln, secret, misconfig
- Scope: Full repository filesystem
- Lock files analyzed: yarn.lock, Gemfile.lock (4 instances), packages.config, Podfile.lock

### Checkov (IaC)
- Framework: github_actions
- Scope: `.github/workflows/` directory
- Checks evaluated: 867 (841 passed, 26 failed)

---

*Report generated automatically. Findings should be validated by the security team before remediation.*
