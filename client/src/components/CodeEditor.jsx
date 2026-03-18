import React from 'react';
import CodeMirror from '@uiw/react-codemirror';
import { javascript } from '@codemirror/lang-javascript';
import { python } from '@codemirror/lang-python';
import { cpp } from '@codemirror/lang-cpp';
import { useTheme } from '../context/ThemeContext';

export default function CodeEditor({ code, onChange, language = 'javascript', readOnly = false }) {
    const { theme } = useTheme();
    
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
            <CodeMirror
                value={code}
                height="100%"
                theme={theme === 'dark' ? 'dark' : 'light'}
                extensions={[getLanguageExtension()]}
                onChange={onChange}
                readOnly={readOnly}
                style={{ fontSize: '14px', minHeight: '300px' }}
            />
        </div>
    );
}
