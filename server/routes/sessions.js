// server/routes/sessions.js
const express = require('express');
const router = express.Router();
const sessionController = require('../controllers/sessionController');
const authMiddleware = require('../utils/authMiddleware');
const { requireRole, requireSessionMentorOwner } = require('../utils/authzMiddleware');

router.use(authMiddleware);

/**
 * @swagger
 * tags:
 *   name: Sessions
 *   description: Session operations
 */

/**
 * @swagger
 * /api/sessions:
 *   post:
 *     summary: Create a new session or workshop
 *     description: |
 *       Creates a new session. To create a **workshop**, prefix the `groupName` with `[WORKSHOP]` and provide `customQuestions` instead of `topicIds`.
 *       Workshops are interactive coding sessions with a shared editor, question panels, and optional AI tutor support.
 *     tags: [Sessions, Workshops]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - groupName
 *             properties:
 *               groupName:
 *                 type: string
 *                 description: Session name. Prefix with `[WORKSHOP]` to create a workshop.
 *                 example: "[WORKSHOP] Intro to Arrays"
 *               students:
 *                 type: array
 *                 description: Array of student objects to add initially (usually empty for workshops)
 *                 items:
 *                   type: object
 *                   properties:
 *                     name:
 *                       type: string
 *                     discord:
 *                       type: string
 *               topicIds:
 *                 type: array
 *                 description: Array of topic IDs for regular sessions (empty for workshops)
 *                 items:
 *                   type: string
 *               customQuestions:
 *                 type: array
 *                 description: Custom questions for workshops (title + body pairs)
 *                 items:
 *                   type: object
 *                   properties:
 *                     title:
 *                       type: string
 *                       description: Question title/topic
 *                       example: "Array Basics"
 *                     body:
 *                       type: string
 *                       description: Question description/prompt
 *                       example: "Write a function that reverses an array in place."
 *               major:
 *                 type: string
 *                 description: Comma-separated majors for the session
 *                 example: "Computer Science, Software Engineering"
 *               createdAt:
 *                 type: string
 *                 format: date-time
 *                 description: Creation timestamp (ISO 8601)
 *               scheduledTime:
 *                 type: string
 *                 description: Scheduled time for the session
 *                 example: "00:00"
 *     responses:
 *       200:
 *         description: Created session/workshop object
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 id:
 *                   type: string
 *                 groupName:
 *                   type: string
 *                 questions:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       topicName:
 *                         type: string
 *                       text:
 *                         type: string
 *                 students:
 *                   type: array
 *                   items:
 *                     type: object
 *                 major:
 *                   type: string
 *                 status:
 *                   type: string
 *       400:
 *         description: Missing required fields (groupName, topics, or questions)
 *       500:
 *         description: Server error
 */
router.post('/', requireRole('mentor'), sessionController.createSession);

/**
 * @swagger
 * /api/sessions:
 *   get:
 *     summary: Get my sessions
 *     tags: [Sessions]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: OK
 */
router.get('/', sessionController.getMySessions);

/**
 * @swagger
 * /api/sessions/joinable:
 *   get:
 *     summary: Get joinable sessions
 *     tags: [Sessions]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: OK
 */
router.get('/joinable', sessionController.getJoinableSessions);

/**
 * @swagger
 * /api/sessions/{id}/join:
 *   post:
 *     summary: Join a session
 *     tags: [Sessions]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: OK
 */
router.post('/:id/join', sessionController.joinSession);

/**
 * @swagger
 * /api/sessions/{id}/students:
 *   post:
 *     summary: Add student to session
 *     tags: [Sessions]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: OK
 */
router.post('/:id/students', requireSessionMentorOwner, sessionController.addStudent);

/**
 * @swagger
 * /api/sessions/{id}:
 *   get:
 *     summary: Get session details
 *     tags: [Sessions]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: OK
 */
router.get('/:id', sessionController.getSession);

/**
 * @swagger
 * /api/sessions/{id}:
 *   put:
 *     summary: Update session details
 *     tags: [Sessions]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: OK
 */
router.put('/:id', requireSessionMentorOwner, sessionController.updateSession);

