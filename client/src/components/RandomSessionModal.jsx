// client/src/components/RandomSessionModal.jsx
import { useState, useEffect, useRef, useCallback } from 'react';
import { Shuffle, Bell, X, Users, RefreshCw, CheckCircle, GripVertical, BookOpen, ChevronRight, ChevronLeft } from 'lucide-react';
import { getMasterStudents, notifyGroups, getQuestionSets } from '../api';
import { useToast } from '../context/ToastContext';
import './RandomSessionModal.css';

function shuffleArray(arr) {
    const a = [...arr];
    for (let i = a.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [a[i], a[j]] = [a[j], a[i]];
    }
    return a;
}

function buildGroups(students, maxSize = 4) {
    // Group students by major
    const byMajor = {};
    for (const student of students) {
        const major = (student.major || 'General').trim() || 'General';
        if (!byMajor[major]) byMajor[major] = [];
        byMajor[major].push(student);
    }

    const groups = [];
    for (const [major, majorStudents] of Object.entries(byMajor)) {
        const shuffled = shuffleArray(majorStudents);
        for (let i = 0; i < shuffled.length; i += maxSize) {
            groups.push({
                name: `Group ${groups.length + 1}`,
                major,
                students: shuffled.slice(i, i + maxSize)
            });
        }
    }
    return groups;
}

