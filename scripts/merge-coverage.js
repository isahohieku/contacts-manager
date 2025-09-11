#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

/**
 * Calculate coverage percentages from coverage data
 */
function calculateCoverageStats(coverageData) {
  let totalStatements = 0;
  let coveredStatements = 0;
  let totalFunctions = 0;
  let coveredFunctions = 0;
  let totalBranches = 0;
  let coveredBranches = 0;
  let totalLines = 0;
  let coveredLines = 0;

  for (const [filePath, fileData] of Object.entries(coverageData)) {
    // Skip if no coverage data
    if (!fileData.s || !fileData.f || !fileData.b) continue;

    // Count statements
    for (const count of Object.values(fileData.s)) {
      totalStatements++;
      if (count > 0) coveredStatements++;
    }

    // Count functions
    for (const count of Object.values(fileData.f)) {
      totalFunctions++;
      if (count > 0) coveredFunctions++;
    }

    // Count branches
    for (const branches of Object.values(fileData.b)) {
      if (Array.isArray(branches)) {
        for (const count of branches) {
          totalBranches++;
          if (count > 0) coveredBranches++;
        }
      }
    }

    // Count lines (use statement map as proxy)
    if (fileData.statementMap) {
      const lines = new Set();
      for (const stmt of Object.values(fileData.statementMap)) {
        if (stmt.start && stmt.start.line) {
          lines.add(stmt.start.line);
        }
      }
      totalLines += lines.size;

      // Count covered lines
      const coveredLineSet = new Set();
      for (const [stmtId, count] of Object.entries(fileData.s)) {
        if (
          count > 0 &&
          fileData.statementMap[stmtId] &&
          fileData.statementMap[stmtId].start
        ) {
          coveredLineSet.add(fileData.statementMap[stmtId].start.line);
        }
      }
      coveredLines += coveredLineSet.size;
    }
  }

  return {
    statements: { covered: coveredStatements, total: totalStatements },
    functions: { covered: coveredFunctions, total: totalFunctions },
    branches: { covered: coveredBranches, total: totalBranches },
    lines: { covered: coveredLines, total: totalLines },
  };
}

/**
 * Display coverage summary
 */
function displayCoverageSummary(stats) {
  const stmtPct =
    stats.statements.total > 0
      ? ((stats.statements.covered / stats.statements.total) * 100).toFixed(2)
      : 0;
  const funcPct =
    stats.functions.total > 0
      ? ((stats.functions.covered / stats.functions.total) * 100).toFixed(2)
      : 0;
  const branchPct =
    stats.branches.total > 0
      ? ((stats.branches.covered / stats.branches.total) * 100).toFixed(2)
      : 0;
  const linePct =
    stats.lines.total > 0
      ? ((stats.lines.covered / stats.lines.total) * 100).toFixed(2)
      : 0;

  console.log('\n=== MERGED COVERAGE SUMMARY ===');
  console.log('--------------------------------');
  console.log(
    `Statements: ${stmtPct}% (${stats.statements.covered}/${stats.statements.total})`,
  );
  console.log(
    `Functions:  ${funcPct}% (${stats.functions.covered}/${stats.functions.total})`,
  );
  console.log(
    `Branches:   ${branchPct}% (${stats.branches.covered}/${stats.branches.total})`,
  );
  console.log(
    `Lines:      ${linePct}% (${stats.lines.covered}/${stats.lines.total})`,
  );
  console.log('--------------------------------\n');
}

/**
 * Generate custom HTML coverage report
 */
