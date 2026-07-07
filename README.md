# utils

A collection of small personal utilities. Each lives in its own subfolder with
its own README.

## Utils

- [go-links](go-links/) — type `go/outlook`, `go/excel`, etc. in any browser and
  get redirected to the right URL. Local stdlib Python redirect server.

## Prerequisites

Each util lists its own prerequisites in its README — there's no shared runtime
requirement across the repo. So far:

- **go-links** — Python 3 only (macOS Command Line Tools: `xcode-select --install`).

## Adding a new util

Make a new folder, drop the code and a `README.md` in it, and add a line to the
list above. No shared build system — keep each util self-contained until there's
a real reason to share code.
