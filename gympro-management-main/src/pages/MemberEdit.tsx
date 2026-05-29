import React, { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useAuth } from '@/hooks/useAuth';
import { Member, UserRole } from '@/types';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import { supabase } from '@/lib/supabase';
import { toast } from 'sonner';
import Sidebar from '@/components/layout/Sidebar';
import Topbar from '@/components/layout/Topbar';
import {
  ArrowLeft,
  User,
  Activity,
  CreditCard,
  ShieldAlert,
  CheckCircle2,
  Edit,
  Dumbbell,
  Zap,
  Trophy,
  Calendar,
  FileText
} from 'lucide-react';

type DbMember = {
  id: string;
  email: string;
  first_name: string;
  last_name: string;
  phone?: string | null;
  dob?: string | null;
  weight?: string | null;
  height?: string | null;
  membership_type: 'Gym' | 'Gym + Cardio' | 'Gym + Cardio + Crossfit';
  status: 'ACTIVE' | 'INACTIVE';
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

const dbTypeToplan = (dbType: string): MembershipPlan => {
  if (dbType === 'Gym + Cardio + Crossfit') return 'Elite';
  if (dbType === 'Gym + Cardio') return 'Premium';
  return 'Basic';
};

const planToDbType = (plan: MembershipPlan): 'Gym' | 'Gym + Cardio' | 'Gym + Cardio + Crossfit' => {
  if (plan === 'Elite') return 'Gym + Cardio + Crossfit';
  if (plan === 'Premium') return 'Gym + Cardio';
  return 'Gym';
};

const getMembershipPrice = (plan: MembershipPlan, cycle: BillingCycle) => membershipPlans[plan][cycle];

const formatPrice = (price: number) =>
  new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(price);

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

const mapSupabaseMemberToMember = (dbMember: DbMember): Member => {
  const height = dbMember.height ? parseFloat(dbMember.height) : undefined;
  const heightUnit: 'cm' | 'ft' = 'cm';
  const weightUnit: 'kg' | 'lbs' = 'kg';
  const weight = dbMember.weight ? parseFloat(dbMember.weight) : undefined;
  return {
    id: dbMember.id,
    email: dbMember.email,
    firstName: dbMember.first_name,
    lastName: dbMember.last_name,
    phone: dbMember.phone || '',
    dateOfBirth: dbMember.dob ? new Date(dbMember.dob) : new Date(),
    address: '',
    weight,
    weightUnit,
    height,
    heightUnit,
    membershipType: dbMember.membership_type,
    membershipStartDate: new Date(dbMember.created_at),
    membershipEndDate: new Date(new Date(dbMember.created_at).setFullYear(new Date(dbMember.created_at).getFullYear() + 1)),
    isActive: dbMember.status === 'ACTIVE',
    role: UserRole.MEMBER,
    createdAt: new Date(dbMember.created_at),
    updatedAt: new Date(dbMember.updated_at),
    fitnessGoals: [],
    medicalConditions: [],
    notes: ''
  };
};

const MemberEdit: React.FC = () => {
  const { hasRole } = useAuth();
  const navigate = useNavigate();
  const { id } = useParams();
  const [member, setMember] = useState<Member | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(() => {
    const saved = localStorage.getItem('sidebar-collapsed');
    return saved ? JSON.parse(saved) : false;
  });

  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
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
    isActive: true
  });

  useEffect(() => {
    const fetchMember = async () => {
      try {
        const { data, error } = await supabase.from('members').select('*').eq('id', id).single();
        if (error) {
          toast.error('Failed to load member');
          return;
        }
        setMember(mapSupabaseMemberToMember(data as DbMember));
      } catch {
        toast.error('Failed to load member');
      } finally {
        setIsLoading(false);
      }
    };
    if (id) fetchMember();
  }, [id]);

  useEffect(() => {
    if (member) {
      setFormData({
        firstName: member.firstName,
        lastName: member.lastName,
        email: member.email,
        phone: member.phone || '',
        dateOfBirth: member.dateOfBirth.toISOString().split('T')[0],
        address: member.address || '',
        weight: member.weight?.toString() || '',
        weightUnit: (member.weightUnit || 'kg') as 'kg' | 'lbs',
        height: member.heightUnit === 'cm' ? (member.height?.toString() || '') : '',
        heightUnit: (member.heightUnit || 'cm') as 'cm' | 'ft',
        heightFeet: member.heightFeet?.toString() || '',
        heightInches: member.heightInches?.toString() || '',
        membershipType: dbTypeToplan(member.membershipType),
        billingCycle: '1_month',
        emergencyContactName: member.emergencyContact?.name || '',
        emergencyContactPhone: member.emergencyContact?.phone || '',
        emergencyContactRelationship: member.emergencyContact?.relationship || '',
        isActive: member.isActive
      });
    }
  }, [member]);

  const allowed = hasRole(UserRole.ADMIN) || hasRole(UserRole.MANAGER) || hasRole(UserRole.STAFF);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!member) return;

    try {
      let heightInCm: number | null = null;
      if (formData.heightUnit === 'cm' && formData.height) {
        heightInCm = parseFloat(formData.height);
      } else if (formData.heightUnit === 'ft' && formData.heightFeet) {
        const totalInches = (parseFloat(formData.heightFeet) * 12) + (parseFloat(formData.heightInches || '0'));
        heightInCm = totalInches * 2.54;
      }
      const weightValue = formData.weight ? parseFloat(formData.weight) : null;

      const { error } = await supabase
        .from('members')
        .update({
          first_name: formData.firstName,
          last_name: formData.lastName,
          email: formData.email,
          phone: formData.phone || null,
          dob: formData.dateOfBirth || null,
          weight: weightValue ? weightValue.toString() : null,
          height: heightInCm ? heightInCm.toString() : null,
          membership_type: planToDbType(formData.membershipType),
          plan_price: getMembershipPrice(formData.membershipType, formData.billingCycle).toString(),
          status: formData.isActive ? 'ACTIVE' : 'INACTIVE',
          updated_at: new Date().toISOString()
        })
        .eq('id', member.id);

      if (error) {
        toast.error(error.message || 'Failed to update member');
        return;
      }
      toast.success('Member updated successfully');
      navigate('/dashboard?tab=members');
    } catch {
      toast.error('Failed to update member');
    }
  };

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: { opacity: 1, transition: { staggerChildren: 0.1 } }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0 }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#00bc7d]"></div>
          <p className="text-gray-500 font-medium">Loading member details...</p>
        </div>
      </div>
    );
  }

  if (!member) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Member Not Found</h2>
          <Button onClick={() => navigate('/dashboard?tab=members')} variant="outline">
            Return to Members
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Sidebar
        isCollapsed={isSidebarCollapsed}
        onToggle={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
      />
      <motion.div
        animate={{ marginLeft: isSidebarCollapsed ? '5rem' : '16rem' }}
        transition={{ duration: 0.3, ease: 'easeInOut' }}
        className="transition-all duration-300"
      >
        <Topbar
          isSidebarCollapsed={isSidebarCollapsed}
          onToggleSidebar={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
        />
        <main className="p-8">
          <div className="max-w-7xl mx-auto space-y-8">

            {/* Header */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
              <div>
                <motion.h2
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  className="text-3xl font-bold mb-2 text-gray-900 flex items-center gap-3"
                >
                  <div className="p-3 bg-[#00bc7d] rounded-xl shadow-lg shadow-[#00bc7d]/20">
                    <Edit className="h-6 w-6 text-white" />
                  </div>
                  Edit Member Profile
                </motion.h2>
                <motion.p
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.1 }}
                  className="text-muted-foreground ml-16"
                >
                  Update personal information, membership details, and settings
                </motion.p>
              </div>
              <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }}>
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
                  Access denied. You do not have permission to edit members.
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
                  {/* Personal Information */}
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
                          <Input id="firstName" value={formData.firstName} onChange={(e) => setFormData({ ...formData, firstName: e.target.value })} required className="focus-visible:ring-[#00bc7d] rounded-xl border-gray-200" placeholder="John" />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="lastName">Last Name *</Label>
                          <Input id="lastName" value={formData.lastName} onChange={(e) => setFormData({ ...formData, lastName: e.target.value })} required className="focus-visible:ring-[#00bc7d] rounded-xl border-gray-200" placeholder="Doe" />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="email">Email Address *</Label>
                          <Input id="email" type="email" value={formData.email} onChange={(e) => setFormData({ ...formData, email: e.target.value })} required className="focus-visible:ring-[#00bc7d] rounded-xl border-gray-200" placeholder="john.doe@example.com" />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="phone">Phone Number</Label>
                          <Input id="phone" value={formData.phone} onChange={(e) => setFormData({ ...formData, phone: e.target.value })} className="focus-visible:ring-[#00bc7d] rounded-xl border-gray-200" placeholder="+91 98765 43210" />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="dateOfBirth">Date of Birth</Label>
                          <Input id="dateOfBirth" type="date" value={formData.dateOfBirth} onChange={(e) => setFormData({ ...formData, dateOfBirth: e.target.value })} className="focus-visible:ring-[#00bc7d] rounded-xl border-gray-200" />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="address">Address</Label>
                          <Input id="address" value={formData.address} onChange={(e) => setFormData({ ...formData, address: e.target.value })} className="focus-visible:ring-[#00bc7d] rounded-xl border-gray-200" placeholder="123 Main St, City, Country" />
                        </div>
                      </CardContent>
                    </Card>
                  </motion.div>

                  {/* Physical Stats */}
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
                            <Input id="weight" type="number" step="0.1" value={formData.weight} onChange={(e) => setFormData({ ...formData, weight: e.target.value })} className="focus-visible:ring-[#00bc7d] rounded-xl border-gray-200" placeholder="70" />
                            <Select value={formData.weightUnit} onValueChange={(value) => setFormData({ ...formData, weightUnit: value as 'kg' | 'lbs' })}>
                              <SelectTrigger className="w-24 rounded-xl border-gray-200 focus:ring-[#00bc7d]"><SelectValue /></SelectTrigger>
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
                              <Input id="height" type="number" value={formData.height} onChange={(e) => setFormData({ ...formData, height: e.target.value })} className="focus-visible:ring-[#00bc7d] rounded-xl border-gray-200" placeholder="175" />
                            ) : (
                              <>
                                <Input id="heightFeet" type="number" value={formData.heightFeet} onChange={(e) => setFormData({ ...formData, heightFeet: e.target.value })} className="w-full focus-visible:ring-[#00bc7d] rounded-xl border-gray-200" placeholder="5" />
                                <Input id="heightInches" type="number" value={formData.heightInches} onChange={(e) => setFormData({ ...formData, heightInches: e.target.value })} className="w-full focus-visible:ring-[#00bc7d] rounded-xl border-gray-200" placeholder="9" />
                              </>
                            )}
                            <Select value={formData.heightUnit} onValueChange={(value) => setFormData({ ...formData, heightUnit: value as 'cm' | 'ft' })}>
                              <SelectTrigger className="w-24 rounded-xl border-gray-200 focus:ring-[#00bc7d]"><SelectValue /></SelectTrigger>
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

                  {/* Emergency Contact */}
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
                          <Input id="emergencyName" value={formData.emergencyContactName} onChange={(e) => setFormData({ ...formData, emergencyContactName: e.target.value })} placeholder="Jane Doe" className="focus-visible:ring-[#00bc7d] rounded-xl border-gray-200" />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="emergencyPhone">Contact Phone</Label>
                          <Input id="emergencyPhone" value={formData.emergencyContactPhone} onChange={(e) => setFormData({ ...formData, emergencyContactPhone: e.target.value })} placeholder="+91 98765 43210" className="focus-visible:ring-[#00bc7d] rounded-xl border-gray-200" />
                        </div>
                        <div className="space-y-2 md:col-span-2">
                          <Label htmlFor="emergencyRelation">Relationship</Label>
                          <Input id="emergencyRelation" value={formData.emergencyContactRelationship} onChange={(e) => setFormData({ ...formData, emergencyContactRelationship: e.target.value })} placeholder="Spouse, Parent, etc." className="focus-visible:ring-[#00bc7d] rounded-xl border-gray-200" />
                        </div>
                      </CardContent>
                    </Card>
                  </motion.div>

                  {/* Account Status */}
                  <motion.div variants={itemVariants}>
                    <Card className="border-0 shadow-lg shadow-gray-100/50 bg-white overflow-hidden rounded-2xl">
                      <CardHeader className="bg-gradient-to-r from-gray-50 to-white border-b border-gray-100 pb-4">
                        <div className="flex items-center gap-2">
                          <div className="p-2 bg-[#00bc7d]/10 rounded-lg">
                            <CreditCard className="h-5 w-5 text-[#00bc7d]" />
                          </div>
                          <CardTitle className="text-lg text-gray-900">Account Status</CardTitle>
                        </div>
                      </CardHeader>
                      <CardContent className="p-6">
                        <div className="space-y-2">
                          <Label>Status</Label>
                          <Select value={formData.isActive ? 'ACTIVE' : 'INACTIVE'} onValueChange={(value) => setFormData({ ...formData, isActive: value === 'ACTIVE' })}>
                            <SelectTrigger className="h-11 rounded-xl border-gray-200 focus:ring-[#00bc7d]"><SelectValue /></SelectTrigger>
                            <SelectContent>
                              <SelectItem value="ACTIVE">
                                <div className="flex items-center gap-2"><span className="h-2 w-2 rounded-full bg-[#00bc7d] animate-pulse" />Active Member</div>
                              </SelectItem>
                              <SelectItem value="INACTIVE">
                                <div className="flex items-center gap-2"><span className="h-2 w-2 rounded-full bg-gray-300" />Inactive</div>
                              </SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                      </CardContent>
                    </Card>
                  </motion.div>

                  {/* Billing Cycle */}
                  <motion.div variants={itemVariants}>
                    <Card className="border-0 shadow-lg shadow-gray-100/50 bg-white overflow-hidden rounded-2xl">
                      <CardHeader className="bg-gradient-to-r from-gray-50 to-white border-b border-gray-100 pb-4">
                        <div className="flex items-center gap-2">
                          <div className="p-2 bg-[#00bc7d]/10 rounded-lg">
                            <Calendar className="h-5 w-5 text-[#00bc7d]" />
                          </div>
                          <CardTitle className="text-lg text-gray-900">Billing Cycle</CardTitle>
                        </div>
                        <CardDescription>Choose how often the member will be billed</CardDescription>
                      </CardHeader>
                      <CardContent className="p-6">
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                          {(['1_month', '3_months', '6_months', 'yearly'] as BillingCycle[]).map((cycle) => (
                            <div
                              key={cycle}
                              onClick={() => setFormData({ ...formData, billingCycle: cycle })}
                              className={`cursor-pointer rounded-xl border-2 p-4 transition-all duration-200 text-center ${
                                formData.billingCycle === cycle
                                  ? 'border-[#00bc7d] bg-[#00bc7d]/5 shadow-md shadow-[#00bc7d]/10'
                                  : 'border-gray-100 hover:border-[#00bc7d]/50 hover:bg-gray-50'
                              }`}
                            >
                              <div className="font-bold text-lg text-gray-900">{getCycleDisplayName(cycle)}</div>
                              {formData.billingCycle === cycle && (
                                <CheckCircle2 className="h-5 w-5 text-[#00bc7d] mx-auto mt-2" />
                              )}
                            </div>
                          ))}
                        </div>
                      </CardContent>
                    </Card>
                  </motion.div>

                  {/* Membership Plan */}
                  <motion.div variants={itemVariants}>
                    <Card className="border-0 shadow-xl shadow-[#00bc7d]/5 bg-white overflow-hidden rounded-2xl relative">
                      <div className="absolute top-0 right-0 p-32 bg-[#00bc7d]/5 rounded-full blur-3xl -mr-16 -mt-16 pointer-events-none" />
                      <CardHeader className="bg-gradient-to-br from-[#00bc7d] to-[#009664] text-white pb-6 relative overflow-hidden">
                        <div className="flex items-center gap-2 relative z-10">
                          <CreditCard className="h-5 w-5" />
                          <CardTitle className="text-lg text-white">Membership Plan</CardTitle>
                        </div>
                        <CardDescription className="text-white/80 relative z-10">Select the best plan for the member</CardDescription>
                      </CardHeader>
                      <CardContent className="p-6 space-y-4 relative z-10">
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                          {(Object.keys(membershipPlans) as MembershipPlan[]).map((planKey) => {
                            const plan = membershipPlans[planKey];
                            const Icon = plan.icon;
                            const isSelected = formData.membershipType === planKey;
                            return (
                              <div
                                key={planKey}
                                onClick={() => setFormData({ ...formData, membershipType: planKey })}
                                className={`cursor-pointer rounded-xl border-2 p-6 transition-all duration-200 relative overflow-hidden group ${
                                  isSelected
                                    ? 'border-[#00bc7d] bg-[#00bc7d]/5 shadow-md shadow-[#00bc7d]/10'
                                    : 'border-gray-100 hover:border-[#00bc7d]/50 hover:bg-gray-50'
                                }`}
                              >
                                <div className="flex flex-col items-start gap-4">
                                  <div className={`p-3 rounded-xl ${isSelected ? 'bg-[#00bc7d] text-white' : 'bg-gray-100 text-gray-600'}`}>
                                    <Icon className="h-6 w-6" />
                                  </div>
                                  <div>
                                    <h4 className={`font-bold text-lg ${isSelected ? 'text-[#00bc7d]' : 'text-gray-700'}`}>{plan.name}</h4>
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

                  {/* Summary / Submit */}
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
                            <span className="font-medium text-gray-700">{getCycleDisplayName(formData.billingCycle)}</span>
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
                          className="w-full h-12 text-lg font-semibold bg-[#00bc7d] hover:bg-[#00bc7d]/90 shadow-lg shadow-[#00bc7d]/20 rounded-xl transition-all"
                        >
                          Update Member
                          <CheckCircle2 className="ml-2 h-5 w-5" />
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

export default MemberEdit;
