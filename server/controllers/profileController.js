// server/controllers/profileController.js
const bcrypt = require('bcryptjs');
const { findUserById, updateUserProfile, updateUserPassword } = require('../models/userModel');

exports.getProfile = async (req, res) => {
    try {
        const user = await findUserById(req.user.id);
        if (!user) return res.status(404).json({ error: 'User not found' });

        // Don't send password
        const { password, ...safeUser } = user;
        res.json(safeUser);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

exports.updateProfile = async (req, res) => {
    try {
        const { username, firstName, lastName, discordId, major } = req.body;

        // Simple validation
        if (!username || !discordId) {
            return res.status(400).json({ error: 'Username and Discord ID are required' });
        }

        await updateUserProfile(req.user.id, {
            username,
            firstName,
            lastName,
            discordId,
            major
        });

        const updatedUser = await findUserById(req.user.id);
        const { password, ...safeUser } = updatedUser;
        res.json({ message: 'Profile updated successfully', user: safeUser });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

exports.updateAvatar = async (req, res) => {
    try {
        const { avatar } = req.body;
        console.log(`[ProfileController] Update avatar request for user: ${req.user.id}. Data length: ${avatar ? avatar.length : 0}`);

        if (!req.user || !req.user.id) {
            console.error('[ProfileController] No user ID in request');
            return res.status(401).json({ error: 'User ID missing' });
        }

        await updateUserProfile(req.user.id, { avatar });
        console.log('[ProfileController] updateUserProfile completed');

        res.json({ message: avatar ? 'Avatar updated successfully' : 'Avatar removed successfully' });
    } catch (err) {
        console.error('[ProfileController] Update avatar error:', err);
        res.status(500).json({ error: err.message });
    }
};

exports.changePassword = async (req, res) => {
    try {
        const { currentPassword, newPassword } = req.body;

        if (!currentPassword || !newPassword) {
            return res.status(400).json({ error: 'Current and new passwords are required' });
        }

        const user = await findUserById(req.user.id);
        const isMatch = await bcrypt.compare(currentPassword, user.password);

        if (!isMatch) {
            return res.status(401).json({ error: 'Incorrect current password' });
        }

        const hashedPassword = await bcrypt.hash(newPassword, 10);
        await updateUserPassword(user.id, hashedPassword);

        res.json({ message: 'Password changed successfully' });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};
