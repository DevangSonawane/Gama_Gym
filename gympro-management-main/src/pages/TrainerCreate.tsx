import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  ArrowLeft,
  UserPlus,
  Dumbbell,
  Phone,
  Mail,
  CheckCircle2,
  ShieldCheck,
  Lock,
  Eye,
  EyeOff
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import Sidebar from '@/components/layout/Sidebar';
import Topbar from '@/components/layout/Topbar';
import { supabase, DEFAULT_GYM_ID } from '@/lib/supabase';
import { hashPassword } from '@/lib/auth-utils';

const TrainerCreate: React.FC = () => {
  const navigate = useNavigate();
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(() => {
    const saved = localStorage.getItem('sidebar-collapsed');
    return saved ? JSON.parse(saved) : false;
  });
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    password: '',
    confirmPassword: '',
    position: 'Fitness Trainer',
    department: 'Fitness',
    salary: '',
    specializations: '',
    yearsExperience: '',
    bio: ''
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (formData.password !== formData.confirmPassword) {
      toast.error('Passwords do not match');
      return;
    }

    if (formData.password.length < 6) {
      toast.error('Password must be at least 6 characters');
      return;
    }

    setIsLoading(true);

    try {
      // Step 1: Create user in users table with role 'trainer'
      const passwordHash = await hashPassword(formData.password);
      
      const { data: userData, error: userError } = await supabase
        .from('users')
        .insert({
          first_name: formData.firstName,
          last_name: formData.lastName,
          email: formData.email,
          phone_number: formData.phone || null,
          password_hash: passwordHash,
          role: 'trainer',
          is_active: true
        })
        .select()
        .single();

      if (userError) {
        console.error('Error creating user:', userError);
        toast.error(userError.message || 'Failed to create user account');
        return;
      }

      // Step 2: Create staff record in staff table with role 'TRAINER'
      const employeeId = `TRN${String(Date.now()).slice(-3)}`;
      
      const specializationsArray = formData.specializations
        .split(',')
        .map(s => s.trim())
        .filter(s => s.length > 0);

      const { error: staffError } = await supabase
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
          role: 'TRAINER',
          salary: parseFloat(formData.salary).toString(),
          hire_date: new Date().toISOString().split('T')[0],
          certifications: [],
          specializations: specializationsArray,
          bio: formData.bio || null,
          years_experience: formData.yearsExperience ? parseFloat(formData.yearsExperience) : 0
        });

      if (staffError) {
        console.error('Error creating staff:', staffError);
        toast.error(staffError.message || 'Failed to create trainer staff record');
        return;
      }

      toast.success('Trainer created successfully!');
      navigate('/trainers');
    } catch (error) {
      console.error('Error creating trainer:', error);
      toast.error('Failed to create trainer');
    } finally {
      setIsLoading(false);
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
    <div className="min-h-screen bg-gray-50 flex">
      <Sidebar
        isCollapsed={isSidebarCollapsed}
        onToggle={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
      />

      <motion.div
        animate={{
          marginLeft: isSidebarCollapsed ? '5rem' : '16rem'
        }}
        transition={{ duration: 0.3, ease: 'easeInOut' }}
        className="transition-all duration-300 flex-1 flex flex-col"
      >
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
                  onClick={() => navigate('/trainers')}
                >
                  <ArrowLeft className="mr-2 h-4 w-4" />
                  Back to Trainers
                </Button>
                <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
                  <div className="p-3 rounded-xl bg-[#00bc7d] text-white shadow-lg shadow-[#00bc7d]/20">
                    <UserPlus className="h-6 w-6" />
                  </div>
                  Add New Trainer
                </h1>
                <p className="text-muted-foreground mt-2 ml-16">
                  Onboard a new trainer and create their user account.
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
              {/* Left Column - Personal & Trainer Info */}
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
                          <Label htmlFor="firstName">First Name *</Label>
                          <Input
                            id="firstName"
                            value={formData.firstName}
                            onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                            className="h-11 focus-visible:ring-[#00bc7d] rounded-xl border-gray-200"
                            required
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="lastName">Last Name *</Label>
                          <Input
                            id="lastName"
                            value={formData.lastName}
                            onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                            className="h-11 focus-visible:ring-[#00bc7d] rounded-xl border-gray-200"
                            required
                          />
                        </div>

                        <div className="space-y-2">
                          <Label htmlFor="email">Email Address *</Label>
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
                              placeholder="+91"
                            />
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>

                {/* Trainer Details */}
                <motion.div variants={itemVariants}>
                  <Card className="border-0 shadow-lg shadow-gray-100/50 bg-white overflow-hidden rounded-2xl">
                    <CardHeader className="bg-gradient-to-r from-gray-50 to-white border-b border-gray-100 pb-4">
                      <div className="flex items-center gap-2">
                        <div className="p-2 bg-[#00bc7d]/10 rounded-lg">
                          <Dumbbell className="h-5 w-5 text-[#00bc7d]" />
                        </div>
                        <CardTitle className="text-lg font-semibold text-gray-900">Trainer Details</CardTitle>
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
                          <select
                            value={formData.department}
                            onChange={(e) => setFormData({ ...formData, department: e.target.value })}
                            className="w-full h-11 px-3 rounded-xl border-gray-200 bg-white focus:ring-2 focus:ring-[#00bc7d]/20 focus:border-[#00bc7d]"
                          >
                            <option value="Fitness">Fitness</option>
                            <option value="Yoga">Yoga</option>
                            <option value="Crossfit">Crossfit</option>
                            <option value="Cardio">Cardio</option>
                          </select>
                        </div>
                      </div>

                      <div className="space-y-6 pt-2">
                        <div className="space-y-2">
                          <Label htmlFor="specializations">Specializations</Label>
                          <Input
                            id="specializations"
                            placeholder="e.g. HIIT, Yoga, Weight Training (comma separated)"
                            value={formData.specializations}
                            onChange={(e) => setFormData({ ...formData, specializations: e.target.value })}
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
                            onChange={(e) => setFormData({ ...formData, bio: e.target.value })}
                            className="min-h-[100px] focus-visible:ring-[#00bc7d] rounded-xl border-gray-200 resize-none"
                          />
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              </div>

              {/* Right Column - Password & Compensation */}
              <div className="space-y-8">
                {/* Account Security */}
                <motion.div variants={itemVariants}>
                  <Card className="border-0 shadow-xl shadow-[#00bc7d]/5 bg-white overflow-hidden rounded-2xl relative">
                    <div className="absolute top-0 right-0 p-32 bg-[#00bc7d]/5 rounded-full blur-3xl -mr-16 -mt-16 pointer-events-none" />
                    <CardHeader className="bg-gradient-to-r from-gray-50 to-white border-b border-gray-100 pb-4 relative">
                      <div className="flex items-center gap-2">
                        <div className="p-2 bg-[#00bc7d]/10 rounded-lg">
                          <Lock className="h-5 w-5 text-[#00bc7d]" />
                        </div>
                        <CardTitle className="text-lg font-semibold text-gray-900">Account Security</CardTitle>
                      </div>
                      <CardDescription>Set login credentials for the trainer</CardDescription>
                    </CardHeader>
                    <CardContent className="p-6 space-y-6 relative">
                      <div className="space-y-4">
                        <div className="space-y-2">
                          <Label htmlFor="password">Password *</Label>
                          <div className="relative">
                            <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                            <Input
                              id="password"
                              type={showPassword ? 'text' : 'password'}
                              value={formData.password}
                              onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                              className="pl-10 pr-10 h-11 focus-visible:ring-[#00bc7d] rounded-xl border-gray-200"
                              required
                              minLength={6}
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
                          <Label htmlFor="confirmPassword">Confirm Password *</Label>
                          <div className="relative">
                            <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                            <Input
                              id="confirmPassword"
                              type={showConfirmPassword ? 'text' : 'password'}
                              value={formData.confirmPassword}
                              onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
                              className="pl-10 pr-10 h-11 focus-visible:ring-[#00bc7d] rounded-xl border-gray-200"
                              required
                              minLength={6}
                            />
                            <button
                              type="button"
                              onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                              className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700"
                            >
                              {showConfirmPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                            </button>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>

                {/* Compensation Card */}
                <motion.div variants={itemVariants}>
                  <Card className="border-0 shadow-lg shadow-gray-100/50 bg-white overflow-hidden rounded-2xl">
                    <CardHeader className="bg-gradient-to-r from-gray-50 to-white border-b border-gray-100 pb-4">
                      <div className="flex items-center gap-2">
                        <div className="p-2 bg-[#00bc7d]/10 rounded-lg">
                          <div className="h-5 w-5 text-[#00bc7d] flex items-center justify-center">₹</div>
                        </div>
                        <CardTitle className="text-lg font-semibold text-gray-900">Compensation</CardTitle>
                      </div>
                      <CardDescription>Set annual salary</CardDescription>
                    </CardHeader>
                    <CardContent className="p-6 space-y-6">
                      <div className="space-y-2">
                        <Label htmlFor="salary">Annual Salary (₹)</Label>
                        <Input
                          id="salary"
                          type="number"
                          value={formData.salary}
                          onChange={(e) => setFormData({ ...formData, salary: e.target.value })}
                          className="h-11 focus-visible:ring-[#00bc7d] rounded-xl border-gray-200 text-lg font-semibold"
                          placeholder="0"
                          required
                        />
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
                        <span className="text-lg font-bold text-[#00bc7d]">Trainer</span>
                      </div>

                      <Button
                        type="submit"
                        disabled={isLoading}
                        className="w-full h-12 text-lg font-semibold bg-[#00bc7d] hover:bg-[#00bc7d]/90 shadow-lg shadow-[#00bc7d]/20 rounded-xl"
                      >
                        {isLoading ? (
                          'Creating...'
                        ) : (
                          <>
                            Create Trainer
                            <CheckCircle2 className="ml-2 h-5 w-5" />
                          </>
                        )}
                      </Button>
                    </CardContent>
                  </Card>
                </motion.div>
              </div>
            </motion.form>
          </div>
        </main>
      </motion.div>
    </div>
  );
};

export default TrainerCreate;
