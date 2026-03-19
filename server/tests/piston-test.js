const axios = require('axios');
const jwt = require('jsonwebtoken');

// Load .env variables
require('dotenv').config({ path: './server/.env' });

const API_URL = 'http://localhost:5000/api/ai'; // Match your server/index.js port
const JWT_SECRET = process.env.JWT_SECRET;

if (!JWT_SECRET) {
    console.error('❌ JWT_SECRET not found in .env');
    process.exit(1);
}

// Generate a valid test token
const TOKEN = jwt.sign({ id: 'test-user-id', role: 'admin' }, JWT_SECRET, { expiresIn: '1h' });

const tests = [
    {
        name: 'Python Success',
        language: 'python',
        code: 'print("Hello from Piston!")'
    },
    {
        name: 'Node.js Success',
        language: 'javascript',
        code: 'console.log("Hello from Node!")'
    },
    {
        name: 'C Success',
        language: 'c',
        code: '#include <stdio.h>\nint main() { printf("Hello from C!\\n"); return 0; }'
    },
    {
        name: 'Java Success',
        language: 'java',
        code: 'public class Main { public static void main(String[] args) { System.out.println("Hello from Java!"); } }'
    },
    {
        name: 'Python Error',
        language: 'python',
        code: 'print(undefined_variable)'
    },
    {
        name: 'C Compilation Error',
        language: 'c',
        code: '#include <stdio.h>\nint main() { printf("Hello") return 0; }'
    },
    {
        name: 'Timeout Test',
        language: 'python',
        code: 'import time\ntime.sleep(10)'
    },
    {
        name: 'Rate Limit Test',
        language: 'python',
        code: 'print("Testing rate limit")'
    }
];

async function runTests() {
    console.log('🚀 Starting Piston Integration Tests...\n');
    console.log('Using API_URL:', API_URL);
    console.log('Using Generated Token (valid for 1h)\n');

    for (const test of tests) {
        process.stdout.write(`Testing ${test.name}... `);
        try {
            const response = await axios.post(`${API_URL}/execute-only`, {
                language: test.language,
                code: test.code
            }, {
                headers: { 'Authorization': `Bearer ${TOKEN}` }
            });

            if (test.name === 'Python Error' || test.name === 'C Compilation Error' || test.name === 'Timeout Test') {
                if (!response.data.success) {
                    console.log('✅ Passed (Expected error: ' + response.data.error + ')');
                } else {
                    console.log('❌ Failed (Expected error but got success)');
                }
            } else if (test.name === 'Rate Limit Test') {
                console.log('✅ Sent (Check manually for 429 after 10 requests)');
            } else {
                if (response.data.success) {
                    console.log('✅ Passed (Output: ' + response.data.output.trim() + ')');
                } else {
                    console.log('❌ Failed: ' + response.data.message);
                }
            }
        } catch (error) {
            if (error.response && error.response.status === 429) {
                console.log('✅ Passed (Rate limit caught)');
            } else {
                const errMsg = error.response?.data?.message || error.response?.data?.error || error.message;
                console.log('❌ Error: ' + errMsg);
                if (error.response?.status === 401) console.log('   (Unauthorized - check JWT_SECRET)');
                if (error.code === 'ECONNREFUSED') console.log('   (Connection Refused - is the server running?)');
            }
        }
    }
}

runTests();
