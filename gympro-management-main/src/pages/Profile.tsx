import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { useAuth } from '@/hooks/useAuth';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import {
  User,
  Mail,
  Phone,
  Shield,
  Lock,
  Camera,
  Edit2,
  Check,
  X
} from 'lucide-react';
import Sidebar from '@/components/layout/Sidebar';
import Topbar from '@/components/layout/Topbar';
import { toast } from 'sonner';

const Profile: React.FC = () => {
  const { user } = useAuth();
  const [isEditing, setIsEditing] = useState(false);
  const [isEditingPassword, setIsEditingPassword] = useState(false);
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(() => {
    const saved = localStorage.getItem('sidebar-collapsed');
    return saved ? JSON.parse(saved) : false;
  });

  const [formData, setFormData] = useState({
    firstName: user?.firstName || '',
    lastName: user?.lastName || '',
    email: user?.email || '',
    phone: user?.phone || '',
  });

  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });

  if (!user) return null;

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handlePasswordChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setPasswordData(prev => ({ ...prev, [name]: value }));
  };

  const handleSave = () => {
    // TODO: Implement actual save logic
    toast.success('Profile updated successfully!');
    setIsEditing(false);
  };

  const handleCancel = () => {
    setFormData({
      firstName: user?.firstName || '',
      lastName: user?.lastName || '',
      email: user?.email || '',
      phone: user?.phone || '',
    });
    setIsEditing(false);
  };

  const handlePasswordSave = () => {
    if (passwordData.newPassword !== passwordData.confirmPassword) {
      toast.error('New passwords do not match');
      return;
    }
    if (passwordData.newPassword.length < 8) {
      toast.error('Password must be at least 8 characters');
      return;
    }
    // TODO: Implement actual password change logic
    toast.success('Password changed successfully!');
    setPasswordData({
      currentPassword: '',
      newPassword: '',
      confirmPassword: '',
    });
    setIsEditingPassword(false);
  };

  const handlePasswordCancel = () => {
    setPasswordData({
      currentPassword: '',
      newPassword: '',
      confirmPassword: '',
    });
    setIsEditingPassword(false);
  };

  // Glass Card Component
  const GlassCard: React.FC<{
    children: React.ReactNode;
    className?: string;
    delay?: number;
  }> = ({ children, className = '', delay = 0 }) => (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay }}
      className={`rounded-2xl bg-white/60 backdrop-blur-xl border border-white/20 shadow-lg shadow-black/5 ${className}`}
    >
      {children}
    </motion.div>
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-50">
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
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
            className="max-w-7xl mx-auto"
          >
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              {/* Left Column: Profile Card & Account Info */}
              <div className="space-y-6 lg:col-span-1">
                {/* Profile Header */}
                <GlassCard delay={0.1}>
                  <Card className="border-0 shadow-none bg-transparent">
                    <CardContent className="pt-6">
                      <div className="flex flex-col items-center text-center gap-4">
                        <div className="relative group">
                          <motion.div
                            whileHover={{ scale: 1.05 }}
                            className="relative"
                          >
                            <Avatar className="h-32 w-32 border-4 border-white shadow-xl shadow-[#00bc7d]/20">
                              <AvatarFallback className="bg-[#00bc7d] text-white text-3xl font-bold">
                                {user.firstName?.[0]}{user.lastName?.[0]}
                              </AvatarFallback>
                            </Avatar>
                            <motion.button
                              whileHover={{ scale: 1.1 }}
                              whileTap={{ scale: 0.9 }}
                              className="absolute bottom-0 right-0 p-2 rounded-full bg-[#00bc7d] text-white shadow-lg shadow-[#00bc7d]/40 hover:shadow-xl transition-shadow"
                            >
                              <Camera className="h-4 w-4" />
                            </motion.button>
                          </motion.div>
                        </div>
                        <div className="w-full">
                          <div className="flex flex-col items-center gap-2 mb-2">
                            <h1 className="text-2xl font-bold text-gray-900">
                              {user.firstName} {user.lastName}
                            </h1>
                            <Badge className="bg-[#00bc7d]/10 text-[#00bc7d] border-[#00bc7d]/20 hover:bg-[#00bc7d]/20">
                              {user.role}
                            </Badge>
                          </div>
                          <p className="text-muted-foreground mb-4">{user.email}</p>
                          <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground bg-gray-50/50 py-2 rounded-lg border border-gray-100">
                            <Shield className="h-4 w-4 text-[#00bc7d]" />
                            <span>Member since {new Date(user.createdAt).getFullYear()}</span>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </GlassCard>

                {/* Account Information */}
                <GlassCard delay={0.2}>
                  <Card className="border-0 shadow-none bg-transparent">
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2 text-gray-900 text-lg">
                        <div className="p-2 bg-[#00bc7d]/10 rounded-lg">
                          <Shield className="h-5 w-5 text-[#00bc7d]" />
                        </div>
                        Account Details
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="p-3 rounded-lg bg-gray-50/50 border border-gray-100">
                        <p className="text-xs font-medium text-muted-foreground mb-1 uppercase tracking-wider">User ID</p>
                        <p className="text-sm font-mono text-gray-900 truncate" title={user.id}>{user.id}</p>
                      </div>
                      <div className="p-3 rounded-lg bg-gray-50/50 border border-gray-100">
                        <p className="text-xs font-medium text-muted-foreground mb-1 uppercase tracking-wider">Last Updated</p>
                        <p className="text-sm text-gray-900">{new Date(user.updatedAt).toLocaleDateString()}</p>
                      </div>
                    </CardContent>
                  </Card>
                </GlassCard>
              </div>

              {/* Right Column: Forms */}
              <div className="space-y-6 lg:col-span-2">
                {/* Personal Information */}
                <GlassCard delay={0.3}>
                  <Card className="border-0 shadow-none bg-transparent">
                    <CardHeader>
                      <div className="flex items-center justify-between">
                        <div>
                          <CardTitle className="flex items-center gap-2 text-gray-900">
                            <div className="p-2 bg-[#00bc7d]/10 rounded-lg">
                              <User className="h-5 w-5 text-[#00bc7d]" />
                            </div>
                            Personal Information
                          </CardTitle>
                          <CardDescription>Update your personal details and contact information</CardDescription>
                        </div>
                        {!isEditing && (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setIsEditing(true)}
                            className="gap-2 border-[#00bc7d]/20 text-[#00bc7d] hover:bg-[#00bc7d]/10 hover:text-[#00bc7d]"
                          >
                            <Edit2 className="h-4 w-4" />
                            Edit
                          </Button>
                        )}
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label htmlFor="firstName">First Name</Label>
                          <Input
                            id="firstName"
                            name="firstName"
                            value={formData.firstName}
                            onChange={handleInputChange}
                            disabled={!isEditing}
                            className={`border-gray-200 focus:border-[#00bc7d] focus:ring-[#00bc7d]/20 ${!isEditing ? "bg-gray-50/50" : "bg-white"}`}
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="lastName">Last Name</Label>
                          <Input
                            id="lastName"
                            name="lastName"
                            value={formData.lastName}
                            onChange={handleInputChange}
                            disabled={!isEditing}
                            className={`border-gray-200 focus:border-[#00bc7d] focus:ring-[#00bc7d]/20 ${!isEditing ? "bg-gray-50/50" : "bg-white"}`}
                          />
                        </div>
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="email" className="flex items-center gap-2">
                          <Mail className="h-4 w-4 text-[#00bc7d]" />
                          Email Address
                        </Label>
                        <Input
                          id="email"
                          name="email"
                          type="email"
                          value={formData.email}
                          onChange={handleInputChange}
                          disabled={!isEditing}
                          className={`border-gray-200 focus:border-[#00bc7d] focus:ring-[#00bc7d]/20 ${!isEditing ? "bg-gray-50/50" : "bg-white"}`}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="phone" className="flex items-center gap-2">
                          <Phone className="h-4 w-4 text-[#00bc7d]" />
                          Phone Number
                        </Label>
                        <Input
                          id="phone"
                          name="phone"
                          type="tel"
                          value={formData.phone}
                          onChange={handleInputChange}
                          placeholder="+1 (555) 000-0000"
                          disabled={!isEditing}
                          className={`border-gray-200 focus:border-[#00bc7d] focus:ring-[#00bc7d]/20 ${!isEditing ? "bg-gray-50/50" : "bg-white"}`}
                        />
                      </div>
                      {isEditing && (
                        <motion.div
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          className="flex gap-2 pt-4"
                        >
                          <Button
                            onClick={handleSave}
                            className="flex-1 text-white gap-2 bg-[#00bc7d] hover:bg-[#00bc7d]/90 shadow-lg shadow-[#00bc7d]/20"
                          >
                            <Check className="h-4 w-4" />
                            Save Changes
                          </Button>
                          <Button
                            variant="outline"
                            onClick={handleCancel}
                            className="flex-1 gap-2"
                          >
                            <X className="h-4 w-4" />
                            Cancel
                          </Button>
                        </motion.div>
                      )}
                    </CardContent>
                  </Card>
                </GlassCard>

                {/* Security Settings */}
                <GlassCard delay={0.4}>
                  <Card className="border-0 shadow-none bg-transparent">
                    <CardHeader>
                      <div className="flex items-center justify-between">
                        <div>
                          <CardTitle className="flex items-center gap-2 text-gray-900">
                            <div className="p-2 bg-[#00bc7d]/10 rounded-lg">
                              <Lock className="h-5 w-5 text-[#00bc7d]" />
                            </div>
                            Security Settings
                          </CardTitle>
                          <CardDescription>Manage your password and account security</CardDescription>
                        </div>
                        {!isEditingPassword && (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setIsEditingPassword(true)}
                            className="gap-2 border-[#00bc7d]/20 text-[#00bc7d] hover:bg-[#00bc7d]/10 hover:text-[#00bc7d]"
                          >
                            <Edit2 className="h-4 w-4" />
                            Change Password
                          </Button>
                        )}
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      {!isEditingPassword ? (
                        <div className="p-4 rounded-lg bg-gray-50/50 border border-gray-100">
                          <p className="text-sm text-muted-foreground">
                            Your password was last updated on {new Date(user.updatedAt).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}
                          </p>
                        </div>
                      ) : (
                        <motion.div
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          className="space-y-4"
                        >
                          <div className="space-y-2">
                            <Label htmlFor="currentPassword">Current Password</Label>
                            <Input
                              id="currentPassword"
                              name="currentPassword"
                              type="password"
                              value={passwordData.currentPassword}
                              onChange={handlePasswordChange}
                              placeholder="Enter your current password"
                              className="border-gray-200 focus:border-[#00bc7d] focus:ring-[#00bc7d]/20"
                            />
                          </div>
                          <div className="space-y-2">
                            <Label htmlFor="newPassword">New Password</Label>
                            <Input
                              id="newPassword"
                              name="newPassword"
                              type="password"
                              value={passwordData.newPassword}
                              onChange={handlePasswordChange}
                              placeholder="Enter your new password"
                              className="border-gray-200 focus:border-[#00bc7d] focus:ring-[#00bc7d]/20"
                            />
                            <p className="text-xs text-muted-foreground">
                              Password must be at least 8 characters long
                            </p>
                          </div>
                          <div className="space-y-2">
                            <Label htmlFor="confirmPassword">Confirm New Password</Label>
                            <Input
                              id="confirmPassword"
                              name="confirmPassword"
                              type="password"
                              value={passwordData.confirmPassword}
                              onChange={handlePasswordChange}
                              placeholder="Confirm your new password"
                              className="border-gray-200 focus:border-[#00bc7d] focus:ring-[#00bc7d]/20"
                            />
                          </div>
                          <div className="flex gap-2 pt-2">
                            <Button
                              onClick={handlePasswordSave}
                              className="flex-1 text-white gap-2 bg-[#00bc7d] hover:bg-[#00bc7d]/90 shadow-lg shadow-[#00bc7d]/20"
                            >
                              <Check className="h-4 w-4" />
                              Update Password
                            </Button>
                            <Button
                              variant="outline"
                              onClick={handlePasswordCancel}
                              className="flex-1 gap-2"
                            >
                              <X className="h-4 w-4" />
                              Cancel
                            </Button>
                          </div>
                        </motion.div>
                      )}
                    </CardContent>
                  </Card>
                </GlassCard>
              </div>
            </div>
          </motion.div>
        </main>
      </motion.div>
    </div>
  );
};

export default Profile;