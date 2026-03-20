#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const { spawnSync } = require('child_process');

const ROOT = process.cwd();
const RUN_ID = new Date().toISOString().replace(/[:.]/g, '-');
const PROVIDER = (process.env.AI_MODEL_PROVIDER || 'ollama').toLowerCase();
const MODEL =
  PROVIDER === 'gemini'
    ? process.env.GEMINI_MODEL || 'gemini-2.0-flash'
    : process.env.OLLAMA_MODEL || 'qwen2.5-coder:7b';
const API_KEY = process.env.GEMINI_API_KEY;
const OLLAMA_BASE_URL = process.env.OLLAMA_BASE_URL || 'http://127.0.0.1:11434';
const AI_REPORT_ROOT = path.join(ROOT, 'pipeline', 'reports', 'ai');
const RUN_REPORT_DIR = path.join(AI_REPORT_ROOT, RUN_ID);
const MANIFEST_PATH = path.join(RUN_REPORT_DIR, 'manifest.json');
const LATEST_MANIFEST_PATH = path.join(AI_REPORT_ROOT, 'latest-manifest.json');

const INCLUDE_EXTENSIONS = new Set(['.js', '.ts', '.tsx', '.jsx', '.html', '.css']);
const EXCLUDE_PREFIXES = [
  'tests/',
  'pipeline/',
  'safe/',
  'node_modules/',
  '.github/',
  'playwright-report/',
  'test-results/',
  'README',
  'SEMINAR_DEMO_GUIDE',
];

function ensureDir(dir) {
  fs.mkdirSync(dir, { recursive: true });
}

function runCommand(command, args) {
  const result = spawnSync(command, args, {
    cwd: ROOT,
    encoding: 'utf8',
  });

  if (result.status !== 0) {
    return '';
  }

  return (result.stdout || '').trim();
}

function getChangedFiles() {
  const explicitRange = process.env.AI_DIFF_RANGE;
  const diffArgs = explicitRange
    ? ['diff', '--name-only', '--relative', explicitRange]
    : ['diff', '--name-only', '--relative', 'HEAD'];

  const diffOutput = runCommand('git', diffArgs);
  const stagedOutput = runCommand('git', ['diff', '--name-only', '--relative', '--cached']);
  const untrackedOutput = runCommand('git', ['ls-files', '--others', '--exclude-standard']);

  const files = new Set();
  for (const block of [diffOutput, stagedOutput, untrackedOutput]) {
    for (const line of block.split('\n')) {
      const file = line.trim();
      if (!file) continue;
      files.add(file);
    }
  }

  return Array.from(files);
}

function shouldUseFile(filePath) {
  const normalized = filePath.replace(/\\/g, '/');
  if (EXCLUDE_PREFIXES.some((prefix) => normalized.startsWith(prefix))) return false;
  const ext = path.extname(normalized).toLowerCase();
  if (!INCLUDE_EXTENSIONS.has(ext)) return false;
  return fs.existsSync(path.join(ROOT, normalized));
}

function readFileSafe(relativePath, maxChars = 14000) {
  const abs = path.join(ROOT, relativePath);
  try {
    const content = fs.readFileSync(abs, 'utf8');
    if (content.length <= maxChars) return content;
    return `${content.slice(0, maxChars)}\n\n/* truncated for prompt size */`;
  } catch {
    return '';
  }
}

function listExistingTests() {
  const testsDir = path.join(ROOT, 'tests');
  const collected = [];

  function walk(current) {
    const entries = fs.readdirSync(current, { withFileTypes: true });
    for (const entry of entries) {
      const absolute = path.join(current, entry.name);
      const relative = path.relative(ROOT, absolute).replace(/\\/g, '/');
      if (entry.isDirectory()) {
        if (entry.name === 'node_modules') continue;
        walk(absolute);
      } else if (/\.spec\.(js|ts|tsx|jsx)$/.test(entry.name)) {
        collected.push(relative);
      }
    }
  }

  if (fs.existsSync(testsDir)) {
    walk(testsDir);
  }

  return collected.sort();
}

