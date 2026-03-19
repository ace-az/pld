Smart Hybrid Approach — Real Execution for Safe Code, AI for Dangerous Code
This is actually a great idea. Here's the logic:

text

Student clicks Run
       │
       ▼
┌──────────────────┐
│ Security Scanner │ (instant, <10ms)
│ Check for:       │
│ - os, subprocess │
│ - file access    │
│ - network calls  │
│ - system commands │
└──────┬───────────┘
       │
   ┌───┴────┐
   │        │
 SAFE    DANGEROUS
   │        │
   ▼        ▼
┌────────┐  ┌────────────┐
│ Real   │  │ AI Mode    │
│ Execute│  │ (OpenRouter)│
│ <100ms │  │ 2-3 seconds │
└────────┘  └────────────┘
Prompt for Gemini CLI
text

⚡ HYBRID CODE EXECUTION: REAL EXECUTION + AI FALLBACK

I have a coding workshop application with AI evaluation.

THE IDEA:
- Most student code is simple and safe (print, loops, variables, functions)
- Only some code is dangerous (file access, system commands, network)
- Run safe code with real execution (temp files) → FAST, <100ms
- Block dangerous code and use AI evaluation → SAFE, 2-3 seconds

SUPPORTED LANGUAGES:
- Python
- JavaScript (Node.js)
- Java
- C#
- C
- C++

=====================================================
🔍 STEP 1: SCAN MY CODEBASE
=====================================================

Find:
1. My existing AI evaluation service
2. My existing API route for evaluation
3. My frontend run/submit handler
4. My existing code execution logic (if any remains)
5. Output display component

Show me file paths before making changes.

=====================================================
🛡️ STEP 2: CREATE SECURITY SCANNER
=====================================================

Create a security scanner that checks code BEFORE deciding
how to execute it. This runs in <10ms.

File: /server/services/securityScanner.js

