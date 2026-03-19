const { LANGUAGE_CONFIG } = require('./pistonClient');

const LIMITS = {
    MAX_LENGTH: 10000,
    MAX_LINES: 500
};

/**
 * Validate code execution request
 * @param {string} language - The language key (e.g., 'python', 'c')
 * @param {string} code - The source code to execute
 * @returns {Object} { isValid: boolean, error: string|null }
 */
function validateCode(language, code) {
    if (!language || !code) {
        return { isValid: false, error: 'Language and code are required' };
    }

    if (!LANGUAGE_CONFIG[language.toLowerCase()]) {
        return { isValid: false, error: `Unsupported language: ${language}` };
    }

    if (code.length > LIMITS.MAX_LENGTH) {
        return { isValid: false, error: `Code too long (max ${LIMITS.MAX_LENGTH} chars)` };
    }

    if (code.split('\n').length > LIMITS.MAX_LINES) {
        return { isValid: false, error: `Too many lines (max ${LIMITS.MAX_LINES} lines)` };
    }

    return { isValid: true, error: null };
}

module.exports = {
    validateCode,
    LIMITS
};
