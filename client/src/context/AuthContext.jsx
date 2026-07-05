import React, { createContext, useState, useContext, useEffect } from 'react';

const AuthContext = createContext();

export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  
  useEffect(() => {
    // Check local storage on load
    const storedUser = localStorage.getItem('ielts_user');
    if (storedUser) {
      setUser(JSON.parse(storedUser));
    }
  }, []);
  
  const login = (userData) => {
    setUser(userData);
    localStorage.setItem('ielts_user', JSON.stringify(userData));
  };
  
  const logout = () => {
    setUser(null);
    localStorage.removeItem('ielts_user');
  };
  
  return (
    <AuthContext.Provider value={{ user, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
};
