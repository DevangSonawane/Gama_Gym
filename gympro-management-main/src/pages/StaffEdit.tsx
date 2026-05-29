import React, { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useAuth } from '@/hooks/useAuth';
import { Staff, UserRole } from '@/types';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { supabase } from '@/lib/supabase';
import { toast } from 'sonner';
import Sidebar from '@/components/layout/Sidebar';
import Topbar from '@/components/layout/Topbar';
import {
  ArrowLeft,
  UserCheck,
  Briefcase,
  DollarSign,
  Phone,
  Mail,
  CheckCircle2,
  ShieldCheck,
  Building2
} from 'lucide-react';

type DbStaff = {
  id: string;
  first_name: string;
  last_name: string;
  email: string;
  phone?: string | null;
  position: string;
  department: string;
  role: string;
  salary?: string | number | null;
  created_at: string;
  updated_at: string;
  employee_id?: string | null;
  hire_date?: string | null;
  certifications?: string[] | null;
  specializations?: string[] | null;
  years_experience?: string | number | null;
};

const mapSupabaseStaffToStaff = (dbStaff: DbStaff): Staff => {
  return {
    id: dbStaff.id,
    email: dbStaff.email,
    firstName: dbStaff.first_name,
    lastName: dbStaff.last_name,
    phone: dbStaff.phone || '',
    position: dbStaff.position,
    department: dbStaff.department,
    salary: dbStaff.salary ? parseFloat(String(dbStaff.salary)) : 0,
    role: (dbStaff.role ? dbStaff.role.toUpperCase() : UserRole.STAFF) as UserRole,
    hireDate: dbStaff.hire_date ? new Date(dbStaff.hire_date) : new Date(),
    employeeId: dbStaff.employee_id || '',
    schedule: [],
    certifications: dbStaff.certifications || [],
    specializations: dbStaff.specializations || [],
    yearsExperience: dbStaff.years_experience ? parseFloat(String(dbStaff.years_experience)) : 0,
    createdAt: new Date(dbStaff.created_at),
    updatedAt: new Date(dbStaff.updated_at)
  };
};

