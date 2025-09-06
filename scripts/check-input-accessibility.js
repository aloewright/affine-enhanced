#!/usr/bin/env node
/**
 * Accessibility Check for Input Elements
 * Scans TSX/JSX/HTML files for input elements missing id or name attributes
 */

const fs = require('node:fs');
const path = require('node:path');
const glob = require('glob');

const projectRoot = path.join(__dirname, '..');
const sourceDirs = [
  'packages/frontend/core/src',
  'packages/frontend/component/src',
  'packages/frontend/apps/web/src',
  'packages/frontend/apps/electron/renderer/src',
];

function scanFiles() {
  const issues = [];
  let totalFiles = 0;
  let totalInputs = 0;

  sourceDirs.forEach(dir => {
    const fullDir = path.join(projectRoot, dir);
    if (!fs.existsSync(fullDir)) {
      console.log(`Skipping non-existent directory: ${dir}`);
      return;
    }

    const patterns = ['**/*.tsx', '**/*.jsx', '**/*.html'];
    patterns.forEach(pattern => {
      const files = glob.sync(path.join(fullDir, pattern), {
        ignore: ['**/node_modules/**', '**/dist/**', '**/build/**'],
      });

      files.forEach(file => {
        totalFiles++;
        const content = fs.readFileSync(file, 'utf8');

        // Match input elements (both self-closing and with closing tag)
        const inputRegex = /<input\s+[^>]*>/gi;
        const matches = content.match(inputRegex) || [];

        matches.forEach(match => {
          totalInputs++;
          const hasId = /\bid\s*=/.test(match);
          const hasName = /\bname\s*=/.test(match);

          if (!hasId && !hasName) {
            const lineNumber = content
              .substring(0, content.indexOf(match))
              .split('\n').length;
            const relativePath = path.relative(projectRoot, file);
            issues.push({
              file: relativePath,
              line: lineNumber,
              element: match.substring(0, 100), // Truncate long elements
            });
          }
        });
      });
    });
  });

  // Report results
  console.log('\\n=== Accessibility Check for Input Elements ===\\n');
  console.log(`Scanned ${totalFiles} files`);
  console.log(`Found ${totalInputs} input elements`);
  console.log(`Issues found: ${issues.length}\\n`);

  if (issues.length > 0) {
    console.log('Input elements missing id or name attributes:\\n');
    issues.forEach(issue => {
      console.log(`  ${issue.file}:${issue.line}`);
      console.log(`    ${issue.element}...`);
      console.log('');
    });

    console.log(
      '\\n⚠️  Warning: Input elements should have either an id or name attribute for:'
    );
    console.log('  - Accessibility (screen readers, label associations)');
    console.log('  - Form submission (name attribute required)');
    console.log('  - JavaScript targeting (id for getElementById)');
    console.log('  - Testing (reliable element selection)\\n');

    process.exit(1); // Exit with error code
  } else {
    console.log('✅ All input elements have proper id or name attributes!\\n');
    process.exit(0);
  }
}

// Check if glob is installed
try {
  require.resolve('glob');
  scanFiles();
} catch {
  console.error(
    'Error: glob package not found. Installing it might be needed.'
  );
  console.log('Running without glob, using simple file search...');

  // Fallback simple implementation
  const simpleIssues = [];
  sourceDirs.forEach(dir => {
    const fullDir = path.join(projectRoot, dir);
    if (fs.existsSync(fullDir)) {
      const files = fs
        .readdirSync(fullDir, { recursive: true })
        .filter(f => f.match(/\.(tsx|jsx|html)$/))
        .map(f => path.join(fullDir, f));

      files.forEach(file => {
        if (fs.statSync(file).isFile()) {
          const content = fs.readFileSync(file, 'utf8');
          const inputRegex = /<input\s+[^>]*>/gi;
          const matches = content.match(inputRegex) || [];

          matches.forEach(match => {
            const hasId = /\bid\s*=/.test(match);
            const hasName = /\bname\s*=/.test(match);

            if (!hasId && !hasName) {
              simpleIssues.push(path.relative(projectRoot, file));
            }
          });
        }
      });
    }
  });

  if (simpleIssues.length > 0) {
    console.log(
      `\\n⚠️  Found ${simpleIssues.length} files with input accessibility issues.`
    );
    process.exit(1);
  } else {
    console.log('\\n✅ No input accessibility issues found!');
    process.exit(0);
  }
}
