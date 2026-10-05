import React, { createContext, useState, useContext, useEffect } from 'react';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        // 1. Force wipe any old insecure local storage data left over from previous versions
        localStorage.removeItem('token');
        localStorage.removeItem('avg_user');

        // 2. Read strictly from temporary Session Storage (Cache)
        const token = sessionStorage.getItem('token');
        const storedUser = sessionStorage.getItem('avg_user');

        if (token && storedUser) {
            setUser(JSON.parse(storedUser));
        }
        setLoading(false);
    }, []);

    const login = (userData, token) => {
        // Save to Session Storage (clears when tab closes)
        sessionStorage.setItem('token', token);
        sessionStorage.setItem('avg_user', JSON.stringify(userData));
        setUser(userData);
    };

    const logout = () => {
        // Clear all session cache
        sessionStorage.removeItem('token');
        sessionStorage.removeItem('avg_user');
        sessionStorage.clear();
        setUser(null);
    };

    return (
        <AuthContext.Provider value={{ user, login, logout, loading }}>
            {children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => useContext(AuthContext);