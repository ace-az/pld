// client/src/pages/SessionRun.jsx
import { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, ArrowRight, Save, Send, Download, Lightbulb } from 'lucide-react';
import { jsPDF } from 'jspdf';
import { generateFeedback } from '../services/aiService';

export default function SessionRun() {
    const { id } = useParams();
    const navigate = useNavigate();
    const [session, setSession] = useState(null);
    const [currentIndex, setCurrentIndex] = useState(0);
    const [note, setNote] = useState('');
    const [saving, setSaving] = useState(false);
    const [generating, setGenerating] = useState(false);
    const [results, setResults] = useState({}); // studentId -> feedback
    const [sentStatus, setSentStatus] = useState({}); // studentId -> boolean

    // Debounce save ref
    const saveTimeout = useRef(null);

    useEffect(() => {
        fetchSession();
    }, [id]);

    useEffect(() => {
        if (session && session.students[currentIndex]) {
            setNote(session.students[currentIndex].notes || '');
        }
    }, [currentIndex, session]);

    // Keyboard navigation
    useEffect(() => {
        const handleKeyDown = (e) => {
            // Only handle arrow keys if not typing in an input/textarea
            if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') {
                return;
            }

            if (e.key === 'ArrowRight' && session && currentIndex < session.students.length - 1) {
                e.preventDefault();
                setCurrentIndex(prev => prev + 1);
            } else if (e.key === 'ArrowLeft' && currentIndex > 0) {
                e.preventDefault();
                setCurrentIndex(prev => prev - 1);
            }
        };

        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [currentIndex, session]);

    const fetchSession = async () => {
        try {
            const res = await fetch(`http://localhost:5000/api/sessions/${id}`, {
                headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
            });
            if (res.ok) {
                const data = await res.json();
                setSession(data);
                // Pre-load results
                const initialResults = {};
                data.students.forEach(s => {
                    if (s.result) initialResults[s.id] = s.result;
                });
                setResults(initialResults);
            }
        } catch (err) {
            console.error(err);
        }
    };

    const saveNote = async (content) => {
        setSaving(true);
        try {
            const studentId = session.students[currentIndex].id;
            await fetch(`http://localhost:5000/api/sessions/${session.id}/students/${studentId}/notes`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${localStorage.getItem('token')}`
                },
                body: JSON.stringify({ notes: content })
            });

            setSession(prev => {
                const newStudents = [...prev.students];
                newStudents[currentIndex].notes = content;
                return { ...prev, students: newStudents };
            });
        } catch (err) {
            console.error('Failed to save note', err);
        } finally {
            setSaving(false);
        }
    };

    const handleNoteChange = (e) => {
        const content = e.target.value;
        setNote(content);
        if (saveTimeout.current) clearTimeout(saveTimeout.current);
        saveTimeout.current = setTimeout(() => {
            saveNote(content);
        }, 1000);
    };

    const handleNext = () => {
        if (session && currentIndex < session.students.length - 1) {
            setCurrentIndex(currentIndex + 1);
        }
    };

    const handlePrev = () => {
        if (currentIndex > 0) {
            setCurrentIndex(currentIndex - 1);
        }
    };

    // Generate Reports Only
    const handleGenerateReports = async () => {
        if (!window.confirm("Generate AI reports for all students?")) return;

        setGenerating(true);
        const newResults = { ...results };

        // Generate for all students
        for (const student of session.students) {
            if (newResults[student.id]) continue; // Skip existing

            const feedback = await generateFeedback(student.name, session.groupName, student.notes || "Participated in session.");
            newResults[student.id] = feedback;

            await fetch(`http://localhost:5000/api/sessions/${session.id}/students/${student.id}/result`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${localStorage.getItem('token')}`
                },
                body: JSON.stringify({ result: feedback })
            });
        }

        setResults(newResults);

        // Auto-mark completed if comprehensive? Or leave active?
        // Let's mark completed only manually or keep distinct.
        await fetch(`http://localhost:5000/api/sessions/${session.id}/end`, {
            method: 'POST',
            headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
        });

        setGenerating(false);
        fetchSession(); // Refresh status
    };

    const handleSendToDiscord = async (studentId) => {
        // Optimistic Update
        const oldStatus = sentStatus[studentId];
        setSentStatus(prev => ({ ...prev, [studentId]: 'sending' }));

        try {
            const res = await fetch(`http://localhost:5000/api/sessions/${session.id}/students/${studentId}/send`, {
                method: 'POST',
                headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
            });

            if (res.ok) {
                setSentStatus(prev => ({ ...prev, [studentId]: true }));
                alert("Sent successfully!");
            } else {
                throw new Error("Failed to send");
            }
        } catch (err) {
            console.error(err);
            setSentStatus(prev => ({ ...prev, [studentId]: false }));
            alert("Failed to send message. Check server logs.");
        }
    };

    const handleSendAllToDiscord = async () => {
        if (!window.confirm("Are you sure you want to send feedback to ALL students via Discord?")) return;

        setGenerating(true); // Re-using generating state to show busy
        try {
            const res = await fetch(`http://localhost:5000/api/sessions/${session.id}/send-all`, {
                method: 'POST',
                headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
            });
            const data = await res.json();

            if (data.summary) {
                // Update statuses based on summary
                const newStatuses = { ...sentStatus };
                let successCount = 0;
                let failCount = 0;

                data.summary.forEach(item => {
                    // Find student ID by name (not ideal but safe enough here since we don't have ID in summary yet)
                    // Better to update backend to return ID, but let's stick to simple matching or refresh session
                    const s = session.students.find(st => st.name === item.student);
                    if (s) {
                        newStatuses[s.id] = item.success;
                    }
                    if (item.success) successCount++;
                    else failCount++;
                });

                setSentStatus(newStatuses);
                alert(`Batch Send Complete:\nSuccess: ${successCount}\nFailed: ${failCount}`);
            }
        } catch (err) {
            console.error(err);
            alert("Failed to execute batch send.");
        } finally {
            setGenerating(false);
        }
    };

    const handleDownloadPDF = () => {
        const doc = new jsPDF();
        let y = 10;
        doc.setFontSize(16);
        doc.text(`PLD Report: ${session.groupName}`, 10, y);
        y += 10;
        doc.setFontSize(12);
        doc.text(`Date: ${new Date(session.createdAt).toLocaleDateString()}`, 10, y);
        y += 15;

        session.students.forEach(student => {
            if (y > 250) { doc.addPage(); y = 10; }
            doc.setFontSize(14);
            doc.setTextColor(211, 47, 47);
            doc.text(`Student: ${student.name} (${student.discord})`, 10, y);
            doc.setTextColor(0);
            y += 7;

            doc.setFontSize(10);
            doc.setFont(undefined, 'bold');
            doc.text("Mentor Notes:", 10, y);
            doc.setFont(undefined, 'normal');
            y += 5;
            const splitNotes = doc.splitTextToSize(student.notes || "No notes", 180);
            doc.text(splitNotes, 10, y);
            y += (splitNotes.length * 5) + 5;

            if (results[student.id]) {
                doc.setFont(undefined, 'bold');
                doc.text("AI Feedback:", 10, y);
                doc.setFont(undefined, 'normal');
                y += 5;
                const cleanFeedback = results[student.id].replace(/\*\*/g, '').replace(/###/g, '');
                const splitFeedback = doc.splitTextToSize(cleanFeedback, 180);
                doc.text(splitFeedback, 10, y);
                y += (splitFeedback.length * 5) + 10;
            } else {
                y += 10;
            }

            doc.setDrawColor(200);
            doc.line(10, y, 200, y);
            y += 10;
        });

        doc.save(`${session.groupName}_Report.pdf`);
    };

    if (!session) return <div className="flex-center" style={{ height: '100vh' }}>Loading...</div>;

    const currentStudent = session.students[currentIndex];
    const progressText = `Student ${currentIndex + 1} / ${session.students.length}`;

    return (
        <div>
            <div className="flex-between" style={{ marginBottom: '1.5rem' }}>
                <div>
                    <button onClick={() => navigate('/')} className="btn-outline" style={{ display: 'flex', alignItems: 'center', marginBottom: '0.5rem', border: 'none', padding: 0 }}>
                        <ArrowLeft size={16} style={{ marginRight: '0.5rem' }} /> Back
                    </button>
                    <h1>{session.groupName}</h1>
                    <span style={{ color: 'var(--text-secondary)' }}>Status: {session.status.toUpperCase()}</span>
                </div>
                <div className="flex-center" style={{ gap: '1rem' }}>
                    {Object.keys(results).length > 0 && (
                        <button onClick={handleDownloadPDF} className="btn btn-outline flex-center">
                            <Download size={18} style={{ marginRight: '0.5rem' }} /> Download PDF
                        </button>
                    )}
                    {/* Generate Button replaces End Session if active */}
                    {(session.status === 'active' || Object.keys(results).length < session.students.length) && (
                        <button
                            onClick={handleGenerateReports}
                            className="btn btn-primary flex-center"
                            disabled={generating}
                        >
                            <Lightbulb size={18} style={{ marginRight: '0.5rem' }} />
                            {generating ? 'Generating Reports...' : 'Generate AI Reports'}
                        </button>
                    )}
                    <button
                        onClick={handleSendAllToDiscord}
                        className="btn flex-center"
                        style={{ background: 'var(--color-primary)', color: 'white', border: 'none' }}
                        disabled={generating || Object.keys(results).length === 0}
                    >
                        <Send size={18} style={{ marginRight: '0.5rem' }} />
                        Send All to Discord
                    </button>
                </div>
            </div>

            <div className="card" style={{ minHeight: '60vh', display: 'flex', flexDirection: 'column' }}>
                <div className="flex-between" style={{ marginBottom: '2rem', borderBottom: '1px solid var(--border-color)', paddingBottom: '1rem' }}>
                    <button onClick={handlePrev} disabled={currentIndex === 0} className="btn-icon" style={{ opacity: currentIndex === 0 ? 0.3 : 1 }}>
                        <ArrowLeft size={32} />
                    </button>

                    <div style={{ textAlign: 'center' }}>
                        <h2 style={{ margin: 0, color: 'var(--color-primary)' }}>{currentStudent.name}</h2>
                        <div style={{ color: 'var(--text-secondary)' }}>{currentStudent.discord}</div>
                        <div style={{ marginTop: '0.5rem', fontWeight: 'bold' }}>{progressText}</div>
                    </div>

                    <button onClick={handleNext} disabled={currentIndex === session.students.length - 1} className="btn-icon" style={{ opacity: currentIndex === session.students.length - 1 ? 0.3 : 1 }}>
                        <ArrowRight size={32} />
                    </button>
                </div>

                <div style={{ flex: 1, display: 'flex', gap: '2rem' }}>
                    <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
                        <div className="flex-between" style={{ marginBottom: '0.5rem' }}>
                            <label style={{ fontWeight: '600' }}>Mentor Notes</label>
                            {saving && <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', display: 'flex', alignItems: 'center' }}><Save size={12} style={{ marginRight: 4 }} /> Saving...</span>}
                        </div>
                        <textarea
                            className="input-control"
                            style={{ flex: 1, minHeight: '300px', resize: 'none', fontFamily: 'monospace' }}
                            value={note}
                            onChange={handleNoteChange}
                            placeholder="Write interview notes, observations, and feedback here..."
                        />
                    </div>

                    {/* Result View */}
                    {results[currentStudent.id] && (
                        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', background: 'var(--bg-app)', padding: '1rem', borderRadius: 'var(--radius-sm)' }}>
                            <div className="flex-between" style={{ marginBottom: '1rem' }}>
                                <strong style={{ color: 'var(--color-primary)' }}>AI Feedback Generated</strong>
                                <button
                                    onClick={() => handleSendToDiscord(currentStudent.id)}
                                    className="btn btn-primary"
                                    style={{ fontSize: '0.8rem', padding: '0.5rem 1rem', display: 'flex', alignItems: 'center' }}
                                    disabled={sentStatus[currentStudent.id] === true || sentStatus[currentStudent.id] === 'sending'}
                                >
                                    <Send size={14} style={{ marginRight: '0.5rem' }} />
                                    {sentStatus[currentStudent.id] === 'sending' ? 'Sending...' : (sentStatus[currentStudent.id] === true ? 'Sent!' : 'Send to Discord')}
                                </button>
                            </div>
                            <div style={{ whiteSpace: 'pre-wrap', fontSize: '0.9rem', flex: 1, overflowY: 'auto', maxHeight: '500px' }}>
                                {results[currentStudent.id]}
                            </div>
                        </div>
                    )}
                    {!results[currentStudent.id] && (
                        <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-secondary)', border: '2px dashed var(--border-color)', borderRadius: 'var(--radius-sm)' }}>
                            <p>Notes collected. <br />Click "Generate AI Reports" when finished.</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
