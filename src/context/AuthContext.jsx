import React, { createContext, useContext, useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(() => {
        try {
            const saved = localStorage.getItem('piripi_session');
            return saved ? JSON.parse(saved) : null;
        } catch {
            return null;
        }
    });
    const [employees, setEmployees] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        loadEmployees();
    }, []);

    const loadEmployees = async () => {
        setLoading(true);
        if (!supabase) {
            console.error("Supabase client not initialized.");
            setLoading(false);
            return;
        }
        const { data, error } = await supabase.from('employees').select('*').eq('is_active', true);
        if (error) {
            console.error('Error loading employees:', error);
        } else {
            setEmployees(data || []);
            // Update session user to latest DB data if they are logged in remotely
            if (user) {
                const updatedUser = (data || []).find(e => e.id === user.id);
                if (updatedUser) {
                    // Update role/name but keep session active. Don't check PIN.
                    const newSession = { ...updatedUser };
                    setUser(newSession);
                    localStorage.setItem('piripi_session', JSON.stringify(newSession));
                } else {
                    // User no longer active in DB
                    logout();
                }
            }
        }
        setLoading(false);
    };

    const login = (employeeId, pin) => {
        const emp = employees.find(e => e.id === employeeId);
        if (emp && emp.pin === pin) {
            setUser(emp);
            localStorage.setItem('piripi_session', JSON.stringify(emp));
            return true;
        }
        return false;
    };

    const logout = () => {
        setUser(null);
        localStorage.removeItem('piripi_session');
    };

    return (
        <AuthContext.Provider value={{ user, employees, loading, login, logout, refreshEmployees: loadEmployees }}>
            {children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => useContext(AuthContext);