function buildPrompt(changedFiles, fileContents, existingTests) {
  const changedBlock = changedFiles
    .map((file) => {
      const content = fileContents[file] || '';
      return [`### FILE: ${file}`, '```', content, '```'].join('\n');
    })
    .join('\n\n');

  return [
    'You are a senior QA automation engineer for a Playwright project.',
    'Goal: generate NEW or UPDATED tests based on recently changed code.',
    '',
    'Rules:',
    '1) Return STRICT JSON only (no markdown, no code fences).',
    '2) Only write files under tests/ai-generated/.',
    '3) Keep tests deterministic and robust (avoid arbitrary timeouts).',
    '4) Use @playwright/test syntax in JS or TS.',
    '5) Prefer behavior-focused assertions tied to changed logic.',
    '6) If no meaningful tests are needed, return empty files array.',
    '',
    'JSON schema:',
    '{',
    '  "summary": "short summary",',
    '  "files": [',
    '    {',
    '      "path": "tests/ai-generated/example.spec.ts",',
    '      "reason": "why this test is needed",',
    '      "content": "file content"',
    '    }',
    '  ]',
    '}',
    '',
    `Changed files (${changedFiles.length}):`,
    changedFiles.map((f) => `- ${f}`).join('\n') || '- none',
    '',
    `Existing tests (${existingTests.length}):`,
    existingTests.map((f) => `- ${f}`).join('\n') || '- none',
    '',
    'Changed file contents:',
    changedBlock || '(none)',
  ].join('\n');
}

function extractJson(text) {
  const trimmed = text.trim();
  if (trimmed.startsWith('{') && trimmed.endsWith('}')) return trimmed;

  const first = trimmed.indexOf('{');
  const last = trimmed.lastIndexOf('}');
  if (first >= 0 && last > first) {
    return trimmed.slice(first, last + 1);
  }

  throw new Error('Model response did not contain JSON object.');
}

function sanitizeOutputPath(filePath) {
  const normalized = filePath.replace(/\\/g, '/').replace(/^\/+/, '');
  if (!normalized.startsWith('tests/ai-generated/')) {
    throw new Error(`Invalid generated path outside tests/ai-generated: ${filePath}`);
  }
  if (normalized.includes('..')) {
    throw new Error(`Invalid generated path traversal: ${filePath}`);
  }
  return normalized;
}

async function callGemini(prompt) {
  if (!API_KEY) {
    throw new Error('GEMINI_API_KEY is not set. Export it before running ai:generate-tests.');
  }

  const url = `https://generativelanguage.googleapis.com/v1beta/models/${MODEL}:generateContent?key=${API_KEY}`;
  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      contents: [
        {
          role: 'user',
          parts: [{ text: prompt }],
        },
      ],
      generationConfig: {
        temperature: 0.2,
        responseMimeType: 'application/json',
      },
    }),
  });

  if (!response.ok) {
    const body = await response.text();
    throw new Error(`Gemini request failed (${response.status}): ${body}`);
  }

  const data = await response.json();
  const text = data?.candidates?.[0]?.content?.parts?.[0]?.text;
  if (!text) {
    throw new Error('Gemini response did not contain candidate text.');
  }

  return text;
}

async function callOllama(prompt) {
  const url = `${OLLAMA_BASE_URL}/api/generate`;
  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: MODEL,
      prompt,
      stream: false,
      options: {
        temperature: 0.2,
      },
    }),
  });

  if (!response.ok) {
    const body = await response.text();
    throw new Error(`Ollama request failed (${response.status}): ${body}`);
  }

  const data = await response.json();
  const text = data?.response;
  if (!text) {
    throw new Error('Ollama response did not contain generated text.');
  }

  return text;
}

