import React, { useEffect, useMemo, useRef } from 'react';
import CodeMirror from '@uiw/react-codemirror';
import { javascript } from '@codemirror/lang-javascript';
import { python } from '@codemirror/lang-python';
import { cpp } from '@codemirror/lang-cpp';
import { keymap, EditorView, Decoration, WidgetType } from '@codemirror/view';
import { Prec, StateField, StateEffect } from '@codemirror/state';
import { indentWithTab } from '@codemirror/commands';
import { acceptCompletion } from '@codemirror/autocomplete';
import { useTheme } from '../context/ThemeContext';

const BADGE_COLORS = [
    '#2563eb', '#16a34a', '#d97706', '#dc2626', '#7c3aed', 
    '#0891b2', '#db2777', '#4f46e5', '#059669', '#ea580c',
    '#c026d3', '#2563eb', '#9333ea', '#4d7c0f', '#b45309',
    '#be123c', '#1d4ed8', '#047857', '#a21caf', '#6d28d9'
];

const getBadgeColor = (userId) => {
    if (!userId) return BADGE_COLORS[0];
    let hash = 0;
    for (let i = 0; i < userId.length; i++) {
        hash = userId.charCodeAt(i) + ((hash << 5) - hash);
    }
    return BADGE_COLORS[Math.abs(hash) % BADGE_COLORS.length];
};

class BadgeWidget extends WidgetType {
    constructor(name, color, timestamp) {
        super();
        this.name = name;
        this.color = color;
        this.timestamp = timestamp;
    }
    eq(other) { return other.timestamp === this.timestamp; }
    toDOM() {
        const span = document.createElement("span");
        span.className = "edit-badge-container";
        span.style.cssText = "display: inline-block; position: relative; width: 0; height: 0; vertical-align: middle; pointer-events: none; user-select: none; z-index: 100;";
        
        const badge = document.createElement("span");
        badge.textContent = this.name;
        badge.style.cssText = `
            position: absolute;
            bottom: 100%;
            left: 0;
            transform: translateY(-4px);
            background-color: ${this.color};
            color: white;
            padding: 3px 10px;
            border-radius: 4px 4px 4px 0;
            font-size: 11px;
            font-weight: bold;
            white-space: nowrap;
            box-shadow: 0 4px 12px rgba(0,0,0,0.3);
            display: inline-block;
            animation: badge-pop 3.5s cubic-bezier(0.2, 0, 0.2, 1) forwards;
            border: 1px solid rgba(255,255,255,0.2);
        `;
        
        const cursorLine = document.createElement("div");
        cursorLine.style.cssText = `
            position: absolute;
            top: 0;
            left: 0;
            width: 2px;
            height: 1.2em;
            background-color: ${this.color};
            animation: cursor-fade 3.5s ease-out forwards;
        `;
        
        span.appendChild(badge);
        span.appendChild(cursorLine);
        return span;
    }
}

const setBadge = StateEffect.define();
const clearBadge = StateEffect.define();

const badgeField = StateField.define({
    create() { return null; },
    update(value, tr) {
        let newVal = value;
        
        // If the document changed (e.g. text was deleted), map the badge's position 
        // to its new location so it doesn't throw an out-of-bounds RangeError.
        if (newVal && tr.docChanged) {
            newVal = { ...newVal, pos: tr.changes.mapPos(newVal.pos) };
        }
        
        for (let e of tr.effects) {
            if (e.is(setBadge)) newVal = e.value;
            if (e.is(clearBadge)) newVal = null;
        }
        
        // Final safety clamp against the new document length
        if (newVal && newVal.pos > tr.state.doc.length) {
            newVal = { ...newVal, pos: tr.state.doc.length };
        }
        
        return newVal;
    },
    provide: f => EditorView.decorations.from(f, val => {
        if (!val || val.pos === null) return Decoration.none;
        return Decoration.set([
            Decoration.widget({
                widget: new BadgeWidget(val.name, val.color, val.timestamp),
                side: 1
            }).range(val.pos)
        ]);
    })
});

// Custom theme to add space for the badge at the top
const editorPaddingTheme = EditorView.theme({
    ".cm-content": {
        paddingTop: "24px !important"
    },
    ".cm-lineNumbers": {
        paddingTop: "24px !important"
    }
});

export default function CodeEditor({ code, onChange, language = 'python', readOnly = false, remoteEdit = null }) {
    const { theme } = useTheme();
    const editorRef = useRef(null);
    const timerRef = useRef(null);
    const lastRemoteTimestamp = useRef(null);

    // Effect to handle remote edits
    useEffect(() => {
        if (remoteEdit && editorRef.current?.view) {
            const { userName, userId, pos, timestamp } = remoteEdit;
            
            // Avoid duplicate triggers for the same remote update
            if (lastRemoteTimestamp.current === timestamp) return;
            lastRemoteTimestamp.current = timestamp;

            const view = editorRef.current.view;
            
            try {
                // Ensure pos is valid against current document length
                const docLength = view.state.doc.length;
                let parsedPos = typeof pos === 'number' ? pos : 0;
                const targetPos = Math.max(0, Math.min(parsedPos, docLength));
                
                view.dispatch({
                    effects: setBadge.of({
                        name: userName,
                        color: getBadgeColor(userId),
                        pos: targetPos,
                        timestamp: timestamp
                    })
                });

                if (timerRef.current) clearTimeout(timerRef.current);
                timerRef.current = setTimeout(() => {
                    if (view) view.dispatch({ effects: clearBadge.of() });
                }, 3500);
            } catch (e) {
                console.error("Failed to show remote badge:", e);
            }
        }
    }, [remoteEdit]);

    const getLanguageExtension = () => {
        switch (language) {
            case 'python': return python();
            case 'cpp': return cpp();
            case 'javascript':
            default: return javascript({ jsx: true });
        }
    };

    return (
        <div style={{ borderRadius: '8px', overflow: 'hidden', border: '1px solid var(--border-color)', height: '100%', opacity: readOnly ? 0.7 : 1 }}>
            <style>{`
                @keyframes badge-pop {
                    0% { opacity: 0; transform: translateY(10px) scale(0.8); }
                    5% { opacity: 1; transform: translateY(-4px) scale(1); }
                    90% { opacity: 1; transform: translateY(-4px) scale(1); }
                    100% { opacity: 0; transform: translateY(-10px) scale(0.9); }
                }
                @keyframes cursor-fade {
                    0% { opacity: 1; }
                    90% { opacity: 1; }
                    100% { opacity: 0; }
                }
                .cm-editor { height: 100% !important; }
            `}</style>
            <CodeMirror
                ref={editorRef}
                value={code}
                height="100%"
                theme={theme === 'dark' ? 'dark' : 'light'}
                basicSetup={{
                    indentWithTab: false,
                }}
                extensions={[
                    getLanguageExtension(),
                    Prec.highest(keymap.of([
                        { key: 'Tab', run: acceptCompletion }
                    ])),
                    keymap.of([
                        indentWithTab
                    ]),
                    badgeField,
                    editorPaddingTheme
                ]}
                onChange={onChange}
                readOnly={readOnly}
                style={{ fontSize: '14px', minHeight: '300px' }}
            />
        </div>
    );
}
