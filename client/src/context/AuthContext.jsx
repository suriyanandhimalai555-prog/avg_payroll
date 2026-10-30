import React, { createContext, useState, useContext, useEffect } from 'react';
import axios from 'axios';

axios.defaults.withCredentials = true;

const getCleanToken = () => {
    let token = localStorage.getItem('token') || sessionStorage.getItem('token');
    if (!token || token === 'null' || token === 'undefined') return null;
    return token.replace(/^["']|["']$/g, '').trim();
};

axios.interceptors.request.use(
    (config) => {
        const token = getCleanToken();
        if (token) {
            config.headers = config.headers || {};
            if (!config.headers.Authorization && !config.headers.authorization) {
                config.headers.Authorization = `Bearer ${token}`;
            }
        }
        return config;
    },
    (error) => Promise.reject(error)
);

axios.interceptors.response.use(
    (response) => response,
    (error) => {
        if (error.response && error.response.status === 401) {
            // 401 means the token is invalid, expired, or REVOKED remotely.
            
            // Wipe all session traces
            localStorage.removeItem('token');
            sessionStorage.removeItem('token');
            localStorage.removeItem('avg_user');
            sessionStorage.removeItem('avg_user');
            localStorage.removeItem('user');
            delete axios.defaults.headers.common['Authorization'];

            // Force a hard redirect to the login screen to clear React state
            const currentPath = window.location.pathname;
            if (currentPath !== '/login' && !currentPath.includes('/superadmin-secure-auth') && currentPath !== '/') {
                window.location.href = '/login';
            }
        }
        return Promise.reject(error);
    }
);

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(() => {
        try {
            const storedUser = localStorage.getItem('avg_user') || sessionStorage.getItem('avg_user');
            const token = getCleanToken();
            if (storedUser && token) {
                return JSON.parse(storedUser);
            }
            return null;
        } catch {
            return null;
        }
    });
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const token = getCleanToken();
        const storedUser = localStorage.getItem('avg_user') || sessionStorage.getItem('avg_user');

        if (token && storedUser) {
            try {
                const parsedUser = JSON.parse(storedUser);
                localStorage.setItem('token', token);
                sessionStorage.setItem('token', token);
                localStorage.setItem('avg_user', storedUser);
                sessionStorage.setItem('avg_user', storedUser);
                axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
                setUser(parsedUser);
            } catch {
                localStorage.removeItem('token');
                sessionStorage.removeItem('token');
                localStorage.removeItem('avg_user');
                sessionStorage.removeItem('avg_user');
                delete axios.defaults.headers.common['Authorization'];
                setUser(null);
            }
        } else {
            localStorage.removeItem('token');
            sessionStorage.removeItem('token');
            localStorage.removeItem('avg_user');
            sessionStorage.removeItem('avg_user');
            delete axios.defaults.headers.common['Authorization'];
            setUser(null);
        }
        setLoading(false);
    }, []);

    const login = (userData, tokenData) => {
        const cleanToken = (tokenData || getCleanToken() || '').replace(/^["']|["']$/g, '').trim();
        if (cleanToken) {
            localStorage.setItem('token', cleanToken);
            sessionStorage.setItem('token', cleanToken);
            axios.defaults.headers.common['Authorization'] = `Bearer ${cleanToken}`;
        }
        if (userData) {
            const serialized = JSON.stringify(userData);
            localStorage.setItem('avg_user', serialized);
            sessionStorage.setItem('avg_user', serialized);
            setUser(userData);
        }
    };

    const logout = async () => {
        // Clear UI and storage instantly to prevent race conditions
        localStorage.removeItem('token');
        localStorage.removeItem('avg_user');
        localStorage.removeItem('user');
        sessionStorage.removeItem('token');
        sessionStorage.removeItem('avg_user');
        sessionStorage.clear();
        delete axios.defaults.headers.common['Authorization'];
        setUser(null);

        try {
            // Tell the backend to destroy the session record
            await axios.post(`${import.meta.env.VITE_API_URL}/api/auth/logout`);
        } catch (err) {
            console.error('Logout error', err);
        }
    };

    return (
        <AuthContext.Provider value={{ user, login, logout, loading }}>
            {children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => useContext(AuthContext);