import React, { useState, useEffect } from 'react';
import { getLeaderboard } from '../api';
import { Trophy, Award, Users, TrendingUp } from 'lucide-react';
import './Leaderboard.css';

const Leaderboard = () => {
    const [leaderboard, setLeaderboard] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchLeaderboard = async () => {
            try {
                const data = await getLeaderboard();
                setLeaderboard(data);
            } catch (err) {
                console.error("Failed to fetch leaderboard", err);
            } finally {
                setLoading(false);
            }
        };
        fetchLeaderboard();
    }, []);

    const getRankStyle = (rank) => {
        if (rank === 1) return { background: 'linear-gradient(135deg, #FFD700, #FFA500)', color: '#000' };
        if (rank === 2) return { background: 'linear-gradient(135deg, #C0C0C0, #A8A8A8)', color: '#000' };
        if (rank === 3) return { background: 'linear-gradient(135deg, #CD7F32, #B87333)', color: '#fff' };
        return { background: 'var(--bg-app)', color: 'var(--text-main)' };
    };

    const getRankIcon = (rank) => {
        if (rank === 1) return '🥇';
        if (rank === 2) return '🥈';
        if (rank === 3) return '🥉';
        return `#${rank}`;
    };

    if (loading) {
        return (
            <div className="flex-center" style={{ height: '50vh', flexDirection: 'column' }}>
                <div className="spinner"></div>
                <p style={{ marginTop: '1rem', color: 'var(--text-secondary)' }}>Loading leaderboard...</p>
            </div>
        );
    }

    return (
        <div className="leaderboard-container">
            {/* Header */}
            <div className="leaderboard-header-card">
                <div className="leaderboard-header-title">
                    <Trophy size={40} color="#FFD700" className="trophy-icon" />
                    <h1>Student Leaderboard</h1>
                    <Trophy size={40} color="#FFD700" className="trophy-icon" />
                </div>
                <p>Ranking students by their average PLD performance</p>
            </div>

            {/* Stats Summary */}
            <div className="leaderboard-stats-grid">
                <div className="card stat-card border-gold">
                    <Users size={32} color="var(--color-primary)" className="stat-icon" />
                    <div className="stat-value color-primary">{leaderboard.length}</div>
                    <div className="stat-label">Total Students</div>
                </div>
                <div className="card stat-card border-green">
                    <TrendingUp size={32} color="#4CAF50" className="stat-icon" />
                    <div className="stat-value color-green">
                        {leaderboard.length > 0 ? leaderboard[0].averageGrade : '-'}
                    </div>
                    <div className="stat-label">Top Average</div>
                </div>
                <div className="card stat-card border-blue">
                    <Award size={32} color="#2196F3" className="stat-icon" />
                    <div className="stat-value color-blue">
                        {leaderboard.reduce((sum, s) => sum + s.sessionsCount, 0)}
                    </div>
                    <div className="stat-label">Total PLDs Graded</div>
                </div>
            </div>

            {/* Leaderboard Table */}
            {leaderboard.length === 0 ? (
                <div className="card empty-state">
                    <Trophy size={64} className="empty-icon" />
                    <h3>No Data Yet</h3>
                    <p>Complete some PLD sessions with grades to see the leaderboard!</p>
                </div>
            ) : (
                <div className="card table-card">
                    {/* Table Header */}
                    <div className="table-header">
                        <div className="col-rank">Rank</div>
                        <div className="col-student">Student</div>
                        <div className="col-plds">PLDs Done</div>
                        <div className="col-grade">Average Grade</div>
                    </div>

                    {/* Table Rows */}
                    {leaderboard.map((student, idx) => {
                        const rank = idx + 1;
                        const rankStyle = getRankStyle(rank);

                        return (
                            <div
                                key={student.discord}
                                className="leaderboard-row"
                                style={{
                                    background: rank <= 3 ? `${rankStyle.background}10` : 'transparent'
                                }}
                            >
                                {/* Rank Badge */}
                                <div className="col-rank">
                                    <span
                                        className="rank-badge"
                                        style={{
                                            fontSize: rank <= 3 ? '1.5rem' : '1rem',
                                            ...rankStyle
                                        }}
                                    >
                                        {getRankIcon(rank)}
                                    </span>
                                </div>

                                {/* Student Name */}
                                <div className="col-student">
                                    <div className="student-name">
                                        {student.name}
                                    </div>
                                    <div className="student-discord">
                                        @{student.discord}
                                    </div>
                                </div>

                                {/* PLDs Done */}
                                <div className="col-plds">
                                    <span className="plds-badge">
                                        {student.sessionsCount} PLDs
                                    </span>
                                </div>

                                {/* Average Grade */}
                                <div className="col-grade">
                                    <span
                                        className="grade-badge"
                                        style={{
                                            background: parseFloat(student.averageGrade) >= 4 ? 'rgba(76, 175, 80, 0.15)' :
                                                parseFloat(student.averageGrade) >= 3 ? 'rgba(255, 193, 7, 0.15)' :
                                                    'rgba(211, 47, 47, 0.15)',
                                            color: parseFloat(student.averageGrade) >= 4 ? '#4CAF50' :
                                                parseFloat(student.averageGrade) >= 3 ? '#FFC107' :
                                                    '#d32f2f',
                                            border: `1px solid ${parseFloat(student.averageGrade) >= 4 ? 'rgba(76, 175, 80, 0.3)' :
                                                parseFloat(student.averageGrade) >= 3 ? 'rgba(255, 193, 7, 0.3)' :
                                                    'rgba(211, 47, 47, 0.3)'}`
                                        }}>
                                        {student.averageGrade}/5
                                    </span>
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}
        </div>
    );
};

export default Leaderboard;
