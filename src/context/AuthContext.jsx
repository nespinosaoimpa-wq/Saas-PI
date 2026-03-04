import React, { createContext, useContext, useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
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
            console.error('Error details:', JSON.stringify(error, null, 2));
        } else {
            console.log('Employees loaded successfully:', data?.length || 0);
            setEmployees(data || []);
        }
        setLoading(false);
    };

    const login = (employeeId, pin) => {
        const emp = employees.find(e => e.id === employeeId);
        if (emp && emp.pin === pin) {
            setUser(emp);
            return true;
        }
        return false;
    };

    const logout = () => {
        setUser(null);
    };

    return (
        <AuthContext.Provider value={{ user, employees, loading, login, logout, refreshEmployees: loadEmployees }}>
            {children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => useContext(AuthContext);
