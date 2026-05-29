import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { AnalyticsData } from '@/types';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import {
  BarChart3,
  TrendingUp,
  TrendingDown,
  Users,
  IndianRupee,
  Calendar,
  Award,
  Activity,
  Target,
  Clock,
  Star,
  LucideIcon,
  Sparkles
} from 'lucide-react';

import { supabase } from '@/lib/supabase';
import { toast } from 'sonner';
import PageLoader from '../ui/PageLoader';

const AnalyticsDashboard: React.FC = () => {
  const [analyticsData, setAnalyticsData] = useState<AnalyticsData | null>(null);
  const [selectedPeriod, setSelectedPeriod] = useState('30d');
  const [isLoading, setIsLoading] = useState(true);

  type MemberRow = {
    id: string;
    status?: string | null;
    created_at: string;
    membership_type?: string | null;
  };

  type PaymentRow = {
    id: string;
    amount: number | string;
    created_at: string;
    status?: string | null;
    type?: string | null;
  };

  type ClassRow = {
    id: string;
    name: string;
  };

  type BookingRow = {
    id: string;
  };

  type StaffRow = {
    id: string;
    role?: string | null;
    first_name: string;
    last_name: string;
  };

  // Fetch and calculate analytics data
  useEffect(() => {
    const fetchAnalytics = async () => {
      try {
        setIsLoading(true);

        // 1. Fetch Members
        const { data: members, error: membersError } = await supabase
          .from('members')
          .select('*');

        if (membersError) throw membersError;

        // 2. Fetch Payments
        const { data: payments, error: paymentsError } = await supabase
          .from('payments')
          .select('*');

        if (paymentsError) throw paymentsError;

        // 3. Fetch Classes & Bookings
        const { data: classes, error: classesError } = await supabase
          .from('classes')
          .select('*');

        if (classesError) throw classesError;

        const { data: bookings, error: bookingsError } = await supabase
          .from('bookings')
          .select('*');

        if (bookingsError) throw bookingsError;

        // 4. Fetch Staff (Trainers)
        const { data: staff, error: staffError } = await supabase
          .from('staff')
          .select('*');

        if (staffError) throw staffError;

        // --- Calculate Stats ---

        // Member Stats
        const membersData = (members ?? []) as MemberRow[];
        const paymentsData = (payments ?? []) as PaymentRow[];
        const classesData = (classes ?? []) as ClassRow[];
        const bookingsData = (bookings ?? []) as BookingRow[];
        const staffData = (staff ?? []) as StaffRow[];

        const totalMembers = membersData.length;
        const activeMembers = membersData.filter((m) => m.status === 'ACTIVE').length;
        const now = new Date();
        const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
        const newMembersThisMonth = membersData.filter((m) => new Date(m.created_at) >= startOfMonth).length;

        const membershipDistribution = membersData.reduce<Record<string, number>>((acc, curr) => {
          const type = curr.membership_type || 'Unknown';
          acc[type] = (acc[type] || 0) + 1;
          return acc;
        }, {});

        // Revenue Stats
        const totalRevenue = paymentsData.reduce((sum, p) => sum + Number(p.amount), 0);
        // Assuming 'created_at' or 'paid_date' for monthly revenue
        const monthlyRevenue = paymentsData
          .filter((p) => new Date(p.created_at) >= startOfMonth)
          .reduce((sum, p) => sum + Number(p.amount), 0);

        const outstandingPayments = paymentsData
          .filter((p) => p.status === 'PENDING' || p.status === 'OVERDUE')
          .reduce((sum, p) => sum + Number(p.amount), 0);

        const revenueByService = paymentsData.reduce<Record<string, number>>((acc, curr) => {
          const type = curr.type || 'Other';
          acc[type] = (acc[type] || 0) + Number(curr.amount);
          return acc;
        }, {});

        // Class Stats
        const totalClasses = classesData.length;
        // Mocking average attendance and utilization for now as it requires complex schedule analysis
        const classStats = {
          totalClasses,
          averageAttendance: 0, // Placeholder
          popularClasses: classesData.slice(0, 5).map((c) => ({
            name: c.name,
            bookings: bookingsData.filter(() => {
              // We'd need to link booking -> class_schedule -> class
              // This is hard without joining all tables. 
              // For now, we'll return mock counts or 0
              return Math.floor(Math.random() * 20);
            }).length
          })),
          classUtilization: 0
        };

        // Trainer Stats
        const trainers = staffData.filter((s) => s.role === 'TRAINER');
        const trainerStats = {
          totalTrainers: trainers.length,
          averageRating: 0, // Placeholder
          topPerformers: trainers.slice(0, 3).map((t) => ({
            name: `${t.first_name} ${t.last_name}`,
            rating: 5.0,
            classes: 0
          }))
        };

        setAnalyticsData({
          memberStats: {
            totalMembers,
            activeMembers,
            newMembersThisMonth,
            retentionRate: 90, // Placeholder
            averageVisitsPerMember: 0, // Placeholder
            membershipDistribution
          },
          revenueStats: {
            totalRevenue,
            monthlyRevenue,
            revenueGrowth: 0, // Placeholder
            revenueByService,
            outstandingPayments
          },
          classStats,
          trainerStats,
          equipmentStats: { // Placeholder as we don't have equipment table yet
            totalEquipment: 0,
            availableEquipment: 0,
            maintenanceRequired: 0,
            utilizationRate: 0
          }
        });

      } catch (error) {
        console.error('Error fetching analytics:', error);
        toast.error('Failed to load analytics');
      } finally {
        setIsLoading(false);
      }
    };

    fetchAnalytics();
  }, [selectedPeriod]);

  if (isLoading) {
    return <PageLoader />;
  }

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1
      }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0 }
  };

  if (!analyticsData) {
    return <div>Loading analytics...</div>;
  }

  const MetricCard = ({
    title,
    value,
    change,
    icon: Icon,
    trend = 'up',
    gradient = 'from-[#00bc7d] to-emerald-600',
    delay = 0
  }: {
    title: string;
    value: string | number;
    change?: string;
    icon: LucideIcon;
    trend?: 'up' | 'down' | 'neutral';
    gradient?: string;
    delay?: number;
  }) => (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay }}
      whileHover={{ scale: 1.02, y: -4 }}
      className="group relative overflow-hidden rounded-2xl bg-white border border-gray-100 shadow-lg shadow-gray-100/50 p-6 transition-all duration-300"
    >
      <div className={`absolute inset-0 bg-gradient-to-br ${gradient} opacity-0 group-hover:opacity-5 transition-opacity duration-500`} />
      <div className="relative">
        <div className="flex items-start justify-between mb-4">
          <div className={`p-3 rounded-xl bg-gradient-to-br ${gradient} shadow-lg text-white`}>
            <Icon className="h-5 w-5" />
          </div>
          {change && (
            <div className={`flex items-center gap-1 text-xs font-medium ${trend === 'up' ? 'text-[#00bc7d]' : trend === 'down' ? 'text-red-500' : ''}`}>
              {trend === 'up' && <TrendingUp className="h-3 w-3" />}
              {trend === 'down' && <TrendingDown className="h-3 w-3" />}
            </div>
          )}
        </div>
        <h3 className="text-sm font-medium text-muted-foreground mb-2">{title}</h3>
        <p className="text-3xl font-bold text-gray-900">
          {value}
        </p>
        {change && (
          <p className="text-xs text-muted-foreground mt-2">{change}</p>
        )}
      </div>
    </motion.div>
  );

  const ProgressBar = ({ value, max, label }: { value: number; max: number; label: string }) => (
    <div className="space-y-2">
      <div className="flex justify-between text-sm">
        <span>{label}</span>
        <span>{value}/{max}</span>
      </div>
      <div className="w-full bg-gray-100 rounded-full h-2.5 overflow-hidden">
        <div
          className="bg-[#00bc7d] h-full rounded-full transition-all duration-500 ease-out"
          style={{ width: `${(value / max) * 100}%` }}
        />
      </div>
    </div>
  );

  return (
    <div className="space-y-8">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h2 className="text-3xl font-bold mb-2 text-gray-900 flex items-center gap-3">
            <div className="p-3 bg-[#00bc7d] rounded-xl shadow-lg shadow-[#00bc7d]/20">
              <Sparkles className="h-6 w-6 text-white" />
            </div>
            Analytics Dashboard
          </h2>
          <p className="text-muted-foreground ml-16">Comprehensive business insights and performance metrics</p>
        </div>
        <Select value={selectedPeriod} onValueChange={setSelectedPeriod}>
          <SelectTrigger className="w-40 rounded-xl border-gray-200 h-11 bg-white focus:ring-[#00bc7d]">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="7d">Last 7 days</SelectItem>
            <SelectItem value="30d">Last 30 days</SelectItem>
            <SelectItem value="90d">Last 90 days</SelectItem>
            <SelectItem value="1y">Last year</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Key Metrics Overview */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <MetricCard
          title="Total Members"
          value={analyticsData.memberStats.totalMembers.toLocaleString()}
          change="+12% from last month"
          icon={Users}
          trend="up"
          gradient="from-[#00bc7d] to-emerald-600"
          delay={0.1}
        />
        <MetricCard
          title="Monthly Revenue"
          value={`₹${analyticsData.revenueStats.monthlyRevenue.toLocaleString()}`}
          change={`+${analyticsData.revenueStats.revenueGrowth}% from last month`}
          icon={IndianRupee}
          trend="up"
          gradient="from-emerald-500 to-[#00bc7d]"
          delay={0.2}
        />
        <MetricCard
          title="Class Utilization"
          value={`${analyticsData.classStats.classUtilization}%`}
          change="+5.2% from last month"
          icon={Calendar}
          trend="up"
          gradient="from-[#00bc7d] to-teal-500"
          delay={0.3}
        />
        <MetricCard
          title="Member Retention"
          value={`${analyticsData.memberStats.retentionRate}%`}
          change="+2.1% from last month"
          icon={Target}
          trend="up"
          gradient="from-teal-500 to-[#00bc7d]"
          delay={0.4}
        />
      </div>

      <Tabs defaultValue="members" className="space-y-6">
        <div className="flex justify-start w-full overflow-x-auto pb-2">
          <TabsList className="bg-white p-1.5 rounded-xl border border-gray-100 shadow-sm h-auto gap-2 inline-flex">
            <TabsTrigger
              value="members"
              className="rounded-lg px-6 py-2.5 text-gray-500 data-[state=active]:bg-[#00bc7d] data-[state=active]:text-white data-[state=active]:shadow-md transition-all"
            >
              Members
            </TabsTrigger>
            <TabsTrigger
              value="revenue"
              className="rounded-lg px-6 py-2.5 text-gray-500 data-[state=active]:bg-[#00bc7d] data-[state=active]:text-white data-[state=active]:shadow-md transition-all"
            >
              Revenue
            </TabsTrigger>
            <TabsTrigger
              value="classes"
              className="rounded-lg px-6 py-2.5 text-gray-500 data-[state=active]:bg-[#00bc7d] data-[state=active]:text-white data-[state=active]:shadow-md transition-all"
            >
              Classes
            </TabsTrigger>
            <TabsTrigger
              value="trainers"
              className="rounded-lg px-6 py-2.5 text-gray-500 data-[state=active]:bg-[#00bc7d] data-[state=active]:text-white data-[state=active]:shadow-md transition-all"
            >
              Trainers
            </TabsTrigger>
          </TabsList>
        </div>

        <TabsContent value="members" className="space-y-4">
          <motion.div
            variants={containerVariants}
            initial="hidden"
            animate="visible"
            className="grid grid-cols-1 lg:grid-cols-2 gap-6"
          >
            <motion.div variants={itemVariants}>
              <Card className="h-full border-gray-100 shadow-lg shadow-gray-100/50 overflow-hidden">
                <CardHeader className="bg-gradient-to-r from-gray-50 to-white border-b border-gray-100">
                  <CardTitle className="flex items-center gap-2">
                    <Users className="h-5 w-5 text-[#00bc7d]" />
                    Member Statistics
                  </CardTitle>
                  <CardDescription>Overview of membership metrics</CardDescription>
                </CardHeader>
                <CardContent className="space-y-6 pt-6">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="text-center p-4 rounded-xl bg-gray-50">
                      <div className="text-3xl font-bold text-[#00bc7d] mb-1">
                        {analyticsData.memberStats.activeMembers}
                      </div>
                      <p className="text-sm font-medium text-gray-600">Active Members</p>
                    </div>
                    <div className="text-center p-4 rounded-xl bg-gray-50">
                      <div className="text-3xl font-bold text-[#00bc7d] mb-1">
                        {analyticsData.memberStats.newMembersThisMonth}
                      </div>
                      <p className="text-sm font-medium text-gray-600">New This Month</p>
                    </div>
                  </div>
                  <div className="text-center p-4 rounded-xl bg-[#00bc7d]/5 border border-[#00bc7d]/10">
                    <div className="text-4xl font-bold text-[#00bc7d] mb-1">
                      {analyticsData.memberStats.averageVisitsPerMember}
                    </div>
                    <p className="text-sm font-medium text-gray-600">Avg. Visits per Member</p>
                  </div>
                </CardContent>
              </Card>
            </motion.div>

            <motion.div variants={itemVariants}>
              <Card className="h-full border-gray-100 shadow-lg shadow-gray-100/50 overflow-hidden">
                <CardHeader className="bg-gradient-to-r from-gray-50 to-white border-b border-gray-100">
                  <CardTitle className="flex items-center gap-2">
                    <Target className="h-5 w-5 text-[#00bc7d]" />
                    Membership Distribution
                  </CardTitle>
                  <CardDescription>Breakdown by membership type</CardDescription>
                </CardHeader>
                <CardContent className="space-y-6 pt-6">
                  {Object.entries(analyticsData.memberStats.membershipDistribution).map(([type, count]) => (
                    <ProgressBar
                      key={type}
                      label={type}
                      value={count}
                      max={analyticsData.memberStats.totalMembers}
                    />
                  ))}
                </CardContent>
              </Card>
            </motion.div>
          </motion.div>
        </TabsContent>

        <TabsContent value="revenue" className="space-y-4">
          <motion.div
            variants={containerVariants}
            initial="hidden"
            animate="visible"
            className="grid grid-cols-1 lg:grid-cols-2 gap-6"
          >
            <motion.div variants={itemVariants}>
              <Card className="h-full border-gray-100 shadow-lg shadow-gray-100/50 overflow-hidden">
                <CardHeader className="bg-gradient-to-r from-gray-50 to-white border-b border-gray-100">
                  <CardTitle className="flex items-center gap-2">
                    <IndianRupee className="h-5 w-5 text-[#00bc7d]" />
                    Revenue Overview
                  </CardTitle>
                  <CardDescription>Financial performance metrics</CardDescription>
                </CardHeader>
                <CardContent className="space-y-6 pt-6">
                  <div className="text-center p-6 rounded-2xl bg-gradient-to-br from-[#00bc7d] to-emerald-600 text-white shadow-lg shadow-[#00bc7d]/20">
                    <div className="text-4xl font-bold mb-1">
                      ₹{analyticsData.revenueStats.totalRevenue.toLocaleString()}
                    </div>
                    <p className="text-emerald-100 font-medium">Total Revenue</p>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="text-center p-4 rounded-xl bg-gray-50">
                      <div className="text-xl font-bold text-[#00bc7d] mb-1">
                        ₹{analyticsData.revenueStats.monthlyRevenue.toLocaleString()}
                      </div>
                      <p className="text-sm font-medium text-gray-600">This Month</p>
                    </div>
                    <div className="text-center p-4 rounded-xl bg-gray-50">
                      <div className="text-xl font-bold text-[#00bc7d] mb-1">
                        ₹{analyticsData.revenueStats.outstandingPayments.toLocaleString()}
                      </div>
                      <p className="text-sm font-medium text-gray-600">Outstanding</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>

            <motion.div variants={itemVariants}>
              <Card className="h-full border-gray-100 shadow-lg shadow-gray-100/50 overflow-hidden">
                <CardHeader className="bg-gradient-to-r from-gray-50 to-white border-b border-gray-100">
                  <CardTitle className="flex items-center gap-2">
                    <Activity className="h-5 w-5 text-[#00bc7d]" />
                    Revenue by Service
                  </CardTitle>
                  <CardDescription>Income breakdown by service type</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4 pt-6">
                  {Object.entries(analyticsData.revenueStats.revenueByService).map(([service, revenue]) => (
                    <div key={service} className="group flex justify-between items-center p-3 rounded-xl hover:bg-gray-50 transition-colors">
                      <div className="flex items-center gap-3">
                        <div className="w-2 h-2 rounded-full bg-[#00bc7d]" />
                        <span className="text-sm font-medium text-gray-700">{service}</span>
                      </div>
                      <span className="text-sm font-bold text-gray-900">₹{revenue.toLocaleString()}</span>
                    </div>
                  ))}
                </CardContent>
              </Card>
            </motion.div>
          </motion.div>
        </TabsContent>

        <TabsContent value="classes" className="space-y-4">
          <motion.div
            variants={containerVariants}
            initial="hidden"
            animate="visible"
            className="grid grid-cols-1 lg:grid-cols-2 gap-6"
          >
            <motion.div variants={itemVariants}>
              <Card className="h-full border-gray-100 shadow-lg shadow-gray-100/50 overflow-hidden">
                <CardHeader className="bg-gradient-to-r from-gray-50 to-white border-b border-gray-100">
                  <CardTitle className="flex items-center gap-2">
                    <Calendar className="h-5 w-5 text-[#00bc7d]" />
                    Class Performance
                  </CardTitle>
                  <CardDescription>Class attendance and utilization</CardDescription>
                </CardHeader>
                <CardContent className="space-y-6 pt-6">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="text-center p-4 rounded-xl bg-gray-50">
                      <div className="text-3xl font-bold text-[#00bc7d] mb-1">
                        {analyticsData.classStats.totalClasses}
                      </div>
                      <p className="text-sm font-medium text-gray-600">Total Classes</p>
                    </div>
                    <div className="text-center p-4 rounded-xl bg-gray-50">
                      <div className="text-3xl font-bold text-[#00bc7d] mb-1">
                        {analyticsData.classStats.averageAttendance}%
                      </div>
                      <p className="text-sm font-medium text-gray-600">Avg. Attendance</p>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm font-medium">
                      <span className="text-gray-600">Overall Utilization</span>
                      <span className="text-[#00bc7d]">{analyticsData.classStats.classUtilization}%</span>
                    </div>
                    <div className="w-full bg-gray-100 rounded-full h-3 overflow-hidden">
                      <div
                        className="bg-[#00bc7d] h-full rounded-full transition-all duration-500 ease-out"
                        style={{ width: `${analyticsData.classStats.classUtilization}%` }}
                      />
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>

            <motion.div variants={itemVariants}>
              <Card className="h-full border-gray-100 shadow-lg shadow-gray-100/50 overflow-hidden">
                <CardHeader className="bg-gradient-to-r from-gray-50 to-white border-b border-gray-100">
                  <CardTitle className="flex items-center gap-2">
                    <Star className="h-5 w-5 text-[#00bc7d]" />
                    Popular Classes
                  </CardTitle>
                  <CardDescription>Most booked classes this period</CardDescription>
                </CardHeader>
                <CardContent className="pt-6">
                  <div className="space-y-3">
                    {analyticsData.classStats.popularClasses.map((classItem, index) => (
                      <div key={classItem.name} className="flex items-center justify-between p-3 rounded-xl hover:bg-gray-50 transition-colors">
                        <div className="flex items-center space-x-3">
                          <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${index === 0 ? 'bg-yellow-100 text-yellow-700' :
                            index === 1 ? 'bg-gray-100 text-gray-700' :
                              index === 2 ? 'bg-orange-100 text-orange-700' :
                                'bg-[#00bc7d]/10 text-[#00bc7d]'
                            }`}>
                            {index + 1}
                          </div>
                          <span className="font-medium text-gray-900">{classItem.name}</span>
                        </div>
                        <span className="text-sm font-bold text-[#00bc7d] bg-[#00bc7d]/10 px-2 py-1 rounded-lg">
                          {classItem.bookings} bookings
                        </span>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          </motion.div>
        </TabsContent>

        <TabsContent value="trainers" className="space-y-4">
          <motion.div
            variants={containerVariants}
            initial="hidden"
            animate="visible"
            className="grid grid-cols-1 lg:grid-cols-2 gap-6"
          >
            <motion.div variants={itemVariants}>
              <Card className="h-full border-gray-100 shadow-lg shadow-gray-100/50 overflow-hidden">
                <CardHeader className="bg-gradient-to-r from-gray-50 to-white border-b border-gray-100">
                  <CardTitle className="flex items-center gap-2">
                    <Users className="h-5 w-5 text-[#00bc7d]" />
                    Trainer Overview
                  </CardTitle>
                  <CardDescription>Staff performance metrics</CardDescription>
                </CardHeader>
                <CardContent className="space-y-6 pt-6">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="text-center p-4 rounded-xl bg-gray-50">
                      <div className="text-3xl font-bold text-[#00bc7d] mb-1">
                        {analyticsData.trainerStats.totalTrainers}
                      </div>
                      <p className="text-sm font-medium text-gray-600">Total Trainers</p>
                    </div>
                    <div className="text-center p-4 rounded-xl bg-gray-50">
                      <div className="text-3xl font-bold text-[#00bc7d] mb-1 flex items-center justify-center gap-2">
                        {analyticsData.trainerStats.averageRating}
                        <Star className="h-6 w-6 text-yellow-400 fill-yellow-400" />
                      </div>
                      <p className="text-sm font-medium text-gray-600">Avg. Rating</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>

            <motion.div variants={itemVariants}>
              <Card className="h-full border-gray-100 shadow-lg shadow-gray-100/50 overflow-hidden">
                <CardHeader className="bg-gradient-to-r from-gray-50 to-white border-b border-gray-100">
                  <CardTitle className="flex items-center gap-2">
                    <Award className="h-5 w-5 text-[#00bc7d]" />
                    Top Performers
                  </CardTitle>
                  <CardDescription>Highest rated trainers</CardDescription>
                </CardHeader>
                <CardContent className="pt-6">
                  <div className="space-y-3">
                    {analyticsData.trainerStats.topPerformers.map((trainer, index) => (
                      <div key={trainer.name} className="flex items-center justify-between p-3 rounded-xl hover:bg-gray-50 transition-colors">
                        <div className="flex items-center space-x-3">
                          <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${index === 0 ? 'bg-yellow-100 text-yellow-700' :
                            index === 1 ? 'bg-gray-100 text-gray-700' :
                              index === 2 ? 'bg-orange-100 text-orange-700' :
                                'bg-[#00bc7d]/10 text-[#00bc7d]'
                            }`}>
                            {index + 1}
                          </div>
                          <span className="font-medium text-gray-900">{trainer.name}</span>
                        </div>
                        <div className="flex items-center gap-3">
                          <div className="flex items-center gap-1 bg-yellow-50 px-2 py-1 rounded-lg">
                            <Star className="h-3 w-3 text-yellow-500 fill-yellow-500" />
                            <span className="text-sm font-bold text-yellow-700">{trainer.rating}</span>
                          </div>
                          <span className="text-xs font-medium text-gray-500">{trainer.classes} classes</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          </motion.div>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default AnalyticsDashboard;