function generateCustomHtmlReport(coverageData, stats, outputDir) {
  const htmlDir = path.join(outputDir, 'html');
  if (!fs.existsSync(htmlDir)) {
    fs.mkdirSync(htmlDir, { recursive: true });
  }

  const stmtPct =
    stats.statements.total > 0
      ? ((stats.statements.covered / stats.statements.total) * 100).toFixed(2)
      : 0;
  const funcPct =
    stats.functions.total > 0
      ? ((stats.functions.covered / stats.functions.total) * 100).toFixed(2)
      : 0;
  const branchPct =
    stats.branches.total > 0
      ? ((stats.branches.covered / stats.branches.total) * 100).toFixed(2)
      : 0;
  const linePct =
    stats.lines.total > 0
      ? ((stats.lines.covered / stats.lines.total) * 100).toFixed(2)
      : 0;

  const html = `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Coverage Report</title>
    <style>
        body { font-family: Arial, sans-serif; margin: 20px; }
        .header { background: #f5f5f5; padding: 20px; border-radius: 5px; margin-bottom: 20px; }
        .summary { display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 20px; margin-bottom: 30px; }
        .metric { background: white; border: 1px solid #ddd; padding: 15px; border-radius: 5px; text-align: center; }
        .metric h3 { margin: 0 0 10px 0; color: #333; }
        .percentage { font-size: 2em; font-weight: bold; margin: 10px 0; }
        .high { color: #28a745; }
        .medium { color: #ffc107; }
        .low { color: #dc3545; }
        .details { font-size: 0.9em; color: #666; }
        .file-list { background: white; border: 1px solid #ddd; border-radius: 5px; }
        .file-list h2 { background: #f8f9fa; margin: 0; padding: 15px; border-bottom: 1px solid #ddd; }
        .file-item { padding: 10px 15px; border-bottom: 1px solid #eee; display: flex; justify-content: space-between; align-items: center; }
        .file-item:last-child { border-bottom: none; }
        .file-name { font-family: monospace; }
        .file-stats { display: flex; gap: 15px; font-size: 0.9em; }
    </style>
</head>
<body>
    <div class="header">
        <h1>📊 Merged Coverage Report</h1>
        <p>Generated on ${new Date().toLocaleString()}</p>
        <p>Combined coverage from Unit, Integration, and E2E tests</p>
    </div>

    <div class="summary">
        <div class="metric">
            <h3>Statements</h3>
            <div class="percentage ${getColorClass(stmtPct)}">${stmtPct}%</div>
            <div class="details">${stats.statements.covered}/${stats.statements.total}</div>
        </div>
        <div class="metric">
            <h3>Functions</h3>
            <div class="percentage ${getColorClass(funcPct)}">${funcPct}%</div>
            <div class="details">${stats.functions.covered}/${stats.functions.total}</div>
        </div>
        <div class="metric">
            <h3>Branches</h3>
            <div class="percentage ${getColorClass(branchPct)}">${branchPct}%</div>
            <div class="details">${stats.branches.covered}/${stats.branches.total}</div>
        </div>
        <div class="metric">
            <h3>Lines</h3>
            <div class="percentage ${getColorClass(linePct)}">${linePct}%</div>
            <div class="details">${stats.lines.covered}/${stats.lines.total}</div>
        </div>
    </div>

    <div class="file-list">
        <h2>📁 File Coverage Details</h2>
        ${generateFileList(coverageData)}
    </div>
</body>
</html>`;

  fs.writeFileSync(path.join(htmlDir, 'index.html'), html);

  // Also create a copy in the main coverage directory
  fs.writeFileSync(path.join(outputDir, 'index.html'), html);
}

function getColorClass(percentage) {
  const pct = parseFloat(percentage);
  if (pct >= 80) return 'high';
  if (pct >= 50) return 'medium';
  return 'low';
}

