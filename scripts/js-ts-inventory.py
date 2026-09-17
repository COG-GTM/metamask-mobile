#!/usr/bin/env python3
"""Build a JS->TS migration inventory for app/.

Enumerates remaining .js/.jsx files under app/, builds an import graph across
all app source files (.js/.jsx/.ts/.tsx), and computes for each remaining JS
file how many *other app files* import it (in-degree), split by JS vs TS
importers. Classifies each file into a workstream and flags cross-domain
imports (a JS file imported by files outside its own workstream).
"""
import os
import re
import json
import collections

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
APP = os.path.join(ROOT, "app")
EXTS = (".js", ".jsx", ".ts", ".tsx")
RESOLVE_EXTS = [".ts", ".tsx", ".js", ".jsx", ".json", ".d.ts"]

TEST_RE = re.compile(r"\.(test|spec)\.")

# import ... from '...'  |  export ... from '...'  |  require('...')  |  import('...')
IMPORT_RE = re.compile(
    r"""(?:import|export)\s+[^;'"]*?from\s*['"]([^'"]+)['"]"""
    r"""|require\(\s*['"]([^'"]+)['"]\s*\)"""
    r"""|import\(\s*['"]([^'"]+)['"]\s*\)""",
    re.MULTILINE,
)


def rel(p):
    return os.path.relpath(p, ROOT)


def is_test(p):
    return bool(TEST_RE.search(os.path.basename(p)))


def all_app_files():
    out = []
    for dirpath, dirnames, filenames in os.walk(APP):
        if "node_modules" in dirpath:
            continue
        for f in filenames:
            if f.endswith(EXTS):
                out.append(os.path.join(dirpath, f))
    return out


def resolve(importer, spec):
    """Resolve an import spec to an absolute file path within app/, or None."""
    base = None
    if spec.startswith("."):
        base = os.path.normpath(os.path.join(os.path.dirname(importer), spec))
    elif spec.startswith("images/"):
        base = os.path.join(APP, "images", spec[len("images/"):])
    else:
        return None  # bare module / alias we don't track
    # direct file with extension
    if os.path.isfile(base) and base.endswith(EXTS):
        return base
    for e in RESOLVE_EXTS:
        cand = base + e
        if os.path.isfile(cand):
            return cand
    # directory -> index
    if os.path.isdir(base):
        for e in RESOLVE_EXTS:
            cand = os.path.join(base, "index" + e)
            if os.path.isfile(cand):
                return cand
    return None


def workstream(relpath):
    p = relpath
    if p.startswith("app/util/"):
        return "A_util"
    if p.startswith("app/components/Base/"):
        return "B_base"
    if p.startswith("app/components/UI/"):
        return "C_ui"
    if p.startswith("app/components/Views/"):
        return "D_views"
    if p.startswith("app/component-library/"):
        return "E_complib"
    # F: everything else in app/
    return "F_other"


def sub_domain(relpath):
    """A finer-grained grouping used for F and general reporting."""
    parts = relpath.split("/")
    # app/<top>/<second>
    if len(parts) >= 3:
        return "/".join(parts[:2])
    return "/".join(parts[:2])


def main():
    files = all_app_files()
    files_set = set(files)

    # remaining JS source & test files
    js_files = [f for f in files if f.endswith((".js", ".jsx"))]
    js_source = [f for f in js_files if not is_test(f)]
    js_test = [f for f in js_files if is_test(f)]

    # Build edges: importer -> resolved target (only targets inside app/)
    importers_of = collections.defaultdict(list)  # target -> [importer,...]
    edges = 0
    for f in files:
        try:
            with open(f, "r", encoding="utf-8", errors="ignore") as fh:
                text = fh.read()
        except Exception:
            continue
        seen = set()
        for m in IMPORT_RE.finditer(text):
            spec = m.group(1) or m.group(2) or m.group(3)
            if not spec:
                continue
            tgt = resolve(f, spec)
            if tgt and tgt in files_set and tgt != f:
                if (f, tgt) in seen:
                    continue
                seen.add((f, tgt))
                importers_of[tgt].append(f)
                edges += 1

    rows = []
    for f in js_source:
        imps = importers_of.get(f, [])
        js_imp = [i for i in imps if i.endswith((".js", ".jsx"))]
        ts_imp = [i for i in imps if i.endswith((".ts", ".tsx"))]
        ws = workstream(rel(f))
        # cross-domain: importers whose workstream differs
        cross = sorted({workstream(rel(i)) for i in imps if workstream(rel(i)) != ws})
        rows.append({
            "file": rel(f),
            "workstream": ws,
            "domain": sub_domain(rel(f)),
            "importers_total": len(imps),
            "importers_js": len(js_imp),
            "importers_ts": len(ts_imp),
            "is_leaf": len(imps) == 0,
            "cross_domain_importers": cross,
            "has_test": os.path.exists(_test_path(f)),
        })

    rows.sort(key=lambda r: (r["workstream"], -r["importers_total"], r["file"]))

    out = {
        "summary": {
            "js_source_files": len(js_source),
            "js_test_files": len(js_test),
            "total_js_files": len(js_files),
            "import_edges_resolved": edges,
        },
        "by_workstream": dict(collections.Counter(r["workstream"] for r in rows)),
        "rows": rows,
        "test_files": [rel(f) for f in sorted(js_test)],
    }
    with open(os.path.join(ROOT, "scripts", "js-ts-inventory.json"), "w") as fh:
        json.dump(out, fh, indent=2)
    print(json.dumps(out["summary"], indent=2))
    print("by_workstream:", json.dumps(out["by_workstream"], indent=2))


def _test_path(f):
    # naive companion test path guess (not exhaustive)
    base, ext = os.path.splitext(f)
    return base + ".test" + ext


if __name__ == "__main__":
    main()
