// client/src/api.js

const RAW_API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';
const API_URL = RAW_API_URL.replace(/\/+$/, '');

const getAuthHeaders = () => {
    const token = localStorage.getItem('token');
    const isAdmin = sessionStorage.getItem('adminAuth') === 'true';
    const adminPass = import.meta.env.VITE_ADMIN_PASSWORD || 'admin123';

    return {
        'Content-Type': 'application/json',
        ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
        ...(isAdmin ? { 'x-admin-password': adminPass } : {})
    };
};

const handleResponse = async (response) => {
    const contentType = response.headers.get('content-type');
    if (contentType && contentType.includes('application/json')) {
        const data = await response.json();
        if (!response.ok) {
            throw new Error(data.error || 'An error occurred');
        }
        return data;
    } else {
        const text = await response.text();
        if (!response.ok) {
            throw new Error(`Server Error (${response.status}): ${text.slice(0, 100)}...`);
        }
        return text;
    }
};

export const registerUser = async (userData) => {
    const response = await fetch(`${API_URL}/api/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(userData)
    });
    return handleResponse(response);
};

export const loginUser = async (credentials) => {
    const response = await fetch(`${API_URL}/api/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(credentials)
    });
    return handleResponse(response);
};

export const requestPasswordReset = async (discordUsername) => {
    const response = await fetch(`${API_URL}/api/auth/request-password-reset`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ discordUsername })
    });
    return handleResponse(response);
};

export const resetPassword = async (discordUsername, code, newPassword) => {
    const response = await fetch(`${API_URL}/api/auth/reset-password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ discordUsername, code, newPassword })
    });
    return handleResponse(response);
};

export const sendVerificationCode = async (discordUsername) => {
    const response = await fetch(`${API_URL}/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ discordUsername })
    });
    if (!response.ok) {
        const text = await response.text();
        throw new Error(text || 'Failed to send verification code');
    }
    return response.text();
};

export const verifyDiscordCode = async (discordUsername, code) => {
    const response = await fetch(`${API_URL}/verify`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ discordUsername, code })
    });
    if (!response.ok) {
        const text = await response.text();
        throw new Error(text || 'Verification failed');
    }
    return response.text();
};

export const getSessions = async () => {
    const response = await fetch(`${API_URL}/api/sessions`, {
        headers: getAuthHeaders()
    });
    return handleResponse(response);
};

export const getSession = async (id) => {
    const response = await fetch(`${API_URL}/api/sessions/${id}`, {
        headers: getAuthHeaders()
    });
    return handleResponse(response);
};

export const getJoinableSessions = async () => {
    const response = await fetch(`${API_URL}/api/sessions/joinable`, {
        headers: getAuthHeaders()
    });
    return handleResponse(response);
};

export const joinSession = async (id) => {
    const response = await fetch(`${API_URL}/api/sessions/${id}/join`, {
        method: 'POST',
        headers: getAuthHeaders()
    });
    return handleResponse(response);
};

export const createSession = async (sessionData) => {
    const response = await fetch(`${API_URL}/api/sessions`, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify(sessionData)
    });
    return handleResponse(response);
};

export const deleteSession = async (id) => {
    const response = await fetch(`${API_URL}/api/sessions/${id}`, {
        method: 'DELETE',
        headers: getAuthHeaders()
    });
    return handleResponse(response);
};

export const removeSessionStudent = async (sessionId, studentId) => {
    const response = await fetch(`${API_URL}/api/sessions/${sessionId}/students/${studentId}`, {
        method: 'DELETE',
        headers: getAuthHeaders()
    });
    return handleResponse(response);
};

export const deleteAllSessions = async () => {
    const response = await fetch(`${API_URL}/api/sessions/all`, {
        method: 'DELETE',
        headers: getAuthHeaders()
    });
    return handleResponse(response);
};

export const endSession = async (sessionId) => {
    const response = await fetch(`${API_URL}/api/sessions/${sessionId}/end`, {
        method: 'POST',
        headers: getAuthHeaders()
    });
    return handleResponse(response);
};

