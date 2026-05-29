import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { User, UserRole } from '@/types';
import { AuthService, mockUsers } from '@/lib/auth';
import api from '@/lib/api';
import { supabase } from '@/lib/supabase';
import { verifyPassword } from '@/lib/auth-utils';

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
  hasRole: (role: UserRole) => boolean;
  hasPermission: (permission: string) => boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const initializeAuth = async () => {
      try {
        const token = AuthService.getToken();
        const savedUser = AuthService.getUser();

        // If we have both token and user, restore the session
        if (token && savedUser) {
          // Check if token is a simple string token (our format) or JWT
          const isSimpleToken = !token.includes('.') || token.startsWith('supabase-jwt-token-');
          
          if (isSimpleToken) {
            // For simple tokens, just restore the user (no expiration check)
            setUser(savedUser);
          } else {
            // For JWT tokens, check expiration
            if (!AuthService.isTokenExpired(token)) {
              setUser(savedUser);
            } else {
              // Try to refresh token
              try {
                const response = await api.refreshToken();
                if (response.success && response.data) {
                  AuthService.setToken(response.data.token);
                  setUser(savedUser);
                } else {
                  AuthService.logout();
                }
              } catch (error) {
                AuthService.logout();
              }
            }
          }
        }
      } catch (error) {
        console.error('Auth initialization error:', error);
        // Don't clear auth on error, just log it
      } finally {
        setIsLoading(false);
      }
    };

    initializeAuth();
  }, []);

  const login = async (emailOrPhone: string, password: string): Promise<void> => {
    setIsLoading(true);
    try {
      if (!emailOrPhone || !password) {
        throw new Error('Email/phone and password are required');
      }

      // Check if input is email or phone
      const isEmail = emailOrPhone.includes('@');
      
      // Query user from Supabase
      let query = supabase.from('users').select('*');
      
      if (isEmail) {
        query = query.eq('email', emailOrPhone.toLowerCase().trim());
      } else {
        query = query.eq('phone_number', emailOrPhone.trim());
      }
      
      const { data, error } = await query.single();
      
      if (error) {
        console.error('Supabase query error:', error);
        console.error('Error details:', {
          code: error.code,
          message: error.message,
          details: error.details,
          hint: error.hint
        });
        
        // If user not found, return generic error for security
        if (error.code === 'PGRST116' || error.message?.includes('No rows')) {
          throw new Error('Invalid email/phone or password');
        }
        
        // Handle RLS policy errors
        if (error.code === '42501' || error.message?.includes('permission denied')) {
          throw new Error('Access denied. Please contact administrator.');
        }
        
        throw new Error(error.message || 'Login failed. Please try again.');
      }
      
      if (!data) {
        throw new Error('Invalid email/phone or password');
      }
      
      // Check if user is active
      if (!data.is_active) {
        throw new Error('Account is deactivated. Please contact administrator.');
      }
      
      // Verify password
      const isValidPassword = await verifyPassword(password, data.password_hash);
      
      if (!isValidPassword) {
        throw new Error('Invalid email/phone or password');
      }
      
      // Map database user to User interface
      const user: User = {
        id: data.id,
        email: data.email,
        firstName: data.first_name,
        lastName: data.last_name,
        phone: data.phone_number || undefined,
        role: data.role.toUpperCase() as UserRole,
        createdAt: new Date(data.created_at),
        updatedAt: new Date(data.updated_at)
      };
      
      // Store user in localStorage
      const mockToken = 'supabase-jwt-token-' + Date.now();
      AuthService.setToken(mockToken);
      AuthService.setUser(user);
      setUser(user);
    } catch (error) {
      console.error('Login error:', error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const logout = () => {
    AuthService.removeToken();
    setUser(null);
  };

  const hasRole = (role: UserRole): boolean => {
    return AuthService.hasRole(role);
  };

  const hasPermission = (permission: string): boolean => {
    return AuthService.hasPermission(permission);
  };

  const value: AuthContextType = {
    user,
    isLoading,
    isAuthenticated: !!user,
    login,
    logout,
    hasRole,
    hasPermission,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export default AuthContext;