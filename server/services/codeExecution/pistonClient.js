const axios = require('axios');

const LANGUAGE_CONFIG = {
    python: { id: 'python', version: '3.10.0', filename: 'main.py' },
    c: { id: 'c', version: '10.2.0', filename: 'main.c' },
    csharp: { id: 'csharp', version: '6.12.0.122', filename: 'Main.cs' },
    java: { id: 'java', version: '15.0.2', filename: 'Main.java' },
    javascript: { id: 'javascript', version: '16.3.0', filename: 'main.js' },
    nodejs: { id: 'javascript', version: '16.3.0', filename: 'main.js' }
};

const EXECUTION_SETTINGS = {
    run_timeout: 5000,
    compile_timeout: 10000
};

/**
 * Execute code via Piston API
 * @param {string} language - The language key (e.g., 'python', 'c')
 * @param {string} code - The source code to execute
 * @returns {Promise<Object>} Execution results
 */
async function executeCode(language, code) {
    // --- LOCAL MOCK MODE ---
    if (process.env.USE_MOCK_PISTON === 'true') {
        console.log(`[Piston] [MOCK MODE] Simulating execution for: ${language}`);
        return {
            success: true,
            language: language,
            output: `[MOCK OUTPUT] ${language} execution successful!\nCode:\n${code.substring(0, 50)}${code.length > 50 ? '...' : ''}`,
            stdout: `[MOCK STDOUT] Successful ${language} execution.`,
            stderr: '',
            exitCode: 0,
            executionTime: 42
        };
    }

    const config = LANGUAGE_CONFIG[language.toLowerCase()];
    if (!config) {
        throw new Error(`Unsupported language: ${language}`);
    }

    const pistonUrl = process.env.PISTON_URL;
    if (!pistonUrl) {
        throw new Error('PISTON_URL environment variable is not set');
    }

    // Robust URL construction
    let apiUrl = pistonUrl.replace(/\/$/, '');
    if (!apiUrl.endsWith('/execute')) {
        if (apiUrl.includes('emkc.org')) {
            apiUrl += '/execute';
        } else {
            apiUrl += '/api/v2/execute';
        }
    }

    console.log(`[Piston] Attempting execution at: ${apiUrl}`);

    try {
        const response = await axios.post(apiUrl, {
            language: config.id,
            version: config.version,
            files: [
                {
                    name: config.filename,
                    content: code
                }
            ],
            compile_timeout: EXECUTION_SETTINGS.compile_timeout,
            run_timeout: EXECUTION_SETTINGS.run_timeout
        });

        const { run, compile } = response.data;

        // Check for compilation errors
        if (compile && compile.code !== 0) {
            return {
                success: false,
                error: 'compilation_error',
                message: compile.stderr || compile.output,
                details: null
            };
        }

        // Check for runtime errors/timeouts
        if (run.signal === 'SIGKILL') {
            return {
                success: false,
                error: 'timeout',
                message: `Code execution timed out (${EXECUTION_SETTINGS.run_timeout / 1000} second limit)`
            };
        }

        if (run.code !== 0) {
            return {
                success: false,
                error: 'runtime_error',
                message: run.stderr || run.output,
                exitCode: run.code
            };
        }

        return {
            success: true,
            language: language,
            output: run.output,
            stdout: run.stdout,
            stderr: run.stderr,
            exitCode: run.code,
            executionTime: null
        };
    } catch (error) {
        console.error('[Piston] Connection Error:', error.message);
        if (error.response) {
            console.error('[Piston] Response Status:', error.response.status);
            console.error('[Piston] Response Data:', JSON.stringify(error.response.data));
        }
        throw new Error(`Failed to connect to code execution service: ${error.message}`);
    }
}

module.exports = {
    executeCode,
    LANGUAGE_CONFIG
};
