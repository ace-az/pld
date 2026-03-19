const axios = require('axios');
const codeExecution = require('../services/codeExecution');

// Mock PISTON_URL for this test
process.env.PISTON_URL = 'http://mock-piston-service:2000';

// Simple manual mock for axios.post
axios.post = async (url, data) => {
    console.log(`[MOCK AXIOS] POST to ${url}`);
    return {
        data: {
            language: data.language,
            version: '1.0.0',
            run: {
                stdout: 'Mock output from ' + data.language,
                stderr: '',
                code: 0,
                signal: null,
                output: 'Mock output from ' + data.language
            }
        }
    };
};

async function runMockTests() {
    console.log('🚀 Starting Mock Piston Service Tests...\n');

    // --- TEST 1: Validator ---
    console.log('--- Testing Validator ---');
    const tooLong = 'a'.repeat(10001);
    const valResult = codeExecution.validateCode('python', tooLong);
    console.log(valResult.isValid === false ? '✅ Caught code too long' : '❌ Failed to catch long code');

    const unsupported = codeExecution.validateCode('ruby', 'puts "hello"');
    console.log(unsupported.isValid === false ? '✅ Caught unsupported language' : '❌ Failed to catch unsupported language');

    const valid = codeExecution.validateCode('python', 'print("ok")');
    console.log(valid.isValid === true ? '✅ Valid code accepted' : '❌ Valid code rejected');

    // --- TEST 2: Rate Limiter ---
    console.log('\n--- Testing Rate Limiter ---');
    let caughtLimit = false;
    // We already used 'test-user' in previous runs if this is the same process,
    // but here we just want to see it catch eventually.
    for(let i=0; i<15; i++) {
        const res = codeExecution.checkRateLimit('test-user');
        if (!res.allowed) {
            caughtLimit = true;
            console.log(`✅ Caught rate limit at request #${i+1}: ${res.error}`);
            break;
        }
    }
    if (!caughtLimit) console.log('❌ Failed to trigger rate limit');

    // --- TEST 3: Sanitizer ---
    console.log('\n--- Testing Sanitizer ---');
    const dirtyOutput = '<script>alert("xss")</script>\nFile "/server/temp/main.py", line 1';
    const cleanOutput = codeExecution.sanitizeOutput(dirtyOutput);
    console.log(!cleanOutput.includes('<script>') ? '✅ HTML Escaped' : '❌ HTML Not Escaped');
    
    const longOutput = 'A'.repeat(11000);
    const truncated = codeExecution.sanitizeOutput(longOutput);
    console.log(truncated.length < 11000 ? '✅ Output truncated' : '❌ Output not truncated');

    // --- TEST 4: Piston Client Integration ---
    console.log('\n--- Testing Piston Client Integration ---');
    try {
        const execResult = await codeExecution.executeCode('python', 'print("hello")');
        console.log(execResult.success ? '✅ Client successfully mapped to mock' : '❌ Client failed');
        console.log('   Result output:', execResult.output.trim());
    } catch (e) {
        console.log('❌ Error during client test:', e.message);
    }
    
    console.log('\n✨ Mock Logic Tests Completed.');
}

runMockTests().catch(console.error);