export const saveStudentNotes = async (sessionId, studentId, notes) => {
    const response = await fetch(`${API_URL}/api/sessions/${sessionId}/students/${studentId}/notes`, {
        method: 'PUT',
        headers: getAuthHeaders(),
        body: JSON.stringify({ notes })
    });
    return handleResponse(response);
};

export const saveStudentGrade = async (sessionId, studentId, grade) => {
    const response = await fetch(`${API_URL}/api/sessions/${sessionId}/students/${studentId}/grade`, {
        method: 'PUT',
        headers: getAuthHeaders(),
        body: JSON.stringify({ grade })
    });
    return handleResponse(response);
};

export const saveStudentQuestions = async (sessionId, studentId, { answered, incorrect }) => {
    const response = await fetch(`${API_URL}/api/sessions/${sessionId}/students/${studentId}/questions`, {
        method: 'PUT',
        headers: getAuthHeaders(),
        body: JSON.stringify({ answered, incorrect })
    });
    return handleResponse(response);
};

export const saveStudentResult = async (sessionId, studentId, result) => {
    const response = await fetch(`${API_URL}/api/sessions/${sessionId}/students/${studentId}/result`, {
        method: 'PUT',
        headers: getAuthHeaders(),
        body: JSON.stringify({ result })
    });
    return handleResponse(response);
};

export const toggleStudentStatus = async (sessionId, studentId, status) => {
    const response = await fetch(`${API_URL}/api/sessions/${sessionId}/students/${studentId}/status`, {
        method: 'PUT',
        headers: getAuthHeaders(),
        body: JSON.stringify({ status })
    });
    return handleResponse(response);
};

export const sendToDiscord = async (sessionId, studentId) => {
    const response = await fetch(`${API_URL}/api/sessions/${sessionId}/students/${studentId}/send`, {
        method: 'POST',
        headers: getAuthHeaders()
    });
    return handleResponse(response);
};

export const sendAllToDiscord = async (sessionId) => {
    const response = await fetch(`${API_URL}/api/sessions/${sessionId}/send-all`, {
        method: 'POST',
        headers: getAuthHeaders()
    });
    return handleResponse(response);
};

export const getMasterStudents = async () => {
    const response = await fetch(`${API_URL}/api/students`, {
        headers: getAuthHeaders()
    });
    return handleResponse(response);
};

export const addMasterStudent = async (studentData) => {
    const response = await fetch(`${API_URL}/api/students`, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify(studentData)
    });
    return handleResponse(response);
};

export const bulkAddMasterStudents = async (students) => {
    const response = await fetch(`${API_URL}/api/students/bulk`, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify({ students })
    });
    return handleResponse(response);
};

export const updateMasterStudent = async (id, studentData) => {
    const response = await fetch(`${API_URL}/api/students/${id}`, {
        method: 'PUT',
        headers: getAuthHeaders(),
        body: JSON.stringify(studentData)
    });
    return handleResponse(response);
};

export const deleteMasterStudent = async (id) => {
    const response = await fetch(`${API_URL}/api/students/${id}`, {
        method: 'DELETE',
        headers: getAuthHeaders()
    });
    return handleResponse(response);
};

export const deleteAllMasterStudents = async (ids) => {
    const response = await fetch(`${API_URL}/api/students/all`, {
        method: 'DELETE',
        headers: getAuthHeaders(),
        body: JSON.stringify({ ids })
    });
    return handleResponse(response);
};

export const getQuestionSets = async () => {
    const response = await fetch(`${API_URL}/api/questions`, {
        headers: getAuthHeaders()
    });
    return handleResponse(response);
};

export const addQuestionSet = async (setData) => {
    const response = await fetch(`${API_URL}/api/questions`, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify(setData)
    });
    return handleResponse(response);
};

export const updateQuestionSet = async (id, setData) => {
    const response = await fetch(`${API_URL}/api/questions/${id}`, {
        method: 'PUT',
        headers: getAuthHeaders(),
        body: JSON.stringify(setData)
    });
    return handleResponse(response);
};

