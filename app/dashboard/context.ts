"use client";

import { createContext, useContext } from 'react';
import { User } from '../lib/db';

export interface DashboardContextProps {
  currentUser: User | null;
  onUpdateProfile: (updatedUser: User) => void;
  onLogout: () => void;
}

export const DashboardContext = createContext<DashboardContextProps | undefined>(undefined);

export function useDashboard() {
  const context = useContext(DashboardContext);
  if (!context) {
    throw new Error('useDashboard must be used within a DashboardProvider');
  }
  return context;
}
