import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useAuth } from '@/hooks/useAuth';
import { UserRole } from '@/types';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import { toast } from 'sonner';
import Sidebar from '@/components/layout/Sidebar';
import Topbar from '@/components/layout/Topbar';
import { 
  ArrowLeft, 
  UserPlus, 
  Briefcase, 
  DollarSign, 
  Phone, 
  Mail, 
  CheckCircle2, 
  ShieldCheck,
  Building2
} from 'lucide-react';
import { supabase, DEFAULT_GYM_ID } from '@/lib/supabase';

const StaffCreate: React.FC = () => {
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
    position: '',
    department: '',
    salary: '',
    role: UserRole.STAFF,
    bio: '',
    specializations: '',
    yearsExperience: ''
  });

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
      const employeeId = `EMP${String(Date.now()).slice(-3)}`;
      
      const specializationsArray = formData.specializations
        .split(',')
        .map(s => s.trim())
        .filter(s => s.length > 0);

      const { error } = await supabase
        .from('staff')
        .insert({
          gym_id: DEFAULT_GYM_ID,
          first_name: formData.firstName,
          last_name: formData.lastName,
          email: formData.email,
          phone: formData.phone || null,
          employee_id: employeeId,
          position: formData.position,
          department: formData.department,
          role: formData.role,
          salary: parseFloat(formData.salary).toString(),
          hire_date: new Date().toISOString().split('T')[0],
          certifications: [],
          specializations: specializationsArray,
          bio: formData.bio || null,
          years_experience: formData.yearsExperience ? parseFloat(formData.yearsExperience) : 0
        });

      if (error) {
        console.error('Error creating staff:', error);
        toast.error(error.message || 'Failed to create staff member');
        return;
      }

      toast.success('Staff member added successfully');
      navigate('/dashboard?tab=staff');
    } catch (error) {
      console.error('Error creating staff:', error);
      toast.error('Failed to create staff member');
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex">
      <Sidebar 
        isCollapsed={isSidebarCollapsed} 
        onToggle={() => setIsSidebarCollapsed(!isSidebarCollapsed)} 
      />
      
      <div className={`flex-1 flex flex-col transition-all duration-300 ${isSidebarCollapsed ? 'ml-[80px]' : 'ml-[280px]'}`}>
        <Topbar
          isSidebarCollapsed={isSidebarCollapsed}
          onToggleSidebar={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
        />
        
        <main className="flex-1 p-8 overflow-y-auto">
          <div className="max-w-5xl mx-auto space-y-8">
            
            {/* Header */}
            <motion.div 
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              className="flex items-center justify-between"
            >
              <div>
                <Button 
                  variant="outline" 
                  className="mb-4 pl-0 hover:bg-transparent hover:text-[#00bc7d] transition-colors border-none"
                  onClick={() => navigate('/dashboard?tab=staff')}
                >
                  <ArrowLeft className="mr-2 h-4 w-4" />
                  Back to Staff
                </Button>
                <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
                  <div className="p-3 rounded-xl bg-[#00bc7d] text-white shadow-lg shadow-[#00bc7d]/20">
                    <UserPlus className="h-6 w-6" />
                  </div>
                  Add Staff Member
                </h1>
                <p className="text-muted-foreground mt-2 ml-16">
                  Onboard a new employee, trainer, or manager.
                </p>
              </div>
            </motion.div>

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
                            onChange={(e) => setFormData({...formData, firstName: e.target.value})}
                            className="h-11 focus-visible:ring-[#00bc7d] rounded-xl border-gray-200"
                            required
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="lastName">Last Name</Label>
                          <Input 
                            id="lastName" 
                            value={formData.lastName}
                            onChange={(e) => setFormData({...formData, lastName: e.target.value})}
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
                              onChange={(e) => setFormData({...formData, email: e.target.value})}
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
                              onChange={(e) => setFormData({...formData, phone: e.target.value})}
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
                            onChange={(e) => setFormData({...formData, position: e.target.value})}
                            className="h-11 focus-visible:ring-[#00bc7d] rounded-xl border-gray-200"
                            required
                          />
                        </div>

                        <div className="space-y-2">
                          <Label htmlFor="department">Department</Label>
                          <Select 
                            value={formData.department} 
                            onValueChange={(value) => setFormData({...formData, department: value})}
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
                            onValueChange={(value) => setFormData({...formData, role: value as UserRole})}
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
                            onChange={(e) => setFormData({...formData, salary: e.target.value})}
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
                        Create Staff Member
                        <CheckCircle2 className="ml-2 h-5 w-5" />
                      </Button>
                    </CardContent>
                  </Card>
                </motion.div>
              </div>
            </motion.form>
          </div>
        </main>
      </div>
    </div>
  );
};

export default StaffCreate;