function generateFileList(coverageData) {
  const files = Object.keys(coverageData).sort();
  return files
    .map((filePath) => {
      const fileData = coverageData[filePath];
      const relativePath = filePath
        .replace(process.cwd(), '')
        .replace(/^\//, '');

      // Calculate file-specific coverage
      const stmts = Object.values(fileData.s || {});
      const funcs = Object.values(fileData.f || {});
      const branches = Object.values(fileData.b || {}).flat();

      const stmtCovered = stmts.filter((s) => s > 0).length;
      const stmtTotal = stmts.length;
      const funcCovered = funcs.filter((f) => f > 0).length;
      const funcTotal = funcs.length;
      const branchCovered = branches.filter((b) => b > 0).length;
      const branchTotal = branches.length;

      const stmtPct =
        stmtTotal > 0 ? ((stmtCovered / stmtTotal) * 100).toFixed(1) : 0;
      const funcPct =
        funcTotal > 0 ? ((funcCovered / funcTotal) * 100).toFixed(1) : 0;
      const branchPct =
        branchTotal > 0 ? ((branchCovered / branchTotal) * 100).toFixed(1) : 0;

      return `
        <div class="file-item">
            <div class="file-name">${relativePath}</div>
            <div class="file-stats">
                <span class="${getColorClass(stmtPct)}">S: ${stmtPct}%</span>
                <span class="${getColorClass(funcPct)}">F: ${funcPct}%</span>
                <span class="${getColorClass(branchPct)}">B: ${branchPct}%</span>
            </div>
        </div>`;
    })
    .join('');
}

/**
 * Generate LCOV report manually
 */
function generateLcovReport(coverageData, outputDir) {
  let lcovContent = '';

  for (const [filePath, fileData] of Object.entries(coverageData)) {
    const relativePath = filePath.replace(process.cwd(), '').replace(/^\//, '');

    lcovContent += `TN:\n`;
    lcovContent += `SF:${relativePath}\n`;

    // Function coverage
    if (fileData.fnMap && fileData.f) {
      for (const [fnId, fnData] of Object.entries(fileData.fnMap)) {
        const fnName = fnData.name || `(anonymous_${fnId})`;
        const line = fnData.loc ? fnData.loc.start.line : 1;
        lcovContent += `FN:${line},${fnName}\n`;
      }

      for (const [fnId, count] of Object.entries(fileData.f)) {
        const fnData = fileData.fnMap[fnId];
        const fnName = fnData
          ? fnData.name || `(anonymous_${fnId})`
          : `(anonymous_${fnId})`;
        lcovContent += `FNDA:${count},${fnName}\n`;
      }

      const totalFunctions = Object.keys(fileData.f).length;
      const coveredFunctions = Object.values(fileData.f).filter(
        (count) => count > 0,
      ).length;
      lcovContent += `FNF:${totalFunctions}\n`;
      lcovContent += `FNH:${coveredFunctions}\n`;
    }

    // Branch coverage
    if (fileData.branchMap && fileData.b) {
      for (const [branchId, branchData] of Object.entries(fileData.branchMap)) {
        const line = branchData.loc ? branchData.loc.start.line : 1;
        const branches = fileData.b[branchId] || [];
        for (let i = 0; i < branches.length; i++) {
          lcovContent += `BDA:${line},${branchId},${i},${branches[i] || 0}\n`;
        }
      }

      const totalBranches = Object.values(fileData.b).flat().length;
      const coveredBranches = Object.values(fileData.b)
        .flat()
        .filter((count) => count > 0).length;
      lcovContent += `BRF:${totalBranches}\n`;
      lcovContent += `BRH:${coveredBranches}\n`;
    }

    // Line coverage
    if (fileData.statementMap && fileData.s) {
      const lineHits = {};

      for (const [stmtId, count] of Object.entries(fileData.s)) {
        const stmtData = fileData.statementMap[stmtId];
        if (stmtData && stmtData.start && stmtData.start.line) {
          const line = stmtData.start.line;
          lineHits[line] = (lineHits[line] || 0) + count;
        }
      }

      for (const [line, hits] of Object.entries(lineHits).sort(
        ([a], [b]) => parseInt(a) - parseInt(b),
      )) {
        lcovContent += `DA:${line},${hits}\n`;
      }

      const totalLines = Object.keys(lineHits).length;
      const coveredLines = Object.values(lineHits).filter(
        (hits) => hits > 0,
      ).length;
      lcovContent += `LF:${totalLines}\n`;
      lcovContent += `LH:${coveredLines}\n`;
    }

    lcovContent += `end_of_record\n`;
  }

  fs.writeFileSync(path.join(outputDir, 'lcov.info'), lcovContent);
}

/**
 * Merge Jest coverage reports from different test types
 */
function mergeCoverageReports() {
  const coverageDir = path.join(process.cwd(), 'coverage');
  const outputFile = path.join(coverageDir, 'coverage-final.json');

  // Coverage directories to merge
  const coverageDirs = ['unit', 'integration', 'e2e'];
  const coverageFiles = [];

  // Check which coverage files exist
  for (const dir of coverageDirs) {
    const coverageFile = path.join(coverageDir, dir, 'coverage-final.json');
    if (fs.existsSync(coverageFile)) {
      coverageFiles.push(coverageFile);
      console.log(`Found coverage file: ${coverageFile}`);
    } else {
      console.warn(`Coverage file not found: ${coverageFile}`);
    }
  }

  if (coverageFiles.length === 0) {
    console.error('No coverage files found to merge');
    process.exit(1);
  }

  // Read and merge coverage data
  const mergedCoverage = {};

  for (const file of coverageFiles) {
    console.log(`Reading coverage from: ${file}`);
    const coverageData = JSON.parse(fs.readFileSync(file, 'utf8'));

    // Merge coverage data
    for (const [filePath, fileData] of Object.entries(coverageData)) {
      if (mergedCoverage[filePath]) {
        // Merge statement counts
        const existing = mergedCoverage[filePath];
        const incoming = fileData;

        // Merge statement counts
        if (existing.s && incoming.s) {
          for (const [key, value] of Object.entries(incoming.s)) {
            existing.s[key] = (existing.s[key] || 0) + value;
          }
        }

        // Merge function counts
        if (existing.f && incoming.f) {
          for (const [key, value] of Object.entries(incoming.f)) {
            existing.f[key] = (existing.f[key] || 0) + value;
          }
        }

        // Merge branch counts
        if (existing.b && incoming.b) {
          for (const [key, branches] of Object.entries(incoming.b)) {
            if (existing.b[key]) {
              for (let i = 0; i < branches.length; i++) {
                existing.b[key][i] =
                  (existing.b[key][i] || 0) + (branches[i] || 0);
              }
            } else {
              existing.b[key] = branches;
            }
          }
        }
      } else {
        // First time seeing this file, add it directly
        mergedCoverage[filePath] = { ...fileData };
      }
    }
  }

  // Write merged coverage
  console.log(`Writing merged coverage to: ${outputFile}`);
  fs.writeFileSync(outputFile, JSON.stringify(mergedCoverage, null, 2));

  // Calculate and display coverage stats
  const stats = calculateCoverageStats(mergedCoverage);
  displayCoverageSummary(stats);

  // Generate a custom HTML report since nyc isn't working properly
  console.log('Generating custom HTML coverage report...');
  try {
    generateCustomHtmlReport(mergedCoverage, stats, coverageDir);
    console.log('Custom HTML report generated successfully!');
    console.log(
      'Open coverage/index.html in your browser to view the detailed report.',
    );
  } catch (error) {
    console.error('Error generating custom HTML report:', error.message);
  }

  // Generate LCOV report manually
  console.log('Generating LCOV report...');
  try {
    generateLcovReport(mergedCoverage, coverageDir);
    console.log('LCOV report generated successfully!');
  } catch (error) {
    console.warn('Warning: Could not generate LCOV report:', error.message);
  }

  console.log('\n✅ Coverage merge completed successfully!');
}

// Run the merge
mergeCoverageReports();
