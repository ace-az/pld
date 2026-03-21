// client/src/context/AuthContext.jsx
import { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import { refreshToken as refreshTokenApi, logoutUser as logoutApi, setAccessToken as setApiToken } from '../api';

import { AuthContext } from './AuthContextObj';

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(() => {
        const saved = localStorage.getItem('user');
        try {
            return saved ? JSON.parse(saved) : null;
        } catch (e) {
            return null;
        }
    });
    const [accessToken, setAccessToken] = useState(null);
    const [loading, setLoading] = useState(() => {
        // Optimistic: If we have a user, don't show the full page loader.
        // The app will mount and background refresh will handle the rest.
        return !localStorage.getItem('user');
    });
    const [sessionExpiring, setSessionExpiring] = useState(false);
    
    const activityTimeoutRef = useRef(null);
    const hasInitialized = useRef(false);
    const INACTIVITY_LIMIT = 30 * 60 * 1000; // 30 minutes
    const WARNING_TIME = 5 * 60 * 1000; // 5 minutes warning before 30m

    // Expose setAccessToken and logout to window for Axios interceptor
    window.setAccessToken = (token) => {
        setAccessToken(token);
        setApiToken(token); // Sync with api module
    };

    const logout = useCallback(async () => {
        try {
            await logoutApi();
        } catch (error) {
            console.error("Logout API failed:", error);
        } finally {
            localStorage.removeItem('user');
            localStorage.removeItem('wasLoggedIn');
            setUser(null);
            setAccessToken(null);
            setApiToken(null);
            setSessionExpiring(false);
            if (activityTimeoutRef.current) clearTimeout(activityTimeoutRef.current);
        }
    }, []);

    window.logoutUser = logout;

    const resetActivityTimer = useCallback(() => {
        if (activityTimeoutRef.current) clearTimeout(activityTimeoutRef.current);
        if (!user) return;

        setSessionExpiring(false);
        
        activityTimeoutRef.current = setTimeout(() => {
            setSessionExpiring(true);
            // After another 5 minutes of no action during warning, logout
            activityTimeoutRef.current = setTimeout(() => {
                logout();
            }, WARNING_TIME);
        }, INACTIVITY_LIMIT - WARNING_TIME);
    }, [user, logout]);

    useEffect(() => {
        const events = ['mousedown', 'keydown', 'scroll', 'touchstart'];
        events.forEach(event => window.addEventListener(event, resetActivityTimer));
        
        return () => {
            events.forEach(event => window.removeEventListener(event, resetActivityTimer));
            if (activityTimeoutRef.current) clearTimeout(activityTimeoutRef.current);
        };
    }, [resetActivityTimer]);

    const performSilentRefresh = useCallback(async () => {
        if (hasInitialized.current) return;
        hasInitialized.current = true;

        // Optimization: Only attempt silent refresh if we were previously logged in
        if (!localStorage.getItem('wasLoggedIn')) {
            console.log("[Auth] Skipping silent refresh - no prior session recorded.");
            setLoading(false);
            return false;
        }

        try {
            const response = await refreshTokenApi();
            const token = response.accessToken || response.data?.accessToken;
            
            setAccessToken(token);
            setApiToken(token);
            localStorage.setItem('wasLoggedIn', 'true');

            // Restore user from localStorage if exists
            const storedUser = localStorage.getItem('user');
            if (storedUser) {
                setUser(JSON.parse(storedUser));
            }
            return true;
        } catch (error) {
            // Only log if it's NOT a 401
            if (error.response?.status !== 401) {
                console.error("Initial silent refresh failed:", error);
            }
            localStorage.removeItem('user');
            // If it failed with 401, we might want to clear wasLoggedIn 
            // but usually it's better to keep it true if they actually had a cookie 
            // and it just expired. But if no cookie, 401 happens.
            return false;
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        // Initial silent refresh
        performSilentRefresh().then(success => {
            // Even if it failed, we want to ensure loading is false 
            // so the login page can show up.
            setLoading(false);
        });
    }, [performSilentRefresh]);

    const login = (token, userData) => {
        setAccessToken(token);
        setApiToken(token);
        setUser(userData);
        localStorage.setItem('user', JSON.stringify(userData));
        localStorage.setItem('wasLoggedIn', 'true');
        resetActivityTimer();
    };

    return (
        <AuthContext.Provider value={{ 
            user, 
            accessToken, 
            login, 
            logout, 
            loading, 
            sessionExpiring, 
            extendSession: resetActivityTimer 
        }}>
            {loading ? (
                <div className="loading-container">
                    <div className="loader"></div>
                    <p>Authenticating...</p>
                </div>
            ) : (
                <>
                    {children}
                    {sessionExpiring && (
                        <div className="session-warning-modal">
                            <div className="modal-content">
                                <h3>Session Expiring</h3>
                                <p>Your session will expire soon due to inactivity. Would you like to stay logged in?</p>
                                <button onClick={resetActivityTimer}>Stay Logged In</button>
                                <button onClick={logout} className="secondary">Logout</button>
                            </div>
                        </div>
                    )}
                </>
            )}
        </AuthContext.Provider>
    );
};

