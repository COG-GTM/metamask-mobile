#!/usr/bin/env python3
"""Generate MIGRATION_TODO.md: inventory of remaining .js/.jsx source files grouped into batches."""
import os
import re
from collections import OrderedDict

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
SRC_ROOTS = ["app", "scripts", "wdio", "e2e"]
EXCLUDE_DIRS = {"node_modules", "build", "dist", "coverage", "__generated__"}

files = []
for root in SRC_ROOTS:
    for dirpath, dirnames, filenames in os.walk(os.path.join(ROOT, root)):
        dirnames[:] = [d for d in dirnames if d not in EXCLUDE_DIRS]
        for f in filenames:
            if f.endswith((".js", ".jsx")):
                files.append(os.path.relpath(os.path.join(dirpath, f), ROOT))
files.sort()

# Batches: ordered list of (id, title, list of path prefixes). First match wins.
BATCHES = [
    ("A", "app/components/Views/confirmations", ["app/components/Views/confirmations/"]),
    ("B", "app/components/Views (everything except confirmations)", ["app/components/Views/"]),
    ("C", "app/components/UI/Swaps", ["app/components/UI/Swaps/"]),
    ("D1", "app/components/UI subdirs A–M", ["app/components/UI/" + c for c in "ABCDEFGHIJKLM"]),
    ("D2", "app/components/UI subdirs N–Z (except Swaps) + lowercase", ["app/components/UI/"]),
    ("E", "app/components/Base + Nav + rest of app/components", ["app/components/"]),
    ("F", "app/store (migrations)", ["app/store/"]),
    ("G", "app/util + app/lib + app/constants + app/images + app/__mocks__", ["app/util/", "app/lib/", "app/constants/", "app/images/", "app/__mocks__/"]),
    ("H", "app/core + app/reducers + app/actions", ["app/core/", "app/reducers/", "app/actions/"]),
    ("I1", "e2e/pages", ["e2e/pages/"]),
    ("I2", "e2e/selectors", ["e2e/selectors/"]),
    ("J", "e2e/specs", ["e2e/specs/"]),
    ("K", "e2e (root, utils, fixtures, api-mocking, api-specs, resources)", ["e2e/"]),
    ("L", "wdio/screen-objects", ["wdio/screen-objects/"]),
    ("M", "wdio (step-definitions, utils, config, helpers) + scripts", ["wdio/", "scripts/"]),
]

grouped = OrderedDict((b[0], []) for b in BATCHES)
for f in files:
    for bid, _title, prefixes in BATCHES:
        if any(f.startswith(p) for p in prefixes):
            grouped[bid].append(f)
            break
    else:
        raise SystemExit(f"unbatched file: {f}")

# Closing or self-closing tags; avoids matching JSDoc/TS generics such as `Array<string>`.
jsx_re = re.compile(r"</[A-Za-z][A-Za-z0-9.]*>|/>")

def has_jsx(path):
    try:
        with open(os.path.join(ROOT, path), encoding="utf-8", errors="ignore") as fh:
            return bool(jsx_re.search(fh.read()))
    except OSError:
        return False

out = []
out.append("# JavaScript → TypeScript Migration Tracker\n")
out.append(
    "Source of truth for the JS→TS migration. Each batch is owned by one session and must not touch files "
    "outside its batch (other than import-path fixes required by renames). Check off files as they are "
    "converted (`- [x]`). Regenerate the unchecked list with `python3 scripts/gen-migration-todo.py` if needed.\n"
)
out.append("Excluded on purpose (build/tooling config, not app source): root `index.js`, `shim.js`, `app.config.js`, "
           "`babel.config*.js`, `metro.config.js`, `metro.transform.js`, `jest.config.js`, `react-native.config.js`, `ses-hermes.cjs`.\n")
out.append("## Conventions\n")
out.append("- `.js` → `.ts`; files containing JSX → `.tsx` (suggested target extension is listed per file, verify before renaming).")
out.append("- Type props with interfaces; remove `PropTypes`. Prefer types from `@metamask/*` controllers, `@reduxjs/toolkit`, `react-redux`, `react-navigation`.")
out.append("- No blanket `any`; use `unknown` + narrowing. Flag every remaining `any` / `@ts-expect-error` in the PR description.")
out.append("- Rename with `git mv` so history is preserved. Convert co-located `*.test.js` and `*.stories.js` in the same PR.")
out.append("- Verify: `yarn lint:tsc`, `yarn jest <paths>`, `yarn eslint <paths>`.\n")

total = len(files)
out.append(f"## Summary ({total} files)\n")
out.append("| Batch | Scope | Files |\n|---|---|---|")
for bid, title, _ in BATCHES:
    out.append(f"| {bid} | {title} | {len(grouped[bid])} |")
out.append("")

for bid, title, _ in BATCHES:
    out.append(f"## Batch {bid} — {title} ({len(grouped[bid])} files)\n")
    by_dir = OrderedDict()
    for f in grouped[bid]:
        by_dir.setdefault(os.path.dirname(f), []).append(f)
    for d, fs in by_dir.items():
        out.append(f"### `{d}/`")
        for f in fs:
            ext = ".tsx" if (f.endswith(".jsx") or has_jsx(f)) else ".ts"
            out.append(f"- [ ] `{f}` → `{ext}`")
        out.append("")

with open(os.path.join(ROOT, "MIGRATION_TODO.md"), "w") as fh:
    fh.write("\n".join(out) + "\n")
print(f"wrote MIGRATION_TODO.md with {total} files")
