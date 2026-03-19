// In-memory rate limiting (Replace with Redis in production)
const minuteHistory = new Map();
const hourHistory = new Map();

const LIMITS = {
    PER_MINUTE: 10,
    PER_HOUR: 100
};

const MS_MINUTE = 60 * 1000;
const MS_HOUR = 60 * 60 * 1000;

/**
 * Check if a user has exceeded rate limits
 * @param {string} userId - The user ID
 * @returns {Object} { allowed: boolean, error: string|null }
 */
function checkRateLimit(userId) {
    const now = Date.now();

    // Minute check
    let userMinHistory = minuteHistory.get(userId) || [];
    userMinHistory = userMinHistory.filter(ts => now - ts < MS_MINUTE);
    
    if (userMinHistory.length >= LIMITS.PER_MINUTE) {
        return { allowed: false, error: 'Rate limit exceeded: Max 10 executions per minute' };
    }

    // Hour check
    let userHourHistory = hourHistory.get(userId) || [];
    userHourHistory = userHourHistory.filter(ts => now - ts < MS_HOUR);

    if (userHourHistory.length >= LIMITS.PER_HOUR) {
        return { allowed: false, error: 'Rate limit exceeded: Max 100 executions per hour' };
    }

    // Record request
    userMinHistory.push(now);
    userHourHistory.push(now);
    minuteHistory.set(userId, userMinHistory);
    hourHistory.set(userId, userHourHistory);

    return { allowed: true, error: null };
}

module.exports = {
    checkRateLimit,
    LIMITS
};
