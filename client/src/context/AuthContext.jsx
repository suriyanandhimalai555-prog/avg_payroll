import React, { createContext, useState, useContext, useEffect } from 'react';
import axios from 'axios';

// ============================================================
// GLOBAL SECURITY POLICY
// Forces every Axios request in the entire app to automatically 
// attach the invisible HttpOnly cookie to the backend.
// ============================================================
axios.defaults.withCredentials = true;

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        // 1. Force wipe any old insecure tokens from local/session storage left over from previous builds
        localStorage.removeItem('token');
        sessionStorage.removeItem('token');

        // 2. Read ONLY harmless user metadata (Name, Role, ID) for UI persistence across reloads.
        // The actual authentication is handled invisibly by the HttpOnly Cookie.
        const storedUser = sessionStorage.getItem('avg_user');

        if (storedUser) {
            setUser(JSON.parse(storedUser));
        }
        setLoading(false);
    }, []);

    const login = (userData) => {
        // Save ONLY harmless UI metadata to Session Storage
        sessionStorage.setItem('avg_user', JSON.stringify(userData));
        setUser(userData);
    };

    const logout = async () => {
        try {
            // Securely instruct the backend to destroy the HttpOnly cookie
            await axios.post(`${import.meta.env.VITE_API_URL}/api/auth/logout`);
        } catch (err) {
            console.error('Logout error', err);
        } finally {
            // Wipe UI state
            sessionStorage.removeItem('avg_user');
            sessionStorage.clear();
            setUser(null);
        }
    };

    return (
        <AuthContext.Provider value={{ user, login, logout, loading }}>
            {children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => useContext(AuthContext);