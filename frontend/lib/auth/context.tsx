"use client";

import React, { createContext, useContext, useState, useEffect } from "react";
import { getOdooClient } from "@/lib/odoo/client";
import type { User } from "@/lib/odoo/types";

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  login: (username: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  error: string | null;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Check if user is already logged in (from localStorage or cookie)
    checkAuth();
  }, []);

  const checkAuth = async () => {
    try {
      const savedUser = localStorage.getItem("user");
      if (savedUser) {
        setUser(JSON.parse(savedUser));
      }
    } catch (error) {
      console.error("Error checking auth:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const login = async (username: string, password: string) => {
    try {
      setIsLoading(true);
      setError(null);

      const odoo = getOdooClient();
      const authResponse = await odoo.authenticate(username, password);

      // Get user details
      const userDetails = await odoo.read("res.users", [authResponse.uid], [
        "id",
        "login",
        "name",
        "email",
        "company_id",
        "partner_id",
      ]);

      if (userDetails.length === 0) {
        throw new Error("User not found");
      }

      const userData: User = {
        id: userDetails[0].id,
        login: userDetails[0].login,
        name: userDetails[0].name,
        email: userDetails[0].email,
        company_id: userDetails[0].company_id,
        partner_id: userDetails[0].partner_id,
      };

      setUser(userData);

      // Save to localStorage (in production, use httpOnly cookies)
      localStorage.setItem("user", JSON.stringify(userData));
      localStorage.setItem("auth", JSON.stringify({ username, password }));
    } catch (err: any) {
      const errorMessage = err.message || "Login failed";
      setError(errorMessage);
      throw new Error(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  const logout = async () => {
    try {
      setIsLoading(true);

      // Clear user data
      setUser(null);
      localStorage.removeItem("user");
      localStorage.removeItem("auth");

      // Redirect to home
      window.location.href = "/";
    } catch (err) {
      console.error("Logout error:", err);
    } finally {
      setIsLoading(false);
    }
  };

  const value: AuthContextType = {
    user,
    isLoading,
    isAuthenticated: !!user,
    login,
    logout,
    error,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
