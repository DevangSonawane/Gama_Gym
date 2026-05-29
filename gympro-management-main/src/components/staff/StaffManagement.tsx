import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Staff, UserRole } from '@/types';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
  Search,
  Edit,
  Trash2,
  UserPlus,
  Calendar,
  Phone,
  Mail,
  DollarSign,
  Clock,
  Award,
  Users,
  Sparkles
} from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/lib/supabase';
import { toast } from 'sonner';
import PageLoader from '../ui/PageLoader';

type SupabaseStaffRow = {
  id: string;
  email: string;
  first_name: string;
  last_name: string;
  phone?: string | null;
  role: UserRole;
  created_at: string;
  updated_at: string;
  employee_id?: string | null;
  position: string;
  department: string;
  hire_date?: string | null;
  salary?: string | number | null;
  certifications?: string[] | null;
  specializations?: string[] | null;
  years_experience?: string | number | null;
};
const StaffManagement: React.FC = () => {
  const navigate = useNavigate();
  const { hasRole } = useAuth();
  const [staff, setStaff] = useState<Staff[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedDepartment, setSelectedDepartment] = useState<string>('all');
  const [isLoading, setIsLoading] = useState(true);

  // Helper function to convert Supabase staff to Staff interface
  const mapSupabaseStaffToStaff = (dbStaff: SupabaseStaffRow): Staff => {
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
      schedule: [], // Schedule not stored in staff table
      certifications: dbStaff.certifications || [],
      specializations: dbStaff.specializations || [],
      yearsExperience: dbStaff.years_experience ? parseFloat(String(dbStaff.years_experience)) : 0
    };
  };

  // Fetch staff from Supabase
  useEffect(() => {
    const fetchStaff = async () => {
      try {
        setIsLoading(true);
        const { data, error } = await supabase
          .from('staff')
          .select('*')
          .order('created_at', { ascending: false });

        if (error) {
          console.error('Error fetching staff:', error);
          toast.error('Failed to load staff');
          return;
        }

        if (data) {
          const mappedStaff = data.map(mapSupabaseStaffToStaff);
          setStaff(mappedStaff);
        }
      } catch (error) {
        console.error('Error fetching staff:', error);
        toast.error('Failed to load staff');
      } finally {
        setIsLoading(false);
      }
    };

    fetchStaff();
  }, []);

  if (isLoading) {
    return <PageLoader />;
  }

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

  const getDayName = (dayOfWeek: number) => {
    const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    return days[dayOfWeek];
  };

  const calculateTenure = (hireDate: Date) => {
    const today = new Date();
    const years = today.getFullYear() - hireDate.getFullYear();
    const months = today.getMonth() - hireDate.getMonth() + (today.getDate() < hireDate.getDate() ? -1 : 0);
    const normalizedMonths = (months + 12) % 12;
    if (years <= 0 && normalizedMonths > 0) {
      return `${normalizedMonths} mos`;
    }
    return `${Math.max(0, years)} yrs`;
  };

  const getInitials = (firstName: string, lastName: string) => {
    const first = firstName?.[0] || '';
    const last = lastName?.[0] || '';
    return `${first}${last}`.toUpperCase();
  };

  const filteredStaff = staff.filter(member => {
    const matchesSearch =
      member.firstName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      member.lastName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      member.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      member.employeeId.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesDepartment = selectedDepartment === 'all' || member.department === selectedDepartment;

    return matchesSearch && matchesDepartment;
  });

  const handleDeleteStaff = async (staffId: string) => {
    if (!window.confirm('Are you sure you want to delete this staff member?')) {
      return;
    }

    try {
      const { error } = await supabase
        .from('staff')
        .delete()
        .eq('id', staffId);

      if (error) {
        console.error('Error deleting staff:', error);
        toast.error('Failed to delete staff member');
        return;
      }

      setStaff(prev => prev.filter(s => s.id !== staffId));
      toast.success('Staff member deleted successfully');
    } catch (error) {
      console.error('Error deleting staff:', error);
      toast.error('Failed to delete staff member');
    }
  };



  return (
    <div className="space-y-8">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-3xl font-bold mb-2 text-gray-900 flex items-center gap-2">
            <Sparkles className="h-7 w-7 text-[#00bc7d]" />
            Staff Management
          </h2>
          <p className="text-muted-foreground">Manage gym staff and roles</p>
        </div>
        <div className="flex gap-3">
          <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
            <Button
              className="rounded-xl h-11 px-6 shadow-lg shadow-[#00bc7d]/20 bg-[#00bc7d] hover:bg-[#00bc7d]/90 text-white"
              onClick={() => navigate('/staff/new')}
            >
              <UserPlus className="h-4 w-4 mr-2" />
              Add Staff
            </Button>
          </motion.div>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {[
          { label: 'Total Staff', value: staff.length, icon: Users, color: 'text-[#00bc7d]', bg: 'bg-[#00bc7d]/10', border: 'border-[#00bc7d]/20', delay: 0.1 },
          { label: 'Trainers', value: staff.filter(s => s.role === UserRole.TRAINER).length, icon: UserPlus, color: 'text-blue-600', bg: 'bg-blue-500/10', border: 'border-blue-200', delay: 0.2 },
          { label: 'Support Staff', value: staff.filter(s => s.role === UserRole.STAFF).length, icon: Award, color: 'text-purple-600', bg: 'bg-purple-500/10', border: 'border-purple-200', delay: 0.3 },
          { label: 'Avg. Salary', value: `$${Math.round(staff.reduce((sum, s) => sum + s.salary, 0) / (staff.length || 1)).toLocaleString()}`, icon: DollarSign, color: 'text-orange-600', bg: 'bg-orange-500/10', border: 'border-orange-200', delay: 0.4 },
        ].map((stat, index) => (
          <motion.div
            key={stat.label}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: stat.delay }}
            whileHover={{ scale: 1.02, y: -4 }}
            className="group relative overflow-hidden rounded-3xl bg-white shadow-xl shadow-gray-100/50 border border-gray-100 p-6 transition-all duration-300 hover:shadow-2xl hover:shadow-[#00bc7d]/5"
          >
            <div className="relative">
              <div className="flex items-start justify-between mb-4">
                <div className={`p-3 rounded-2xl ${stat.bg} ${stat.border} border`}>
                  <stat.icon className={`h-6 w-6 ${stat.color}`} />
                </div>
              </div>
              <h3 className="text-sm font-medium text-gray-500 mb-1">{stat.label}</h3>
              <p className="text-3xl font-bold text-gray-900">
                {stat.value}
              </p>
            </div>
          </motion.div>
        ))}
      </div>

      {/* Search and Filters */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="rounded-3xl bg-white shadow-2xl shadow-gray-100/50 border border-gray-100 overflow-hidden"
      >
        <div className="p-6 border-b border-gray-100 flex flex-col md:flex-row justify-between items-center gap-4 bg-gradient-to-r from-white to-gray-50/50">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-[#00bc7d]/10 rounded-xl border border-[#00bc7d]/10">
              <Users className="h-6 w-6 text-[#00bc7d]" />
            </div>
            <div>
              <h3 className="text-xl font-bold text-gray-900">Staff Directory</h3>
              <p className="text-sm text-gray-500">Manage your team members</p>
            </div>
          </div>

          <div className="flex gap-4">
            <div className="relative group">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400 group-focus-within:text-[#00bc7d] transition-colors" />
              <Input
                placeholder="Search staff..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 rounded-xl border-gray-200 h-11 bg-white focus:ring-2 focus:ring-[#00bc7d]/20 focus:border-[#00bc7d] transition-all shadow-sm w-64"
              />
            </div>
            <Select value={selectedDepartment} onValueChange={setSelectedDepartment}>
              <SelectTrigger className="w-48 rounded-xl border-gray-200 h-11 bg-white focus:ring-2 focus:ring-[#00bc7d]/20 focus:border-[#00bc7d] shadow-sm">
                <SelectValue placeholder="Filter by Department" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Departments</SelectItem>
                <SelectItem value="Fitness">Fitness</SelectItem>
                <SelectItem value="Operations">Operations</SelectItem>
                <SelectItem value="Management">Management</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="p-6">
          {filteredStaff.length === 0 ? (
            <div className="text-center py-16 text-gray-500">
              <div className="flex flex-col items-center gap-3">
                <div className="p-4 bg-gray-50 rounded-full border border-gray-100">
                  <Users className="h-8 w-8 text-gray-400" />
                </div>
                <p className="text-lg font-medium text-gray-900">No staff members found</p>
                <p className="text-sm text-gray-500">Try adjusting your search or filters.</p>
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
              {filteredStaff.map((staffMember, index) => {
                const tenureYears = calculateTenure(staffMember.hireDate);
                const experienceLabel = `${Math.max(0, staffMember.yearsExperience || 0)} yrs`;
                const salaryLabel = staffMember.salary ? `$${staffMember.salary.toLocaleString()}` : 'N/A';

                return (
                  <motion.div
                    key={staffMember.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.03 }}
                    className="rounded-3xl bg-white border border-gray-100 shadow-xl shadow-gray-100/50 p-6 flex flex-col gap-5"
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-4">
                        <Avatar className="h-14 w-14 ring-2 ring-white shadow-md">
                          <AvatarImage src={staffMember.avatar} />
                          <AvatarFallback className="bg-gradient-to-br from-[#00bc7d] to-[#009664] text-white font-bold text-lg">
                            {getInitials(staffMember.firstName, staffMember.lastName)}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <p className="text-lg font-bold text-gray-900">
                            {staffMember.firstName} {staffMember.lastName}
                          </p>
                          <p className="text-sm text-gray-500">{staffMember.position || staffMember.department}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-1">
                        {hasRole(UserRole.MANAGER) && (
                          <>
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => navigate(`/staff/${staffMember.id}/edit`)}
                              className="h-9 w-9 rounded-xl text-gray-500 hover:bg-[#00bc7d]/10 hover:text-[#00bc7d] transition-all"
                              title="Edit Staff"
                            >
                              <Edit className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => handleDeleteStaff(staffMember.id)}
                              className="h-9 w-9 rounded-xl text-gray-500 hover:bg-red-50 hover:text-red-600 transition-all"
                              title="Delete Staff"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center gap-2 text-sm">
                      <Badge className={`${getRoleColor(staffMember.role)} border px-2.5 py-0.5 rounded-full text-xs font-semibold`}>
                        {staffMember.role}
                      </Badge>
                      <Badge className={`${getDepartmentColor(staffMember.department)} border px-2.5 py-0.5 rounded-full text-xs font-semibold`}>
                        {staffMember.department}
                      </Badge>
                    </div>
                    {staffMember.specializations && staffMember.specializations.length > 0 && (
                      <div className="flex flex-wrap gap-2 mt-1">
                        {staffMember.specializations.map((spec, i) => (
                          <Badge key={i} className="bg-[#00bc7d]/10 text-[#00bc7d] border-[#00bc7d]/20 border px-2.5 py-0.5 rounded-full text-xs font-semibold">
                            {spec}
                          </Badge>
                        ))}
                      </div>
                    )}

                    <div className="grid grid-cols-2 gap-3">
                      <div className="rounded-2xl bg-gray-50 border border-gray-100 p-3">
                        <div className="flex items-center gap-2 text-gray-900 font-semibold">
                          <Clock className="h-4 w-4 text-[#00bc7d]" />
                          {experienceLabel}
                        </div>
                        <p className="text-xs text-gray-500">Experience</p>
                      </div>
                      <div className="rounded-2xl bg-gray-50 border border-gray-100 p-3">
                        <div className="flex items-center gap-2 text-gray-900 font-semibold">
                          <DollarSign className="h-4 w-4 text-[#00bc7d]" />
                          {salaryLabel}
                        </div>
                        <p className="text-xs text-gray-500">Salary</p>
                      </div>
                    </div>

                    <div className="space-y-2 text-sm text-gray-600">
                      <div className="flex items-center gap-2">
                        <Mail className="h-4 w-4 text-gray-400" />
                        <span>{staffMember.email}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Phone className="h-4 w-4 text-gray-400" />
                        <span>{staffMember.phone || 'N/A'}</span>
                      </div>
                    </div>

                    <div className="flex items-center gap-3">
                      <Button
                        variant="outline"
                        className="flex-1 rounded-xl h-11 border-gray-200 text-gray-700 hover:border-[#00bc7d] hover:text-[#00bc7d] hover:bg-[#00bc7d]/5"
                        onClick={() => navigate(`/staff/${staffMember.id}`)}
                      >
                        <Calendar className="h-4 w-4 mr-2" />
                        Schedule
                      </Button>
                      <Button
                        className="flex-1 rounded-xl h-11 bg-[#00bc7d] hover:bg-[#00bc7d]/90 text-white shadow-lg shadow-[#00bc7d]/20"
                        onClick={() => navigate(`/staff/${staffMember.id}`)}
                      >
                        View Profile
                      </Button>
                    </div>
                  </motion.div>
                );
              })}
            </div>
          )}
        </div>
      </motion.div>
    </div>
  );
};

export default StaffManagement;
