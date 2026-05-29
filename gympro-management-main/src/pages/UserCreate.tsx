import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  ArrowLeft,
  Save,
  User,
  Mail,
  Phone,
  Shield,
  Lock,
  Sparkles,
  Eye,
  EyeOff
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from 'sonner';
import { supabase } from '@/lib/supabase';
import { hashPassword } from '@/lib/auth-utils';
import Sidebar from '@/components/layout/Sidebar';
import Topbar from '@/components/layout/Topbar';

const UserCreate: React.FC = () => {
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(false);
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(() => {
    const saved = localStorage.getItem('sidebar-collapsed');
    return saved ? JSON.parse(saved) : false;
  });
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phoneNumber: '',
    password: '',
    confirmPassword: '',
    role: 'admin',
    isActive: true
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

    try {
      setIsLoading(true);
      const passwordHash = await hashPassword(formData.password);

      const { error } = await supabase
        .from('users')
        .insert({
          first_name: formData.firstName,
          last_name: formData.lastName,
          email: formData.email,
          phone_number: formData.phoneNumber || null,
          password_hash: passwordHash,
          role: formData.role,
          is_active: formData.isActive
        });

      if (error) {
        console.error('Error creating user:', error);
        toast.error(error.message || 'Failed to create user');
        return;
      }

      toast.success('User created successfully');
      navigate('/users');
    } catch (error) {
      console.error('Error creating user:', error);
      toast.error('Failed to create user');
    } finally {
      setIsLoading(false);
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
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
              <div>
                <motion.h2
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  className="text-3xl font-bold mb-2 text-gray-900 flex items-center gap-3"
                >
                  <div className="p-3 bg-[#00bc7d] rounded-xl shadow-lg shadow-[#00bc7d]/20">
                    <User className="h-6 w-6 text-white" />
                  </div>
                  Create New User
                </motion.h2>
                <motion.p
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.1 }}
                  className="text-muted-foreground ml-16"
                >
                  Add a new user to the system with their role and credentials
                </motion.p>
              </div>
              <motion.div
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
              >
                <Button
                  variant="outline"
                  onClick={() => navigate('/users')}
                  className="group hover:border-[#00bc7d] hover:text-[#00bc7d] hover:bg-[#00bc7d]/5 rounded-xl border-gray-200"
                >
                  <ArrowLeft className="h-4 w-4 mr-2 group-hover:-translate-x-1 transition-transform" />
                  Back to Users
                </Button>
              </motion.div>
            </div>

            <form onSubmit={handleSubmit}>
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Personal Information */}
                <div className="lg:col-span-2 space-y-8">
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
                      <div className="space-y-2">
                        <Label htmlFor="firstName">First Name *</Label>
                        <Input
                          id="firstName"
                          value={formData.firstName}
                          onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                          required
                          className="focus-visible:ring-[#00bc7d] rounded-xl border-gray-200"
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
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="email">Email *</Label>
                        <div className="relative">
                          <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                          <Input
                            id="email"
                            type="email"
                            value={formData.email}
                            onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                            required
                            className="pl-9 focus-visible:ring-[#00bc7d] rounded-xl border-gray-200"
                          />
                        </div>
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="phoneNumber">Phone Number</Label>
                        <div className="relative">
                          <Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                          <Input
                            id="phoneNumber"
                            type="tel"
                            value={formData.phoneNumber}
                            onChange={(e) => setFormData({ ...formData, phoneNumber: e.target.value })}
                            placeholder="+1-555-0100"
                            className="pl-9 focus-visible:ring-[#00bc7d] rounded-xl border-gray-200"
                          />
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </div>

                {/* Role & Security */}
                <div className="space-y-8">
                  <Card className="border-0 shadow-xl shadow-[#00bc7d]/5 bg-white overflow-hidden h-full rounded-2xl relative">
                    <div className="absolute top-0 right-0 p-32 bg-[#00bc7d]/5 rounded-full blur-3xl -mr-16 -mt-16 pointer-events-none" />
                    <CardHeader className="bg-gradient-to-r from-gray-50 to-white border-b border-gray-100 pb-4 relative">
                      <div className="flex items-center gap-2">
                        <div className="p-2 bg-[#00bc7d]/10 rounded-lg">
                          <Shield className="h-5 w-5 text-[#00bc7d]" />
                        </div>
                        <CardTitle className="text-lg text-gray-900">Role & Security</CardTitle>
                      </div>
                    </CardHeader>
                    <CardContent className="p-6 space-y-6 relative">
                      <div className="space-y-2">
                        <Label htmlFor="status">Status</Label>
                        <Select
                          value={formData.isActive ? 'active' : 'inactive'}
                          onValueChange={(value) => setFormData({ ...formData, isActive: value === 'active' })}
                        >
                          <SelectTrigger className={`focus:ring-[#00bc7d]/20 rounded-xl border-gray-200 h-11 ${formData.isActive ? 'bg-[#00bc7d]/5 border-[#00bc7d]/30 text-[#00bc7d]' : ''}`}>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="active">
                              <div className="flex items-center gap-2">
                                <span className="h-2 w-2 rounded-full bg-[#00bc7d] animate-pulse"></span>
                                Active
                              </div>
                            </SelectItem>
                            <SelectItem value="inactive">
                              <div className="flex items-center gap-2">
                                <span className="h-2 w-2 rounded-full bg-gray-300"></span>
                                Inactive
                              </div>
                            </SelectItem>
                          </SelectContent>
                        </Select>
                      </div>

                      <div className="space-y-4 pt-2">
                        <div className="space-y-2">
                          <Label htmlFor="password">Password *</Label>
                          <div className="relative">
                            <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                            <Input
                              id="password"
                              type={showPassword ? 'text' : 'password'}
                              value={formData.password}
                              onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                              required
                              minLength={6}
                              className="pl-9 pr-10 focus-visible:ring-[#00bc7d] rounded-xl border-gray-200"
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
                              required
                              minLength={6}
                              className="pl-9 pr-10 focus-visible:ring-[#00bc7d] rounded-xl border-gray-200"
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

                      <Button
                        type="submit"
                        disabled={isLoading}
                        className="w-full bg-[#00bc7d] hover:bg-[#00bc7d]/90 text-white shadow-lg shadow-[#00bc7d]/20 h-12 rounded-xl text-base font-medium transition-all hover:scale-[1.02]"
                      >
                        {isLoading ? (
                          <>Creating...</>
                        ) : (
                          <>
                            <Save className="h-5 w-5 mr-2" />
                            Create User
                          </>
                        )}
                      </Button>
                    </CardContent>
                  </Card>
                </div>
              </div>
            </form>
          </div>
        </main>
      </motion.div>
    </div>
  );
};

export default UserCreate;
