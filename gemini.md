🚨 CRITICAL: INTEGRATE PISTON + REMOVE UNSAFE CODE EXECUTION

I have a coding workshop application hosted on Railway.

WHAT'S ALREADY DONE:
✅ Piston service deployed on Railway
✅ Language runtimes installed (Python, C, C#, Java, JavaScript, Node.js)
✅ Piston is running and accessible

PISTON URL: [Check my Railway dashboard for internal URL]
- Likely something like: http://piston.railway.internal:2000
- Or a custom service name Railway assigned

SUPPORTED LANGUAGES:
- Python
- C
- C#
- Java
- JavaScript
- Node.js

=====================================================
🔴 YOUR TASK — CRITICAL SECURITY FIX
=====================================================

STEP 1: FIND ALL DANGEROUS CODE EXECUTION

Scan my entire codebase and find:
- Any code that writes student code to temp files
- Any subprocess, child_process, exec, spawn calls
- Any direct invocation of python, gcc, node, javac, dotnet
- Any fs.writeFile that creates .py, .c, .cs, .java, .js files
- The /server/temp/ folder or similar
- Any eval() or Function() on user input

List EVERY file and line number where unsafe execution exists.

STEP 2: CREATE PISTON CLIENT SERVICE

Create these files:

/server/services/codeExecution/pistonClient.js
- Connect to Piston API
- Language configuration mapping
- Execute code function
- Handle responses and errors

/server/services/codeExecution/validator.js
- Validate code length (max 10,000 chars)
- Validate line count (max 500 lines)
- Validate language is supported

/server/services/codeExecution/rateLimiter.js
- Max 10 executions per minute per user
- Max 100 executions per hour per user

/server/services/codeExecution/sanitizer.js
- Sanitize output for XSS
- Truncate output if > 10KB
- Strip server paths from error messages

/server/services/codeExecution/index.js
- Export all functions cleanly

STEP 3: UPDATE API ROUTES

Find my existing code execution endpoint and replace it:
- Use Piston client instead of direct execution
- Add validation before execution
- Add rate limiting middleware
- Add proper error handling
- Return sanitized output

STEP 4: ADD ENVIRONMENT VARIABLE

Add to my backend:
PISTON_URL=http://[my-piston-service-internal-url]:2000

Show me what to add in Railway dashboard.

STEP 5: DELETE ALL UNSAFE CODE

After Piston integration works:
- DELETE the temp folder entirely
- DELETE all subprocess/exec/spawn calls for student code
- DELETE all file writing for student code
- REMOVE any direct compiler/interpreter invocation

Show me EXACTLY what to delete, file by file.

STEP 6: TEST THE INTEGRATION

Provide test commands to verify:
- Each language executes correctly
- Timeout works
- Memory limit works
- Errors are handled gracefully
- Rate limiting works

=====================================================
LANGUAGE CONFIGURATION REFERENCE
=====================================================

Use these Piston language IDs and versions:

| Language   | Piston ID    | Version      | Filename    |
|------------|--------------|--------------|-------------|
| Python     | python       | 3.10.0       | main.py     |
| C          | c            | 10.2.0       | main.c      |
| C#         | csharp       | 6.12.0.122   | Main.cs     |
| Java       | java         | 15.0.2       | Main.java   |
| JavaScript | javascript   | 16.3.0       | main.js     |
| Node.js    | javascript   | 16.3.0       | main.js     |

Note: Verify these versions match what I installed. 
Run this to check installed runtimes:
GET http://[piston-url]:2000/api/v2/runtimes

=====================================================
EXECUTION SETTINGS
=====================================================

- run_timeout: 5000ms (5 seconds)
- compile_timeout: 10000ms (10 seconds)
- memory_limit: use Piston defaults
- output max: 10KB (truncate in my backend)

=====================================================
EXPECTED OUTPUT FORMAT
=====================================================

My API should return:

Success:
{
  "success": true,
  "language": "python",
  "output": "Hello World\n",
  "stdout": "Hello World\n",
  "stderr": "",
  "exitCode": 0,
  "executionTime": 45
}

Compilation Error (C, Java, C#):
{
  "success": false,
  "error": "compilation_error",
  "message": "main.c:5:1: error: expected ';' before '}' token",
  "details": null
}

Runtime Error:
{
  "success": false,
  "error": "runtime_error",
  "message": "NameError: name 'x' is not defined",
  "exitCode": 1
}

Timeout:
{
  "success": false,
  "error": "timeout",
  "message": "Code execution timed out (5 second limit)"
}

=====================================================
DO THIS NOW
=====================================================

1. FIRST: Scan codebase, list ALL unsafe execution code
2. SECOND: Create Piston client service files
3. THIRD: Update API routes
4. FOURTH: Show me what env vars to add
5. FIFTH: Tell me exactly what files/code to delete
6. SIXTH: Provide test script

Start with step 1 — show me every unsafe line in my codebase.