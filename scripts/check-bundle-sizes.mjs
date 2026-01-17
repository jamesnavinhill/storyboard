#!/usr/bin/env node
import fs from "node:fs";
import path from "node:path";
import zlib from "node:zlib";

const DIST = path.resolve(process.cwd(), "dist");
const ASSETS = path.join(DIST, "assets");

function gzipSizeSync(buf) {
  const gz = zlib.gzipSync(buf, { level: 9 });
  return gz.length;
}

function readFileSyncSafe(p) {
  return fs.readFileSync(p);
}

function formatKB(n) {
  return `${(n / 1024).toFixed(2)} kB`;
}

function isVendor(name) {
  return (
    /(^|-)react-vendor/.test(name) ||
    /^vendor-/.test(name) ||
    /tiptap/.test(name) ||
    /prosemirror/.test(name) ||
    /highlight/.test(name) ||
    /use-sync-external-store/.test(name) ||
    /scheduler/.test(name) ||
    /linkifyjs/.test(name) ||
    /zod/.test(name)
  );
}

function main() {
  if (!fs.existsSync(ASSETS)) {
    console.error("No dist/assets found. Build first.");
    process.exit(1);
  }

  const files = fs.readdirSync(ASSETS).filter((f) => f.endsWith(".js"));
  const results = files.map((f) => {
    const p = path.join(ASSETS, f);
    const size = gzipSizeSync(readFileSyncSafe(p));
    return { file: f, size };
  });

  const entry = results.find((r) => /^index-.*\.js$/.test(r.file));
  if (!entry) {
    console.error("Entry bundle (index-*.js) not found.");
    process.exit(1);
  }

  const MAX_ENTRY = 200 * 1024; // 200 kB gzip
  const MAX_APP_CHUNK = 300 * 1024; // 300 kB gzip

  let ok = true;

  if (entry.size > MAX_ENTRY) {
    console.error(
      `FAIL: entry ${entry.file} is ${formatKB(entry.size)} > ${formatKB(
        MAX_ENTRY
      )}`
    );
    ok = false;
  } else {
    console.log(
      `PASS: entry ${entry.file} is ${formatKB(entry.size)} <= ${formatKB(
        MAX_ENTRY
      )}`
    );
  }

  const offenders = results.filter(
    (r) => !isVendor(r.file) && r.file !== entry.file && r.size > MAX_APP_CHUNK
  );
  if (offenders.length) {
    console.error("FAIL: non-vendor chunks exceeding limit:");
    offenders.forEach((o) =>
      console.error(` - ${o.file}: ${formatKB(o.size)}`)
    );
    ok = false;
  } else {
    console.log("PASS: all non-vendor chunks are within limits");
  }

  process.exit(ok ? 0 : 2);
}

main();