/**
 * @swagger
 * /api/sessions/{sessionId}/students/{studentId}:
 *   delete:
 *     summary: Remove student from session
 *     tags: [Sessions]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: sessionId
 *         required: true
 *         schema:
 *           type: string
 *       - in: path
 *         name: studentId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: OK
 */
router.delete('/:sessionId/students/:studentId', sessionController.removeStudent);

/**
 * @swagger
 * /api/sessions/{sessionId}/students/{studentId}/notes:
 *   put:
 *     summary: Update student notes
 *     tags: [Sessions]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: sessionId
 *         required: true
 *         schema:
 *           type: string
 *       - in: path
 *         name: studentId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: OK
 */
router.put('/:sessionId/students/:studentId/notes', requireSessionMentorOwner, sessionController.updateNote);

/**
 * @swagger
 * /api/sessions/{sessionId}/students/{studentId}/result:
 *   put:
 *     summary: Save student result
 *     tags: [Sessions]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: sessionId
 *         required: true
 *         schema:
 *           type: string
 *       - in: path
 *         name: studentId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: OK
 */
router.put('/:sessionId/students/:studentId/result', requireSessionMentorOwner, sessionController.saveResult);

/**
 * @swagger
 * /api/sessions/{sessionId}/students/{studentId}/grade:
 *   put:
 *     summary: Update student grade
 *     tags: [Sessions]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: sessionId
 *         required: true
 *         schema:
 *           type: string
 *       - in: path
 *         name: studentId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: OK
 */
router.put('/:sessionId/students/:studentId/grade', requireSessionMentorOwner, sessionController.updateGrade);

/**
 * @swagger
 * /api/sessions/{sessionId}/students/{studentId}/questions:
 *   put:
 *     summary: Update student questions
 *     tags: [Sessions]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: sessionId
 *         required: true
 *         schema:
 *           type: string
 *       - in: path
 *         name: studentId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: OK
 */
router.put('/:sessionId/students/:studentId/questions', requireSessionMentorOwner, sessionController.updateQuestions);

/**
 * @swagger
 * /api/sessions/{sessionId}/students/{studentId}/status:
 *   put:
 *     summary: Toggle student status
 *     tags: [Sessions]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: sessionId
 *         required: true
 *         schema:
 *           type: string
 *       - in: path
 *         name: studentId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: OK
 */
router.put('/:sessionId/students/:studentId/status', requireSessionMentorOwner, sessionController.toggleStatus);

/**
 * @swagger
 * /api/sessions/{sessionId}/students/{studentId}/send:
 *   post:
 *     summary: Send feedback to student
 *     tags: [Sessions]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: sessionId
 *         required: true
 *         schema:
 *           type: string
 *       - in: path
 *         name: studentId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: OK
 */
router.post('/:sessionId/students/:studentId/send', requireSessionMentorOwner, sessionController.sendFeedback);

/**
 * @swagger
 * /api/sessions/{sessionId}/send-all:
 *   post:
 *     summary: Send all feedback
 *     tags: [Sessions]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: sessionId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: OK
 */
router.post('/:sessionId/send-all', requireSessionMentorOwner, sessionController.sendAllFeedback);

/**
 * @swagger
 * /api/sessions/all:
 *   delete:
 *     summary: Delete all sessions
 *     tags: [Sessions]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: OK
 */
router.delete('/all', requireRole('mentor'), sessionController.deleteAllSessions);

/**
 * @swagger
 * /api/sessions/{id}:
 *   delete:
 *     summary: Delete a session
 *     tags: [Sessions]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: OK
 */
router.delete('/:id', requireSessionMentorOwner, sessionController.deleteSession);

/**
 * @swagger
 * /api/sessions/{id}/end:
 *   post:
 *     summary: End a session
 *     tags: [Sessions]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: OK
 */
router.post('/:id/end', requireSessionMentorOwner, sessionController.endSession);

