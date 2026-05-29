import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  LayoutDashboard,
  Users,
  Calendar,
  UserCheck,
  CreditCard,
  BarChart3,
  LogOut,
  Settings,
  ChevronLeft,
  ChevronRight
} from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { UserRole } from '@/types';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';

import logoIcon from '@/asset/favicon.png';
import logoFull from '@/asset/gamalog.png';

interface NavItem {
  id: string;
  label: string;
  icon: React.ElementType;
  path: string;
  roles?: UserRole[];
}

interface SidebarProps {
  isCollapsed?: boolean;
  onToggle?: () => void;
}

const Sidebar: React.FC<SidebarProps> = ({ isCollapsed: externalCollapsed, onToggle }) => {
  const { user, logout, hasRole } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [internalCollapsed, setInternalCollapsed] = useState(() => {
    const saved = localStorage.getItem('sidebar-collapsed');
    return saved ? JSON.parse(saved) : false;
  });

  const isCollapsed = externalCollapsed !== undefined ? externalCollapsed : internalCollapsed;

  useEffect(() => {
    // Update localStorage when external state changes
    if (externalCollapsed !== undefined) {
      localStorage.setItem('sidebar-collapsed', JSON.stringify(externalCollapsed));
    }
  }, [externalCollapsed]);

  const navItems: NavItem[] = [
    { id: 'overview', label: 'Overview', icon: LayoutDashboard, path: '/dashboard' },
    { id: 'members', label: 'Members', icon: Users, path: '/dashboard', roles: [UserRole.STAFF, UserRole.MANAGER, UserRole.ADMIN] },
    { id: 'classes', label: 'Classes', icon: Calendar, path: '/dashboard' },
    { id: 'staff', label: 'Staff', icon: UserCheck, path: '/dashboard', roles: [UserRole.MANAGER, UserRole.ADMIN] },
    { id: 'payments', label: 'Payments', icon: CreditCard, path: '/dashboard', roles: [UserRole.STAFF, UserRole.MANAGER, UserRole.ADMIN] },
    { id: 'analytics', label: 'Analytics', icon: BarChart3, path: '/dashboard', roles: [UserRole.MANAGER, UserRole.ADMIN] },
    { id: 'users', label: 'Users', icon: Users, path: '/users', roles: [UserRole.ADMIN] },
  ];

  const filteredNavItems = navItems.filter(item =>
    !item.roles || item.roles.some(role => hasRole(role))
  );

  const getActiveTab = () => {
    const params = new URLSearchParams(location.search);
    return params.get('tab') || 'overview';
  };

  const handleNavigation = (item: NavItem) => {
    if (item.id === 'users') {
      navigate(item.path);
    } else {
      navigate(`${item.path}?tab=${item.id}`);
    }
  };

  const isActive = (item: NavItem) => {
    if (item.id === 'users') {
      return location.pathname === '/users';
    }

    if (item.id === 'members' && location.pathname.startsWith('/members/')) {
      return true;
    }

    if (location.pathname === '/dashboard') {
      const activeTab = getActiveTab();
      return activeTab === item.id;
    }

    return false;
  };

  return (
    <TooltipProvider>
      <motion.aside
        initial={{ x: -100, opacity: 0 }}
        animate={{ x: 0, opacity: 1 }}
        transition={{ duration: 0.3 }}
        className={cn(
          "fixed left-0 top-0 z-40 h-screen border-r border-[#00bc7d]/10 bg-white/95 backdrop-blur-xl shadow-2xl shadow-[#00bc7d]/5 transition-all duration-300",
          isCollapsed ? "w-20" : "w-64"
        )}
      >
        <div className="flex h-full flex-col">
          {/* Logo */}
          <div
            className={cn(
              "relative flex h-20 items-center transition-all duration-300",
              isCollapsed ? "justify-center px-2" : "gap-3 px-6"
            )}
          >
            {isCollapsed ? (
              <motion.div
                whileHover={{ scale: 1.1, rotate: 5 }}
                className=""
              >
                <img src={logoIcon} alt="GAMA" className="h-20 w-20 object-contain" />
              </motion.div>
            ) : (
              <>
                <AnimatePresence>
                  <motion.div
                    initial={{ opacity: 0, width: 0 }}
                    animate={{ opacity: 1, width: 'auto' }}
                    exit={{ opacity: 0, width: 0 }}
                    transition={{ duration: 0.2 }}
                    className="overflow-hidden flex-1"
                  >
                    <img src={logoFull} alt="GAMA Admin Dashboard" className="h-[100px] object-contain" />
                  </motion.div>
                </AnimatePresence>
              </>
            )}
          </div>

          <nav
            className={cn(
              "flex-1 transition-all duration-300 overflow-y-auto py-6",
              isCollapsed ? "px-3" : "px-4"
            )}
          >
            {isCollapsed ? (
              <div className="flex flex-col items-center gap-3">
                {filteredNavItems.map((item, index) => {
                  const Icon = item.icon;
                  const active = isActive(item);

                  return (
                    <Tooltip key={item.id}>
                      <TooltipTrigger asChild>
                        <motion.button
                          initial={{ opacity: 0, x: -20 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: index * 0.05 }}
                          whileHover={{ scale: 1.1 }}
                          whileTap={{ scale: 0.95 }}
                          onClick={() => handleNavigation(item)}
                          className={cn(
                            "flex h-12 w-12 items-center justify-center rounded-2xl transition-all duration-300",
                            active
                              ? "bg-[#00bc7d] text-white shadow-lg shadow-[#00bc7d]/30"
                              : "text-gray-400 hover:bg-[#00bc7d]/10 hover:text-[#00bc7d]"
                          )}
                        >
                          <Icon className="h-5 w-5" />
                        </motion.button>
                      </TooltipTrigger>
                      <TooltipContent side="right" className="bg-[#00bc7d] text-white border-[#00bc7d]">
                        <p>{item.label}</p>
                      </TooltipContent>
                    </Tooltip>
                  );
                })}
              </div>
            ) : (
              <div className="flex h-full flex-col">
                <div className="space-y-2">
                  {filteredNavItems.map((item, index) => {
                    const Icon = item.icon;
                    const active = isActive(item);

                    return (
                      <motion.button
                        key={item.id}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: index * 0.05 }}
                        whileHover={{ scale: 1.01, x: 4 }}
                        whileTap={{ scale: 0.98 }}
                        onClick={() => handleNavigation(item)}
                        className={cn(
                          "group flex w-full items-center justify-between rounded-xl px-4 py-3 text-sm font-medium transition-all duration-300",
                          active
                            ? "bg-[#00bc7d]/10 text-[#00bc7d] shadow-sm"
                            : "text-gray-500 hover:bg-gray-50 hover:text-gray-900"
                        )}
                      >
                        <div className="flex items-center gap-3">
                          <div
                            className={cn(
                              "flex h-9 w-9 items-center justify-center rounded-lg transition-all duration-300",
                              active
                                ? "bg-[#00bc7d] text-white shadow-md shadow-[#00bc7d]/20"
                                : "bg-gray-100 text-gray-500 group-hover:bg-[#00bc7d]/20 group-hover:text-[#00bc7d]"
                            )}
                          >
                            <Icon className="h-4 w-4" />
                          </div>
                          <span className={cn("transition-colors", active ? "font-semibold" : "")}>
                            {item.label}
                          </span>
                        </div>
                        {active && (
                          <motion.div
                            layoutId="active-indicator"
                            className="h-1.5 w-1.5 rounded-full bg-[#00bc7d]"
                          />
                        )}
                      </motion.button>
                    );
                  })}
                </div>
              </div>
            )}
          </nav>

          <div
            className={cn(
              "border-t border-[#00bc7d]/10 px-4 py-4 flex gap-3 justify-center bg-gray-50/50 backdrop-blur-md",
              isCollapsed && "flex-col items-center px-2"
            )}
          >
            <Button
              variant="ghost"
              size={isCollapsed ? "icon" : "sm"}
              onClick={() => navigate('/settings')}
              className={cn(
                "rounded-xl text-gray-500 hover:bg-[#00bc7d]/10 hover:text-[#00bc7d] transition-all",
                !isCollapsed && "flex-1 justify-start gap-2"
              )}
            >
              <Settings className="h-4 w-4" />
              {!isCollapsed && <span>Settings</span>}
            </Button>
            <Button
              variant="ghost"
              size={isCollapsed ? "icon" : "sm"}
              onClick={logout}
              className={cn(
                "rounded-xl text-red-500 hover:bg-red-50 hover:text-red-600 transition-all",
                !isCollapsed && "flex-1 justify-start gap-2"
              )}
            >
              <LogOut className="h-4 w-4" />
              {!isCollapsed && <span>Logout</span>}
            </Button>
          </div>
        </div>
      </motion.aside>
    </TooltipProvider>
  );
};

export default Sidebar;
