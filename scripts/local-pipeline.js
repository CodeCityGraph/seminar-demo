#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const { spawnSync } = require('child_process');

const ROOT = process.cwd();
const PLAYWRIGHT_CLI = path.join(ROOT, 'node_modules', '@playwright', 'test', 'cli.js');
const RUN_ID = new Date().toISOString().replace(/[:.]/g, '-');
const PIPELINE_ROOT = path.join(ROOT, 'pipeline');
const RUNS_ROOT = path.join(PIPELINE_ROOT, 'runs');
const REPORTS_ROOT = path.join(PIPELINE_ROOT, 'reports');
const FAILED_ROOT = path.join(PIPELINE_ROOT, 'failed');
const SAFE_ROOT = path.join(ROOT, 'safe');

const snapshotDir = path.join(RUNS_ROOT, RUN_ID, 'source');
const reportDir = path.join(REPORTS_ROOT, RUN_ID);

const batches = [
  {
    name: 'ai-generated',
    tests: ['tests/ai-generated'],
  },
];

const excludeDirs = new Set([
  '.git',
  '.github',
  'node_modules',
  'pipeline',
  'safe',
  'playwright-report',
  'test-results',
]);

function ensureDir(dir) {
  fs.mkdirSync(dir, { recursive: true });
}

function hasSpecFiles(targetPath) {
  const absolute = path.join(ROOT, targetPath);
  if (!fs.existsSync(absolute)) return false;

  const stat = fs.statSync(absolute);
  if (stat.isFile()) {
    return /\.spec\.(js|ts|tsx|jsx)$/.test(path.basename(absolute));
  }

  const entries = fs.readdirSync(absolute, { withFileTypes: true });
  for (const entry of entries) {
    const child = path.join(targetPath, entry.name);
    if (entry.isDirectory()) {
      if (hasSpecFiles(child)) return true;
    } else if (/\.spec\.(js|ts|tsx|jsx)$/.test(entry.name)) {
      return true;
    }
  }

  return false;
}

function copyProjectSnapshot(src, dst) {
  ensureDir(dst);
  const entries = fs.readdirSync(src, { withFileTypes: true });

  for (const entry of entries) {
    if (excludeDirs.has(entry.name)) continue;

    const from = path.join(src, entry.name);
    const to = path.join(dst, entry.name);

    if (entry.isDirectory()) {
      copyProjectSnapshot(from, to);
      continue;
    }

    if (entry.isFile()) {
      ensureDir(path.dirname(to));
      fs.copyFileSync(from, to);
    }
  }
}

function runBatch(batch) {
  const hasAnySpecs = batch.tests.some((testPath) => hasSpecFiles(testPath));
  if (!hasAnySpecs) {
    return {
      name: batch.name,
      tests: batch.tests,
      htmlReportDir: '',
      passed: false,
      skipped: false,
      code: 1,
      message: 'No spec files found. Generate tests first with npm run ai:generate-tests',
    };
  }

  const batchHtmlReport = path.join(reportDir, batch.name, 'html');
  ensureDir(batchHtmlReport);

  const args = [PLAYWRIGHT_CLI, 'test', ...batch.tests, '--reporter=line,html'];

  const env = {
    ...process.env,
    PLAYWRIGHT_HTML_OPEN: 'never',
    PLAYWRIGHT_HTML_REPORT: batchHtmlReport,
  };

  console.log(`\n=== Running batch: ${batch.name} ===`);
  console.log(`Tests: ${batch.tests.join(', ')}`);

  const result = spawnSync('node', args, {
    cwd: ROOT,
    env,
    stdio: 'inherit',
  });

  return {
    name: batch.name,
    tests: batch.tests,
    htmlReportDir: batchHtmlReport,
    passed: result.status === 0,
    skipped: false,
    code: result.status,
  };
}

function writeSummary(results, allPassed) {
  ensureDir(reportDir);
  const summaryPath = path.join(reportDir, 'summary.md');

  const lines = [
    `# Local Pipeline Report (${RUN_ID})`,
    '',
    `Status: ${allPassed ? 'PASS' : 'FAIL'}`,
    '',
    '## Batch Results',
    '',
  ];

  for (const r of results) {
    lines.push(`- ${r.passed ? 'PASS' : 'FAIL'} ${r.name}`);
    lines.push(`  - Tests: ${r.tests.join(', ')}`);
    if (!r.passed && r.message) {
      lines.push(`  - Message: ${r.message}`);
      lines.push('  - HTML report: (not generated)');
    } else {
      lines.push(`  - HTML report: ${r.htmlReportDir}`);
    }
  }

  lines.push('');
  lines.push('## Generated At');
  lines.push('');
  lines.push(new Date().toString());

  fs.writeFileSync(summaryPath, `${lines.join('\n')}\n`, 'utf8');
  return summaryPath;
}

function updateSafe(snapshot) {
  const safeCurrent = path.join(SAFE_ROOT, 'current');
  const safeRuns = path.join(SAFE_ROOT, 'runs', RUN_ID);

  fs.rmSync(safeCurrent, { recursive: true, force: true });
  ensureDir(path.dirname(safeCurrent));
  fs.cpSync(snapshot, safeCurrent, { recursive: true });

  ensureDir(path.dirname(safeRuns));
  fs.cpSync(snapshot, safeRuns, { recursive: true });

  return { safeCurrent, safeRuns };
}

function main() {
  ensureDir(snapshotDir);
  ensureDir(reportDir);

  console.log(`Creating source snapshot at: ${snapshotDir}`);
  copyProjectSnapshot(ROOT, snapshotDir);

  const results = batches.map(runBatch);
  const allPassed = results.every((r) => r.passed);
  const summaryPath = writeSummary(results, allPassed);

  if (!allPassed) {
    const failedSnapshot = path.join(FAILED_ROOT, RUN_ID);
    ensureDir(path.dirname(failedSnapshot));
    fs.cpSync(snapshotDir, failedSnapshot, { recursive: true });

    console.error('\nPipeline FAILED.');
    console.error(`Summary: ${summaryPath}`);
    console.error(`Failed snapshot: ${failedSnapshot}`);
    process.exit(1);
  }

  const safe = updateSafe(snapshotDir);
  console.log('\nPipeline PASSED.');
  console.log(`Summary: ${summaryPath}`);
  console.log(`Safe copy (current): ${safe.safeCurrent}`);
  console.log(`Safe copy (archived run): ${safe.safeRuns}`);
}

main();
