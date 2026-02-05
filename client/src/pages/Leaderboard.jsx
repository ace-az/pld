// client/src/pages/Leaderboard.jsx
import React, { useState, useEffect } from 'react';
import { getLeaderboard } from '../api';
import { Trophy, Award, Users, TrendingUp } from 'lucide-react';

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
        <div>
            {/* Header */}
            <div style={{
                textAlign: 'center',
                marginBottom: '3rem',
                padding: '2rem',
                background: 'linear-gradient(135deg, var(--color-primary), #6366f1)',
                borderRadius: '16px',
                boxShadow: 'var(--shadow-lg)'
            }}>
                <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '1rem', marginBottom: '0.5rem' }}>
                    <Trophy size={40} color="#FFD700" />
                    <h1 style={{ margin: 0, fontSize: '2.5rem', color: 'white' }}>Student Leaderboard</h1>
                    <Trophy size={40} color="#FFD700" />
                </div>
                <p style={{ color: 'rgba(255,255,255,0.8)', margin: 0 }}>
                    Ranking students by their average PLD performance
                </p>
            </div>

            {/* Stats Summary */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem', marginBottom: '2rem' }}>
                <div className="card" style={{ textAlign: 'center', borderTop: '4px solid #FFD700' }}>
                    <Users size={32} color="var(--color-primary)" style={{ marginBottom: '0.5rem' }} />
                    <div style={{ fontSize: '2rem', fontWeight: 'bold', color: 'var(--color-primary)' }}>{leaderboard.length}</div>
                    <div style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>Total Students</div>
                </div>
                <div className="card" style={{ textAlign: 'center', borderTop: '4px solid #4CAF50' }}>
                    <TrendingUp size={32} color="#4CAF50" style={{ marginBottom: '0.5rem' }} />
                    <div style={{ fontSize: '2rem', fontWeight: 'bold', color: '#4CAF50' }}>
                        {leaderboard.length > 0 ? leaderboard[0].averageGrade : '-'}
                    </div>
                    <div style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>Top Average</div>
                </div>
                <div className="card" style={{ textAlign: 'center', borderTop: '4px solid #2196F3' }}>
                    <Award size={32} color="#2196F3" style={{ marginBottom: '0.5rem' }} />
                    <div style={{ fontSize: '2rem', fontWeight: 'bold', color: '#2196F3' }}>
                        {leaderboard.reduce((sum, s) => sum + s.sessionsCount, 0)}
                    </div>
                    <div style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>Total PLDs Graded</div>
                </div>
            </div>

            {/* Leaderboard Table */}
            {leaderboard.length === 0 ? (
                <div className="card" style={{ textAlign: 'center', padding: '4rem', color: 'var(--text-secondary)' }}>
                    <Trophy size={64} style={{ opacity: 0.3, marginBottom: '1rem' }} />
                    <h3>No Data Yet</h3>
                    <p>Complete some PLD sessions with grades to see the leaderboard!</p>
                </div>
            ) : (
                <div className="card" style={{ padding: '0', overflow: 'hidden' }}>
                    {/* Table Header */}
                    <div style={{
                        display: 'grid',
                        gridTemplateColumns: '80px 1fr 150px 150px',
                        padding: '1rem 1.5rem',
                        background: 'var(--bg-app)',
                        borderBottom: '2px solid var(--border-color)',
                        fontWeight: '600',
                        color: 'var(--text-secondary)',
                        fontSize: '0.85rem',
                        textTransform: 'uppercase',
                        letterSpacing: '0.05em'
                    }}>
                        <div>Rank</div>
                        <div>Student</div>
                        <div style={{ textAlign: 'center' }}>PLDs Done</div>
                        <div style={{ textAlign: 'center' }}>Average Grade</div>
                    </div>

                    {/* Table Rows */}
                    {leaderboard.map((student, idx) => {
                        const rank = idx + 1;
                        const rankStyle = getRankStyle(rank);

                        return (
                            <div
                                key={student.discord}
                                style={{
                                    display: 'grid',
                                    gridTemplateColumns: '80px 1fr 150px 150px',
                                    padding: '1rem 1.5rem',
                                    borderBottom: '1px solid var(--border-color)',
                                    alignItems: 'center',
                                    transition: 'background 0.2s ease',
                                    background: rank <= 3 ? `${rankStyle.background}10` : 'transparent'
                                }}
                                className="leaderboard-row"
                            >
                                {/* Rank Badge */}
                                <div>
                                    <span style={{
                                        display: 'inline-flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        width: '40px',
                                        height: '40px',
                                        borderRadius: '50%',
                                        fontWeight: 'bold',
                                        fontSize: rank <= 3 ? '1.5rem' : '1rem',
                                        ...rankStyle
                                    }}>
                                        {getRankIcon(rank)}
                                    </span>
                                </div>

                                {/* Student Name */}
                                <div>
                                    <div style={{ fontWeight: '600', fontSize: '1.05rem', color: 'var(--text-main)' }}>
                                        {student.name}
                                    </div>
                                    <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                                        @{student.discord}
                                    </div>
                                </div>

                                {/* PLDs Done */}
                                <div style={{ textAlign: 'center' }}>
                                    <span style={{
                                        background: 'var(--bg-app)',
                                        padding: '0.3rem 0.75rem',
                                        borderRadius: '20px',
                                        fontSize: '0.9rem',
                                        fontWeight: '600',
                                        border: '1px solid var(--border-color)'
                                    }}>
                                        {student.sessionsCount} PLDs
                                    </span>
                                </div>

                                {/* Average Grade */}
                                <div style={{ textAlign: 'center' }}>
                                    <span style={{
                                        background: parseFloat(student.averageGrade) >= 4 ? 'rgba(76, 175, 80, 0.15)' :
                                            parseFloat(student.averageGrade) >= 3 ? 'rgba(255, 193, 7, 0.15)' :
                                                'rgba(211, 47, 47, 0.15)',
                                        color: parseFloat(student.averageGrade) >= 4 ? '#4CAF50' :
                                            parseFloat(student.averageGrade) >= 3 ? '#FFC107' :
                                                '#d32f2f',
                                        padding: '0.4rem 1rem',
                                        borderRadius: '8px',
                                        fontSize: '1.1rem',
                                        fontWeight: 'bold',
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

            <style>{`
                .leaderboard-row:hover {
                    background: var(--bg-app) !important;
                }
            `}</style>
        </div>
    );
};

export default Leaderboard;
