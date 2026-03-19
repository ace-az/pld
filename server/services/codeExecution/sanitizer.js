const MAX_OUTPUT_SIZE = 10 * 1024; // 10KB

/**
 * Sanitize and truncate execution output
 * @param {string} output - Raw output/error string
 * @returns {string} Sanitized output
 */
function sanitizeOutput(output) {
    if (!output) return '';

    let sanitized = output;

    // Truncate if too large
    if (sanitized.length > MAX_OUTPUT_SIZE) {
        sanitized = sanitized.substring(0, MAX_OUTPUT_SIZE) + '\n[Output Truncated...]';
    }

    // Strip potential server paths (common patterns like /var/www, C:\Users, etc)
    // This helps prevent leaking internal directory structures in error messages
    sanitized = sanitized
        .replace(/\/[a-zA-Z0-9._\-\/]+\//g, '.../') // Strip Unix-style paths
        .replace(/[a-zA-Z]:\\[a-zA-Z0-9._\-\\]+\\/g, '...\\'); // Strip Windows-style paths

    // We can also escape basic HTML tags to prevent simple XSS if the output is rendered directly.
    sanitized = sanitized
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");

    return sanitized;
}

module.exports = {
    sanitizeOutput,
    MAX_OUTPUT_SIZE
};