/**
 * @swagger
 * /api/sessions/{sessionId}/students/{studentId}/submit-code:
 *   post:
 *     summary: Submit code from workshop workspace
 *     description: |
 *       Students submit their code for a specific question in the workshop.
 *       The submission stores code, language, output, and optional AI tutor feedback.
 *       Used alongside `/api/ai/evaluate` for code execution and `/api/ai/tutor-review` for AI tutor feedback.
 *     tags: [Workshops]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: sessionId
 *         required: true
 *         description: The workshop session ID
 *         schema:
 *           type: string
 *       - in: path
 *         name: studentId
 *         required: true
 *         description: The student ID within the session
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - code
 *               - language
 *             properties:
 *               code:
 *                 type: string
 *                 description: The submitted source code
 *                 example: "print('Hello World')"
 *               language:
 *                 type: string
 *                 description: Programming language
 *                 enum: [python, javascript, java, csharp, c, cpp, typescript, go, ruby, php, swift, kotlin, rust, sql, lua]
 *                 example: python
 *               feedback:
 *                 type: string
 *                 nullable: true
 *                 description: AI tutor feedback (set after tutor-review call)
 *               questionIndex:
 *                 type: integer
 *                 description: Index of the question being answered
 *                 example: 0
 *               output:
 *                 type: string
 *                 description: Execution output from the code runner
 *     responses:
 *       200:
 *         description: Submission saved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 feedback:
 *                   type: string
 *                   nullable: true
 *                 student:
 *                   type: object
 *       404:
 *         description: Session or student not found
 *       500:
 *         description: Server error
 */
router.post('/:sessionId/students/:studentId/submit-code', sessionController.submitCode);

/**
 * @swagger
 * /api/sessions/{sessionId}/students/{studentId}/permission:
 *   post:
 *     summary: Toggle workshop permission for a student
 *     description: Grant or revoke a student's permission to edit the shared workshop code editor. Only the session mentor owner can toggle this.
 *     tags: [Workshops]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: sessionId
 *         required: true
 *         description: The session ID
 *         schema:
 *           type: string
 *       - in: path
 *         name: studentId
 *         required: true
 *         description: The student ID within the session
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - hasWorkshopPermission
 *             properties:
 *               hasWorkshopPermission:
 *                 type: boolean
 *                 description: Whether the student should have workshop editing permission
 *                 example: true
 *     responses:
 *       200:
 *         description: Updated student object with new permission state
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 id:
 *                   type: string
 *                 name:
 *                   type: string
 *                 hasWorkshopPermission:
 *                   type: boolean
 *       404:
 *         description: Student or session not found
 *       500:
 *         description: Server error
 */
router.post('/:sessionId/students/:studentId/permission', requireSessionMentorOwner, sessionController.toggleStudentWorkshopPermission);

/**
 * @swagger
 * /api/sessions/stats/leaderboard:
 *   get:
 *     summary: Get leaderboard
 *     tags: [Sessions]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: OK
 */
router.get('/stats/leaderboard', sessionController.getLeaderboard);

/**
 * @swagger
 * /api/sessions/{id}/workshop-code:
 *   put:
 *     summary: Update shared workshop code
 *     description: Update the shared code in the workshop editor for a session. Only the session mentor or students with workshop permission can update the code.
 *     tags: [Workshops]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         description: The session ID
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - code
 *               - language
 *             properties:
 *               code:
 *                 type: string
 *                 description: The source code content
 *                 example: "console.log('Hello World');"
 *               language:
 *                 type: string
 *                 description: The programming language of the code
 *                 example: javascript
 *               questionIndex:
 *                 type: integer
 *                 description: Index of the question being worked on
 *                 example: 0
 *               lastEditPos:
 *                 type: object
 *                 description: Cursor position of the last edit
 *                 properties:
 *                   line:
 *                     type: integer
 *                   column:
 *                     type: integer
 *     responses:
 *       200:
 *         description: Updated session with workshop data
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 id:
 *                   type: string
 *                 workshop_data:
 *                   type: object
 *                   properties:
 *                     code:
 *                       type: string
 *                     language:
 *                       type: string
 *                     updatedBy:
 *                       type: string
 *                     updatedByName:
 *                       type: string
 *       403:
 *         description: Access denied - no workshop editing permission
 *       404:
 *         description: Session not found
 *       500:
 *         description: Server error
 */
router.put('/:id/workshop-code', sessionController.updateWorkshopCode);

module.exports = router;