export const shareQuestionSet = async (id, targetMentorIds) => {
    const response = await fetch(`${API_URL}/api/questions/${id}/share`, {
        method: 'PUT',
        headers: getAuthHeaders(),
        body: JSON.stringify({ targetMentorIds })
    });
    return handleResponse(response);
};

export const getMentors = async () => {
    const response = await fetch(`${API_URL}/api/users/mentors`, {
        headers: getAuthHeaders()
    });
    return handleResponse(response);
};

export const deleteQuestionSet = async (id) => {
    const response = await fetch(`${API_URL}/api/questions/${id}`, {
        method: 'DELETE',
        headers: getAuthHeaders()
    });
    return handleResponse(response);
};

export const deleteAllQuestionSets = async () => {
    const response = await fetch(`${API_URL}/api/questions/all`, {
        method: 'DELETE',
        headers: getAuthHeaders()
    });
    return handleResponse(response);
};

export const getLeaderboard = async (major = null) => {
    const url = major
        ? `${API_URL}/api/sessions/stats/leaderboard?major=${encodeURIComponent(major)}`
        : `${API_URL}/api/sessions/stats/leaderboard`;
    const response = await fetch(url, {
        headers: getAuthHeaders()
    });
    return handleResponse(response);
};

// Admin API
export const getAdminUsers = async () => {
    const response = await fetch(`${API_URL}/api/users/admin`, {
        headers: getAuthHeaders()
    });
    return handleResponse(response);
};

export const deleteUserAccount = async (id) => {
    const response = await fetch(`${API_URL}/api/users/admin/${id}`, {
        method: 'DELETE',
        headers: getAuthHeaders()
    });
    return handleResponse(response);
};

// Majors API
export const getMajors = async () => {
    const response = await fetch(`${API_URL}/api/majors`, {
        headers: getAuthHeaders()
    });
    return handleResponse(response);
};

export const addMajor = async (name) => {
    const response = await fetch(`${API_URL}/api/majors`, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify({ name })
    });
    return handleResponse(response);
};

export const deleteMajor = async (id) => {
    const response = await fetch(`${API_URL}/api/majors/${id}`, {
        method: 'DELETE',
        headers: getAuthHeaders()
    });
    return handleResponse(response);
};

// Profile API
export const getUserProfile = async () => {
    const response = await fetch(`${API_URL}/api/profile`, {
        headers: getAuthHeaders()
    });
    return handleResponse(response);
};

export const updateUserProfile = async (profileData) => {
    const response = await fetch(`${API_URL}/api/profile`, {
        method: 'PUT',
        headers: getAuthHeaders(),
        body: JSON.stringify(profileData)
    });
    return handleResponse(response);
};

export const updateAvatar = async (avatar) => {
    const response = await fetch(`${API_URL}/api/profile/avatar`, {
        method: 'PUT',
        headers: getAuthHeaders(),
        body: JSON.stringify({ avatar })
    });
    return handleResponse(response);
};

export const changePassword = async (passwords) => {
    const response = await fetch(`${API_URL}/api/profile/change-password`, {
        method: 'PUT',
        headers: getAuthHeaders(),
        body: JSON.stringify(passwords)
    });
    return handleResponse(response);
};

export const getAnnouncements = async () => {
    const response = await fetch(`${API_URL}/api/announcements`, {
        headers: getAuthHeaders()
    });
    return handleResponse(response);
};

export const createAnnouncement = async (data) => {
    const response = await fetch(`${API_URL}/api/announcements`, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify(data)
    });
    return handleResponse(response);
};

export const deleteAnnouncement = async (id) => {
    const response = await fetch(`${API_URL}/api/announcements/${id}`, {
        method: 'DELETE',
        headers: getAuthHeaders()
    });
    return handleResponse(response);
};

export const notifyGroups = async ({ groups, topicIds, groupTimes, scheduledDates }) => {
    const response = await fetch(`${API_URL}/api/announcements/notify-groups`, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify({ groups, topicIds, groupTimes, scheduledDates })
    });
    return handleResponse(response);
};

export default API_URL;

