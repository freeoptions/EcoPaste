import { copyFile, mkdir, readdir, stat } from "node:fs/promises";
import { execFileSync } from "node:child_process";
import { basename, dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const projectRoot = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const targetDir = "D:\\testohmymymy\\EcoPaste";

const candidateDirs = [
	join(projectRoot, "target", "release"),
	join(projectRoot, "target", "release", "bundle", "nsis"),
	join(projectRoot, "src-tauri", "target", "release"),
	join(projectRoot, "src-tauri", "target", "release", "bundle", "nsis"),
];

interface Artifact {
	source: string;
	targetName: string;
}

async function findArtifacts() {
	const artifacts = new Map<string, Artifact>();

	for (const dir of candidateDirs) {
		try {
			const entries = await readdir(dir, { withFileTypes: true });

			for (const entry of entries) {
				if (!entry.isFile()) continue;

				const lowerName = entry.name.toLowerCase();
				const source = join(dir, entry.name);

				if (lowerName === "ecopaste.exe") {
					artifacts.set("app", {
						source,
						targetName: "EcoPaste.exe",
					});
				}

				if (
					lowerName.endsWith(".exe") &&
					(lowerName.includes("setup") || lowerName.includes("nsis"))
				) {
					artifacts.set("setup", {
						source,
						targetName: "setup.exe",
					});
				}
			}
		} catch {
			// Some artifact folders only exist after specific Tauri bundle targets.
		}
	}

	return Array.from(artifacts.values());
}

const artifacts = await findArtifacts();

if (artifacts.length === 0) {
	throw new Error("No Windows artifacts found. Run the Tauri build first.");
}

await mkdir(targetDir, { recursive: true });

const wait = (millis: number) => {
	return new Promise((resolve) => setTimeout(resolve, millis));
};

function stopRunningTarget(target: string) {
	if (process.platform !== "win32") return;

	const command = [
		"Get-Process",
		"-ErrorAction",
		"SilentlyContinue",
		"|",
		`Where-Object { $_.Path -eq '${target.replaceAll("'", "''")}' }`,
		"|",
		"Stop-Process",
		"-Force",
	].join(" ");

	execFileSync("powershell", ["-NoProfile", "-Command", command], {
		stdio: "ignore",
	});
}

async function copyFileWithRetry(source: string, target: string) {
	const maxAttempts = 6;

	for (let attempt = 1; attempt <= maxAttempts; attempt += 1) {
		try {
			await copyFile(source, target);
			return;
		} catch (error) {
			if (
				attempt === maxAttempts ||
				!(error instanceof Error) ||
				!("code" in error) ||
				error.code !== "EBUSY"
			) {
				throw error;
			}

			stopRunningTarget(target);
			await wait(500 * attempt);
		}
	}
}

for (const artifact of artifacts) {
	const { source, targetName } = artifact;
	const target = join(targetDir, targetName);
	stopRunningTarget(target);
	await copyFileWithRetry(source, target);
	const { size } = await stat(target);
	console.log(`Copied ${source} -> ${target} (${size} bytes)`);
}
