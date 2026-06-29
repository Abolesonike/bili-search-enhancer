# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project overview

This is a Manifest V3 browser extension (Chinese UI) that adds a floating "B站考古工具 · 时间胶囊" panel to `search.bilibili.com` pages. It lets users search Bilibili videos by keyword, era (custom year ranges), partition (Bilibili category/tid), and sort order.

## Loading the extension for development

There is no build system, package manager, test suite, or linter. The extension is loaded directly from this directory as an unpacked extension:

- **Chrome / Edge**: Go to `chrome://extensions` (or `edge://extensions`), enable **Developer mode**, click **Load unpacked**, and select this repository directory.
- The extension matches `*://search.bilibili.com/*` and injects `content.js` and `style.css` at `document_end`.

To verify changes after editing, reload the extension in the extensions page and refresh a Bilibili search page.

## File structure

```
manifest.json   # Manifest V3 definition: content script, matches, permissions
content.js      # All extension logic: UI creation, event binding, URL building, drag handling
style.css       # All styles for the injected floating panel
```

## Architecture

- **Single content script**: `content.js` is an IIFE that creates a fixed-position panel (`#bili-archaeology-tool`) and attaches it to `document.body`.
- **URL construction**: `buildSearchUrl` constructs a Bilibili search URL using `URLSearchParams`:
  - `keyword` — required search term.
  - `stime` / `etime` — Unix timestamps for the selected era, unless the era is the default `2009-2020`.
  - `tids` — partition/category ID, omitted when set to `0` (all).
  - `order` — sort order, omitted when set to `totalrank`.
- **State sync from URL**: `autoFillFromUrl` reads the current page's query parameters and pre-populates the panel's inputs when the user lands on a search result page.
- **Interactions**:
  - Search is triggered by the button or pressing Enter in the keyword input.
  - Preset keyword buttons immediately fill the input and search.
  - The drag handle lets users reposition the panel; movement is constrained to the viewport.
  - Reset restores defaults and focuses the keyword input.

## Configuration data

Hard-coded arrays in `content.js` define the UI options:

- `ERAS` — year ranges mapped to `stime`/`etime`.
- `PARTITIONS` — Bilibili `tids` values and their Chinese labels.
- `KEYWORD_PRESETS` — quick-search keyword buttons shown below the input.

Modify these arrays directly to add or change eras, partitions, or preset keywords.

## Notes for changes

- Keep styles scoped to `#bili-archaeology-tool` to avoid leaking into the host page.
- The panel uses `z-index: 2147483647` to stay above Bilibili's own UI elements.
- The extension declares no permissions (`"permissions": []`), so it cannot use browser APIs beyond content-script injection on matched pages.
