import { createContext } from "react";

export interface User {
  id: string;
  name: string;
  email: string;
  role: string;
  onboardingCompleted: boolean;
  token: string;
  bio?: string;
  avatar?: string;
  organizationName?: string;
  eventTypes?: string[];
  socialLinks?: {
    twitter?: string;
    linkedin?: string;
    facebook?: string;
    instagram?: string;
    website?: string;
  };
  createdAt?: string;
}

export interface AuthContextType {
  user: User | null;
  login: (userData: User) => void;
  logout: () => void;
}

export const AuthContext = createContext<AuthContextType | undefined>(undefined);