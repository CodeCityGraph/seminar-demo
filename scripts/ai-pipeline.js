#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const { spawnSync } = require('child_process');

const ROOT = process.cwd();
const AI_REPORT_ROOT = path.join(ROOT, 'pipeline', 'reports', 'ai');
const LATEST_MANIFEST_PATH = path.join(AI_REPORT_ROOT, 'latest-manifest.json');
const PLAYWRIGHT_CLI = path.join(ROOT, 'node_modules', '@playwright', 'test', 'cli.js');
const PROVIDER = (process.env.AI_MODEL_PROVIDER || 'ollama').toLowerCase();

function run(command, args, options = {}) {
  const result = spawnSync(command, args, {
    cwd: ROOT,
    stdio: 'inherit',
    env: { ...process.env, ...(options.env || {}) },
  });

  return result.status === 0;
}

function runGeneratedTests(manifest) {
  const generatedSpecFiles = (manifest.generatedFiles || [])
    .map((f) => f.path)
    .filter((p) => /\.spec\.(js|ts|tsx|jsx)$/.test(p));

  if (generatedSpecFiles.length === 0) {
    console.log('No AI-generated spec files detected. Skipping targeted AI test run.');
    return true;
  }

  const reportDir = path.join(manifest.reportDir, 'generated-tests', 'html');
  fs.mkdirSync(reportDir, { recursive: true });

  console.log('\nRunning targeted AI-generated tests...');
  const ok = run(
    'node',
    [PLAYWRIGHT_CLI, 'test', ...generatedSpecFiles, '--reporter=line,html', '--workers=1', '--max-failures=1'],
    {
    env: {
      PLAYWRIGHT_HTML_OPEN: 'never',
      PLAYWRIGHT_HTML_REPORT: reportDir,
    },
    }
  );

  return ok;
}

function main() {
  if (PROVIDER === 'gemini' && !process.env.GEMINI_API_KEY) {
    console.error('GEMINI_API_KEY is not set.');
    console.error('Example: export GEMINI_API_KEY="your_key_here"');
    process.exit(1);
  }

  if (PROVIDER !== 'gemini' && PROVIDER !== 'ollama') {
    console.error(`Unsupported AI_MODEL_PROVIDER: ${PROVIDER}. Use "ollama" or "gemini".`);
    process.exit(1);
  }

  console.log(`Step 1/3: Generating tests with ${PROVIDER}...`);
  const generated = run('node', ['scripts/ai-generate-tests.js']);
  if (!generated) {
    process.exit(1);
  }

  if (!fs.existsSync(LATEST_MANIFEST_PATH)) {
    console.error(`Missing manifest: ${LATEST_MANIFEST_PATH}`);
    process.exit(1);
  }

  const manifest = JSON.parse(fs.readFileSync(LATEST_MANIFEST_PATH, 'utf8'));

  console.log('Step 2/3: Running targeted AI-generated tests...');
  const targetedOk = runGeneratedTests(manifest);

  console.log('Step 3/3: Running AI-only local pipeline...');
  const quickCategoryOk = run('npm', ['run', 'pipeline:local']);

  const runFullPipeline = process.env.AI_PIPELINE_FULL === '1';
  const pipelineOk = true;

  const summaryPath = path.join(manifest.reportDir, 'ai-pipeline-summary.md');
  const lines = [
    `# AI Pipeline Summary (${manifest.runId || 'unknown-run'})`,
    '',
    `Generated tests: ${(manifest.generatedFiles || []).length}`,
    `Targeted AI test run: ${targetedOk ? 'PASS' : 'FAIL'}`,
    `AI-only local pipeline run: ${quickCategoryOk ? 'PASS' : 'FAIL'}`,
    `Full local pipeline: ${runFullPipeline ? 'SAME AS AI-ONLY IN FRESH MODE' : 'SKIPPED'}`,
    '',
    '## Artifacts',
    '',
    `- AI generation summary: ${path.join(manifest.reportDir, 'summary.md')}`,
    `- AI generation manifest: ${path.join(manifest.reportDir, 'manifest.json')}`,
    `- Targeted AI HTML report: ${path.join(manifest.reportDir, 'generated-tests', 'html', 'index.html')}`,
    '- Local pipeline reports: pipeline/reports/<run-id>/*',
  ];

  fs.writeFileSync(summaryPath, `${lines.join('\n')}\n`, 'utf8');

  console.log(`\nAI pipeline summary: ${summaryPath}`);

  if (!targetedOk || !quickCategoryOk || !pipelineOk) {
    process.exit(1);
  }
}

main();
