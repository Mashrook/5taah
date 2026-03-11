#!/usr/bin/env node

/**
 * iOS Setup Script for Khattah
 *
 * Prerequisites:
 *   - macOS with Xcode installed
 *   - Node.js 18+
 *   - CocoaPods (`sudo gem install cocoapods`)
 *
 * Usage:
 *   node scripts/ios-setup.mjs
 */

import { execSync } from "child_process";

function run(cmd) {
  console.log(`\n▶ ${cmd}`);
  execSync(cmd, { stdio: "inherit" });
}

console.log("🚀 Khattah iOS Setup\n");

try {
  run("npm install");
  run("npm run build");
  console.log("\n📱 Adding iOS platform...");
  run("npx cap add ios");
  run("npx cap sync ios");
  console.log("\n✅ iOS project ready! Open with:");
  console.log("   npx cap open ios");
  console.log("\n   Then build & run from Xcode.\n");
} catch (err) {
  console.error("❌ Setup failed:", err.message);
  process.exit(1);
}
