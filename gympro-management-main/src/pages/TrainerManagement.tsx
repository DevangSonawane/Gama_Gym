import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { UserRole } from '@/types';
import Sidebar from '@/components/layout/Sidebar';
import Topbar from '@/components/layout/Topbar';
import TrainerManagementComponent from '@/components/trainers/TrainerManagement';

const TrainerManagement: React.FC = () => {
  const navigate = useNavigate();
  const { hasRole } = useAuth();
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(() => {
    const saved = localStorage.getItem('sidebar-collapsed');
    return saved ? JSON.parse(saved) : false;
  });

  const isAdminOrManager = hasRole(UserRole.ADMIN) || hasRole(UserRole.MANAGER);

  return (
    <div className="min-h-screen bg-gray-50/50">
      <Sidebar
        isCollapsed={isSidebarCollapsed}
        onToggle={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
      />
      <motion.div
        animate={{
          marginLeft: isSidebarCollapsed ? '5rem' : '16rem'
        }}
        transition={{ duration: 0.3, ease: 'easeInOut' }}
        className="transition-all duration-300"
      >
        <Topbar
          isSidebarCollapsed={isSidebarCollapsed}
          onToggleSidebar={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
        />
        <main className="p-8">
          {!isAdminOrManager ? (
            <div className="min-h-[60vh] flex items-center justify-center">
              <div className="bg-white p-8 rounded-2xl shadow-lg border border-gray-100">
                <p className="text-center text-muted-foreground text-lg">Access denied. Admin or Manager only.</p>
              </div>
            </div>
          ) : (
            <TrainerManagementComponent />
          )}
        </main>
      </motion.div>
    </div>
  );
};

export default TrainerManagement;
