import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  ArrowLeft,
  User,
  Mail,
  Phone,
  Shield,
  Calendar,
  Clock,
  Edit,
  Loader2,
  CheckCircle2,
  XCircle
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { supabase } from '@/lib/supabase';
import Sidebar from '@/components/layout/Sidebar';
import Topbar from '@/components/layout/Topbar';
import PageLoader from '@/components/ui/PageLoader';

interface UserData {
  id: string;
  first_name: string;
  last_name: string;
  email: string;
  phone_number: string | null;
  role: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

const UserView: React.FC = () => {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const [user, setUser] = useState<UserData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(() => {
    const saved = localStorage.getItem('sidebar-collapsed');
    return saved ? JSON.parse(saved) : false;
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

        setUser(data);
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

  const getRoleBadgeColor = (role: string) => {
    switch (role) {
      case 'admin':
        return 'bg-violet-500/10 text-violet-700 border-violet-200';
      case 'manager':
        return 'bg-blue-500/10 text-blue-700 border-blue-200';
      case 'trainer':
        return 'bg-cyan-500/10 text-cyan-700 border-cyan-200';
      default:
        return 'bg-gray-500/10 text-gray-700 border-gray-200';
    }
  };

  if (isLoading) {
    return <PageLoader />;
  }

  if (!user) return null;

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
                User Details
              </h1>
            </div>
            <Button
              onClick={() => navigate(`/users/${id}/edit`)}
              className="bg-[#00bc7d] hover:bg-[#00bc7d]/90 text-white shadow-lg shadow-[#00bc7d]/20"
            >
              <Edit className="h-4 w-4 mr-2" />
              Edit User
            </Button>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Main Info */}
            <Card className="lg:col-span-2 border-gray-100 shadow-lg shadow-gray-100/50">
              <CardHeader className="bg-gradient-to-r from-gray-50 to-white border-b border-gray-100">
                <CardTitle className="flex items-center gap-2 text-base">
                  <User className="h-4 w-4 text-[#00bc7d]" />
                  Personal Information
                </CardTitle>
              </CardHeader>
              <CardContent className="p-6 space-y-6">
                <div className="flex items-center gap-6 pb-6 border-b border-gray-100">
                  <div className="h-20 w-20 rounded-full bg-gradient-to-br from-[#00bc7d] to-teal-600 flex items-center justify-center text-white text-2xl font-bold shadow-lg shadow-[#00bc7d]/20">
                    {user.first_name[0]}{user.last_name[0]}
                  </div>
                  <div>
                    <h2 className="text-2xl font-bold text-gray-900">{user.first_name} {user.last_name}</h2>
                    <div className="flex items-center gap-2 mt-2">
                      <Badge className={`${getRoleBadgeColor(user.role)} capitalize`}>
                        {user.role}
                      </Badge>
                      <Badge variant="outline" className={user.is_active ? 'border-[#00bc7d] text-[#00bc7d] bg-[#00bc7d]/5' : 'border-gray-300 text-gray-500'}>
                        {user.is_active ? (
                          <span className="flex items-center gap-1">
                            <CheckCircle2 className="h-3 w-3" /> Active
                          </span>
                        ) : (
                          <span className="flex items-center gap-1">
                            <XCircle className="h-3 w-3" /> Inactive
                          </span>
                        )}
                      </Badge>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-1">
                    <label className="text-xs font-medium text-gray-500 uppercase">Email Address</label>
                    <div className="flex items-center gap-2 text-gray-900">
                      <Mail className="h-4 w-4 text-gray-400" />
                      {user.email}
                    </div>
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs font-medium text-gray-500 uppercase">Phone Number</label>
                    <div className="flex items-center gap-2 text-gray-900">
                      <Phone className="h-4 w-4 text-gray-400" />
                      {user.phone_number || 'N/A'}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Meta Info */}
            <Card className="border-gray-100 shadow-lg shadow-gray-100/50">
              <CardHeader className="bg-gradient-to-r from-gray-50 to-white border-b border-gray-100">
                <CardTitle className="flex items-center gap-2 text-base">
                  <Shield className="h-4 w-4 text-[#00bc7d]" />
                  System Information
                </CardTitle>
              </CardHeader>
              <CardContent className="p-6 space-y-6">
                <div className="space-y-1">
                  <label className="text-xs font-medium text-gray-500 uppercase">User ID</label>
                  <div className="text-sm font-mono text-gray-600 bg-gray-50 p-2 rounded border border-gray-100 break-all">
                    {user.id}
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-medium text-gray-500 uppercase">Created At</label>
                  <div className="flex items-center gap-2 text-gray-900">
                    <Calendar className="h-4 w-4 text-gray-400" />
                    {new Date(user.created_at).toLocaleDateString()}
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-medium text-gray-500 uppercase">Last Updated</label>
                  <div className="flex items-center gap-2 text-gray-900">
                    <Clock className="h-4 w-4 text-gray-400" />
                    {new Date(user.updated_at).toLocaleDateString()}
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </main>
      </motion.div>
    </div>
  );
};

export default UserView;
