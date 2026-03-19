const axios = require('axios');

// This test calls a PUBLIC Piston API to verify our request format is correct.
// It bypasses our backend and calls Piston directly.
const PUBLIC_PISTON_URL = 'https://emkc.org/api/v2/piston';

const tests = [
    {
        name: 'Python',
        language: 'python',
        version: '3.10.0',
        code: 'print("Hello from Public Piston!")',
        filename: 'main.py'
    },
    {
        name: 'JavaScript',
        language: 'javascript',
        version: '18.15.0',
        code: 'console.log("Hello from Public Piston!")',
        filename: 'main.js'
    }
];

async function runPublicTests() {
    console.log('🌐 Testing Piston API Format (Public Service)...\n');

    for (const test of tests) {
        process.stdout.write(`Testing ${test.name}... `);
        try {
            const response = await axios.post(`${PUBLIC_PISTON_URL}/execute`, {
                language: test.language,
                version: test.version,
                files: [{ name: test.filename, content: test.code }]
            });

            if (response.data.run && response.data.run.code === 0) {
                console.log('✅ Success! Output: ' + response.data.run.output.trim());
            } else {
                console.log('❌ Failed: ' + (response.data.run?.stderr || 'Unknown error'));
            }
        } catch (error) {
            console.log('❌ Error: ' + error.message);
        }
    }
}

runPublicTests();