```javascript
// ============================================
// PYTHON DANGEROUS PATTERNS
// ============================================
const PYTHON_BLOCKED = {
  imports: [
    'os', 'sys', 'subprocess', 'shutil', 'pathlib',
    'socket', 'http', 'urllib', 'requests', 'ftplib',
    'ctypes', 'multiprocessing', 'threading',
    'importlib', 'signal', 'resource',
    'pickle', 'shelve', 'marshal',
    'tempfile', 'glob', 'fnmatch',
    'webbrowser', 'antigravity',
    'code', 'codeop', 'compile',
    'smtplib', 'poplib', 'imaplib',
    'telnetlib', 'xmlrpc', 'socketserver'
  ],
  patterns: [
    /import\s+os/,
    /from\s+os\s+import/,
    /import\s+sys/,
    /from\s+sys\s+import/,
    /import\s+subprocess/,
    /from\s+subprocess\s+import/,
    /import\s+shutil/,
    /import\s+socket/,
    /from\s+socket\s+import/,
    /import\s+pathlib/,
    /import\s+ctypes/,
    /import\s+multiprocessing/,
    /import\s+threading/,
    /import\s+importlib/,
    /import\s+signal/,
    /import\s+resource/,
    /import\s+pickle/,
    /import\s+tempfile/,
    /import\s+glob/,
    /import\s+webbrowser/,
    /import\s+http/,
    /from\s+http\s+import/,
    /import\s+urllib/,
    /from\s+urllib\s+import/,
    /import\s+requests/,
    /import\s+ftplib/,
    /import\s+smtplib/,
    /import\s+telnetlib/,
    /__import__\s*\(/,
    /exec\s*\(/,
    /eval\s*\(/,
    /compile\s*\(/,
    /globals\s*\(/,
    /locals\s*\(/,
    /getattr\s*\(/,
    /setattr\s*\(/,
    /delattr\s*\(/,
    /open\s*\(/,
    /file\s*\(/,
    /input\s*\(/,         // can hang the process waiting for stdin
    /breakpoint\s*\(/,
    /exit\s*\(/,
    /quit\s*\(/,
    /os\.\w+/,
    /sys\.\w+/,
    /subprocess\.\w+/,
    /shutil\.\w+/,
    /socket\.\w+/,
    /\.system\s*\(/,
    /\.popen\s*\(/,
    /\.exec\w*\s*\(/,
    /\.spawn\s*\(/,
    /\.fork\s*\(/,
    /\.kill\s*\(/,
    /\.remove\s*\(/,
    /\.unlink\s*\(/,
    /\.rmdir\s*\(/,
    /\.mkdir\s*\(/,
    /\.rename\s*\(/,
    /\.chmod\s*\(/,
    /\.chown\s*\(/,
    /while\s+True\s*:/,    // infinite loop
    /while\s+1\s*:/,       // infinite loop
    /recursion|RecursionError/  // might be intentional but risky
  ]
};

// ============================================
// JAVASCRIPT / NODE.JS DANGEROUS PATTERNS
// ============================================
const JAVASCRIPT_BLOCKED = {
  patterns: [
    /require\s*\(\s*['"]child_process['"]\s*\)/,
    /require\s*\(\s*['"]fs['"]\s*\)/,
    /require\s*\(\s*['"]net['"]\s*\)/,
    /require\s*\(\s*['"]http['"]\s*\)/,
    /require\s*\(\s*['"]https['"]\s*\)/,
    /require\s*\(\s*['"]dgram['"]\s*\)/,
    /require\s*\(\s*['"]cluster['"]\s*\)/,
    /require\s*\(\s*['"]os['"]\s*\)/,
    /require\s*\(\s*['"]path['"]\s*\)/,
    /require\s*\(\s*['"]stream['"]\s*\)/,
    /require\s*\(\s*['"]vm['"]\s*\)/,
    /require\s*\(\s*['"]worker_threads['"]\s*\)/,
    /require\s*\(\s*['"]dns['"]\s*\)/,
    /require\s*\(\s*['"]tls['"]\s*\)/,
    /require\s*\(\s*['"]crypto['"]\s*\)/,
    /import\s+.*from\s+['"]child_process['"]/,
    /import\s+.*from\s+['"]fs['"]/,
    /import\s+.*from\s+['"]net['"]/,
    /import\s+.*from\s+['"]http['"]/,
    /import\s+.*from\s+['"]os['"]/,
    /process\.env/,
    /process\.exit/,
    /process\.kill/,
    /process\.cwd/,
    /process\.chdir/,
    /process\.execPath/,
    /process\.argv/,
    /child_process/,
    /\.exec\s*\(/,
    /\.execSync\s*\(/,
    /\.spawn\s*\(/,
    /\.spawnSync\s*\(/,
    /\.fork\s*\(/,
    /fs\.\w+/,
    /eval\s*\(/,
    /Function\s*\(/,
    /new\s+Function/,
    /setTimeout.*while/,   // potential infinite with timeout
    /setInterval/,
    /while\s*\(\s*true\s*\)/,
    /while\s*\(\s*1\s*\)/,
    /for\s*\(\s*;\s*;\s*\)/,
    /fetch\s*\(/,
    /XMLHttpRequest/,
    /WebSocket/,
    /globalThis/,
    /Deno\./,
    /Bun\./
  ]
};

// ============================================
// C LANGUAGE DANGEROUS PATTERNS
// ============================================
const C_BLOCKED = {
  patterns: [
    /#include\s*<stdlib\.h>/,   // system() lives here
    /#include\s*<unistd\.h>/,   // fork, exec, pipe
    /#include\s*<sys\//,        // sys/socket.h, sys/stat.h etc
    /#include\s*<signal\.h>/,
    /#include\s*<pthread\.h>/,
    /#include\s*<dirent\.h>/,
    /#include\s*<fcntl\.h>/,
    /#include\s*<dlfcn\.h>/,    // dlopen, dlsym
    /#include\s*<netinet\//,
    /#include\s*<arpa\//,
    /#include\s*<netdb\.h>/,
    /system\s*\(/,
    /popen\s*\(/,
    /exec[vlpe]*\s*\(/,         // execve, execvp, execl, etc.
    /fork\s*\(/,
    /vfork\s*\(/,
    /clone\s*\(/,
    /kill\s*\(/,
    /socket\s*\(/,
    /connect\s*\(/,
    /bind\s*\(/,
    /listen\s*\(/,
    /accept\s*\(/,
    /send\s*\(/,
    /recv\s*\(/,
    /fopen\s*\(/,               // file access
    /fwrite\s*\(/,
    /fread\s*\(/,
    /remove\s*\(/,
    /rename\s*\(/,
    /unlink\s*\(/,
    /rmdir\s*\(/,
    /mkdir\s*\(/,
    /chdir\s*\(/,
    /chmod\s*\(/,
    /chown\s*\(/,
    /mmap\s*\(/,
    /mprotect\s*\(/,
    /dlopen\s*\(/,
    /dlsym\s*\(/,
    /setuid\s*\(/,
    /setgid\s*\(/,
    /signal\s*\(/,
    /raise\s*\(/,
    /asm\s*\(/,                 // inline assembly
    /__asm__/,
    /__asm/,
    /#pragma/,
    /__attribute__/,
    /while\s*\(\s*1\s*\)/,
    /for\s*\(\s*;\s*;\s*\)/
  ],
  // C also needs: only allow stdio.h, string.h, math.h, stdbool.h, ctype.h
  allowedHeaders: [
    'stdio.h',
    'string.h',
    'math.h',
    'stdbool.h',
    'ctype.h',
    'limits.h',
    'float.h',
    'stddef.h',
    'stdint.h',
    'assert.h',
    'errno.h',
    'time.h'
  ]
};

// ============================================
// C++ DANGEROUS PATTERNS (same as C plus more)
// ============================================
const CPP_BLOCKED = {
  patterns: [
    ...C_BLOCKED.patterns,
    /#include\s*<fstream>/,
    /#include\s*<filesystem>/,
    /#include\s*<thread>/,
    /#include\s*<mutex>/,
    /#include\s*<future>/,
    /#include\s*<chrono>/,      // can be used for timing attacks
    /#include\s*<regex>/,       // ReDoS potential
    /std::system\s*\(/,
    /std::thread/,
    /std::fstream/,
    /std::ifstream/,
    /std::ofstream/,
    /std::filesystem/
  ],
  allowedHeaders: [
    ...C_BLOCKED.allowedHeaders,
    'iostream',
    'string',
    'vector',
    'array',
    'map',
    'set',
    'unordered_map',
    'unordered_set',
    'algorithm',
    'numeric',
    'cmath',
    'iomanip',
    'sstream',
    'stack',
    'queue',
    'deque',
    'list',
    'tuple',
    'utility',
    'functional',
    'iterator',
    'climits',
    'cfloat',
    'cctype',
    'cstring',
    'cstdlib'  // allowed in C++ for atoi etc but system() blocked separately
  ]
};

// ============================================
// JAVA DANGEROUS PATTERNS
// ============================================
const JAVA_BLOCKED = {
  patterns: [
    /Runtime\s*\.\s*getRuntime/,
    /ProcessBuilder/,
    /Process\s+/,
    /\.exec\s*\(/,
    /import\s+java\.io\.File/,
    /import\s+java\.io\.FileWriter/,
    /import\s+java\.io\.FileReader/,
    /import\s+java\.io\.FileInputStream/,
    /import\s+java\.io\.FileOutputStream/,
    /import\s+java\.io\.BufferedWriter/,
    /import\s+java\.io\.BufferedReader/,
    /import\s+java\.io\.PrintWriter/,
    /import\s+java\.nio/,
    /import\s+java\.net/,
    /import\s+java\.lang\.reflect/,
    /import\s+java\.lang\.Runtime/,
    /import\s+java\.lang\.Process/,
    /import\s+java\.lang\.Thread/,
    /import\s+java\.rmi/,
    /import\s+java\.sql/,
    /import\s+javax\./,
    /new\s+File\s*\(/,
    /new\s+Socket\s*\(/,
    /new\s+ServerSocket\s*\(/,
    /new\s+URL\s*\(/,
    /new\s+Thread\s*\(/,
    /System\.exit/,
    /System\.getenv/,
    /System\.getProperty/,
    /System\.setProperty/,
    /System\.load/,
    /System\.loadLibrary/,
    /Class\.forName/,
    /\.getMethod\s*\(/,
    /\.invoke\s*\(/,
    /\.getDeclaredField/,
    /\.setAccessible\s*\(\s*true\s*\)/,
    /ClassLoader/,
    /SecurityManager/,
    /while\s*\(\s*true\s*\)/
  ]
};

// ============================================
// C# DANGEROUS PATTERNS
// ============================================
const CSHARP_BLOCKED = {
  patterns: [
    /System\.Diagnostics\.Process/,
    /Process\.Start/,
    /ProcessStartInfo/,
    /using\s+System\.IO;/,
    /using\s+System\.Net/,
    /using\s+System\.Reflection/,
    /using\s+System\.Threading/,
    /using\s+System\.Runtime/,
    /using\s+System\.Diagnostics/,
    /using\s+System\.Data/,
    /using\s+System\.Security/,
    /File\.\w+/,
    /Directory\.\w+/,
    /FileStream/,
    /StreamWriter/,
    /StreamReader/,
    /WebClient/,
    /HttpClient/,
    /TcpClient/,
    /TcpListener/,
    /Socket\s/,
    /Assembly\.\w+/,
    /Type\.GetType/,
    /Activator\.CreateInstance/,
    /AppDomain/,
    /Environment\.Exit/,
    /Environment\.GetEnvironmentVariable/,
    /Marshal\.\w+/,
    /unsafe\s*\{/,
    /fixed\s*\(/,
    /stackalloc/,
    /DllImport/,
    /extern\s/,
    /Thread\.\w+/,
    /Task\.Run/,
    /while\s*\(\s*true\s*\)/
  ]
};

// ============================================
// MASTER SCANNER
// ============================================
function scanCode(language, code) {
  const configs = {
    python: PYTHON_BLOCKED,
    javascript: JAVASCRIPT_BLOCKED,
    c: C_BLOCKED,
    cpp: CPP_BLOCKED,
    java: JAVA_BLOCKED,
    csharp: CSHARP_BLOCKED
  };

  const config = configs[language];
  if (!config) {
    // Unknown language → always use AI (safe default)
    return { safe: false, reason: 'unsupported_language', threats: [] };
  }

  const threats = [];

  // Check patterns
  for (const pattern of config.patterns) {
    const match = code.match(pattern);
    if (match) {
      threats.push({
        matched: match[0],
        pattern: pattern.toString(),
        line: getLineNumber(code, match.index)
      });
    }
  }

  // For C/C++: check if headers are in allowed list
  if (config.allowedHeaders) {
    const headerMatches = code.matchAll(/#include\s*[<"]([^>"]+)[>"]/g);
    for (const match of headerMatches) {
      const header = match[1];
      if (!config.allowedHeaders.includes(header)) {
        threats.push({
          matched: match[0],
          pattern: 'blocked_header',
          line: getLineNumber(code, match.index),
          message: `Header '${header}' is not allowed`
        });
      }
    }
  }

  return {
    safe: threats.length === 0,
    threats: threats,
    reason: threats.length > 0 ? 'dangerous_code' : 'clean'
  };
}

function getLineNumber(code, index) {
  return code.substring(0, index).split('\n').length;
}

module.exports = { scanCode };
=====================================================
⚡ STEP 3: CREATE REAL EXECUTION SERVICE (SAFE CODE ONLY)
This ONLY runs code that passed the security scanner.

File: /server/services/codeRunner.js

JavaScript

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

const TEMP_DIR = path.join(__dirname, '..', 'temp');
const TIMEOUT = 5000; // 5 seconds max

// Ensure temp directory exists
if (!fs.existsSync(TEMP_DIR)) {
  fs.mkdirSync(TEMP_DIR, { recursive: true });
}

function runCode(language, code) {
  const id = crypto.randomBytes(8).toString('hex');
  const startTime = Date.now();
  
  try {
    switch (language) {
      case 'python':
        return runPython(id, code, startTime);
      case 'javascript':
        return runJavaScript(id, code, startTime);
      case 'java':
        return runJava(id, code, startTime);
      case 'c':
        return runC(id, code, startTime);
      case 'cpp':
        return runCpp(id, code, startTime);
      case 'csharp':
        return runCSharp(id, code, startTime);
      default:
        return { success: false, output: 'Language not supported for execution', exitCode: 1 };
    }
  } finally {
    // ALWAYS clean up temp files
    cleanupTempFiles(id);
  }
}

function runPython(id, code, startTime) {
  const filePath = path.join(TEMP_DIR, `${id}.py`);
  fs.writeFileSync(filePath, code);
  
  try {
    const output = execSync(`python "${filePath}"`, {
      timeout: TIMEOUT,
      maxBuffer: 1024 * 10, // 10KB max output
      cwd: TEMP_DIR,
      env: { PATH: process.env.PATH }, // minimal env, no secrets
      stdio: ['pipe', 'pipe', 'pipe']
    });
    
    return {
      success: true,
      output: output.toString(),
      exitCode: 0,
      executionTime: Date.now() - startTime
    };
  } catch (error) {
    return handleExecError(error, startTime);
  }
}

function runJavaScript(id, code, startTime) {
  const filePath = path.join(TEMP_DIR, `${id}.js`);
  fs.writeFileSync(filePath, code);
  
  try {
    const output = execSync(`node "${filePath}"`, {
      timeout: TIMEOUT,
      maxBuffer: 1024 * 10,
      cwd: TEMP_DIR,
      env: { PATH: process.env.PATH },
      stdio: ['pipe', 'pipe', 'pipe']
    });
    
    return {
      success: true,
      output: output.toString(),
      exitCode: 0,
      executionTime: Date.now() - startTime
    };
  } catch (error) {
    return handleExecError(error, startTime);
  }
}

function runC(id, code, startTime) {
  const srcPath = path.join(TEMP_DIR, `${id}.c`);
  const outPath = path.join(TEMP_DIR, `${id}.out`);
  fs.writeFileSync(srcPath, code);
  
  try {
    // Compile
    execSync(`gcc "${srcPath}" -o "${outPath}" -lm`, {
      timeout: TIMEOUT,
      cwd: TEMP_DIR,
      stdio: ['pipe', 'pipe', 'pipe']
    });
    
    // Run
    const output = execSync(`"${outPath}"`, {
      timeout: TIMEOUT,
      maxBuffer: 1024 * 10,
      cwd: TEMP_DIR,
      env: { PATH: process.env.PATH },
      stdio: ['pipe', 'pipe', 'pipe']
    });
    
    return {
      success: true,
      output: output.toString(),
      exitCode: 0,
      executionTime: Date.now() - startTime
    };
  } catch (error) {
    return handleExecError(error, startTime);
  }
}

function runCpp(id, code, startTime) {
  const srcPath = path.join(TEMP_DIR, `${id}.cpp`);
  const outPath = path.join(TEMP_DIR, `${id}.out`);
  fs.writeFileSync(srcPath, code);
  
  try {
    execSync(`g++ "${srcPath}" -o "${outPath}"`, {
      timeout: TIMEOUT,
      cwd: TEMP_DIR,
      stdio: ['pipe', 'pipe', 'pipe']
    });
    
    const output = execSync(`"${outPath}"`, {
      timeout: TIMEOUT,
      maxBuffer: 1024 * 10,
      cwd: TEMP_DIR,
      env: { PATH: process.env.PATH },
      stdio: ['pipe', 'pipe', 'pipe']
    });
    
    return {
      success: true,
      output: output.toString(),
      exitCode: 0,
      executionTime: Date.now() - startTime
    };
  } catch (error) {
    return handleExecError(error, startTime);
  }
}

function runJava(id, code, startTime) {
  // Extract class name from code
  const classMatch = code.match(/class\s+(\w+)/);
  const className = classMatch ? classMatch[1] : 'Main';
  
  const filePath = path.join(TEMP_DIR, `${className}.java`);
  fs.writeFileSync(filePath, code);
  
  try {
    execSync(`javac "${filePath}"`, {
      timeout: TIMEOUT,
      cwd: TEMP_DIR,
      stdio: ['pipe', 'pipe', 'pipe']
    });
    
    const output = execSync(`java -cp "${TEMP_DIR}" ${className}`, {
      timeout: TIMEOUT,
      maxBuffer: 1024 * 10,
      cwd: TEMP_DIR,
      env: { PATH: process.env.PATH },
      stdio: ['pipe', 'pipe', 'pipe']
    });
    
    return {
      success: true,
      output: output.toString(),
      exitCode: 0,
      executionTime: Date.now() - startTime
    };
  } catch (error) {
    return handleExecError(error, startTime);
  }
}

function runCSharp(id, code, startTime) {
  const filePath = path.join(TEMP_DIR, `${id}.cs`);
  fs.writeFileSync(filePath, code);
  
  try {
    const output = execSync(`dotnet-script "${filePath}"`, {
      timeout: TIMEOUT,
      maxBuffer: 1024 * 10,
      cwd: TEMP_DIR,
      env: { PATH: process.env.PATH },
      stdio: ['pipe', 'pipe', 'pipe']
    });
    
    return {
      success: true,
      output: output.toString(),
      exitCode: 0,
      executionTime: Date.now() - startTime
    };
  } catch (error) {
    return handleExecError(error, startTime);
  }
}

function handleExecError(error, startTime) {
  // Timeout
  if (error.killed) {
    return {
      success: false,
      output: 'Error: Code execution timed out (5 second limit)',
      exitCode: 1,
      executionTime: Date.now() - startTime
    };
  }

  // Get stderr output
  let errorOutput = error.stderr?.toString() || error.message || 'Unknown error';
  
  // STRIP server paths from error messages
  errorOutput = errorOutput.replace(/\/.*?temp\//g, '');
  errorOutput = errorOutput.replace(/\\.*?temp\\/g, '');
  errorOutput = errorOutput.replace(/C:\\.*?temp\\/gi, '');
  errorOutput = errorOutput.replace(/[a-f0-9]{16}\./g, ''); // remove hash IDs

  return {
    success: false,
    output: errorOutput,
    exitCode: error.status || 1,
    executionTime: Date.now() - startTime
  };
}

function cleanupTempFiles(id) {
  try {
    const files = fs.readdirSync(TEMP_DIR);
    for (const file of files) {
      if (file.startsWith(id)) {
        fs.unlinkSync(path.join(TEMP_DIR, file));
      }
    }
  } catch (e) {
    // Ignore cleanup errors
  }
}

module.exports = { runCode };
=====================================================
⚡ STEP 4: CREATE HYBRID EXECUTION ROUTE
File: update my existing evaluation/execution route

JavaScript

const { scanCode } = require('../services/securityScanner');
const { runCode } = require('../services/codeRunner');
const { evaluateCode } = require('../services/codeEvaluation');

router.post('/evaluate', rateLimiter, async (req, res) => {
  const { language, code, tutorMode, expectedOutput } = req.body;

  // Validate
  if (!language || !code) {
    return res.status(400).json({
      success: false,
      error: 'Language and code are required'
    });
  }

  if (code.length > 10000) {
    return res.status(400).json({
      success: false,
      error: 'Code too long. Maximum 10,000 characters.'
    });
  }

  // STEP 1: Security scan (<10ms)
  const scan = scanCode(language, code);

  let executionResult;

  if (scan.safe) {
    // ⚡ SAFE → Real execution (fast, <100ms)
    executionResult = runCode(language, code);
    executionResult.executionMode = 'real';
  } else {
    // 🛡️ DANGEROUS → AI evaluation (safe, 2-3s)
    executionResult = await evaluateCode(language, code, false, expectedOutput);
    executionResult.executionMode = 'ai';
    executionResult.securityWarning = 'Some code patterns were restricted. Output is AI-predicted.';
  }

  // STEP 2: If tutor mode ON, get AI feedback too
  if (tutorMode && scan.safe) {
    // Code already ran successfully, now get AI feedback on the code quality
    const tutorFeedback = await evaluateCode(language, code, true, expectedOutput);
    executionResult.explanation = tutorFeedback.explanation;
    executionResult.suggestions = tutorFeedback.suggestions;
    executionResult.hints = tutorFeedback.hints;
    executionResult.codeQuality = tutorFeedback.codeQuality;
  }

  return res.json(executionResult);
});
=====================================================
🖥️ STEP 5: UPDATE FRONTEND
Update my EXISTING run handler:

JavaScript

const handleRun = async () => {
  setIsLoading(true);
  setResult(null);

  try {
    const response = await fetch('/api/evaluate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        language: selectedLanguage,
        code: code,
        tutorMode: aiTutorEnabled,
        expectedOutput: exercise?.expectedOutput
      })
    });

    const data = await response.json();
    setResult(data);

    // Show mode indicator
    if (data.executionMode === 'real') {
      // Fast execution badge
    } else if (data.executionMode === 'ai') {
      // AI predicted badge + security warning if any
    }
  } catch (error) {
    setResult({
      success: false,
      output: 'Service unavailable. Try again.',
      exitCode: 1
    });
  } finally {
    setIsLoading(false);
  }
};
Update output display to show execution mode:

In my EXISTING output component, add a small badge:

⚡ Real Execution (when safe code ran locally)
🤖 AI Predicted (when dangerous code was caught)
=====================================================
🎓 STEP 6: AI TUTOR TOGGLE
Toggle works alongside hybrid execution:

Toggle	Safe Code	Dangerous Code
Tutor OFF	⚡ Real execution only	🤖 AI output only
Tutor ON	⚡ Real execution + 🤖 AI feedback	🤖 AI output + AI feedback
Persist in localStorage. Default: OFF.

=====================================================
📋 ENVIRONMENT REQUIREMENTS
For real execution to work on Railway, the server needs:

Python installed (for Python exercises)
Node.js installed (already there)
GCC installed (for C/C++ — may need to add to Dockerfile)
JDK installed (for Java — may need to add to Dockerfile)
dotnet-script installed (for C# — may need to add)
Check what's available on Railway and add to Dockerfile/nixpacks if needed:

Dockerfile

# Example Railway Dockerfile additions
RUN apt-get update && apt-get install -y \
  python3 \
  gcc \
  g++ \
  default-jdk \
  && rm -rf /var/lib/apt/lists/*
=====================================================
📁 FILES TO CREATE/MODIFY
CREATE:
□ /server/services/securityScanner.js
□ /server/services/codeRunner.js

MODIFY:
□ My existing evaluation route (add hybrid logic)
□ My existing frontend run handler
□ My existing output display (add mode badge)

DO NOT CREATE new UI components.

=====================================================
🚀 DO THIS NOW
FIRST: Scan my codebase

Find existing evaluation service
Find existing route
Find frontend handler
Check what languages/compilers are available on Railway
SECOND: Create securityScanner.js

THIRD: Create codeRunner.js

FOURTH: Update route with hybrid logic

FIFTH: Update frontend to show execution mode

SIXTH: Test with:

print("hello") → should run REAL (fast)
import os; os.system("ls") → should use AI (safe)
Simple loop → should run REAL
while True: pass → should use AI
Start with step 1 — scan my codebase.

text


---

## Speed Comparison

| Code | Before | After |
|---|---|---|
| `print("hello")` | 5-6 seconds (AI) | **<100ms (real)** ⚡ |
| `print(hello world)` | 5-6 seconds (AI) | **<100ms (real error)** ⚡ |
| `for i in range(10): print(i)` | 5-6 seconds (AI) | **<100ms (real)** ⚡ |
| `import os; os.system("rm -rf /")` | 5-6 seconds (AI) | **2-3s (AI, blocked)** 🛡️ |
| `while True: pass` | 5-6 seconds (AI) | **2-3s (AI, blocked)** 🛡️ |

**~90% of student code is safe → ~90% of runs will be instant.**