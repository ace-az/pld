const sessionModel = require('../models/sessionModel');
const userModel = require('../models/userModel');

function requireRole(role) {
    return (req, res, next) => {
        if (!req.user || req.user.role !== role) {
            return res.status(403).json({ error: 'Forbidden' });
        }
        return next();
    };
}

function extractSessionId(req) {
    return req?.params?.sessionId
        || req?.params?.id
        || req?.query?.sessionId
        || req?.query?.id
        || req?.body?.sessionId
        || req?.body?.id
        || null;
}

async function resolveSessionAccess(req) {
    const sessionId = extractSessionId(req);
    if (!sessionId) {
        return { error: { status: 400, body: { error: 'Session ID is required' } } };
    }

    const session = await sessionModel.getSessionById(sessionId);
    if (!session) {
        return { error: { status: 404, body: { error: 'Session not found' } } };
    }

    const userId = req?.user?.id;
    const isMentorOwner = Boolean(userId && session.mentorId === userId);

    let canonicalDiscordId = '';
    if (!isMentorOwner && userId) {
        const user = await userModel.findUserById(userId);
        canonicalDiscordId = typeof user?.discordId === 'string' ? user.discordId.toLowerCase() : '';
    }

    const students = Array.isArray(session.students) ? session.students : [];
    const isStudentMember = Boolean(
        canonicalDiscordId && students.some((student) => {
            const discord = typeof student?.discord === 'string' ? student.discord.toLowerCase() : '';
            return discord === canonicalDiscordId;
        })
    );

    return {
        sessionId,
        session,
        isMentorOwner,
        isStudentMember,
        isSessionMemberOrMentor: isMentorOwner || isStudentMember
    };
}

async function requireSessionMemberOrMentor(req, res, next) {
    const authz = await resolveSessionAccess(req);
    if (authz.error) {
        return res.status(authz.error.status).json(authz.error.body);
    }

    req.authz = authz;

    if (!authz.isSessionMemberOrMentor) {
        return res.status(403).json({ error: 'Forbidden' });
    }

    return next();
}

async function requireSessionMentorOwner(req, res, next) {
    const authz = await resolveSessionAccess(req);
    if (authz.error) {
        return res.status(authz.error.status).json(authz.error.body);
    }

    req.authz = authz;

    if (!authz.isMentorOwner) {
        return res.status(403).json({ error: 'Forbidden' });
    }

    return next();
}

module.exports = {
    requireRole,
    resolveSessionAccess,
    requireSessionMemberOrMentor,
    requireSessionMentorOwner
};
