import React, { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useAuth } from '@/hooks/useAuth';
import { Member, UserRole } from '@/types';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
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
  Edit,
  Mail,
  Phone,
  Calendar,
  MapPin,
  Ruler,
  Scale
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
    address: '', // Address is not in the DB type shown in search results, defaulting to empty
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

const getMembershipPrice = (membership: string) => {
  switch (membership) {
    case 'Gym':
      return 39.99;
    case 'Gym + Cardio':
      return 59.99;
    case 'Gym + Cardio + Crossfit':
      return 89.99;
    default:
      return 39.99;
  }
};

const MemberView: React.FC = () => {
  const { hasRole } = useAuth();
  const navigate = useNavigate();
  const { id } = useParams();
  const [member, setMember] = useState<Member | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(() => {
    const saved = localStorage.getItem('sidebar-collapsed');
    return saved ? JSON.parse(saved) : false;
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
                <motion.div
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  className="flex items-center gap-4 mb-2"
                >
                  <div className="p-3 bg-[#00bc7d] rounded-xl shadow-lg shadow-[#00bc7d]/20">
                    <User className="h-6 w-6 text-white" />
                  </div>
                  <div>
                    <h2 className="text-3xl font-bold text-gray-900">
                      {member.firstName} {member.lastName}
                    </h2>
                    <div className="flex items-center gap-2 mt-1">
                      <Badge className={member.isActive ? "bg-[#00bc7d]/10 text-[#00bc7d] border-[#00bc7d]/20" : "bg-red-50 text-red-600 border-red-100"}>
                        {member.isActive ? 'Active Member' : 'Inactive'}
                      </Badge>
                      <span className="text-sm text-gray-500">Member since {member.createdAt.toLocaleDateString()}</span>
                    </div>
                  </div>
                </motion.div>
              </div>
              <motion.div
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                className="flex items-center gap-3"
              >
                <Button
                  variant="outline"
                  onClick={() => navigate('/dashboard?tab=members')}
                  className="group hover:border-[#00bc7d] hover:text-[#00bc7d] hover:bg-[#00bc7d]/5 rounded-xl border-gray-200"
                >
                  <ArrowLeft className="h-4 w-4 mr-2 group-hover:-translate-x-1 transition-transform" />
                  Back
                </Button>
                {(hasRole(UserRole.ADMIN) || hasRole(UserRole.MANAGER) || hasRole(UserRole.STAFF)) && (
                  <Button
                    onClick={() => navigate(`/members/${member.id}/edit`)}
                    className="bg-[#00bc7d] hover:bg-[#00bc7d]/90 text-white shadow-lg shadow-[#00bc7d]/20 rounded-xl"
                  >
                    <Edit className="h-4 w-4 mr-2" />
                    Edit Profile
                  </Button>
                )}
              </motion.div>
            </div>

            <motion.div
              variants={containerVariants}
              initial="hidden"
              animate="visible"
              className="grid grid-cols-1 lg:grid-cols-3 gap-8"
            >
              {/* Left Column - Main Info */}
              <div className="lg:col-span-2 space-y-8">

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
                    </CardHeader>
                    <CardContent className="p-6 grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="space-y-1">
                        <p className="text-sm text-gray-500 font-medium flex items-center gap-2">
                          <Mail className="h-4 w-4" /> Email Address
                        </p>
                        <p className="text-base font-semibold text-gray-900">{member.email}</p>
                      </div>
                      <div className="space-y-1">
                        <p className="text-sm text-gray-500 font-medium flex items-center gap-2">
                          <Phone className="h-4 w-4" /> Phone Number
                        </p>
                        <p className="text-base font-semibold text-gray-900">{member.phone || 'N/A'}</p>
                      </div>
                      <div className="space-y-1">
                        <p className="text-sm text-gray-500 font-medium flex items-center gap-2">
                          <Calendar className="h-4 w-4" /> Date of Birth
                        </p>
                        <p className="text-base font-semibold text-gray-900">{member.dateOfBirth.toLocaleDateString()}</p>
                      </div>
                      <div className="space-y-1">
                        <p className="text-sm text-gray-500 font-medium flex items-center gap-2">
                          <MapPin className="h-4 w-4" /> Address
                        </p>
                        <p className="text-base font-semibold text-gray-900">{member.address || 'N/A'}</p>
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
                    </CardHeader>
                    <CardContent className="p-6 grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="space-y-1">
                        <p className="text-sm text-gray-500 font-medium flex items-center gap-2">
                          <Scale className="h-4 w-4" /> Weight
                        </p>
                        <p className="text-base font-semibold text-gray-900">
                          {member.weight ? `${member.weight} ${member.weightUnit}` : 'N/A'}
                        </p>
                      </div>
                      <div className="space-y-1">
                        <p className="text-sm text-gray-500 font-medium flex items-center gap-2">
                          <Ruler className="h-4 w-4" /> Height
                        </p>
                        <p className="text-base font-semibold text-gray-900">
                          {member.height ? `${member.height} ${member.heightUnit}` : 'N/A'}
                        </p>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>

                {/* Emergency Contact Card */}
                {/* Assuming emergency contact might be available in member object if updated properly, 
                    though db type shown was limited. Displaying placeholder if missing or implementing logic. 
                    I'll hide this if no data is available or show N/A */}
                <motion.div variants={itemVariants}>
                  <Card className="border-0 shadow-lg shadow-gray-100/50 bg-white overflow-hidden rounded-2xl">
                    <CardHeader className="bg-gradient-to-r from-gray-50 to-white border-b border-gray-100 pb-4">
                      <div className="flex items-center gap-2">
                        <div className="p-2 bg-[#00bc7d]/10 rounded-lg">
                          <ShieldAlert className="h-5 w-5 text-[#00bc7d]" />
                        </div>
                        <CardTitle className="text-lg text-gray-900">Emergency Contact</CardTitle>
                      </div>
                    </CardHeader>
                    <CardContent className="p-6 grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="space-y-1">
                        <p className="text-sm text-gray-500 font-medium">Contact Name</p>
                        <p className="text-base font-semibold text-gray-900">
                          {member.emergencyContact?.name || 'N/A'}
                        </p>
                      </div>
                      <div className="space-y-1">
                        <p className="text-sm text-gray-500 font-medium">Contact Phone</p>
                        <p className="text-base font-semibold text-gray-900">
                          {member.emergencyContact?.phone || 'N/A'}
                        </p>
                      </div>
                      <div className="space-y-1 md:col-span-2">
                        <p className="text-sm text-gray-500 font-medium">Relationship</p>
                        <p className="text-base font-semibold text-gray-900">
                          {member.emergencyContact?.relationship || 'N/A'}
                        </p>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              </div>

              {/* Right Column - Membership & Summary */}
              <div className="space-y-8">

                {/* Membership Plan Card */}
                <motion.div variants={itemVariants}>
                  <Card className="border-0 shadow-xl shadow-[#00bc7d]/5 bg-white overflow-hidden h-full rounded-2xl relative">
                    <div className="absolute top-0 right-0 p-32 bg-[#00bc7d]/5 rounded-full blur-3xl -mr-16 -mt-16 pointer-events-none" />
                    <CardHeader className="bg-gradient-to-r from-gray-50 to-white border-b border-gray-100 pb-4 relative z-10">
                      <div className="flex items-center gap-2">
                        <div className="p-2 bg-[#00bc7d]/10 rounded-lg">
                          <CreditCard className="h-5 w-5 text-[#00bc7d]" />
                        </div>
                        <CardTitle className="text-lg text-gray-900">Membership Plan</CardTitle>
                      </div>
                    </CardHeader>
                    <CardContent className="p-6 relative z-10 space-y-6">
                      <div className="space-y-2">
                        <p className="text-sm text-gray-500 font-medium">Current Plan</p>
                        <p className="text-2xl font-bold text-[#00bc7d]">{member.membershipType}</p>
                      </div>

                      <div className="p-4 rounded-xl bg-[#00bc7d]/5 border border-[#00bc7d]/10 space-y-3">
                        <div className="flex justify-between items-center">
                          <span className="text-sm text-gray-600">Monthly Fee</span>
                          <span className="text-xl font-bold text-[#00bc7d]">
                            ${getMembershipPrice(member.membershipType)}
                          </span>
                        </div>
                        <div className="flex justify-between items-center pt-2 border-t border-[#00bc7d]/10">
                          <span className="text-sm text-gray-600">Status</span>
                          <Badge className={member.isActive ? "bg-[#00bc7d] hover:bg-[#00bc7d]/90" : "bg-gray-400"}>
                            {member.isActive ? 'Active' : 'Inactive'}
                          </Badge>
                        </div>
                      </div>

                      <div className="space-y-3 pt-2">
                        <div className="flex justify-between text-sm">
                          <span className="text-gray-500">Start Date</span>
                          <span className="font-medium">{member.membershipStartDate.toLocaleDateString()}</span>
                        </div>
                        <div className="flex justify-between text-sm">
                          <span className="text-gray-500">Renewal Date</span>
                          <span className="font-medium">{member.membershipEndDate.toLocaleDateString()}</span>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              </div>
            </motion.div>
          </div>
        </main>
      </motion.div>
    </div>
  );
};

export default MemberView;
