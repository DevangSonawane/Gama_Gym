import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useAuth } from '@/hooks/useAuth';
import { UserRole, Trainer } from '@/types';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import { supabase, DEFAULT_GYM_ID } from '@/lib/supabase';
import { hashPassword } from '@/lib/auth-utils';
import { toast } from 'sonner';
import Sidebar from '@/components/layout/Sidebar';
import Topbar from '@/components/layout/Topbar';
import {
  UserPlus,
  ArrowLeft,
  User,
  Activity,
  CreditCard,
  ShieldAlert,
  CheckCircle2,
  FileText,
  Sparkles,
  Calendar,
  Dumbbell,
  Zap,
  Trophy,
  Eye,
  EyeOff
} from 'lucide-react';

type SupabaseTrainerRow = {
  id: string;
  first_name: string;
  last_name: string;
  email: string;
  phone?: string | null;
  specializations?: string[] | null;
  bio?: string | null;
  profile_image?: string | null;
  gym_id?: string;
  created_at: string;
  updated_at: string;
};

type MembershipPlan = 'Basic' | 'Premium' | 'Elite';
type BillingCycle = '1_month' | '3_months' | '6_months' | 'yearly';

const membershipPlans = {
  Basic: {
    name: 'Basic Gym',
    icon: Dumbbell,
    description: 'Access to gym equipment',
    features: ['Gym Equipment Access', 'Locker Room', 'Free Parking'],
    '1_month': 999,
    '3_months': 2699,
    '6_months': 4999,
    'yearly': 8999
  },
  Premium: {
    name: 'Premium Gym + Cardio',
    icon: Zap,
    description: 'Gym + Cardio classes',
    features: ['All Basic Features', 'Unlimited Cardio Classes', 'Nutrition Consultation'],
    '1_month': 1999,
    '3_months': 5399,
    '6_months': 9999,
    'yearly': 17999
  },
  Elite: {
    name: 'Elite All Access',
    icon: Trophy,
    description: 'Complete fitness experience',
    features: ['All Premium Features', 'Crossfit Classes', 'Personal Trainer (1x/week)', 'Sauna Access'],
    '1_month': 3499,
    '3_months': 9499,
    '6_months': 17499,
    'yearly': 31499
  }
};