async function main() {
  ensureDir(RUN_REPORT_DIR);

  const rawChanged = getChangedFiles();
  let changedFiles = rawChanged.filter(shouldUseFile);

  if (changedFiles.length === 0) {
    const fallback = ['index.html', 'app.js', 'styles.css', 'api/submit.js'].filter((f) =>
      fs.existsSync(path.join(ROOT, f))
    );
    changedFiles = fallback;
  }

  const fileContents = {};
  for (const file of changedFiles) {
    fileContents[file] = readFileSafe(file);
  }

  const existingTests = listExistingTests();
  const prompt = buildPrompt(changedFiles, fileContents, existingTests);

  fs.writeFileSync(path.join(RUN_REPORT_DIR, 'prompt.txt'), prompt, 'utf8');
  fs.writeFileSync(path.join(RUN_REPORT_DIR, 'changed-files.txt'), `${changedFiles.join('\n')}\n`, 'utf8');

  let modelRawResponse = '';
  if (PROVIDER === 'gemini') {
    modelRawResponse = await callGemini(prompt);
  } else if (PROVIDER === 'ollama') {
    modelRawResponse = await callOllama(prompt);
  } else {
    throw new Error(`Unsupported AI_MODEL_PROVIDER: ${PROVIDER}. Use "ollama" or "gemini".`);
  }
  fs.writeFileSync(path.join(RUN_REPORT_DIR, 'raw-response.txt'), modelRawResponse, 'utf8');

  const parsed = JSON.parse(extractJson(modelRawResponse));
  const files = Array.isArray(parsed.files) ? parsed.files : [];

  const generatedFiles = [];
  for (const item of files) {
    if (!item || typeof item !== 'object') continue;
    if (typeof item.path !== 'string' || typeof item.content !== 'string') continue;

    const normalized = sanitizeOutputPath(item.path);
    const absPath = path.join(ROOT, normalized);
    ensureDir(path.dirname(absPath));
    fs.writeFileSync(absPath, item.content, 'utf8');

    generatedFiles.push({
      path: normalized,
      reason: typeof item.reason === 'string' ? item.reason : '',
      bytes: Buffer.byteLength(item.content),
    });
  }

  const manifest = {
    runId: RUN_ID,
    provider: PROVIDER,
    model: MODEL,
    generatedAt: new Date().toISOString(),
    changedFiles,
    summary: typeof parsed.summary === 'string' ? parsed.summary : '',
    generatedFiles,
    reportDir: RUN_REPORT_DIR,
  };

  fs.writeFileSync(MANIFEST_PATH, `${JSON.stringify(manifest, null, 2)}\n`, 'utf8');
  ensureDir(AI_REPORT_ROOT);
  fs.writeFileSync(LATEST_MANIFEST_PATH, `${JSON.stringify(manifest, null, 2)}\n`, 'utf8');

  const summaryLines = [
    `# AI Test Generation Report (${RUN_ID})`,
    '',
    `Provider: ${PROVIDER}`,
    `Model: ${MODEL}`,
    `Changed files considered: ${changedFiles.length}`,
    `Generated test files: ${generatedFiles.length}`,
    '',
    '## Summary',
    '',
    manifest.summary || '_No summary provided by model._',
    '',
    '## Generated Files',
    '',
  ];

  if (generatedFiles.length === 0) {
    summaryLines.push('- No files were generated.');
  } else {
    for (const file of generatedFiles) {
      summaryLines.push(`- ${file.path} (${file.bytes} bytes)`);
      if (file.reason) {
        summaryLines.push(`  - Reason: ${file.reason}`);
      }
    }
  }

  summaryLines.push('');
  summaryLines.push('## Artifacts');
  summaryLines.push('');
  summaryLines.push(`- Prompt: ${path.join(RUN_REPORT_DIR, 'prompt.txt')}`);
  summaryLines.push(`- Raw model response: ${path.join(RUN_REPORT_DIR, 'raw-response.txt')}`);
  summaryLines.push(`- Manifest: ${MANIFEST_PATH}`);

  fs.writeFileSync(path.join(RUN_REPORT_DIR, 'summary.md'), `${summaryLines.join('\n')}\n`, 'utf8');

  console.log(`AI generation complete.`);
  console.log(`Manifest: ${MANIFEST_PATH}`);
  console.log(`Summary: ${path.join(RUN_REPORT_DIR, 'summary.md')}`);
  console.log(`Generated test files: ${generatedFiles.length}`);
}

main().catch((error) => {
  console.error('AI test generation failed:');
  console.error(error.message || error);
  if (PROVIDER === 'ollama') {
    console.error('Tip: start Ollama and ensure the model is pulled.');
    console.error('  ollama serve');
    console.error(`  ollama pull ${MODEL}`);
  }
  process.exit(1);
});
