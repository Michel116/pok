
"use client";

import type { ReactNode } from 'react';
import { createContext, useContext, useState, useMemo, useCallback, useEffect } from 'react';
import type { User, UserRole, NotificationSettings } from '@/lib/types';
import { useToast } from '@/components/ui/use-toast';


interface UserContextType {
  user: User | null;
  users: User[];
  isAuthenticated: boolean;
  login: (name: string, pass: string) => Promise<boolean>;
  logout: () => void;
  setUserRole: (role: UserRole) => void;
  roles: UserRole[];
  notificationSettings: NotificationSettings;
  setNotificationSettings: React.Dispatch<React.SetStateAction<NotificationSettings>>;
  addUser: (name: string, pass: string, role: UserRole) => Promise<boolean>;
  deleteUser: (userId: string) => Promise<boolean>;
  fetchUsers: () => void;
}

const UserContext = createContext<UserContextType | undefined>(undefined);

export function UserProvider({ children }: { children: ReactNode }) {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [users, setUsers] = useState<User[]>([]);
  const { toast } = useToast();

  const [notificationSettings, setNotificationSettings] = useState<NotificationSettings>({
    shippingUnverified: true,
    shippingExpired: true,
    verificationNeeded: true,
    verificationPending: true,
  });

  const isAuthenticated = !!currentUser;
  
  const fetchUsers = useCallback(async () => {
    try {
        const response = await fetch('/api/users');
        if (!response.ok) throw new Error('Failed to fetch users');
        const data = await response.json();
        setUsers(data);
    } catch (error) {
        console.error("Failed to fetch users:", error);
    }
  }, []);
  
  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);
  
  const roles = useMemo(() => {
    const roleSet = new Set(users.map(u => u.role));
    return Array.from(roleSet) as UserRole[];
  }, [users]);


  const login = useCallback(async (name: string, pass: string): Promise<boolean> => {
    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: name, password: pass }),
      });
      const data = await response.json();
      if (response.ok) {
        setCurrentUser(data.user);
        return true;
      } else {
        return false;
      }
    } catch (error) {
        console.error("Login failed:", error);
        return false;
    }
  }, []);

  const logout = useCallback(() => {
    setCurrentUser(null);
  }, []);

  const setUserRole = (role: UserRole) => {
    if (!isAuthenticated) return;
    const selectedUser = users.find(u => u.role === role);
    if (selectedUser) {
      setCurrentUser(selectedUser);
    }
  };
  
  const addUser = async (name: string, pass: string, role: UserRole): Promise<boolean> => {
    try {
        const response = await fetch('/api/users', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ name, password: pass, role })
        });
        if (response.ok) {
            fetchUsers(); // Refresh user list
            return true;
        }
        return false;
    } catch (error) {
        console.error("Failed to add user:", error);
        return false;
    }
  };
  
  const deleteUser = async (userId: string): Promise<boolean> => {
    try {
        const response = await fetch(`/api/users/${userId}`, {
            method: 'DELETE',
        });
        if (response.ok) {
            fetchUsers(); // Refresh user list
            return true;
        }
        return false;
    } catch (error) {
        console.error("Failed to delete user:", error);
        return false;
    }
  };


  const value = useMemo(() => ({
    user: currentUser,
    users,
    isAuthenticated,
    login,
    logout,
    setUserRole,
    roles,
    notificationSettings,
    setNotificationSettings,
    addUser,
    deleteUser,
    fetchUsers,
  }), [currentUser, users, isAuthenticated, login, logout, roles, notificationSettings, fetchUsers]);

  return (
    <UserContext.Provider value={value}>
      {children}
    </UserContext.Provider>
  );
}

export function useUser() {
  const context = useContext(UserContext);
  if (context === undefined) {
    throw new Error('useUser must be used within a UserProvider');
  }
  return context;
}