const MemberCreate: React.FC = () => {
  const { hasRole } = useAuth();
  const navigate = useNavigate();
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(() => {
    const saved = localStorage.getItem('sidebar-collapsed');
    return saved ? JSON.parse(saved) : false;
  });
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    password: '',
    dateOfBirth: '',
    address: '',
    weight: '',
    weightUnit: 'kg' as 'kg' | 'lbs',
    height: '',
    heightUnit: 'cm' as 'cm' | 'ft',
    heightFeet: '',
    heightInches: '',
    membershipType: 'Basic' as MembershipPlan,
    billingCycle: '1_month' as BillingCycle,
    emergencyContactName: '',
    emergencyContactPhone: '',
    emergencyContactRelationship: '',
    medicalConditions: '',
    fitnessGoals: '',
    notes: '',
    trainerId: ''
  });
  const [trainers, setTrainers] = useState<Trainer[]>([]);
  const [isLoadingTrainers, setIsLoadingTrainers] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const allowed = hasRole(UserRole.ADMIN) || hasRole(UserRole.MANAGER) || hasRole(UserRole.STAFF);

  const getMembershipPrice = (plan: MembershipPlan, cycle: BillingCycle) => {
    return membershipPlans[plan][cycle];
  };

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0
    }).format(price);
  };

  const getCycleLabel = (cycle: BillingCycle) => {
    switch (cycle) {
      case '1_month': return '/month';
      case '3_months': return '/3 months';
      case '6_months': return '/6 months';
      case 'yearly': return '/year';
      default: return '/month';
    }
  };

  const getCycleDisplayName = (cycle: BillingCycle) => {
    switch (cycle) {
      case '1_month': return '1 Month';
      case '3_months': return '3 Months';
      case '6_months': return '6 Months';
      case 'yearly': return 'Yearly';
      default: return '1 Month';
    }
  };

  useEffect(() => {
    const fetchTrainers = async () => {
      try {
        setIsLoadingTrainers(true);
        const { data, error } = await supabase
          .from('staff')
          .select('*')
          .eq('gym_id', DEFAULT_GYM_ID)
          .eq('role', 'TRAINER')
          .order('first_name');
        if (error) {
          console.error('Error fetching trainers:', error);
          toast.error('Failed to load trainers');
          return;
        }
        if (data) {
          const trainerRows = data as SupabaseTrainerRow[];
          setTrainers(trainerRows.map(t => ({
            id: t.id,
            firstName: t.first_name,
            lastName: t.last_name,
            email: t.email,
            phone: t.phone || '',
            specialization: t.specializations || [],
            bio: t.bio || '',
            profileImage: t.profile_image || '',
            createdAt: new Date(t.created_at),
            updatedAt: new Date(t.updated_at),
            gymId: t.gym_id
          })));
        }
      } catch (error) {
        console.error('Error fetching trainers:', error);
      } finally {
        setIsLoadingTrainers(false);
      }
    };
    fetchTrainers();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      let heightInCm: number | null = null;
      if (formData.heightUnit === 'cm' && formData.height) {
        heightInCm = parseFloat(formData.height);
      } else if (formData.heightUnit === 'ft' && formData.heightFeet) {
        const totalInches = (parseFloat(formData.heightFeet) * 12) + (parseFloat(formData.heightInches || '0'));
        heightInCm = totalInches * 2.54;
      }
      const weightValue = formData.weight ? parseFloat(formData.weight) : null;

      // Hash the password
      const passwordHash = await hashPassword(formData.password || 'password123');

      // First create the user in users table
      const { data: userData, error: userError } = await supabase
        .from('users')
        .insert({
          first_name: formData.firstName,
          last_name: formData.lastName,
          email: formData.email,
          phone_number: formData.phone || null,
          password_hash: passwordHash,
          role: 'member',
          is_active: true,
        })
        .select()
        .single();

      if (userError) {
        toast.error(userError.message || 'Failed to create user account');
        return;
      }

      // Then create the member record
      const { error: memberError } = await supabase
        .from('members')
        .insert({
          gym_id: DEFAULT_GYM_ID,
          first_name: formData.firstName,
          last_name: formData.lastName,
          email: formData.email,
          phone: formData.phone || null,
          dob: formData.dateOfBirth || null,
          weight: weightValue,
          height: heightInCm,
          membership_type: formData.membershipType === 'Basic' ? 'Gym' : 
                           formData.membershipType === 'Premium' ? 'Gym + Cardio' : 
                           'Gym + Cardio + Crossfit',
          plan_price: getMembershipPrice(formData.membershipType, formData.billingCycle),
          status: 'ACTIVE',
          trainer_id: formData.trainerId || null,
        });

      if (memberError) {
        toast.error(memberError.message || 'Failed to create member');
        return;
      }

      toast.success('Member and user account created successfully!');
      navigate('/dashboard?tab=members');
    } catch (error) {
      console.error('Error creating member:', error);
      toast.error('Failed to create member');
    } finally {
      setIsSubmitting(false);
    }
  };

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

  return (
    <div className="min-h-screen bg-gray-50">
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
          <div className="max-w-7xl mx-auto space-y-8">

            {/* Header Section */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
              <div>
                <motion.h2
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  className="text-3xl font-bold mb-2 text-gray-900 flex items-center gap-3"
                >
                  <div className="p-3 bg-[#00bc7d] rounded-xl shadow-lg shadow-[#00bc7d]/20">
                    <UserPlus className="h-6 w-6 text-white" />
                  </div>
                  Add New Member
                </motion.h2>
                <motion.p
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.1 }}
                  className="text-muted-foreground ml-16"
                >
                  Create a new membership account and set up their profile
                </motion.p>
              </div>
              <motion.div
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
              >
                <Button
                  variant="outline"
                  onClick={() => navigate('/dashboard?tab=members')}
                  className="group hover:border-[#00bc7d] hover:text-[#00bc7d] hover:bg-[#00bc7d]/5 rounded-xl border-gray-200"
                >
                  <ArrowLeft className="h-4 w-4 mr-2 group-hover:-translate-x-1 transition-transform" />
                  Back to Members
                </Button>
              </motion.div>
            </div>

            {!allowed ? (
              <Card className="border-red-200 bg-red-50 rounded-2xl">
                <CardContent className="p-6 text-center text-red-600">
                  Access denied. You do not have permission to add members.
                </CardContent>
              </Card>
            ) : (
              <form onSubmit={handleSubmit}>
                <motion.div
                  variants={containerVariants}
                  initial="hidden"
                  animate="visible"
                  className="space-y-8"
                >
                  {/* Personal Information Card */}
                  <motion.div variants={itemVariants}>
                    <Card className="border-0 shadow-lg shadow-gray-100/50 bg-white overflow-hidden rounded-2xl">
                      <CardHeader className="bg-gradient-to-r from-gray-50 to-white border-b border-gray-100 pb-4">
                        <div className="flex items-center gap-2">
                          <div className="p-2 bg-[#00bc7d]/10 rounded-lg">
                            <User className="h-5 w-5 text-[#00bc7d]" />
                          </div>
                          <CardTitle className="text-lg text-gray-900">Personal Information</CardTitle>
                        </div>
                        <CardDescription>Basic details about the member</CardDescription>
                      </CardHeader>
                      <CardContent className="p-6 grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="space-y-2">
                          <Label htmlFor="firstName">First Name *</Label>
                          <Input
                            id="firstName"
                            value={formData.firstName}
                            onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                            required
                            className="focus-visible:ring-[#00bc7d] rounded-xl border-gray-200"
                            placeholder="John"
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="lastName">Last Name *</Label>
                          <Input
                            id="lastName"
                            value={formData.lastName}
                            onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                            required
                            className="focus-visible:ring-[#00bc7d] rounded-xl border-gray-200"
                            placeholder="Doe"
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="email">Email Address *</Label>
                          <Input
                            id="email"
                            type="email"
                            value={formData.email}
                            onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                            required
                            className="focus-visible:ring-[#00bc7d] rounded-xl border-gray-200"
                            placeholder="john.doe@example.com"
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="password">Login Password *</Label>
                          <div className="relative">
                            <Input
                              id="password"
                              type={showPassword ? "text" : "password"}
                              value={formData.password}
                              onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                              required
                              className="focus-visible:ring-[#00bc7d] rounded-xl border-gray-200 pr-10"
                              placeholder="Create a password"
                            />
                            <button
                              type="button"
                              onClick={() => setShowPassword(!showPassword)}
                              className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700"
                            >
                              {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                            </button>
                          </div>
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="phone">Phone Number</Label>
                          <Input
                            id="phone"
                            value={formData.phone}
                            onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                            className="focus-visible:ring-[#00bc7d] rounded-xl border-gray-200"
                            placeholder="+91 98765 43210"
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="dateOfBirth">Date of Birth</Label>
                          <Input
                            id="dateOfBirth"
                            type="date"
                            value={formData.dateOfBirth}
                            onChange={(e) => setFormData({ ...formData, dateOfBirth: e.target.value })}
                            className="focus-visible:ring-[#00bc7d] rounded-xl border-gray-200"
                          />
                        </div>
                        <div className="space-y-2 md:col-span-2">
                          <Label htmlFor="address">Address</Label>
                          <Input
                            id="address"
                            value={formData.address}
                            onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                            className="focus-visible:ring-[#00bc7d] rounded-xl border-gray-200"
                            placeholder="123 Main St, City, Country"
                          />
                        </div>
                      </CardContent>
                    </Card>
                  </motion.div>

                  {/* Physical Stats Card */}
                  <motion.div variants={itemVariants}>
                    <Card className="border-0 shadow-lg shadow-gray-100/50 bg-white overflow-hidden rounded-2xl">
                      <CardHeader className="bg-gradient-to-r from-gray-50 to-white border-b border-gray-100 pb-4">
                        <div className="flex items-center gap-2">
                          <div className="p-2 bg-[#00bc7d]/10 rounded-lg">
                            <Activity className="h-5 w-5 text-[#00bc7d]" />
                          </div>
                          <CardTitle className="text-lg text-gray-900">Physical Statistics</CardTitle>
                        </div>
                        <CardDescription>Body measurements for tracking progress</CardDescription>
                      </CardHeader>
                      <CardContent className="p-6 grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="space-y-2">
                          <Label htmlFor="weight">Weight</Label>
                          <div className="flex space-x-2">
                            <Input
                              id="weight"
                              type="number"
                              step="0.1"
                              value={formData.weight}
                              onChange={(e) => setFormData({ ...formData, weight: e.target.value })}
                              className="focus-visible:ring-[#00bc7d] rounded-xl border-gray-200"
                              placeholder="70"
                            />
                            <Select
                              value={formData.weightUnit}
                              onValueChange={(value) => setFormData({ ...formData, weightUnit: value as 'kg' | 'lbs' })}
                            >
                              <SelectTrigger className="w-24 rounded-xl border-gray-200 focus:ring-[#00bc7d]">
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="kg">kg</SelectItem>
                                <SelectItem value="lbs">lbs</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="height">Height</Label>
                          <div className="flex space-x-2">
                            {formData.heightUnit === 'cm' ? (
                              <Input
                                id="height"
                                type="number"
                                value={formData.height}
                                onChange={(e) => setFormData({ ...formData, height: e.target.value })}
                                className="focus-visible:ring-[#00bc7d] rounded-xl border-gray-200"
                                placeholder="175"
                              />
                            ) : (
                              <>
                                <Input
                                  id="heightFeet"
                                  type="number"
                                  value={formData.heightFeet}
                                  onChange={(e) => setFormData({ ...formData, heightFeet: e.target.value })}
                                  className="w-full focus-visible:ring-[#00bc7d] rounded-xl border-gray-200"
                                  placeholder="5"
                                />
                                <Input
                                  id="heightInches"
                                  type="number"
                                  value={formData.heightInches}
                                  onChange={(e) => setFormData({ ...formData, heightInches: e.target.value })}
                                  className="w-full focus-visible:ring-[#00bc7d] rounded-xl border-gray-200"
                                  placeholder="9"
                                />
                              </>
                            )}
                            <Select
                              value={formData.heightUnit}
                              onValueChange={(value) => setFormData({ ...formData, heightUnit: value as 'cm' | 'ft' })}
                            >
                              <SelectTrigger className="w-24 rounded-xl border-gray-200 focus:ring-[#00bc7d]">
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="cm">cm</SelectItem>
                                <SelectItem value="ft">ft</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </motion.div>

                  {/* Assign Trainer */}
                  <motion.div variants={itemVariants}>
                    <Card className="border-0 shadow-lg shadow-gray-100/50 bg-white overflow-hidden rounded-2xl">
                      <CardHeader className="bg-gradient-to-r from-gray-50 to-white border-b border-gray-100 pb-4">
                        <div className="flex items-center gap-2">
                          <div className="p-2 bg-[#00bc7d]/10 rounded-lg">
                            <Sparkles className="h-5 w-5 text-[#00bc7d]" />
                          </div>
                          <CardTitle className="text-lg text-gray-900">Assign Trainer</CardTitle>
                        </div>
                        <CardDescription>Choose a trainer for this member</CardDescription>
                      </CardHeader>
                      <CardContent className="p-6">
                        <div className="space-y-2">
                          <Label htmlFor="trainer">Trainer</Label>
                          <Select
                            value={formData.trainerId}
                            onValueChange={(value) => setFormData({ ...formData, trainerId: value })}
                          >
                            <SelectTrigger className="h-11 focus:ring-[#00bc7d] rounded-xl border-gray-200">
                              <SelectValue placeholder={isLoadingTrainers ? "Loading trainers..." : "Select Trainer"} />
                            </SelectTrigger>
                            <SelectContent>
                              {trainers.map((trainer) => (
                                <SelectItem key={trainer.id} value={trainer.id}>
                                  {trainer.firstName} {trainer.lastName} {trainer.specialization && trainer.specialization.length > 0 ? `(${trainer.specialization[0]})` : ''}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                      </CardContent>
                    </Card>
                  </motion.div>

                  {/* Emergency Contact Card */}
                  <motion.div variants={itemVariants}>
                    <Card className="border-0 shadow-lg shadow-gray-100/50 bg-white overflow-hidden rounded-2xl">
                      <CardHeader className="bg-gradient-to-r from-gray-50 to-white border-b border-gray-100 pb-4">
                        <div className="flex items-center gap-2">
                          <div className="p-2 bg-[#00bc7d]/10 rounded-lg">
                            <ShieldAlert className="h-5 w-5 text-[#00bc7d]" />
                          </div>
                          <CardTitle className="text-lg text-gray-900">Emergency Contact</CardTitle>
                        </div>
                        <CardDescription>Who to contact in case of emergency</CardDescription>
                      </CardHeader>
                      <CardContent className="p-6 grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="space-y-2">
                          <Label htmlFor="emergencyName">Contact Name</Label>
                          <Input
                            id="emergencyName"
                            value={formData.emergencyContactName}
                            onChange={(e) => setFormData({ ...formData, emergencyContactName: e.target.value })}
                            placeholder="Jane Doe"
                            className="focus-visible:ring-[#00bc7d] rounded-xl border-gray-200"
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="emergencyPhone">Contact Phone</Label>
                          <Input
                            id="emergencyPhone"
                            value={formData.emergencyContactPhone}
                            onChange={(e) => setFormData({ ...formData, emergencyContactPhone: e.target.value })}
                            placeholder="+91 98765 43210"
                            className="focus-visible:ring-[#00bc7d] rounded-xl border-gray-200"
                          />
                        </div>
                        <div className="space-y-2 md:col-span-2">
                          <Label htmlFor="emergencyRelation">Relationship</Label>
                          <Input
                            id="emergencyRelation"
                            value={formData.emergencyContactRelationship}
                            onChange={(e) => setFormData({ ...formData, emergencyContactRelationship: e.target.value })}
                            placeholder="Spouse, Parent, etc."
                            className="focus-visible:ring-[#00bc7d] rounded-xl border-gray-200"
                          />
                        </div>
                      </CardContent>
                    </Card>
                  </motion.div>

                  {/* Billing Cycle Selection */}
                  <motion.div variants={itemVariants}>
                    <Card className="border-0 shadow-lg shadow-gray-100/50 bg-white overflow-hidden rounded-2xl">
                      <CardHeader className="bg-gradient-to-r from-gray-50 to-white border-b border-gray-100 pb-4">
                        <div className="flex items-center gap-2">
                          <div className="p-2 bg-[#00bc7d]/10 rounded-lg">
                            <Calendar className="h-5 w-5 text-[#00bc7d]" />
                          </div>
                          <CardTitle className="text-lg text-gray-900">Select Billing Cycle</CardTitle>
                        </div>
                        <CardDescription>Choose how often the member will be billed</CardDescription>
                      </CardHeader>
                      <CardContent className="p-6">
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                          {(['1_month', '3_months', '6_months', 'yearly'] as BillingCycle[]).map((cycle) => (
                            <div
                              key={cycle}
                              onClick={() => setFormData({ ...formData, billingCycle: cycle })}
                              className={`
                                cursor-pointer rounded-xl border-2 p-4 transition-all duration-200 text-center
                                ${formData.billingCycle === cycle
                                  ? 'border-[#00bc7d] bg-[#00bc7d]/5 shadow-md shadow-[#00bc7d]/10'
                                  : 'border-gray-100 hover:border-[#00bc7d]/50 hover:bg-gray-50'
                                  }
                              `}
                            >
                              <div className="font-bold text-lg text-gray-900">
                                {getCycleDisplayName(cycle)}
                              </div>
                              {formData.billingCycle === cycle && (
                                <CheckCircle2 className="h-5 w-5 text-[#00bc7d] mx-auto mt-2" />
                              )}
                            </div>
                          ))}
                        </div>
                      </CardContent>
                    </Card>
                  </motion.div>

                  {/* Membership Plan Card */}
                  <motion.div variants={itemVariants}>
                    <Card className="border-0 shadow-xl shadow-[#00bc7d]/5 bg-white overflow-hidden rounded-2xl relative">
                      <div className="absolute top-0 right-0 p-32 bg-[#00bc7d]/5 rounded-full blur-3xl -mr-16 -mt-16 pointer-events-none" />
                      <CardHeader className="bg-gradient-to-br from-[#00bc7d] to-[#009664] text-white pb-6 relative overflow-hidden">
                        <div className="absolute top-0 right-0 p-4 opacity-10">
                          <Sparkles className="h-24 w-24 text-white" />
                        </div>
                        <div className="flex items-center gap-2 relative z-10">
                          <CreditCard className="h-5 w-5" />
                          <CardTitle className="text-lg text-white">Membership Plan</CardTitle>
                        </div>
                        <CardDescription className="text-white/80 relative z-10">Select the best plan for the member</CardDescription>
                      </CardHeader>
                      <CardContent className="p-6 space-y-4 relative z-10">
                        {/* Plan Cards */}
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                          {(Object.keys(membershipPlans) as MembershipPlan[]).map((planKey) => {
                            const plan = membershipPlans[planKey];
                            const Icon = plan.icon;
                            const isSelected = formData.membershipType === planKey;
                            return (
                              <div
                                key={planKey}
                                onClick={() => setFormData({ ...formData, membershipType: planKey })}
                                className={`
                                  cursor-pointer rounded-xl border-2 p-6 transition-all duration-200 relative overflow-hidden group
                                  ${isSelected
                                    ? 'border-[#00bc7d] bg-[#00bc7d]/5 shadow-md shadow-[#00bc7d]/10'
                                    : 'border-gray-100 hover:border-[#00bc7d]/50 hover:bg-gray-50'
                                    }
                                `}
                              >
                                <div className="flex flex-col items-start gap-4">
                                  <div className={`p-3 rounded-xl ${isSelected ? 'bg-[#00bc7d] text-white' : 'bg-gray-100 text-gray-600'}`}>
                                    <Icon className="h-6 w-6" />
                                  </div>
                                  <div>
                                    <h4 className={`font-bold text-lg ${isSelected ? 'text-[#00bc7d]' : 'text-gray-700'}`}>
                                      {plan.name}
                                    </h4>
                                    <p className="text-sm text-muted-foreground mt-1">{plan.description}</p>
                                  </div>
                                  <div>
                                    <p className={`text-3xl font-bold ${isSelected ? 'text-[#00bc7d]' : 'text-gray-900'}`}>
                                      {formatPrice(getMembershipPrice(planKey, formData.billingCycle))}
                                      <span className="text-sm font-normal text-muted-foreground ml-1">{getCycleLabel(formData.billingCycle)}</span>
                                    </p>
                                  </div>
                                  <div className="space-y-2 w-full">
                                    {plan.features.map((feature, idx) => (
                                      <div key={idx} className="flex items-center gap-2 text-sm text-gray-600">
                                        <CheckCircle2 className="h-4 w-4 text-[#00bc7d]" />
                                        <span>{feature}</span>
                                      </div>
                                    ))}
                                  </div>
                                  {isSelected && (
                                    <div className="absolute top-3 right-3">
                                      <CheckCircle2 className="h-6 w-6 text-[#00bc7d]" />
                                    </div>
                                  )}
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </CardContent>
                    </Card>
                  </motion.div>

                  {/* Summary / Submit Card */}
                  <motion.div variants={itemVariants}>
                    <Card className="border-0 shadow-lg shadow-gray-100/50 bg-white overflow-hidden rounded-2xl">
                      <CardHeader className="bg-gray-50/50 border-b border-gray-100 pb-4">
                        <div className="flex items-center gap-2">
                          <div className="p-2 bg-gray-100 rounded-lg">
                            <FileText className="h-5 w-5 text-gray-500" />
                          </div>
                          <CardTitle className="text-lg text-gray-900">Summary</CardTitle>
                        </div>
                      </CardHeader>
                      <CardContent className="p-6 space-y-4">
                        <div className="space-y-2">
                          <div className="flex justify-between items-center text-sm">
                            <span className="text-muted-foreground">{membershipPlans[formData.membershipType].name}</span>
                            <span className="font-medium text-gray-700">
                              {getCycleDisplayName(formData.billingCycle)}
                            </span>
                          </div>
                          <Separator />
                          <div className="flex justify-between items-center pt-2">
                            <span className="text-muted-foreground font-medium">Total</span>
                            <span className="text-3xl font-bold text-[#00bc7d]">
                              {formatPrice(getMembershipPrice(formData.membershipType, formData.billingCycle))}
                            </span>
                          </div>
                        </div>
                        <Separator />
                        <Button
                          type="submit"
                          disabled={isSubmitting}
                          className="w-full h-12 text-lg font-semibold bg-[#00bc7d] hover:bg-[#00bc7d]/90 text-white shadow-lg shadow-[#00bc7d]/20 transition-all duration-300 rounded-xl"
                        >
                          {isSubmitting ? 'Creating...' : 'Create Member Account'}
                        </Button>
                        <Button
                          type="button"
                          variant="ghost"
                          onClick={() => navigate('/dashboard?tab=members')}
                          className="w-full text-muted-foreground hover:text-gray-900 hover:bg-gray-100 rounded-xl"
                        >
                          Cancel
                        </Button>
                      </CardContent>
                    </Card>
                  </motion.div>
                </motion.div>
              </form>
            )}
          </div>
        </main>
      </motion.div>
    </div>
  );
};

export default MemberCreate;
