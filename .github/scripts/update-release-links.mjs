import { readFileSync, writeFileSync } from "node:fs";

const [, , rawVersion, rawReleaseRepository = "GingerPrivacy/GingerWallet"] = process.argv;

if (!rawVersion) {
  throw new Error("Usage: node .github/scripts/update-release-links.mjs <version> [owner/repo]");
}

const version = rawVersion.replace(/^v/, "");
const releaseRepository = rawReleaseRepository.trim();

if (!/^\d+(?:\.\d+){1,3}$/.test(version)) {
  throw new Error(`Invalid release version: ${rawVersion}`);
}

if (!/^[A-Za-z0-9_.-]+\/[A-Za-z0-9_.-]+$/.test(releaseRepository)) {
  throw new Error(`Invalid release repository: ${rawReleaseRepository}`);
}

const indexPath = "wwwroot/index.html";
let html = readFileSync(indexPath, "utf8");
const originalHtml = html;
const versionPattern = String.raw`\d+(?:\.\d+){1,3}`;
const releaseBase = `https://github.com/${releaseRepository}/releases/download/v${version}`;
const releaseUrlPrefix = String.raw`h?https:\/\/github\.com\/[^\/"'<>\s]+\/[^\/"'<>\s]+\/releases\/download\/v${versionPattern}\/`;

const replacements = [
  ["Windows installer signature", String.raw`Ginger-${versionPattern}\.msi\.asc`, `Ginger-${version}.msi.asc`],
  ["Windows installer", String.raw`Ginger-${versionPattern}\.msi(?!\.asc)`, `Ginger-${version}.msi`],
  ["macOS Apple Silicon signature", String.raw`Ginger-${versionPattern}-arm64\.dmg\.asc`, `Ginger-${version}-arm64.dmg.asc`],
  ["macOS Apple Silicon", String.raw`Ginger-${versionPattern}-arm64\.dmg(?!\.asc)`, `Ginger-${version}-arm64.dmg`],
  ["macOS Intel signature", String.raw`Ginger-${versionPattern}\.dmg\.asc`, `Ginger-${version}.dmg.asc`],
  ["macOS Intel", String.raw`Ginger-${versionPattern}\.dmg(?!\.asc)`, `Ginger-${version}.dmg`],
  ["Debian package signature", String.raw`Ginger-${versionPattern}\.deb\.asc`, `Ginger-${version}.deb.asc`],
  ["Debian package", String.raw`Ginger-${versionPattern}\.deb(?!\.asc)`, `Ginger-${version}.deb`],
  ["Linux tarball signature", String.raw`Ginger-${versionPattern}(?:-linux-x64)?\.tar\.gz\.asc`, `Ginger-${version}-linux-x64.tar.gz.asc`],
  ["Linux tarball", String.raw`Ginger-${versionPattern}(?:-linux-x64)?\.tar\.gz(?!\.asc)`, `Ginger-${version}-linux-x64.tar.gz`]
];

const counts = [];

for (const [label, assetPattern, assetName] of replacements) {
  const regex = new RegExp(`${releaseUrlPrefix}${assetPattern}`, "g");
  let count = 0;
  html = html.replace(regex, () => {
    count += 1;
    return `${releaseBase}/${assetName}`;
  });
  counts.push([label, count]);
}

const missing = counts.filter(([, count]) => count === 0).map(([label]) => label);
if (missing.length > 0) {
  throw new Error(`Could not find release links for: ${missing.join(", ")}`);
}

if (html !== originalHtml) {
  writeFileSync(indexPath, html, "utf8");
}

for (const [label, count] of counts) {
  console.log(`${label}: ${count}`);
}

console.log(`Updated release links to v${version} from ${releaseRepository}.`);
