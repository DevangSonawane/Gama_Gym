import React, { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useAuth } from '@/hooks/useAuth';
import { Staff, UserRole, WorkSchedule } from '@/types';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { supabase } from '@/lib/supabase';
import { toast } from 'sonner';
import Sidebar from '@/components/layout/Sidebar';
import Topbar from '@/components/layout/Topbar';
import {
  ArrowLeft,
  User,
  Briefcase,
  Mail,
  Phone,
  Calendar,
  DollarSign,
  Award,
  Clock,
  Edit,
  Building2,
  CheckCircle2,
  MapPin,
  Sparkles
} from 'lucide-react';

type DbStaff = {
  id: string;
  email: string;
  first_name: string;
  last_name: string;
  phone?: string | null;
  role: string;
  created_at: string;
  updated_at: string;
  employee_id?: string | null;
  position: string;
  department: string;
  hire_date?: string | null;
  salary?: string | number | null;
  certifications?: string[] | null;
  specializations?: string[] | null;
};

const mapSupabaseStaffToStaff = (dbStaff: DbStaff): Staff => {
  return {
    id: dbStaff.id,
    email: dbStaff.email,
    firstName: dbStaff.first_name,
    lastName: dbStaff.last_name,
    phone: dbStaff.phone || '',
    role: dbStaff.role as UserRole,
    createdAt: new Date(dbStaff.created_at),
    updatedAt: new Date(dbStaff.updated_at),
    employeeId: dbStaff.employee_id || '',
    position: dbStaff.position,
    department: dbStaff.department,
    hireDate: dbStaff.hire_date ? new Date(dbStaff.hire_date) : new Date(),
    salary: dbStaff.salary ? parseFloat(String(dbStaff.salary)) : 0,
    schedule: [], // Schedule fetching would be separate if needed, or we can assume empty for now as it's not in the main table query in StaffManagement
    certifications: dbStaff.certifications || [],
    specializations: dbStaff.specializations || []
  };
};

const getDepartmentColor = (department: string) => {
  switch (department) {
    case 'Fitness':
      return 'bg-[#00bc7d]/10 text-[#00bc7d] border-[#00bc7d]/20';
    case 'Operations':
      return 'bg-blue-500/10 text-blue-700 border-blue-200';
    case 'Management':
      return 'bg-purple-500/10 text-purple-700 border-purple-200';
    default:
      return 'bg-gray-500/10 text-gray-700 border-gray-200';
  }
};

const getRoleColor = (role: UserRole) => {
  switch (role) {
    case UserRole.TRAINER:
      return 'bg-[#00bc7d]/10 text-[#00bc7d] border-[#00bc7d]/20';
    case UserRole.STAFF:
      return 'bg-blue-500/10 text-blue-700 border-blue-200';
    case UserRole.MANAGER:
      return 'bg-purple-500/10 text-purple-700 border-purple-200';
    default:
      return 'bg-gray-500/10 text-gray-700 border-gray-200';
  }
};

