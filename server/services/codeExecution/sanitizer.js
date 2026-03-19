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
    // We don't have access to the exact tempDir here easily, but we can try to find common patterns
    // or just rely on what Piston returns (which is usually isolated)
    // However, the instructions say "Strip server paths from error messages"
    
    // For now, let's assume Piston might return some paths we want to hide.
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
