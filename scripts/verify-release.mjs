import fs from "node:fs";

function readJson(path) {
  return JSON.parse(fs.readFileSync(path, "utf8"));
}

function readCargoVersion(path) {
  const cargo = fs.readFileSync(path, "utf8");
  const packageSection = cargo.match(/\[package\]([\s\S]*?)(?:\n\[|$)/)?.[1];
  const version = packageSection?.match(/^version\s*=\s*"([^"]+)"/m)?.[1];
  if (!version) throw new Error(`${path}에서 package.version을 찾을 수 없습니다.`);
  return version;
}

function readCargoLockPackageVersion(path, packageName) {
  const cargoLock = fs.readFileSync(path, "utf8");
  for (const section of cargoLock.split(/\n(?=\[\[package\]\]\n)/)) {
    const name = section.match(/^name\s*=\s*"([^"]+)"$/m)?.[1];
    if (name !== packageName) continue;
    const version = section.match(/^version\s*=\s*"([^"]+)"$/m)?.[1];
    if (version) return version;
  }
  throw new Error(`${path}에서 ${packageName} 패키지 버전을 찾을 수 없습니다.`);
}

function majorMinor(version) {
  const match = version.match(/^(\d+)\.(\d+)\./);
  if (!match) throw new Error(`SemVer 형식이 아닌 버전입니다: ${version}`);
  return `${match[1]}.${match[2]}`;
}

function argument(name) {
  const index = process.argv.indexOf(name);
  return index >= 0 ? process.argv[index + 1] : undefined;
}

const packageJson = readJson("package.json");
const packageLock = readJson("package-lock.json");
const tauriConfig = readJson("src-tauri/tauri.conf.json");
const versions = {
  "package.json": packageJson.version,
  "package-lock.json": packageLock.version,
  "package-lock.json packages[\"\"]": packageLock.packages?.[""]?.version,
  "src-tauri/Cargo.toml": readCargoVersion("src-tauri/Cargo.toml"),
  "src-tauri/tauri.conf.json": tauriConfig.version,
};
const uniqueVersions = new Set(Object.values(versions));

if (uniqueVersions.size !== 1 || uniqueVersions.has(undefined)) {
  const details = Object.entries(versions)
    .map(([file, version]) => `${file}: ${version ?? "없음"}`)
    .join("\n");
  throw new Error(`릴리스 버전이 일치하지 않습니다.\n${details}`);
}

const tauriVersions = {
  "package-lock.json @tauri-apps/api":
    packageLock.packages?.["node_modules/@tauri-apps/api"]?.version,
  "package-lock.json @tauri-apps/cli":
    packageLock.packages?.["node_modules/@tauri-apps/cli"]?.version,
  "src-tauri/Cargo.lock tauri": readCargoLockPackageVersion(
    "src-tauri/Cargo.lock",
    "tauri",
  ),
};

if (Object.values(tauriVersions).some((value) => !value)) {
  const details = Object.entries(tauriVersions)
    .map(([source, value]) => `${source}: ${value ?? "없음"}`)
    .join("\n");
  throw new Error(`Tauri 버전을 확인할 수 없습니다.\n${details}`);
}

const tauriMinorVersions = new Set(
  Object.values(tauriVersions).map(majorMinor),
);
if (tauriMinorVersions.size !== 1) {
  const details = Object.entries(tauriVersions)
    .map(([source, value]) => `${source}: ${value}`)
    .join("\n");
  throw new Error(`Tauri major/minor 버전이 일치하지 않습니다.\n${details}`);
}

const version = packageJson.version;
const tag = argument("--tag") ?? process.env.GITHUB_REF_NAME;
if (tag) {
  const stableTag = /^v(0|[1-9]\d*)\.(0|[1-9]\d*)\.(0|[1-9]\d*)$/;
  if (!stableTag.test(tag)) {
    throw new Error(`안정 릴리스 태그 형식이 아닙니다: ${tag}`);
  }
  if (tag !== `v${version}`) {
    throw new Error(`태그 ${tag}와 앱 버전 v${version}이 일치하지 않습니다.`);
  }
}

if (process.env.GITHUB_OUTPUT) {
  fs.appendFileSync(process.env.GITHUB_OUTPUT, `version=${version}\n`);
}

console.log(
  tag
    ? `릴리스 버전 검증 완료: ${tag}`
    : `릴리스 버전 검증 완료: v${version}`,
);
