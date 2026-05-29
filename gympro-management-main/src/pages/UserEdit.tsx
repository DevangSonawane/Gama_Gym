import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  ArrowLeft,
  Save,
  User,
  Mail,
  Phone,
  Shield,
  Lock
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
import PageLoader from '@/components/ui/PageLoader';

const UserEdit: React.FC = () => {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(() => {
    const saved = localStorage.getItem('sidebar-collapsed');
    return saved ? JSON.parse(saved) : false;
  });

  const roleOptions = ['admin', 'manager', 'trainer', 'member'] as const;
  type RoleOption = typeof roleOptions[number];

  type UserRow = {
    first_name: string;
    last_name: string;
    email: string;
    phone_number?: string | null;
    role: RoleOption;
    is_active: boolean;
  };

  type UserUpdate = {
    first_name: string;
    last_name: string;
    email: string;
    phone_number: string | null;
    role: RoleOption;
    is_active: boolean;
    updated_at: string;
    password_hash?: string;
  };

  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phoneNumber: '',
    role: 'member' as RoleOption,
    isActive: true,
    newPassword: '',
    confirmNewPassword: ''
  });

  useEffect(() => {
    const fetchUser = async () => {
      try {
        if (!id) return;

        const { data, error } = await supabase
          .from('users')
          .select('*')
          .eq('id', id)
          .single();

        if (error) {
          console.error('Error fetching user:', error);
          toast.error('Failed to load user');
          navigate('/users');
          return;
        }

        const userRow = data as UserRow;
        setFormData(prev => ({
          ...prev,
          firstName: userRow.first_name,
          lastName: userRow.last_name,
          email: userRow.email,
          phoneNumber: userRow.phone_number || '',
          role: userRow.role,
          isActive: userRow.is_active
        }));
      } catch (error) {
        console.error('Error fetching user:', error);
        toast.error('Failed to load user');
        navigate('/users');
      } finally {
        setIsLoading(false);
      }
    };

    fetchUser();
  }, [id, navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (formData.newPassword) {
      if (formData.newPassword !== formData.confirmNewPassword) {
        toast.error('New passwords do not match');
        return;
      }
      if (formData.newPassword.length < 6) {
        toast.error('Password must be at least 6 characters');
        return;
      }
    }

    try {
      setIsSaving(true);

      const updates: UserUpdate = {
        first_name: formData.firstName,
        last_name: formData.lastName,
        email: formData.email,
        phone_number: formData.phoneNumber || null,
        role: formData.role,
        is_active: formData.isActive,
        updated_at: new Date().toISOString()
      };

      if (formData.newPassword) {
        updates.password_hash = await hashPassword(formData.newPassword);
      }

      const { error } = await supabase
        .from('users')
        .update(updates)
        .eq('id', id);

      if (error) {
        console.error('Error updating user:', error);
        toast.error(error.message || 'Failed to update user');
        return;
      }

      toast.success('User updated successfully');
      navigate('/users');
    } catch (error) {
      console.error('Error updating user:', error);
      toast.error('Failed to update user');
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return <PageLoader />;
  }

  return (
    <div className="min-h-screen bg-gray-50/50">
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
        <main className="p-8 max-w-5xl mx-auto">
          <div className="mb-8 flex items-center justify-between">
            <div>
              <Button
                variant="ghost"
                className="mb-4 pl-0 hover:bg-transparent hover:text-[#00bc7d]"
                onClick={() => navigate('/users')}
              >
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back to Users
              </Button>
              <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
                <div className="p-2 bg-[#00bc7d]/10 rounded-xl">
                  <User className="h-6 w-6 text-[#00bc7d]" />
                </div>
                Edit User
              </h1>
              <p className="text-muted-foreground mt-1 ml-14">
                Update user information and permissions
              </p>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Personal Information */}
              <Card className="border-gray-100 shadow-lg shadow-gray-100/50">
                <CardHeader className="bg-gradient-to-r from-gray-50 to-white border-b border-gray-100">
                  <CardTitle className="flex items-center gap-2 text-base">
                    <User className="h-4 w-4 text-[#00bc7d]" />
                    Personal Information
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-6 space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="firstName">First Name *</Label>
                      <Input
                        id="firstName"
                        value={formData.firstName}
                        onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                        required
                        className="focus:border-[#00bc7d] focus:ring-[#00bc7d]/20"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="lastName">Last Name *</Label>
                      <Input
                        id="lastName"
                        value={formData.lastName}
                        onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                        required
                        className="focus:border-[#00bc7d] focus:ring-[#00bc7d]/20"
                      />
                    </div>
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
                        className="pl-9 focus:border-[#00bc7d] focus:ring-[#00bc7d]/20"
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
                        className="pl-9 focus:border-[#00bc7d] focus:ring-[#00bc7d]/20"
                      />
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Role & Security */}
              <Card className="border-gray-100 shadow-lg shadow-gray-100/50">
                <CardHeader className="bg-gradient-to-r from-gray-50 to-white border-b border-gray-100">
                  <CardTitle className="flex items-center gap-2 text-base">
                    <Shield className="h-4 w-4 text-[#00bc7d]" />
                    Role & Security
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-6 space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="role">Role *</Label>
                    <Select
                      value={formData.role}
                      onValueChange={(value) => {
                        if ((roleOptions as readonly string[]).includes(value)) {
                          setFormData({ ...formData, role: value as RoleOption });
                        }
                      }}
                    >
                      <SelectTrigger className="focus:ring-[#00bc7d]/20">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="admin">Admin</SelectItem>
                        <SelectItem value="manager">Manager</SelectItem>
                        <SelectItem value="trainer">Trainer</SelectItem>
                        <SelectItem value="member">Member</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="status">Status</Label>
                    <Select
                      value={formData.isActive ? 'active' : 'inactive'}
                      onValueChange={(value) => setFormData({ ...formData, isActive: value === 'active' })}
                    >
                      <SelectTrigger className="focus:ring-[#00bc7d]/20">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="active">Active</SelectItem>
                        <SelectItem value="inactive">Inactive</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="pt-4 border-t border-gray-100 mt-4">
                    <Label className="text-gray-500 mb-2 block">Change Password (Optional)</Label>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="newPassword">New Password</Label>
                        <div className="relative">
                          <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                          <Input
                            id="newPassword"
                            type="password"
                            value={formData.newPassword}
                            onChange={(e) => setFormData({ ...formData, newPassword: e.target.value })}
                            minLength={6}
                            className="pl-9 focus:border-[#00bc7d] focus:ring-[#00bc7d]/20"
                          />
                        </div>
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="confirmNewPassword">Confirm New Password</Label>
                        <div className="relative">
                          <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                          <Input
                            id="confirmNewPassword"
                            type="password"
                            value={formData.confirmNewPassword}
                            onChange={(e) => setFormData({ ...formData, confirmNewPassword: e.target.value })}
                            minLength={6}
                            className="pl-9 focus:border-[#00bc7d] focus:ring-[#00bc7d]/20"
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            <div className="flex justify-end gap-3">
              <Button
                type="button"
                variant="outline"
                onClick={() => navigate('/users')}
                className="hover:bg-gray-50"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={isSaving}
                className="bg-[#00bc7d] hover:bg-[#00bc7d]/90 text-white shadow-lg shadow-[#00bc7d]/20"
              >
                {isSaving ? (
                  <>Saving...</>
                ) : (
                  <>
                    <Save className="h-4 w-4 mr-2" />
                    Save Changes
                  </>
                )}
              </Button>
            </div>
          </form>
        </main>
      </motion.div>
    </div>
  );
};

export default UserEdit;
