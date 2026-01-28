#!/usr/bin/env node
"use strict";

const fs = require("node:fs");
const path = require("node:path");
const { execSync } = require("node:child_process");

function run(cmd) {
	return execSync(cmd, {
		encoding: "utf8",
		stdio: ["ignore", "pipe", "pipe"],
	}).trim();
}

function getRepoRoot() {
	return run("git rev-parse --show-toplevel");
}

function getStagedFiles() {
	const output = run("git diff --name-only --cached");
	return output ? output.split("\n").filter(Boolean) : [];
}

function hasDependencyChanges(file) {
	const dependencyFields = [
		"dependencies",
		"devDependencies",
		"peerDependencies",
		"optionalDependencies",
		"packageManager",
	];

	const readJson = (ref) => {
		try {
			const content =
				ref === ":" ? run(`git show :${file}`) : run(`git show ${ref}:${file}`);
			return JSON.parse(content);
		} catch {
			return null;
		}
	};

	const normalizeDeps = (value) => {
		if (!value || typeof value !== "object") return null;
		const sorted = Object.keys(value)
			.sort()
			.reduce((acc, key) => {
				acc[key] = String(value[key]);
				return acc;
			}, {});
		return sorted;
	};

	const staged = readJson(":");
	if (!staged) return true;
	const head = readJson("HEAD");

	return dependencyFields.some((field) => {
		const stagedValue = staged[field];
		const headValue = head ? head[field] : undefined;

		if (field === "packageManager") {
			return String(stagedValue || "") !== String(headValue || "");
		}

		const stagedDeps = normalizeDeps(stagedValue);
		const headDeps = normalizeDeps(headValue);
		return JSON.stringify(stagedDeps) !== JSON.stringify(headDeps);
	});
}

function listAllFiles() {
	const tracked = run("git ls-files");
	const untracked = run("git ls-files --others --exclude-standard");
	const files = [...tracked.split("\n"), ...untracked.split("\n")].filter(
		Boolean,
	);
	return Array.from(new Set(files));
}

function hasForbiddenLockfiles(files) {
	return files.filter((file) =>
		/(^|\/)(package-lock\.json|yarn\.lock)$/.test(file),
	);
}

function isWorkspacePackage(dir, rootDir) {
	const relativePath = path.relative(rootDir, dir);
	// Check if path starts with apps/* or packages/*
	return (
		relativePath.startsWith("apps/") || relativePath.startsWith("packages/")
	);
}

function findNestedNodeModules(rootDir) {
	const violations = [];
	const stack = [rootDir];
	const rootNodeModules = path.join(rootDir, "node_modules");

	while (stack.length > 0) {
		const current = stack.pop();
		let entries;
		try {
			entries = fs.readdirSync(current, { withFileTypes: true });
		} catch {
			continue;
		}

		for (const entry of entries) {
			if (!entry.isDirectory()) {
				continue;
			}

			if (entry.isSymbolicLink?.()) {
				continue;
			}

			const fullPath = path.join(current, entry.name);

			if (
				entry.name === ".git" ||
				entry.name === ".turbo" ||
				entry.name === ".pnpm-store"
			) {
				continue;
			}

			if (entry.name === "node_modules") {
				const parentDir = path.dirname(fullPath);
				// Allow node_modules in workspace packages (apps/* and packages/*)
				if (
					path.resolve(fullPath) !== path.resolve(rootNodeModules) &&
					!isWorkspacePackage(parentDir, rootDir)
				) {
					violations.push(path.relative(rootDir, fullPath));
				}
				continue;
			}

			stack.push(fullPath);
		}
	}

	return violations;
}

function main() {
	const rootDir = getRepoRoot();
	const stagedFiles = getStagedFiles();

	const changedPackageJson = stagedFiles.filter((file) =>
		file.endsWith("package.json"),
	);
	const lockfileStaged = stagedFiles.includes("pnpm-lock.yaml");

	// Check if any package.json has dependency changes
	const packageJsonWithDepChanges = changedPackageJson.filter((file) =>
		hasDependencyChanges(file),
	);

	if (packageJsonWithDepChanges.length > 0 && !lockfileStaged) {
		console.error("Dependency check failed:");
		console.error(
			"- Detected dependency changes in package.json without pnpm-lock.yaml staged.",
		);
		console.error(`  Modified: ${packageJsonWithDepChanges.join(", ")}`);
		process.exit(1);
	}

	const allFiles = listAllFiles();
	const forbidden = hasForbiddenLockfiles(allFiles);
	if (forbidden.length > 0) {
		console.error("Dependency check failed:");
		console.error("- Forbidden lockfiles found (remove them):");
		for (const file of forbidden) {
			console.error(`  - ${file}`);
		}
		process.exit(1);
	}

	const nestedNodeModules = findNestedNodeModules(rootDir);
	if (nestedNodeModules.length > 0) {
		console.error("Dependency check failed:");
		console.error("- Nested node_modules detected outside repo root:");
		for (const dir of nestedNodeModules) {
			console.error(`  - ${dir}`);
		}
		process.exit(1);
	}
}

try {
	main();
} catch (error) {
	console.error("Dependency check failed:", error.message || error);
	process.exit(1);
}
