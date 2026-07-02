const express = require('express');
const cors = require('cors');
const fs = require('fs');
const path = require('path');
const { exec } = require('child_process');
const testCases = require('./config/testCases.json');

const app = express();
app.use(cors());
app.use(express.json());

const PORT = process.env.PORT || 5001;
const TEMP_DIR = path.join(__dirname, 'temp');

// Ensure temp directory exists
if (!fs.existsSync(TEMP_DIR)) {
  fs.mkdirSync(TEMP_DIR, { recursive: true });
}

// Simple in-memory queue to process requests sequentially and avoid CPU spikes
const queue = [];
let processing = false;

async function processQueue() {
  if (processing || queue.length === 0) return;
  processing = true;

  const { req, res } = queue.shift();

  try {
    const result = await evaluateSubmission(req.body);
    res.json({ success: true, ...result });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message || 'Evaluation failed.' });
  } finally {
    processing = false;
    // Process next item
    processQueue();
  }
}

function runCommand(cmd, timeout = 5000) {
  return new Promise((resolve, reject) => {
    exec(cmd, { timeout }, (error, stdout, stderr) => {
      resolve({ error, stdout, stderr });
    });
  });
}

async function evaluateSubmission({ code, roomOrder }) {
  const submissionId = Date.now() + Math.random().toString(36).substring(2, 7);
  const subDir = path.join(TEMP_DIR, `submission_${submissionId}`);
  fs.mkdirSync(subDir, { recursive: true });

  const solutionPath = path.join(subDir, 'solution.cpp');
  fs.writeFileSync(solutionPath, code);

  const mountPath = path.resolve(subDir).replace(/\\/g, '/');
  const targetRoom = testCases[roomOrder.toString()];

  if (!targetRoom) {
    fs.rmSync(subDir, { recursive: true, force: true });
    return { passed: false, notes: `Room ${roomOrder} challenges are not defined in the Judge Server.` };
  }

  // Step 1: Compile inside Docker
  const compileCmd = `docker run --rm -v "${mountPath}:/app" cpp-runner g++ /app/solution.cpp -o /app/main`;
  const compResult = await runCommand(compileCmd, 7000);

  if (compResult.error) {
    const errorMsg = compResult.stderr || compResult.stdout || 'Compilation failed.';
    fs.rmSync(subDir, { recursive: true, force: true });
    return { passed: false, notes: `Compilation Error:\n${errorMsg}` };
  }

  // Step 2: Run test cases inside Docker
  let passedAll = true;
  let notes = 'Compilation Successful.\n\n';

  for (let i = 0; i < targetRoom.cases.length; i++) {
    const tc = targetRoom.cases[i];
    const inputPath = path.join(subDir, `input_${i}.txt`);
    const outputPath = path.join(subDir, `output_${i}.txt`);
    fs.writeFileSync(inputPath, tc.input);

    // Run using timeout inside container to prevent infinite loops
    // Alpine timeout returns exit code 124 on timeout
    const runCmd = `docker run --rm -v "${mountPath}:/app" cpp-runner sh -c "timeout 3 /app/main < /app/input_${i}.txt > /app/output_${i}.txt"`;
    const runResult = await runCommand(runCmd, 5000);

    const outExists = fs.existsSync(outputPath);
    const userOutput = outExists ? fs.readFileSync(outputPath, 'utf8') : '';

    const cleanExpected = tc.expected.trim().replace(/\r\n/g, '\n');
    const cleanActual = userOutput.trim().replace(/\r\n/g, '\n');

    if (runResult.error && runResult.error.code === 124) {
      notes += `❌ Test Case ${i + 1}: Time Limit Exceeded (3000ms limit)\n`;
      passedAll = false;
    } else if (runResult.error) {
      const runErr = runResult.stderr || 'Runtime error.';
      notes += `❌ Test Case ${i + 1}: Runtime Error (${runErr.trim()})\n`;
      passedAll = false;
    } else if (cleanActual !== cleanExpected) {
      notes += `❌ Test Case ${i + 1}: Wrong Answer\n   - Input: ${tc.input.replace(/\n/g, ' ')}\n   - Expected: ${cleanExpected.replace(/\n/g, ' ')}\n   - Got: ${cleanActual.replace(/\n/g, ' ')}\n`;
      passedAll = false;
    } else {
      notes += `✅ Test Case ${i + 1}: Passed\n`;
    }
  }

  // Cleanup temp files
  try {
    fs.rmSync(subDir, { recursive: true, force: true });
  } catch (err) {
    console.error('Failed to cleanup subdirectory:', err);
  }

  return { passed: passedAll, notes };
}

app.post('/judge', (req, res) => {
  const { code, roomOrder } = req.body;
  if (!code || !roomOrder) {
    return res.status(400).json({ success: false, message: 'Missing code or roomOrder in body.' });
  }
  queue.push({ req, res });
  processQueue();
});

app.get('/health', (req, res) => {
  res.json({ success: true, message: 'Judge Server is ready and listening.' });
});

app.listen(PORT, () => {
  console.log(`🚀 Judge Server running on port ${PORT}`);
});
