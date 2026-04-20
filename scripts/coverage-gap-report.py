#!/usr/bin/env python3
"""Generate a coverage gap report for the ``app/`` source tree.

Scans ``app/`` for source files that do not have an adjacent test file and
emits a JSON report at ``tests/coverage-gap-report.json`` plus a
human-readable summary to stdout.

Designed for CI usage: a ``--strict`` flag exits non-zero when coverage
percentage drops below a saved baseline at ``tests/coverage-baseline.json``.
"""

import argparse
import json
import os
import sys
from datetime import datetime, timezone


REPO_ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
APP_DIR = os.path.join(REPO_ROOT, "app")
REPORT_PATH = os.path.join(REPO_ROOT, "tests", "coverage-gap-report.json")
BASELINE_PATH = os.path.join(REPO_ROOT, "tests", "coverage-baseline.json")

SOURCE_EXTENSIONS = (".ts", ".tsx", ".js", ".jsx")
TEST_EXTENSIONS = (".ts", ".tsx", ".js", ".jsx")

EXCLUDED_DIR_NAMES = {
    "__mocks__",
    "_mocks_",
    "test",
    "tests",
    "__tests__",
    "__snapshots__",
    "node_modules",
}

EXCLUDED_FILE_SUFFIXES = (
    ".d.ts",
)

EXCLUDED_INFIX_MARKERS = (
    ".test.",
    ".spec.",
    ".stories.",
    ".styles.",
    ".types.",
    ".constants.",
)


def is_excluded_file(filename: str) -> bool:
    """Return True for test/stories/types/constants/index files."""
    if filename.startswith("index."):
        return True
    if filename.endswith(EXCLUDED_FILE_SUFFIXES):
        return True
    for marker in EXCLUDED_INFIX_MARKERS:
        if marker in filename:
            return True
    return False


def has_source_extension(filename: str) -> bool:
    return filename.endswith(SOURCE_EXTENSIONS)


def has_adjacent_test(src_path: str) -> bool:
    """Return True if a sibling or ``test/`` test file exists for ``src_path``."""
    directory, filename = os.path.split(src_path)
    base, _ = os.path.splitext(filename)

    for ext in TEST_EXTENSIONS:
        for marker in (".test", ".spec"):
            candidate = os.path.join(directory, f"{base}{marker}{ext}")
            if os.path.isfile(candidate):
                return True

    test_dir = os.path.join(directory, "test")
    if os.path.isdir(test_dir):
        for ext in TEST_EXTENSIONS:
            for marker in (".test", ".spec", ""):
                candidate = os.path.join(test_dir, f"{base}{marker}{ext}")
                if os.path.isfile(candidate):
                    return True

    return False


def top_level_dir(rel_path: str) -> str:
    """Group a repo-relative path by its first three path components.

    Examples:
      ``app/components/UI/Foo/Foo.tsx`` -> ``app/components/UI``
      ``app/util/foo.ts``               -> ``app/util``
    """
    parts = rel_path.split(os.sep)
    if len(parts) >= 3:
        return os.sep.join(parts[:3])
    return os.sep.join(parts[:-1]) if len(parts) > 1 else parts[0]


def walk_sources(root: str):
    """Yield repo-relative paths of source files eligible for coverage checks."""
    for dirpath, dirnames, filenames in os.walk(root):
        dirnames[:] = [d for d in dirnames if d not in EXCLUDED_DIR_NAMES]
        for filename in filenames:
            if not has_source_extension(filename):
                continue
            if is_excluded_file(filename):
                continue
            abs_path = os.path.join(dirpath, filename)
            yield abs_path


def build_report() -> dict:
    total = 0
    with_tests = 0
    missing: list[str] = []
    by_dir: dict[str, dict[str, int]] = {}

    for abs_path in walk_sources(APP_DIR):
        rel_path = os.path.relpath(abs_path, REPO_ROOT)
        total += 1

        bucket = top_level_dir(rel_path)
        entry = by_dir.setdefault(bucket, {"src": 0, "missing": 0})
        entry["src"] += 1

        if has_adjacent_test(abs_path):
            with_tests += 1
        else:
            missing.append(rel_path)
            entry["missing"] += 1

    missing.sort()
    return {
        "generated_at": datetime.now(timezone.utc).isoformat(),
        "total_source_files": total,
        "files_with_tests": with_tests,
        "files_missing_tests": missing,
        "by_top_level_dir": dict(sorted(by_dir.items())),
    }


def coverage_percent(report: dict) -> float:
    total = report.get("total_source_files", 0) or 0
    if not total:
        return 0.0
    return (report.get("files_with_tests", 0) / total) * 100.0


def print_summary(report: dict) -> None:
    pct = coverage_percent(report)
    total = report["total_source_files"]
    covered = report["files_with_tests"]
    missing = total - covered

    print("Coverage gap report")
    print("-------------------")
    print(f"Generated at:         {report['generated_at']}")
    print(f"Total source files:   {total}")
    print(f"Files with tests:     {covered}")
    print(f"Files missing tests:  {missing}")
    print(f"Test-adjacency ratio: {pct:.2f}%")
    print()
    print("By top-level directory:")
    for directory, counts in report["by_top_level_dir"].items():
        dir_total = counts["src"]
        dir_missing = counts["missing"]
        dir_pct = 0.0 if not dir_total else ((dir_total - dir_missing) / dir_total) * 100.0
        print(f"  {directory}: {dir_total - dir_missing}/{dir_total} ({dir_pct:.2f}%)")


def write_report(report: dict) -> None:
    os.makedirs(os.path.dirname(REPORT_PATH), exist_ok=True)
    with open(REPORT_PATH, "w", encoding="utf-8") as fh:
        json.dump(report, fh, indent=2, sort_keys=True)
        fh.write("\n")


def check_strict(report: dict) -> int:
    """Return non-zero if coverage % regressed vs. the saved baseline."""
    if not os.path.isfile(BASELINE_PATH):
        print("No baseline found at tests/coverage-baseline.json; skipping strict check.")
        return 0

    with open(BASELINE_PATH, "r", encoding="utf-8") as fh:
        baseline = json.load(fh)

    current_pct = coverage_percent(report)
    baseline_pct = coverage_percent(baseline)

    print(f"Baseline coverage: {baseline_pct:.2f}%  Current coverage: {current_pct:.2f}%")
    if current_pct + 1e-6 < baseline_pct:
        print("ERROR: coverage percentage regressed vs. baseline.", file=sys.stderr)
        return 1
    return 0


def main() -> int:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument(
        "--strict",
        action="store_true",
        help="Exit non-zero if coverage % dropped vs. the saved baseline.",
    )
    args = parser.parse_args()

    if not os.path.isdir(APP_DIR):
        print(f"ERROR: expected source directory at {APP_DIR}", file=sys.stderr)
        return 1

    report = build_report()
    write_report(report)
    print_summary(report)

    if args.strict:
        return check_strict(report)
    return 0


if __name__ == "__main__":
    sys.exit(main())