export default function RandomSessionModal({ onClose }) {
    const toast = useToast();
    const [step, setStep] = useState(1);           // 1 = topic picker, 2 = groups
    const [questionSets, setQuestionSets] = useState([]);
    const [selectedTopicIds, setSelectedTopicIds] = useState([]);
    const [allStudents, setAllStudents] = useState([]);
    const [groups, setGroups] = useState([]);
    const [loading, setLoading] = useState(true);
    const [notifying, setNotifying] = useState(false);
    const [notified, setNotified] = useState(false);

    /* ── Drag refs ──────────────────────────────────────── */
    const dragSrc = useRef(null);
    const touchSrc = useRef(null);
    const ghostRef = useRef(null);
    const scrollContainerRef = useRef(null);
    const scrollAnimFrame = useRef(null);

    useEffect(() => { fetchInitialData(); }, []);

    // Non-passive touchmove to allow preventDefault on iOS
    useEffect(() => {
        const el = scrollContainerRef.current;
        if (!el) return;
        const prevent = (e) => { if (touchSrc.current) e.preventDefault(); };
        el.addEventListener('touchmove', prevent, { passive: false });
        return () => el.removeEventListener('touchmove', prevent);
    }, [step]);

    const fetchInitialData = async () => {
        setLoading(true);
        try {
            const [studentData, setsData] = await Promise.all([getMasterStudents(), getQuestionSets()]);
            const valid = (studentData || []).filter(s => s.name && s.discord);
            setAllStudents(valid);
            setQuestionSets(Array.isArray(setsData) ? setsData : []);
        } catch { toast.error('Failed to load data.'); }
        finally { setLoading(false); }
    };

    const handleGoToGroups = () => {
        if (!selectedTopicIds.length) return toast.error('Please select at least one topic.');
        setGroups(buildGroups(allStudents));
        setNotified(false);
        setStep(2);
    };

    const handleReshuffle = () => { setGroups(buildGroups(allStudents)); setNotified(false); };

    const toggleTopic = (id) => setSelectedTopicIds(prev =>
        prev.includes(id) ? prev.filter(t => t !== id) : [...prev, id]);

    /* ── Auto-scroll ────────────────────────────────────── */
    const autoScroll = useCallback((clientY) => {
        const el = scrollContainerRef.current;
        if (!el) return;
        const { top, bottom } = el.getBoundingClientRect();
        const ZONE = 80, MAX = 18;
        if (scrollAnimFrame.current) { cancelAnimationFrame(scrollAnimFrame.current); scrollAnimFrame.current = null; }
        if (clientY < top + ZONE) {
            const speed = Math.round(MAX * (1 - (clientY - top) / ZONE));
            const step = () => { el.scrollTop -= speed; scrollAnimFrame.current = requestAnimationFrame(step); };
            scrollAnimFrame.current = requestAnimationFrame(step);
        } else if (clientY > bottom - ZONE) {
            const speed = Math.round(MAX * (1 - (bottom - clientY) / ZONE));
            const stepFn = () => { el.scrollTop += speed; scrollAnimFrame.current = requestAnimationFrame(stepFn); };
            scrollAnimFrame.current = requestAnimationFrame(stepFn);
        }
    }, []);

    const stopAutoScroll = () => {
        if (scrollAnimFrame.current) { cancelAnimationFrame(scrollAnimFrame.current); scrollAnimFrame.current = null; }
    };

    /* ── Move helpers ───────────────────────────────────── */
    const moveStudent = (srcGrp, srcIdx, targetGroupIdx) => {
        if (srcGrp === targetGroupIdx) return;
        setGroups(prev => {
            const next = prev.map(g => ({ ...g, students: [...g.students] }));
            const [student] = next[srcGrp].students.splice(srcIdx, 1);
            next[targetGroupIdx].students.push(student);
            const filtered = next.filter(g => g.students.length > 0);
            return filtered.map((g, i) => ({ ...g, name: `Group ${i + 1}` }));
        });
    };

    const moveStudentToPos = (srcGrp, srcIdx, targetGroupIdx, targetStudentIdx) => {
        setGroups(prev => {
            const next = prev.map(g => ({ ...g, students: [...g.students] }));
            const [student] = next[srcGrp].students.splice(srcIdx, 1);
            const adjIdx = srcGrp === targetGroupIdx && srcIdx < targetStudentIdx ? targetStudentIdx - 1 : targetStudentIdx;
            next[targetGroupIdx].students.splice(adjIdx, 0, student);
            const filtered = next.filter(g => g.students.length > 0);
            return filtered.map((g, i) => ({ ...g, name: `Group ${i + 1}` }));
        });
    };

    /* ── Mouse drag ─────────────────────────────────────── */
    const handleDragStart = (e, groupIdx, studentIdx) => { dragSrc.current = { groupIdx, studentIdx }; e.dataTransfer.effectAllowed = 'move'; };
    const handleDragOverContainer = useCallback((e) => { e.preventDefault(); e.dataTransfer.dropEffect = 'move'; autoScroll(e.clientY); }, [autoScroll]);
    const handleDropOnGroup = (e, gi) => { e.preventDefault(); if (!dragSrc.current) return; moveStudent(dragSrc.current.groupIdx, dragSrc.current.studentIdx, gi); dragSrc.current = null; };
    const handleDropOnStudent = (e, gi, si) => { e.preventDefault(); e.stopPropagation(); if (!dragSrc.current) return; moveStudentToPos(dragSrc.current.groupIdx, dragSrc.current.studentIdx, gi, si); dragSrc.current = null; };

    /* ── Touch drag ─────────────────────────────────────── */
    const createGhost = (el) => {
        const rect = el.getBoundingClientRect();
        const ghost = el.cloneNode(true);
        ghost.style.cssText = `position:fixed;left:${rect.left}px;top:${rect.top}px;width:${rect.width}px;opacity:.88;pointer-events:none;z-index:9999;border-radius:8px;background:var(--bg-card);box-shadow:0 8px 28px rgba(0,0,0,.45);transition:none;`;
        document.body.appendChild(ghost);
        ghostRef.current = ghost;
    };
    const removeGhost = () => {
        if (ghostRef.current) { ghostRef.current.remove(); ghostRef.current = null; }
        document.querySelectorAll('.rnd-group-card').forEach(c => c.classList.remove('drag-over'));
    };
    const handleTouchStart = (e, groupIdx, studentIdx) => {
        touchSrc.current = { groupIdx, studentIdx };
        createGhost(e.currentTarget);
        e.currentTarget.style.opacity = '0.3';
        e.currentTarget.dataset.dragging = 'true';
    };
    const handleTouchMove = (e) => {
        if (!touchSrc.current || !ghostRef.current) return;
        e.preventDefault();
        const { clientX: x, clientY: y } = e.touches[0];
        ghostRef.current.style.left = `${x - ghostRef.current.offsetWidth / 2}px`;
        ghostRef.current.style.top = `${y - ghostRef.current.offsetHeight / 2}px`;
        autoScroll(y);
        ghostRef.current.style.display = 'none';
        const under = document.elementFromPoint(x, y);
        ghostRef.current.style.display = '';
        document.querySelectorAll('.rnd-group-card').forEach(c => c.classList.remove('drag-over'));
        under?.closest('.rnd-group-card')?.classList.add('drag-over');
    };
    const handleTouchEnd = (e) => {
        stopAutoScroll();
        if (!touchSrc.current || !ghostRef.current) return;
        const { clientX: x, clientY: y } = e.changedTouches[0];
        ghostRef.current.style.display = 'none';
        const under = document.elementFromPoint(x, y);
        removeGhost();
        document.querySelectorAll('[data-dragging="true"]').forEach(el => { el.style.opacity = ''; delete el.dataset.dragging; });
        const groupCard = under?.closest('.rnd-group-card');
        if (!groupCard) { touchSrc.current = null; return; }
        const allCards = Array.from(scrollContainerRef.current?.querySelectorAll('.rnd-group-card') || []);
        const targetGroupIdx = allCards.indexOf(groupCard);
        if (targetGroupIdx !== -1) moveStudent(touchSrc.current.groupIdx, touchSrc.current.studentIdx, targetGroupIdx);
        touchSrc.current = null;
    };

    /* ── Notify ─────────────────────────────────────────── */
    const handleNotify = async () => {
        setNotifying(true);
        try {
            const result = await notifyGroups({ groups, topicIds: selectedTopicIds });
            toast.success(`✅ ${result.sessions} sessions created, ${result.notified} students notified!`);
            setNotified(true);
        } catch (err) {
            toast.error(err.message || 'Failed to notify students.');
        } finally { setNotifying(false); }
    };

    /* ── Render ─────────────────────────────────────────── */
    return (
        <div className="rnd-overlay" onClick={e => e.target === e.currentTarget && onClose()}>
            <div className="rnd-modal">

                {/* Header */}
                <div className="rnd-header">
                    <div className="rnd-header-left">
                        {step === 2 && <button className="rnd-back-btn" onClick={() => setStep(1)}><ChevronLeft size={16} /></button>}
                        <Shuffle size={20} />
                        <h2>{step === 1 ? 'Select Topics' : 'Random PLD Groups'}</h2>
                    </div>
                    <button className="rnd-close" onClick={onClose}><X size={18} /></button>
                </div>

                {loading ? (
                    <div className="rnd-loading"><div className="spinner" /><p>Loading…</p></div>
                ) : step === 1 ? (
                    /* ─ Step 1: Topic Picker ─ */
                    <>
                        <p className="rnd-subtitle">Choose which topics will be asked during the PLD session.</p>
                        <div className="rnd-topics" ref={scrollContainerRef}>
                            {questionSets.length === 0 ? (
                                <div className="rnd-empty">No question sets found. Create some first.</div>
                            ) : Object.entries(
                                questionSets.reduce((acc, qs) => {
                                    const m = qs.major || 'General';
                                    if (!acc[m]) acc[m] = [];
                                    acc[m].push(qs);
                                    return acc;
                                }, {})
                            ).map(([major, sets]) => (
                                <div key={major} style={{ marginBottom: '1rem' }}>
                                    <div style={{ fontSize: '0.8rem', fontWeight: 'bold', color: 'var(--text-secondary)', textTransform: 'uppercase', marginBottom: '0.5rem', letterSpacing: '0.5px', paddingLeft: '0.25rem' }}>{major}</div>
                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                                        {sets.map(qs => (
                                            <label key={qs.id} className={`rnd-topic-row ${selectedTopicIds.includes(qs.id) ? 'selected' : ''}`}>
                                                <input
                                                    type="checkbox"
                                                    checked={selectedTopicIds.includes(qs.id)}
                                                    onChange={() => toggleTopic(qs.id)}
                                                />
                                                <BookOpen size={14} />
                                                <span className="rnd-topic-name">{qs.topic || qs.name}</span>
                                                <span className="rnd-topic-count">{qs.questions?.length || 0} Qs</span>
                                            </label>
                                        ))}
                                    </div>
                                </div>
                            ))}
                        </div>
                        <div className="rnd-actions">
                            <button className="rnd-btn-notify" onClick={handleGoToGroups} disabled={!selectedTopicIds.length}>
                                <ChevronRight size={15} /> Next — Randomize Groups ({allStudents.length} students)
                            </button>
                        </div>
                    </>
                ) : (
                    /* ─ Step 2: Groups View ─ */
                    <>
                        <p className="rnd-subtitle">
                            {allStudents.length} students → {groups.length} groups · Drag to rearrange
                        </p>
                        <div
                            className="rnd-groups"
                            ref={scrollContainerRef}
                            onDragOver={handleDragOverContainer}
                            onDragEnd={stopAutoScroll}
                            onDrop={stopAutoScroll}
                        >
                            {groups.map((group, gi) => (
                                <div
                                    key={gi}
                                    className="rnd-group-card"
                                    onDragOver={e => e.preventDefault()}
                                    onDrop={e => handleDropOnGroup(e, gi)}
                                >
                                    <div className="rnd-group-title">
                                        <Users size={14} />{group.name}
                                        <span className="rnd-count">{group.students.length}</span>
                                        {group.major && group.major !== 'General' && (
                                            <span className="rnd-major-badge">{group.major}</span>
                                        )}
                                    </div>
                                    <div className="rnd-members">
                                        {group.students.map((s, si) => (
                                            <div
                                                key={si}
                                                className="rnd-member"
                                                draggable
                                                onDragStart={e => handleDragStart(e, gi, si)}
                                                onDragOver={e => e.preventDefault()}
                                                onDrop={e => handleDropOnStudent(e, gi, si)}
                                                onTouchStart={e => handleTouchStart(e, gi, si)}
                                                onTouchMove={handleTouchMove}
                                                onTouchEnd={handleTouchEnd}
                                            >
                                                <GripVertical size={13} className="rnd-grip" />
                                                <span className="rnd-member-name">{s.name}</span>
                                                <span className="rnd-member-discord">@{s.discord}</span>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            ))}
                        </div>
                        <div className="rnd-actions">
                            <button className="rnd-btn-reshuffle" onClick={handleReshuffle}><RefreshCw size={15} /> Reshuffle</button>
                            <button
                                className={`rnd-btn-notify ${notified ? 'notified' : ''}`}
                                onClick={handleNotify}
                                disabled={notifying || notified}
                            >
                                {notified ? <><CheckCircle size={15} /> Done!</>
                                    : notifying ? 'Creating…'
                                        : <><Bell size={15} /> Create Sessions & Notify</>}
                            </button>
                        </div>
                    </>
                )}
            </div>
        </div>
    );
}