const StaffView: React.FC = () => {
  const { hasRole } = useAuth();
  const navigate = useNavigate();
  const { id } = useParams();
  const [staff, setStaff] = useState<Staff | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(() => {
    const saved = localStorage.getItem('sidebar-collapsed');
    return saved ? JSON.parse(saved) : false;
  });

  useEffect(() => {
    const fetchStaff = async () => {
      try {
        const { data, error } = await supabase.from('staff').select('*').eq('id', id).single();
        if (error) {
          toast.error('Failed to load staff member');
          return;
        }
        setStaff(mapSupabaseStaffToStaff(data as DbStaff));
      } catch {
        toast.error('Failed to load staff member');
      } finally {
        setIsLoading(false);
      }
    };
    if (id) fetchStaff();
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
          <p className="text-gray-500 font-medium">Loading staff details...</p>
        </div>
      </div>
    );
  }

  if (!staff) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Staff Member Not Found</h2>
          <Button onClick={() => navigate('/dashboard?tab=staff')} variant="outline">
            Return to Staff List
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
                      {staff.firstName} {staff.lastName}
                    </h2>
                    <div className="flex items-center gap-2 mt-1">
                      <Badge className={getRoleColor(staff.role)}>
                        {staff.role}
                      </Badge>
                      <Badge className={getDepartmentColor(staff.department)}>
                        {staff.department}
                      </Badge>
                      <span className="text-sm text-gray-500 ml-1">Joined {staff.hireDate.toLocaleDateString()}</span>
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
                  onClick={() => navigate('/dashboard?tab=staff')}
                  className="group hover:border-[#00bc7d] hover:text-[#00bc7d] hover:bg-[#00bc7d]/5 rounded-xl border-gray-200"
                >
                  <ArrowLeft className="h-4 w-4 mr-2 group-hover:-translate-x-1 transition-transform" />
                  Back
                </Button>
                {(hasRole(UserRole.ADMIN) || hasRole(UserRole.MANAGER)) && (
                  <Button
                    onClick={() => navigate(`/staff/${staff.id}/edit`)}
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
                        <p className="text-base font-semibold text-gray-900">{staff.email}</p>
                      </div>
                      <div className="space-y-1">
                        <p className="text-sm text-gray-500 font-medium flex items-center gap-2">
                          <Phone className="h-4 w-4" /> Phone Number
                        </p>
                        <p className="text-base font-semibold text-gray-900">{staff.phone || 'N/A'}</p>
                      </div>
                      <div className="space-y-1">
                        <p className="text-sm text-gray-500 font-medium flex items-center gap-2">
                          <Sparkles className="h-4 w-4" /> Employee ID
                        </p>
                        <p className="text-base font-semibold text-gray-900">{staff.employeeId || 'N/A'}</p>
                      </div>
                      <div className="space-y-1">
                        <p className="text-sm text-gray-500 font-medium flex items-center gap-2">
                          <MapPin className="h-4 w-4" /> Location
                        </p>
                        <p className="text-base font-semibold text-gray-900">Main Branch</p>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>

                {/* Professional Details Card */}
                <motion.div variants={itemVariants}>
                  <Card className="border-0 shadow-lg shadow-gray-100/50 bg-white overflow-hidden rounded-2xl">
                    <CardHeader className="bg-gradient-to-r from-gray-50 to-white border-b border-gray-100 pb-4">
                      <div className="flex items-center gap-2">
                        <div className="p-2 bg-[#00bc7d]/10 rounded-lg">
                          <Briefcase className="h-5 w-5 text-[#00bc7d]" />
                        </div>
                        <CardTitle className="text-lg text-gray-900">Professional Details</CardTitle>
                      </div>
                    </CardHeader>
                    <CardContent className="p-6 grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="space-y-1">
                        <p className="text-sm text-gray-500 font-medium flex items-center gap-2">
                          <Award className="h-4 w-4" /> Position
                        </p>
                        <p className="text-base font-semibold text-gray-900">{staff.position}</p>
                      </div>
                      <div className="space-y-1">
                        <p className="text-sm text-gray-500 font-medium flex items-center gap-2">
                          <Building2 className="h-4 w-4" /> Department
                        </p>
                        <p className="text-base font-semibold text-gray-900">{staff.department}</p>
                      </div>
                      <div className="space-y-1">
                        <p className="text-sm text-gray-500 font-medium flex items-center gap-2">
                          <Calendar className="h-4 w-4" /> Hire Date
                        </p>
                        <p className="text-base font-semibold text-gray-900">{staff.hireDate.toLocaleDateString()}</p>
                      </div>
                      {(hasRole(UserRole.ADMIN) || hasRole(UserRole.MANAGER)) && (
                        <div className="space-y-1">
                          <p className="text-sm text-gray-500 font-medium flex items-center gap-2">
                            <DollarSign className="h-4 w-4" /> Salary
                          </p>
                          <p className="text-base font-semibold text-gray-900">${staff.salary.toLocaleString()}/year</p>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                </motion.div>

                {/* Certifications & Specializations */}
                <motion.div variants={itemVariants}>
                  <Card className="border-0 shadow-lg shadow-gray-100/50 bg-white overflow-hidden rounded-2xl">
                    <CardHeader className="bg-gradient-to-r from-gray-50 to-white border-b border-gray-100 pb-4">
                      <div className="flex items-center gap-2">
                        <div className="p-2 bg-[#00bc7d]/10 rounded-lg">
                          <Award className="h-5 w-5 text-[#00bc7d]" />
                        </div>
                        <CardTitle className="text-lg text-gray-900">Skills & Qualifications</CardTitle>
                      </div>
                    </CardHeader>
                    <CardContent className="p-6 grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="space-y-3">
                        <h4 className="text-sm font-medium text-gray-500">Certifications</h4>
                        <div className="flex flex-wrap gap-2">
                          {staff.certifications && staff.certifications.length > 0 ? (
                            staff.certifications.map((cert, i) => (
                              <Badge key={i} variant="secondary" className="bg-blue-50 text-blue-700 hover:bg-blue-100 border-blue-200">
                                {cert}
                              </Badge>
                            ))
                          ) : (
                            <span className="text-gray-400 text-sm italic">No certifications listed</span>
                          )}
                        </div>
                      </div>
                      <div className="space-y-3">
                        <h4 className="text-sm font-medium text-gray-500">Specializations</h4>
                        <div className="flex flex-wrap gap-2">
                          {staff.specializations && staff.specializations.length > 0 ? (
                            staff.specializations.map((spec, i) => (
                              <Badge key={i} variant="secondary" className="bg-[#00bc7d]/10 text-[#00bc7d] hover:bg-[#00bc7d]/20 border-[#00bc7d]/20">
                                {spec}
                              </Badge>
                            ))
                          ) : (
                            <span className="text-gray-400 text-sm italic">No specializations listed</span>
                          )}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              </div>

              {/* Right Column - Status & Schedule */}
              <div className="space-y-8">

                {/* Status Card */}
                <motion.div variants={itemVariants}>
                  <Card className="border-0 shadow-xl shadow-[#00bc7d]/5 bg-white overflow-hidden h-full rounded-2xl relative">
                    <div className="absolute top-0 right-0 p-32 bg-[#00bc7d]/5 rounded-full blur-3xl -mr-16 -mt-16 pointer-events-none" />
                    <CardHeader className="bg-gradient-to-r from-gray-50 to-white border-b border-gray-100 pb-4 relative z-10">
                      <div className="flex items-center gap-2">
                        <div className="p-2 bg-[#00bc7d]/10 rounded-lg">
                          <CheckCircle2 className="h-5 w-5 text-[#00bc7d]" />
                        </div>
                        <CardTitle className="text-lg text-gray-900">Employment Status</CardTitle>
                      </div>
                    </CardHeader>
                    <CardContent className="p-6 relative z-10 space-y-6">
                      <div className="space-y-2">
                        <p className="text-sm text-gray-500 font-medium">Current Role</p>
                        <p className="text-2xl font-bold text-[#00bc7d]">{staff.role}</p>
                      </div>

                      <div className="p-4 rounded-xl bg-[#00bc7d]/5 border border-[#00bc7d]/10 space-y-3">
                        <div className="flex justify-between items-center">
                          <span className="text-sm text-gray-600">Department</span>
                          <span className="text-base font-semibold text-[#00bc7d]">
                            {staff.department}
                          </span>
                        </div>
                        <div className="flex justify-between items-center pt-2 border-t border-[#00bc7d]/10">
                          <span className="text-sm text-gray-600">Status</span>
                          <Badge className="bg-[#00bc7d] hover:bg-[#00bc7d]/90">
                            Active
                          </Badge>
                        </div>
                      </div>

                      <div className="space-y-3 pt-2">
                        <div className="flex justify-between text-sm">
                          <span className="text-gray-500">Started</span>
                          <span className="font-medium">{staff.hireDate.toLocaleDateString()}</span>
                        </div>
                        <div className="flex justify-between text-sm">
                          <span className="text-gray-500">Last Updated</span>
                          <span className="font-medium">{staff.updatedAt.toLocaleDateString()}</span>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>

                {/* Schedule Placeholder */}
                <motion.div variants={itemVariants}>
                  <Card className="border-0 shadow-lg shadow-gray-100/50 bg-white overflow-hidden rounded-2xl">
                    <CardHeader className="bg-gradient-to-r from-gray-50 to-white border-b border-gray-100 pb-4">
                      <div className="flex items-center gap-2">
                        <div className="p-2 bg-[#00bc7d]/10 rounded-lg">
                          <Clock className="h-5 w-5 text-[#00bc7d]" />
                        </div>
                        <CardTitle className="text-lg text-gray-900">Schedule</CardTitle>
                      </div>
                    </CardHeader>
                    <CardContent className="p-6">
                      <div className="text-center py-6">
                         <Calendar className="h-10 w-10 text-gray-300 mx-auto mb-3" />
                         <p className="text-gray-500 text-sm">Schedule management coming soon</p>
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

export default StaffView;
