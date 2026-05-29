import React, { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '@/hooks/useAuth';
import { UserRole } from '@/types';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Users,
  Calendar,
  DollarSign,
  Activity,
  TrendingUp,
  Clock,
  CreditCard,
  ArrowUpRight,
  ArrowDownRight,
  Sparkles
} from 'lucide-react';
import Sidebar from '@/components/layout/Sidebar';
import Topbar from '@/components/layout/Topbar';
import MemberManagement from '@/components/members/MemberManagement';
import ClassBooking from '@/components/classes/ClassBooking';
import StaffManagement from '@/components/staff/StaffManagement';
import PaymentSystem from '@/components/payments/PaymentSystem';
import AnalyticsDashboard from '@/components/analytics/AnalyticsDashboard';

// Animated Counter Component
const AnimatedCounter: React.FC<{ value: number; duration?: number }> = ({ value, duration = 1.5 }) => {
  const [displayValue, setDisplayValue] = useState(0);

  useEffect(() => {
    let startTime: number;
    const animate = (currentTime: number) => {
      if (!startTime) startTime = currentTime;
      const progress = Math.min((currentTime - startTime) / (duration * 1000), 1);
      setDisplayValue(Math.floor(value * progress));
      if (progress < 1) {
        requestAnimationFrame(animate);
      }
    };
    requestAnimationFrame(animate);
  }, [value, duration]);

  return <>{displayValue.toLocaleString()}</>;
};

// Glass Card Component
const GlassCard: React.FC<{
  children: React.ReactNode;
  className?: string;
  delay?: number;
}> = ({ children, className = '', delay = 0 }) => (
  <motion.div
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ duration: 0.5, delay }}
    className={`rounded-2xl bg-white/60 backdrop-blur-xl border border-white/20 shadow-lg shadow-black/5 ${className}`}
  >
    {children}
  </motion.div>
);

// Stat Card Component
const StatCard: React.FC<{
  title: string;
  value: number;
  change: number;
  icon: React.ElementType;
  gradient: string;
  delay?: number;
}> = ({ title, value, change, icon: Icon, gradient, delay = 0 }) => {
  const isPositive = change >= 0;

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.4, delay }}
      whileHover={{ scale: 1.02, y: -4 }}
      className="group relative overflow-hidden rounded-2xl bg-gradient-to-br from-white/80 to-white/40 backdrop-blur-xl border border-white/20 shadow-lg shadow-black/5 p-6 transition-all duration-300"
    >
      <div className={`absolute inset-0 bg-gradient-to-br ${gradient} opacity-0 group-hover:opacity-5 transition-opacity duration-300`} />
      <div className="relative">
        <div className="flex items-start justify-between mb-4">
          <div className={`p-3 rounded-xl bg-gradient-to-br ${gradient} shadow-lg`}>
            <Icon className="h-5 w-5 text-white" />
          </div>
          {/* <div className={`flex items-center gap-1 text-xs font-medium ${isPositive ? 'text-blue-600' : 'text-blue-400'}`}>
            {isPositive ? <ArrowUpRight className="h-3 w-3" /> : <ArrowDownRight className="h-3 w-3" />}
            {Math.abs(change)}%
          </div> */}
        </div>
        <h3 className="text-sm font-medium text-muted-foreground mb-2">{title}</h3>
        <p className="text-3xl font-bold bg-gradient-to-r from-gray-900 to-gray-700 bg-clip-text text-transparent">
          <AnimatedCounter value={value} />
        </p>
      </div>
    </motion.div>
  );
};

