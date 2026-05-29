import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Search, Bell, User, ChevronDown, X, LogOut, Menu, Settings, Calendar, PanelLeftClose, PanelLeftOpen } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';

interface TopbarProps {
  isSidebarCollapsed?: boolean;
  onToggleSidebar?: () => void;
}

const Topbar: React.FC<TopbarProps> = ({ isSidebarCollapsed, onToggleSidebar }) => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [searchValue, setSearchValue] = useState('');
  const [notifications] = useState(3);
  const formattedDate = new Date().toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
    year: 'numeric'
  });

  return (
    <motion.header
      initial={{ y: -80, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.3 }}
      className="sticky top-0 z-30 flex h-16 md:h-20 items-center gap-4 border-b border-border/40 bg-white/80 backdrop-blur-xl px-4 md:px-6 shadow-sm"
    >
      <div className="flex flex-1 items-center gap-4">
        {onToggleSidebar && (
          <Button
            type="button"
            variant="ghost"
            size="icon"
            onClick={onToggleSidebar}
            className="h-9 w-9 rounded-full border border-border/40 bg-background/60 hover:bg-[#00bc7d] flex items-center justify-center"
          >
            {isSidebarCollapsed ? (
              <PanelLeftOpen className="h-5 w-5" />
            ) : (
              <PanelLeftClose className="h-5 w-5" />
            )}
          </Button>
        )}
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            type="search"
            placeholder="Search members, classes, payments..."
            value={searchValue}
            onChange={(e) => setSearchValue(e.target.value)}
            className="h-10 md:h-11 w-full rounded-full border border-border/40 bg-background/60 pl-10 pr-4 pr-8 text-sm focus:bg-background focus:ring-2 focus:ring-[#00bc7d]/40 transition-all"
          />
          {searchValue && (
            <motion.button
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              onClick={() => setSearchValue('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 rounded-full p-1.5 bg-background/70 hover:bg-accent transition-colors"
            >
              <X className="h-3 w-3 text-muted-foreground" />
            </motion.button>
          )}
        </div>
      </div>

      <div className="flex items-center gap-2 md:gap-4">
        <div className="hidden lg:flex items-center gap-2 rounded-full border border-border/40 bg-background/60 px-3 py-2 text-xs font-medium text-muted-foreground">
          <Calendar className="h-4 w-4 text-muted-foreground" />
          <span>{formattedDate}</span>
        </div>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              className="relative h-10 w-10 rounded-full hover:bg-[#00bc7d]/40"
            >
              <Bell className="h-5 w-5 text-muted-foreground" />
              {notifications > 0 && (
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  className="absolute -right-0.5 -top-0.5 h-5 w-5 rounded-full bg-[#00bc7d] flex items-center justify-center shadow-md shadow-[#00bc7d]/40 ring-2 ring-white"
                >
                  <span className="text-[10px] font-bold text-white">{notifications}</span>
                </motion.div>
              )}
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-80">
            <DropdownMenuLabel>Notifications</DropdownMenuLabel>
            <DropdownMenuSeparator />
            <div className="p-4 text-center text-sm text-muted-foreground">
              No new notifications
            </div>
          </DropdownMenuContent>
        </DropdownMenu>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="ghost"
              className="flex items-center gap-3 h-auto py-1.5 pl-1.5 pr-3 rounded-full hover:bg-[#00bc7d]/40 transition-colors"
            >
              <Avatar className="h-9 w-9 border-2 border-white shadow-sm">
                <AvatarFallback className="bg-[#00bc7d] text-white text-sm font-bold">
                  {user?.firstName?.[0]}
                  {user?.lastName?.[0]}
                </AvatarFallback>
              </Avatar>
              <div className="hidden md:flex flex-col items-start gap-0.5">
                <p className="text-sm font-bold leading-none text-foreground">
                  {user?.firstName} {user?.lastName}
                </p>
                <p className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider">
                  {user?.role}
                </p>
              </div>
              <ChevronDown className="h-4 w-4 text-muted-foreground/70 hidden md:block ml-1" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56">
            <DropdownMenuLabel className="text-[#000] font-bold">My Account</DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={() => navigate('/profile')} className="focus:text-[#00bc7d] focus:bg-[#00bc7d]/10 cursor-pointer">
              <User className="mr-2 h-4 w-4 text-[#00bc7d]" />
              <span>Profile</span>
            </DropdownMenuItem>
            <DropdownMenuItem className="focus:text-[#00bc7d] focus:bg-[#00bc7d]/10 cursor-pointer">
              <Settings className="mr-2 h-4 w-4 text-[#00bc7d]" />
              <span>Settings</span>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </motion.header>
  );
};

export default Topbar;
