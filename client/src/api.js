// client/src/api.js

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

/**
 * Helper function to get authorization headers
 */
const getAuthHeaders = () => {
    const token = localStorage.getItem('token');
    return {
        'Content-Type': 'application/json',
        ...(token && { 'Authorization': `Bearer ${token}` })
    };
};

/**
 * Helper function to handle API responses
 */
const handleResponse = async (response) => {
    const data = await response.json();
    if (!response.ok) {
        throw new Error(data.error || 'An error occurred');
    }
    return data;
};

// ==================== AUTH ENDPOINTS ====================

/**
 * Register a new user
 * @param {Object} userData - { username, password, discordId }
 * @returns {Promise<Object>} { token, user }
 */
export const registerUser = async (userData) => {
    const response = await fetch(`${API_URL}/api/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(userData)
    });
    return handleResponse(response);
};

/**
 * Login user
 * @param {Object} credentials - { username, password }
 * @returns {Promise<Object>} { token, user }
 */
export const loginUser = async (credentials) => {
    const response = await fetch(`${API_URL}/api/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(credentials)
    });
    return handleResponse(response);
};

// ==================== SESSION ENDPOINTS ====================

/**
 * Get all sessions for the current user
 * @returns {Promise<Array>} Array of session objects
 */
export const getSessions = async () => {
    const response = await fetch(`${API_URL}/api/sessions`, {
        headers: getAuthHeaders()
    });
    return handleResponse(response);
};

/**
 * Get a single session by ID
 * @param {string} id - Session ID
 * @returns {Promise<Object>} Session object
 */
export const getSession = async (id) => {
    const response = await fetch(`${API_URL}/api/sessions/${id}`, {
        headers: getAuthHeaders()
    });
    return handleResponse(response);
};

/**
 * Create a new session
 * @param {Object} sessionData - { groupName, students }
 * @returns {Promise<Object>} Created session object
 */
export const createSession = async (sessionData) => {
    const response = await fetch(`${API_URL}/api/sessions`, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify(sessionData)
    });
    return handleResponse(response);
};

/**
 * Delete a session by ID
 * @param {string} id - Session ID
 * @returns {Promise<Object>} Success response
 */
export const deleteSession = async (id) => {
    const response = await fetch(`${API_URL}/api/sessions/${id}`, {
        method: 'DELETE',
        headers: getAuthHeaders()
    });
    return handleResponse(response);
};

/**
 * End a session (mark as completed)
 * @param {string} sessionId - Session ID
 * @returns {Promise<Object>} Success response
 */
export const endSession = async (sessionId) => {
    const response = await fetch(`${API_URL}/api/sessions/${sessionId}/end`, {
        method: 'POST',
        headers: getAuthHeaders()
    });
    return handleResponse(response);
};

// ==================== STUDENT ENDPOINTS ====================

/**
 * Save notes for a student in a session
 * @param {string} sessionId - Session ID
 * @param {string} studentId - Student ID
 * @param {string} notes - Notes content
 * @returns {Promise<Object>} Success response
 */
export const saveStudentNotes = async (sessionId, studentId, notes) => {
    const response = await fetch(`${API_URL}/api/sessions/${sessionId}/students/${studentId}/notes`, {
        method: 'PUT',
        headers: getAuthHeaders(),
        body: JSON.stringify({ notes })
    });
    return handleResponse(response);
};

/**
 * Save AI-generated result for a student
 * @param {string} sessionId - Session ID
 * @param {string} studentId - Student ID
 * @param {string} result - AI-generated feedback
 * @returns {Promise<Object>} Success response
 */
export const saveStudentResult = async (sessionId, studentId, result) => {
    const response = await fetch(`${API_URL}/api/sessions/${sessionId}/students/${studentId}/result`, {
        method: 'PUT',
        headers: getAuthHeaders(),
        body: JSON.stringify({ result })
    });
    return handleResponse(response);
};

/**
 * Send feedback to a single student via Discord
 * @param {string} sessionId - Session ID
 * @param {string} studentId - Student ID
 * @returns {Promise<Object>} Success response
 */
export const sendToDiscord = async (sessionId, studentId) => {
    const response = await fetch(`${API_URL}/api/sessions/${sessionId}/students/${studentId}/send`, {
        method: 'POST',
        headers: getAuthHeaders()
    });
    return handleResponse(response);
};

/**
 * Send feedback to all students in a session via Discord
 * @param {string} sessionId - Session ID
 * @returns {Promise<Object>} { summary: Array of results }
 */
export const sendAllToDiscord = async (sessionId) => {
    const response = await fetch(`${API_URL}/api/sessions/${sessionId}/send-all`, {
        method: 'POST',
        headers: getAuthHeaders()
    });
    return handleResponse(response);
};

// ==================== MASTER STUDENT LIST ENDPOINTS ====================

/**
 * Get all students in the master list
 * @returns {Promise<Array>} Array of student objects
 */
export const getMasterStudents = async () => {
    const response = await fetch(`${API_URL}/api/students`, {
        headers: getAuthHeaders()
    });
    return handleResponse(response);
};

/**
 * Add a student to the master list
 * @param {Object} studentData - { name, discord }
 * @returns {Promise<Object>} Created student object
 */
export const addMasterStudent = async (studentData) => {
    const response = await fetch(`${API_URL}/api/students`, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify(studentData)
    });
    return handleResponse(response);
};

/**
 * Update a student in the master list
 * @param {string} id - Student ID
 * @param {Object} studentData - { name, discord }
 * @returns {Promise<Object>} Updated student object
 */
export const updateMasterStudent = async (id, studentData) => {
    const response = await fetch(`${API_URL}/api/students/${id}`, {
        method: 'PUT',
        headers: getAuthHeaders(),
        body: JSON.stringify(studentData)
    });
    return handleResponse(response);
};

/**
 * Delete a student from the master list
 * @param {string} id - Student ID
 * @returns {Promise<Object>} Success response
 */
export const deleteMasterStudent = async (id) => {
    const response = await fetch(`${API_URL}/api/students/${id}`, {
        method: 'DELETE',
        headers: getAuthHeaders()
    });
    return handleResponse(response);
};

export default API_URL;

