#!/usr/bin/env node
import assert from "node:assert/strict";
import fs from "node:fs";

const source = fs.readFileSync("src/components/foundation/Preloader.tsx", "utf8");
assert.match(source, /role="progressbar"/, "loader exposes progressbar semantics");
assert.match(source, /aria-valuemin=\{0\}/, "progressbar has a zero minimum");
assert.match(source, /aria-valuemax=\{100\}/, "progressbar has a hundred maximum");
assert.match(source, /aria-valuenow=\{progress\}/, "assistive technology receives the current progress value");
assert.match(source, /aria-valuetext=\{\x60\$\{progress\} percent\x60\}/, "progress value has a readable percentage");
assert.match(source, /aria-live="off"/, "rapid visual progress updates do not flood live announcements");

console.log("PASS Preloader exposes an accessible percentage progressbar without live-region update spam.");
