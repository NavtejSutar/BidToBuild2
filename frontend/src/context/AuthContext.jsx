import React, { createContext, useContext, useState, useEffect } from 'react';
import api from '../api/client';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const storedUser = localStorage.getItem('user');
    const token = localStorage.getItem('token');
    if (storedUser && token) {
      try {
        setUser(JSON.parse(storedUser));
      } catch (e) {
        localStorage.removeItem('user');
        localStorage.removeItem('token');
      }
    }
    setLoading(false);
  }, []);

  const login = async (email, password) => {
    const response = await api.post('/auth/login', { email, password });
    const authData = response.data;
    const token = authData.accessToken || authData.token;
    const userObj = authData.user || authData;
    const userData = {
      id: userObj.id,
      email: userObj.email,
      fullName: userObj.name || userObj.fullName,
      role: userObj.role,
      department: userObj.department,
      token,
    };
    localStorage.setItem('token', token);
    localStorage.setItem('user', JSON.stringify(userData));
    setUser(userData);
    return userData;
  };

  const register = async (registerData) => {
    const payload = {
      name: registerData.name || registerData.fullName,
      email: registerData.email,
      password: registerData.password,
      role: registerData.role,
      department: registerData.department,
    };
    const response = await api.post('/auth/register', payload);
    const authData = response.data;
    const token = authData.accessToken || authData.token;
    const userObj = authData.user || authData;
    const userData = {
      id: userObj.id,
      email: userObj.email,
      fullName: userObj.name || userObj.fullName,
      role: userObj.role,
      department: userObj.department,
      token,
    };
    localStorage.setItem('token', token);
    localStorage.setItem('user', JSON.stringify(userData));
    setUser(userData);
    return userData;
  };

  const logout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, register, logout, isAuthenticated: !!user }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