const Dashboard: React.FC = () => {
  const { user, hasRole } = useAuth();
  const [searchParams] = useSearchParams();
  const urlTab = searchParams.get('tab') || 'overview';
  const activeTab = urlTab === 'trainers' ? 'staff' : urlTab;
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(() => {
    const saved = localStorage.getItem('sidebar-collapsed');
    return saved ? JSON.parse(saved) : false;
  });

  if (!user) return null;

  const QuickStats = () => (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
      <StatCard
        title="Total Members"
        value={1234}
        change={12}
        icon={Users}
        gradient="from-[#00bc7d] to-[#009664]"
        delay={0.1}
      />
      <StatCard
        title="Active Classes"
        value={48}
        change={8}
        icon={Calendar}
        gradient="from-[#00bc7d] to-emerald-500"
        delay={0.2}
      />
      <StatCard
        title="Monthly Revenue"
        value={45231}
        change={15}
        icon={DollarSign}
        gradient="from-emerald-500 to-teal-500"
        delay={0.3}
      />
      <StatCard
        title="Equipment Status"
        value={94}
        change={-2}
        icon={Activity}
        gradient="from-teal-500 to-[#00bc7d]"
        delay={0.4}
      />
    </div>
  );

  const QuickActions = () => {
    const actions = [
      { icon: Users, label: 'Add Member', description: 'Register a new gym member', color: 'bg-[#00bc7d] text-[#fff]' },
      { icon: Calendar, label: 'Schedule Class', description: 'Create a new class session', color: 'bg-[#00bc7d] text-[#fff]' },
      { icon: CreditCard, label: 'Process Payment', description: 'Record a transaction', color: 'bg-[#00bc7d] text-[#fff]' },
      { icon: Activity, label: 'View Reports', description: 'Analyze gym performance', color: 'bg-[#00bc7d] text-[#fff]' },
    ];

    return (
      <GlassCard delay={0.4} className="h-full bg-white border-none shadow-xl shadow-black/5">
        <CardHeader className="pb-2">
          <CardTitle className="text-xl font-bold text-gray-900">Quick Actions</CardTitle>
          <CardDescription className="text-gray-500">Common tasks and shortcuts</CardDescription>
        </CardHeader>
        <CardContent className="mt-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {actions.map((action, index) => {
              const Icon = action.icon;
              return (
                <motion.button
                  key={index}
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: 0.5 + index * 0.1 }}
                  whileHover={{ scale: 1.02, y: -2 }}
                  whileTap={{ scale: 0.95 }}
                  className="flex flex-col items-center justify-center gap-3 rounded-2xl bg-gray-50 border border-gray-100 p-6 shadow-sm hover:shadow-lg hover:shadow-[#00bc7d]/10 hover:border-[#00bc7d]/20 hover:bg-white transition-all duration-300 h-auto min-h-[160px] group"
                >
                  <div className={`p-4 rounded-xl ${action.color} shadow-md shadow-[#00bc7d]/20 group-hover:scale-110 transition-transform duration-300`}>
                    <Icon className="h-6 w-6" />
                  </div>
                  <div className="text-center">
                    <span className="block text-sm font-bold text-gray-900 mb-1 group-hover:text-[#00bc7d] transition-colors">{action.label}</span>
                    <span className="block text-xs text-gray-500 group-hover:text-gray-600 transition-colors">{action.description}</span>
                  </div>
                </motion.button>
              );
            })}
          </div>
        </CardContent>
      </GlassCard>
    );
  };


  const IntroSection = () => (
    <div className="relative overflow-hidden rounded-3xl bg-white p-8 shadow-sm border border-gray-100">
      <div className="relative z-10 flex flex-col md:flex-row justify-between items-start md:items-center gap-8">
        <div className="space-y-1">
          <h1 className="text-3xl md:text-4xl font-bold text-gray-900 tracking-tight">
            Welcome back, <span className="text-[#00bc7d]">{user.firstName}</span>
          </h1>
          <p className="text-base text-gray-500 max-w-xl">
            Here's what's happening at your gym today.
          </p>
        </div>

        <div className="flex flex-col items-end gap-4">
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-[#00bc7d]/5 border border-[#00bc7d]/10">
            <div className="relative flex h-2.5 w-2.5">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#00bc7d] opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-[#00bc7d]"></span>
            </div>
            <span className="text-sm font-medium text-[#00bc7d]">Live</span>
            <span className="mx-1 text-gray-300">|</span>
            <span className="text-sm font-medium text-gray-500 flex items-center gap-1">
              <Clock className="h-3.5 w-3.5" />
              {new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}
            </span>
          </div>

          <div className="flex gap-3">
            <Button variant="outline" className="h-10 rounded-xl border-gray-200 hover:border-[#00bc7d] hover:text-[#00bc7d] hover:bg-[#00bc7d]/5 transition-all">
              <Users className="mr-2 h-4 w-4" />
              Members
            </Button>
            <Button variant="outline" className="h-10 rounded-xl border-gray-200 hover:border-[#00bc7d] hover:text-[#00bc7d] hover:bg-[#00bc7d]/5 transition-all">
              <Calendar className="mr-2 h-4 w-4" />
              Schedule
            </Button>
            <Button className="h-10 rounded-xl bg-[#00bc7d] hover:bg-[#00bc7d]/90 text-white shadow-lg shadow-[#00bc7d]/20 transition-all">
              <DollarSign className="mr-2 h-4 w-4" />
              Revenue
            </Button>
          </div>
        </div>
      </div>
    </div>
  );

  const FeatureHighlights = () => {
    const features = [
      {
        icon: TrendingUp,
        title: 'Growth at a glance',
        description: 'Track member growth, retention, and revenue trends without leaving the dashboard.',
        color: 'from-[#00bc7d] to-[#009664]',
      },
      {
        icon: Calendar,
        title: 'Smart scheduling',
        description: 'See how classes are filling up so you can adjust capacity in real time.',
        color: 'from-[#00bc7d] to-emerald-500',
      },
      {
        icon: Activity,
        title: 'Operations overview',
        description: 'Monitor equipment status and activity to keep your gym running smoothly.',
        color: 'from-emerald-500 to-teal-500',
      },
    ];

    return (
      <GlassCard delay={0.2} className="bg-white/80">
        <CardHeader className="flex flex-col gap-2">
          <CardTitle className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-[#00bc7d]" />
            Key features
          </CardTitle>
          <CardDescription>Everything you need to run your gym, in one view.</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {features.map((feature, index) => {
              const Icon = feature.icon;
              return (
                <motion.div
                  key={feature.title}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.2 + index * 0.1 }}
                  className="relative overflow-hidden rounded-2xl border border-white/40 bg-white/70 backdrop-blur-xl p-4 shadow-sm shadow-black/5 hover:shadow-lg hover:shadow-[#00bc7d]/10 hover:border-[#00bc7d]/20 transition-all duration-300"
                >
                  <div className={`mb-3 inline-flex items-center justify-center rounded-xl bg-gradient-to-br ${feature.color} p-2.5 shadow-md shadow-[#00bc7d]/20`}>
                    <Icon className="h-4 w-4 text-white" />
                  </div>
                  <h3 className="text-sm font-semibold text-gray-900 mb-1">{feature.title}</h3>
                  <p className="text-xs text-muted-foreground leading-relaxed">
                    {feature.description}
                  </p>
                </motion.div>
              );
            })}
          </div>
        </CardContent>
      </GlassCard>
    );
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Sidebar
        isCollapsed={isSidebarCollapsed}
        onToggle={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
      />
      <motion.div
        animate={{
          marginLeft: isSidebarCollapsed ? '5rem' : '16rem' // 80px when collapsed, 256px when expanded
        }}
        transition={{ duration: 0.3, ease: 'easeInOut' }}
        className="transition-all duration-300"
      >
        <Topbar
          isSidebarCollapsed={isSidebarCollapsed}
          onToggleSidebar={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
        />
        <main className="p-8">
          <AnimatePresence mode="wait">
            {activeTab === 'overview' && (
              <motion.div
                key="overview"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ duration: 0.3 }}
                className="space-y-8"
              >
                <IntroSection />

                <FeatureHighlights />

                <QuickStats />

                {/* <div className="mt-8">
                  <QuickActions />
                </div> */}
              </motion.div>
            )}

            {activeTab === 'members' && hasRole(UserRole.STAFF) && (
              <motion.div
                key="members"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ duration: 0.3 }}
              >
                <MemberManagement />
              </motion.div>
            )}

            

            {activeTab === 'classes' && (
              <motion.div
                key="classes"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ duration: 0.3 }}
              >
                <ClassBooking />
              </motion.div>
            )}

            {activeTab === 'staff' && hasRole(UserRole.MANAGER) && (
              <motion.div
                key="staff"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ duration: 0.3 }}
              >
                <StaffManagement />
              </motion.div>
            )}

            {activeTab === 'payments' && hasRole(UserRole.STAFF) && (
              <motion.div
                key="payments"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ duration: 0.3 }}
              >
                <PaymentSystem />
              </motion.div>
            )}

            {activeTab === 'analytics' && hasRole(UserRole.MANAGER) && (
              <motion.div
                key="analytics"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ duration: 0.3 }}
              >
                <AnalyticsDashboard />
              </motion.div>
            )}
          </AnimatePresence>
        </main>
      </motion.div>
    </div>
  );
};

export default Dashboard;
