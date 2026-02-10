import { useState, useMemo, } from "react";
import type { ReactNode } from "react";
import { AuthContext } from "./AuthContext";
import type {User} from "./AuthContext";

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  // Initialize state from localStorage immediately
  const [user, setUser] = useState<User | null>(() => {
    const savedUser = localStorage.getItem("user");
    try {
      return savedUser ? JSON.parse(savedUser) : null;
    } catch {
      return null;
    }
  });

  const login = (userData: User) => {
    // Store user data and token in localStorage
    localStorage.setItem("user", JSON.stringify(userData));
    localStorage.setItem("token", userData.token);
    setUser(userData);
  };

  const logout = () => {
    // Clear both user and token from localStorage
    localStorage.removeItem("user");
    localStorage.removeItem("token");
    setUser(null);
  };

  // Provide the state values to the context
  const value = useMemo(() => ({ 
    user, 
    login, 
    logout 
  }), [user]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};