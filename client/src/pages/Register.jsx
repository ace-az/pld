// client/src/pages/Register.jsx
import { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate, Link } from 'react-router-dom';
import { registerUser, sendVerificationCode, verifyDiscordCode } from '../api';

export default function Register() {
    const [formData, setFormData] = useState({ username: '', password: '', discordId: '' });
    const { login } = useAuth();
    const navigate = useNavigate();
    const [error, setError] = useState('');
    const [verificationCode, setVerificationCode] = useState('');
    const [isVerified, setIsVerified] = useState(false);
    const [codeSent, setCodeSent] = useState(false);
    const [verificationStatus, setVerificationStatus] = useState('');
    const [isLoading, setIsLoading] = useState(false);

    const handleSendCode = async () => {
        if (!formData.discordId) {
            setError('Please enter your Discord username first');
            return;
        }

        setIsLoading(true);
        setError('');
        setVerificationStatus('');

        try {
            const message = await sendVerificationCode(formData.discordId);
            setCodeSent(true);
            setVerificationStatus(message);
        } catch (err) {
            setError(err.message);
        } finally {
            setIsLoading(false);
        }
    };

    const handleVerifyCode = async () => {
        if (!verificationCode) {
            setError('Please enter the verification code');
            return;
        }

        setIsLoading(true);
        setError('');

        try {
            const message = await verifyDiscordCode(formData.discordId, verificationCode);
            setIsVerified(true);
            setVerificationStatus(message);
        } catch (err) {
            setError(err.message);
        } finally {
            setIsLoading(false);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (!isVerified && formData.discordId) {
            setError('Please verify your Discord account first');
            return;
        }

        try {
            const data = await registerUser(formData);
            login(data.token, data.user);
            navigate('/');
        } catch (err) {
            setError(err.message);
        }
    };

    return (
        <div className="flex-center" style={{ minHeight: '60vh' }}>
            <form onSubmit={handleSubmit} className="card" style={{ width: '400px' }}>
                <h2 style={{ textAlign: 'center', marginBottom: '1.5rem', color: 'var(--color-primary)' }}>Register</h2>
                {error && <div style={{ color: 'red', marginBottom: '1rem' }}>{error}</div>}

                <div className="input-group">
                    <label>Username</label>
                    <input
                        className="input-control"
                        value={formData.username}
                        onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                    />
                </div>

                <div className="input-group">
                    <label>Password</label>
                    <input
                        type="password"
                        className="input-control"
                        value={formData.password}
                        onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                    />
                </div>

                <div className="input-group">
                    <label>Discord Username (Optional)</label>
                    <div style={{ display: 'flex', gap: '0.5rem' }}>
                        <input
                            className="input-control"
                            placeholder="For notifications"
                            value={formData.discordId}
                            onChange={(e) => {
                                setFormData({ ...formData, discordId: e.target.value });
                                setCodeSent(false);
                                setIsVerified(false);
                                setVerificationCode('');
                            }}
                            disabled={isVerified}
                        />
                        {!isVerified && formData.discordId && (
                            <button
                                type="button"
                                className="btn btn-secondary"
                                onClick={handleSendCode}
                                disabled={isLoading || codeSent}
                                style={{ whiteSpace: 'nowrap' }}
                            >
                                {codeSent ? '✓ Sent' : 'Send Code'}
                            </button>
                        )}
                        {isVerified && (
                            <span style={{ color: 'green', alignSelf: 'center', whiteSpace: 'nowrap' }}>✓ Verified</span>
                        )}
                    </div>
                </div>

                {codeSent && !isVerified && (
                    <div className="input-group">
                        <label>Verification Code</label>
                        <div style={{ display: 'flex', gap: '0.5rem' }}>
                            <input
                                className="input-control"
                                placeholder="Enter code from Discord DM"
                                value={verificationCode}
                                onChange={(e) => setVerificationCode(e.target.value)}
                            />
                            <button
                                type="button"
                                className="btn btn-primary"
                                onClick={handleVerifyCode}
                                disabled={isLoading}
                            >
                                Verify
                            </button>
                        </div>
                    </div>
                )}

                {verificationStatus && (
                    <div style={{ color: isVerified ? 'green' : '#666', fontSize: '0.9rem', marginTop: '-0.5rem' }}>
                        {verificationStatus}
                    </div>
                )}

                <button type="submit" className="btn btn-primary" style={{ width: '100%' }}>Register</button>
                <div style={{ marginTop: '1rem', textAlign: 'center' }}>
                    <Link to="/login" style={{ color: 'var(--color-primary)' }}>Have an account? Login</Link>
                </div>
            </form>
        </div>
    );
}