const StaffEdit: React.FC = () => {
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

  const allowed = hasRole(UserRole.ADMIN) || hasRole(UserRole.MANAGER);

  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    position: '',
    department: '',
    salary: '',
    role: UserRole.STAFF as UserRole,
    bio: '',
    specializations: '',
    yearsExperience: ''
  });

  useEffect(() => {
    if (staff) {
      setFormData({
        firstName: staff.firstName,
        lastName: staff.lastName,
        email: staff.email,
        phone: staff.phone || '',
        position: staff.position,
        department: staff.department,
        salary: staff.salary.toString(),
        role: staff.role,
        bio: staff.bio || '',
        specializations: staff.specializations ? staff.specializations.join(', ') : '',
        yearsExperience: String(staff.yearsExperience ?? '')
      });
    }
  }, [staff]);

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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const specializationsArray = formData.specializations
        .split(',')
        .map(s => s.trim())
        .filter(s => s.length > 0);

      const { error } = await supabase
        .from('staff')
        .update({
          first_name: formData.firstName,
          last_name: formData.lastName,
          email: formData.email,
          phone: formData.phone || null,
          position: formData.position,
          department: formData.department,
          salary: parseFloat(formData.salary), // Ensure number is sent
          role: formData.role, // Remove unnecessary toUpperCase if it's already enum
          bio: formData.bio || null,
          specializations: specializationsArray,
          years_experience: formData.yearsExperience ? parseFloat(formData.yearsExperience) : 0,
          updated_at: new Date().toISOString()
        })
        .eq('id', staff?.id);
      if (error) {
        console.error('Update error:', error);
        toast.error(`Failed to update staff member: ${error.message}`);
        return;
      }
      toast.success('Staff member updated successfully');
      navigate('/dashboard?tab=staff');
    } catch (err) {
      console.error('Unexpected error:', err);
      toast.error('Failed to update staff member');
    }
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

            {/* Header */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
              <div>
                <motion.h1
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  className="text-3xl font-bold mb-2 text-gray-900 flex items-center gap-3"
                >
                  <div className="p-3 bg-[#00bc7d] rounded-xl shadow-lg shadow-[#00bc7d]/20">
                    <UserCheck className="h-6 w-6 text-white" />
                  </div>
                  Edit Staff Member
                </motion.h1>
                <motion.p
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.1 }}
                  className="text-muted-foreground ml-16"
                >
                  Update information for {staff ? `${staff.firstName} ${staff.lastName}` : 'staff member'}.
                </motion.p>
              </div>
              <motion.div
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
              >
                <Button
                  variant="outline"
                  onClick={() => navigate('/dashboard?tab=staff')}
                  className="group hover:border-[#00bc7d] hover:text-[#00bc7d] hover:bg-[#00bc7d]/5 rounded-xl border-gray-200"
                >
                  <ArrowLeft className="h-4 w-4 mr-2 group-hover:-translate-x-1 transition-transform" />
                  Back to Staff
                </Button>
              </motion.div>
            </div>

            {!allowed ? (
              <div className="p-6 text-center text-muted-foreground">Access denied</div>
            ) : isLoading ? (
              <div className="p-6 text-center">Loading...</div>
            ) : !staff ? (
              <div className="p-6 text-center">Staff member not found</div>
            ) : (
              <motion.form
                variants={containerVariants}
                initial="hidden"
                animate="visible"
                onSubmit={handleSubmit}
                className="grid grid-cols-1 lg:grid-cols-3 gap-8"
              >
                {/* Left Column - Main Info */}
                <div className="lg:col-span-2 space-y-8">

                  {/* Personal Information */}
                  <motion.div variants={itemVariants}>
                    <Card className="border-0 shadow-lg shadow-gray-100/50 bg-white overflow-hidden rounded-2xl">
                      <CardHeader className="bg-gradient-to-r from-gray-50 to-white border-b border-gray-100 pb-4">
                        <div className="flex items-center gap-2">
                          <div className="p-2 bg-[#00bc7d]/10 rounded-lg">
                            <ShieldCheck className="h-5 w-5 text-[#00bc7d]" />
                          </div>
                          <CardTitle className="text-lg font-semibold text-gray-900">Personal Information</CardTitle>
                        </div>
                      </CardHeader>
                      <CardContent className="p-6 space-y-6">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                          <div className="space-y-2">
                            <Label htmlFor="firstName">First Name</Label>
                            <Input
                              id="firstName"
                              value={formData.firstName}
                              onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                              className="h-11 focus-visible:ring-[#00bc7d] rounded-xl border-gray-200"
                              required
                            />
                          </div>
                          <div className="space-y-2">
                            <Label htmlFor="lastName">Last Name</Label>
                            <Input
                              id="lastName"
                              value={formData.lastName}
                              onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                              className="h-11 focus-visible:ring-[#00bc7d] rounded-xl border-gray-200"
                              required
                            />
                          </div>

                          <div className="space-y-2">
                            <Label htmlFor="email">Email Address</Label>
                            <div className="relative">
                              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                              <Input
                                id="email"
                                type="email"
                                value={formData.email}
                                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                                className="pl-10 h-11 focus-visible:ring-[#00bc7d] rounded-xl border-gray-200"
                                required
                              />
                            </div>
                          </div>

                          <div className="space-y-2">
                            <Label htmlFor="phone">Phone Number</Label>
                            <div className="relative">
                              <Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                              <Input
                                id="phone"
                                value={formData.phone}
                                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                                className="pl-10 h-11 focus-visible:ring-[#00bc7d] rounded-xl border-gray-200"
                                required
                              />
                            </div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </motion.div>

                  {/* Employment Details */}
                  <motion.div variants={itemVariants}>
                    <Card className="border-0 shadow-lg shadow-gray-100/50 bg-white overflow-hidden rounded-2xl">
                      <CardHeader className="bg-gradient-to-r from-gray-50 to-white border-b border-gray-100 pb-4">
                        <div className="flex items-center gap-2">
                          <div className="p-2 bg-[#00bc7d]/10 rounded-lg">
                            <Briefcase className="h-5 w-5 text-[#00bc7d]" />
                          </div>
                          <CardTitle className="text-lg font-semibold text-gray-900">Employment Details</CardTitle>
                        </div>
                      </CardHeader>
                      <CardContent className="p-6 space-y-6">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                          <div className="space-y-2">
                            <Label htmlFor="position">Position Title</Label>
                            <Input
                              id="position"
                              placeholder="e.g. Senior Trainer"
                              value={formData.position}
                              onChange={(e) => setFormData({ ...formData, position: e.target.value })}
                              className="h-11 focus-visible:ring-[#00bc7d] rounded-xl border-gray-200"
                              required
                            />
                          </div>

                          <div className="space-y-2">
                            <Label htmlFor="department">Department</Label>
                            <Select
                              value={formData.department}
                              onValueChange={(value) => setFormData({ ...formData, department: value })}
                            >
                              <SelectTrigger className="h-11 focus:ring-[#00bc7d] rounded-xl border-gray-200">
                                <SelectValue placeholder="Select Department" />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="Fitness">Fitness</SelectItem>
                                <SelectItem value="Operations">Operations</SelectItem>
                                <SelectItem value="Management">Management</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>

                          <div className="space-y-2">
                            <Label htmlFor="role">System Role</Label>
                            <Select
                              value={formData.role}
                              onValueChange={(value) => setFormData({ ...formData, role: value as UserRole })}
                            >
                              <SelectTrigger className="h-11 focus:ring-[#00bc7d] rounded-xl border-gray-200">
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value={UserRole.TRAINER}>Trainer</SelectItem>
                                <SelectItem value={UserRole.STAFF}>Staff</SelectItem>
                                <SelectItem value={UserRole.MANAGER}>Manager</SelectItem>
                              </SelectContent>
                            </Select>
                        </div>
                      </div>

                      {formData.role === UserRole.TRAINER && (
                        <div className="space-y-6 pt-6 border-t border-gray-100">
                          <div className="space-y-2">
                            <Label htmlFor="specializations">Specializations</Label>
                            <Input 
                              id="specializations" 
                              placeholder="e.g. HIIT, Yoga, Weight Training (comma separated)"
                              value={formData.specializations}
                              onChange={(e) => setFormData({...formData, specializations: e.target.value})}
                              className="h-11 focus-visible:ring-[#00bc7d] rounded-xl border-gray-200"
                            />
                            <p className="text-xs text-muted-foreground">Separate multiple specializations with commas</p>
                          </div>

                          <div className="space-y-2">
                        <Label htmlFor="yearsExperience">Years of Experience</Label>
                        <Input
                          id="yearsExperience"
                          type="number"
                          placeholder="e.g. 3"
                          value={formData.yearsExperience}
                          onChange={(e) => setFormData({ ...formData, yearsExperience: e.target.value })}
                          className="h-11 focus-visible:ring-[#00bc7d] rounded-xl border-gray-200"
                        />
                        <p className="text-xs text-muted-foreground">Specify total professional experience</p>
                      </div>

                      <div className="space-y-2">
                            <Label htmlFor="bio">Professional Bio</Label>
                            <Textarea 
                              id="bio" 
                              placeholder="Brief professional biography..."
                              value={formData.bio}
                              onChange={(e) => setFormData({...formData, bio: e.target.value})}
                              className="min-h-[100px] focus-visible:ring-[#00bc7d] rounded-xl border-gray-200 resize-none"
                            />
                          </div>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                </motion.div>
                </div>

                {/* Right Column - Compensation & Summary */}
                <div className="space-y-8">

                  {/* Compensation Card */}
                  <motion.div variants={itemVariants}>
                    <Card className="border-0 shadow-lg shadow-gray-100/50 bg-white overflow-hidden rounded-2xl h-full">
                      <CardHeader className="bg-gradient-to-r from-gray-50 to-white border-b border-gray-100 pb-4">
                        <div className="flex items-center gap-2">
                          <div className="p-2 bg-[#00bc7d]/10 rounded-lg">
                            <DollarSign className="h-5 w-5 text-[#00bc7d]" />
                          </div>
                          <CardTitle className="text-lg text-gray-900">Compensation</CardTitle>
                        </div>
                        <CardDescription>Set salary and benefits</CardDescription>
                      </CardHeader>
                      <CardContent className="p-6 space-y-6">
                        <div className="space-y-2">
                          <Label htmlFor="salary">Annual Salary ($)</Label>
                          <div className="relative">
                            <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-500" />
                            <Input
                              id="salary"
                              type="number"
                              value={formData.salary}
                              onChange={(e) => setFormData({ ...formData, salary: e.target.value })}
                              className="pl-10 h-11 focus-visible:ring-[#00bc7d] rounded-xl border-gray-200 text-lg font-semibold"
                              placeholder="0.00"
                              required
                            />
                          </div>
                        </div>

                        <div className="bg-[#00bc7d]/5 rounded-xl p-4 border border-[#00bc7d]/10">
                          <h4 className="font-semibold text-[#00bc7d] mb-2 flex items-center gap-2">
                            <Building2 className="h-4 w-4" />
                            Gym Access
                          </h4>
                          <p className="text-sm text-gray-600">
                            Staff members receive full gym access and employee benefits automatically.
                          </p>
                        </div>
                      </CardContent>
                    </Card>
                  </motion.div>

                  {/* Summary / Actions */}
                  <motion.div variants={itemVariants}>
                    <Card className="border-0 shadow-xl shadow-[#00bc7d]/5 bg-white overflow-hidden rounded-2xl relative">
                      <div className="absolute top-0 right-0 p-32 bg-[#00bc7d]/5 rounded-full blur-3xl -mr-16 -mt-16 pointer-events-none" />
                      <CardContent className="p-6 relative">
                        <div className="flex items-center justify-between mb-4">
                          <span className="text-sm font-medium text-gray-500">Department</span>
                          <span className="text-lg font-bold text-gray-900">{formData.department || '-'}</span>
                        </div>
                        <div className="flex items-center justify-between mb-6">
                          <span className="text-sm font-medium text-gray-500">Role</span>
                          <span className="text-lg font-bold text-gray-900">{formData.role}</span>
                        </div>

                        <Button
                          type="submit"
                          className="w-full h-12 text-lg font-semibold bg-[#00bc7d] hover:bg-[#00bc7d]/90 shadow-lg shadow-[#00bc7d]/20 rounded-xl"
                        >
                          Update Staff Member
                          <CheckCircle2 className="ml-2 h-5 w-5" />
                        </Button>
                      </CardContent>
                    </Card>
                  </motion.div>
                </div>
              </motion.form>
            )}
          </div>
        </main>
      </motion.div>
    </div>
  );
};

export default StaffEdit;
