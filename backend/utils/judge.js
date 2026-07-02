const { execFile, exec } = require('child_process');
const fs = require('fs');
const path = require('path');
const os = require('os');
const testCases = require('../config/testCases.json');

const EXECUTION_TIMEOUT_MS = 3000;

/**
 * Normalizes output by trimming whitespace and normalizing line endings.
 */
function normalizeOutput(output) {
  return output.replace(/\r\n/g, '\n').trim();
}

/**
 * Runs a single test case against the compiled executable.
 */
function runTestCase(executablePath, input) {
  return new Promise((resolve, reject) => {
    const child = execFile(executablePath, { timeout: EXECUTION_TIMEOUT_MS }, (error, stdout, stderr) => {
      if (error) {
        if (error.killed) {
          return resolve({ success: false, error: 'Time Limit Exceeded' });
        }
        return resolve({ success: false, error: stderr || error.message });
      }
      resolve({ success: true, output: stdout });
    });
    
    // Provide input to stdin
    if (input) {
      child.stdin.write(input);
      child.stdin.end();
    }
  });
}

/**
 * Evaluates the C++ code for a specific room.
 * @param {string} code 
 * @param {number} roomOrder 
 * @returns {Promise<{passed: boolean, notes: string}>}
 */
async function evaluateCode(code, roomOrder) {
  const roomCases = testCases[roomOrder];
  
  // If no test cases are defined, auto-accept (e.g. for custom rooms for now)
  if (!roomCases) {
    return { passed: true, notes: `Auto-accepted: No test cases found for Room ${roomOrder}.` };
  }

  const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'codedungeon-'));
  const sourceFile = path.join(tmpDir, 'solution.cpp');
  const executableFile = path.join(tmpDir, os.platform() === 'win32' ? 'solution.exe' : 'solution');
  
  try {
    fs.writeFileSync(sourceFile, code);

    // Compile
    await new Promise((resolve, reject) => {
      exec(`g++ "${sourceFile}" -o "${executableFile}" -O2`, (error, stdout, stderr) => {
        if (error) {
          reject(new Error(`Compilation Error:\n${stderr}`));
        } else {
          resolve();
        }
      });
    });

    // Run tests
    let passedCount = 0;
    const totalCount = roomCases.cases.length;

    for (let i = 0; i < totalCount; i++) {
      const { input, expected } = roomCases.cases[i];
      const res = await runTestCase(executableFile, input);

      if (!res.success) {
        return { passed: false, notes: `Test Case ${i + 1} Failed: ${res.error}` };
      }

      const actual = normalizeOutput(res.output);
      const expectedNorm = normalizeOutput(expected);

      if (actual !== expectedNorm) {
        return { passed: false, notes: `Test Case ${i + 1} Failed.\nExpected:\n${expectedNorm}\n\nGot:\n${actual}` };
      }

      passedCount++;
    }

    return { passed: true, notes: `All ${totalCount} test cases passed.` };

  } catch (error) {
    return { passed: false, notes: error.message };
  } finally {
    // Cleanup tmp files
    try {
      if (fs.existsSync(sourceFile)) fs.unlinkSync(sourceFile);
      if (fs.existsSync(executableFile)) fs.unlinkSync(executableFile);
      if (fs.existsSync(tmpDir)) fs.rmdirSync(tmpDir);
    } catch (e) {
      console.error('Failed to cleanup temp files', e);
    }
  }
}

module.exports = { evaluateCode };
