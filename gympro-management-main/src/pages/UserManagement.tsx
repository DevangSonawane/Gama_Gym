import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { UserRole } from '@/types';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import {
  UserPlus,
  Users,
  Search,
  Edit,
  Trash2,
  Eye,
  Mail,
  Phone,
  Sparkles,
  MoreVertical
} from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger
} from '@/components/ui/dropdown-menu';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { supabase } from '@/lib/supabase';
import { toast } from 'sonner';
import Sidebar from '@/components/layout/Sidebar';
import Topbar from '@/components/layout/Topbar';
import PageLoader from '@/components/ui/PageLoader';

interface User {
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

const UserManagement: React.FC = () => {
  const navigate = useNavigate();
  const { user: currentUser, hasRole } = useAuth();
  const [users, setUsers] = useState<User[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState<string>('all');
  const [isLoading, setIsLoading] = useState(true);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [pendingDeleteUserId, setPendingDeleteUserId] = useState<string | null>(null);
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(() => {
    const saved = localStorage.getItem('sidebar-collapsed');
    return saved ? JSON.parse(saved) : false;
  });

  const isAdmin = hasRole(UserRole.ADMIN);

  // Fetch users from Supabase
  useEffect(() => {
    const fetchUsers = async () => {
      try {
        setIsLoading(true);
        const { data, error } = await supabase
          .from('users')
          .select('*')
          .order('created_at', { ascending: false });

        if (error) {
          console.error('Error fetching users:', error);
          toast.error('Failed to load users');
          return;
        }

        if (data) {
          setUsers(data);
        }
      } catch (error) {
        console.error('Error fetching users:', error);
        toast.error('Failed to load users');
      } finally {
        setIsLoading(false);
      }
    };

    fetchUsers();
  }, []);

  if (isLoading) {
    return <PageLoader />;
  }

  const openDeleteDialog = (userId: string) => {
    setPendingDeleteUserId(userId);
    setIsDeleteDialogOpen(true);
  };

  const executeDeleteUser = async () => {
    if (!pendingDeleteUserId) return;

    try {
      const { error } = await supabase
        .from('users')
        .delete()
        .eq('id', pendingDeleteUserId);

      if (error) {
        console.error('Error deleting user:', error);
        toast.error('Failed to delete user');
        return;
      }

      setUsers(prev => prev.filter(u => u.id !== pendingDeleteUserId));
      toast.success('User deleted successfully');
      setIsDeleteDialogOpen(false);
      setPendingDeleteUserId(null);
    } catch (error) {
      console.error('Error deleting user:', error);
      toast.error('Failed to delete user');
    }
  };

  const getRoleColor = (role: string) => {
    switch (role) {
      case 'admin':
        return 'bg-violet-500/10 text-violet-700 border-violet-200';
      case 'manager':
        return 'bg-blue-500/10 text-blue-700 border-blue-200';
      case 'trainer':
        return 'bg-cyan-500/10 text-cyan-700 border-cyan-200';
      case 'member':
        return 'bg-gray-500/10 text-gray-700 border-gray-200';
      default:
        return 'bg-gray-500/10 text-gray-700 border-gray-200';
    }
  };

  const filteredUsers = users.filter(u => {
    const matchesSearch =
      u.first_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      u.last_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      u.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (u.phone_number && u.phone_number.includes(searchTerm));

    const matchesRole = roleFilter === 'all' || u.role === roleFilter;

    return matchesSearch && matchesRole;
  });

  const stats = {
    totalUsers: users.length,
    activeUsers: users.filter(u => u.is_active).length,
    admins: users.filter(u => u.role === 'admin').length,
    managers: users.filter(u => u.role === 'manager').length,
    trainers: users.filter(u => u.role === 'trainer').length,
    members: users.filter(u => u.role === 'member').length
  };

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
        <main className="p-8">
          {!isAdmin ? (
            <div className="min-h-[60vh] flex items-center justify-center">
              <Card>
                <CardContent className="p-6">
                  <p className="text-center text-muted-foreground">Access denied. Admin only.</p>
                </CardContent>
              </Card>
            </div>
          ) : (
            <div className="space-y-8">
              <div className="flex justify-between items-center">
                <div>
                  <h2 className="text-3xl font-bold mb-2 text-gray-900 flex items-center gap-2">
                    <div className="p-2 bg-[#00bc7d]/10 rounded-xl">
                      <Sparkles className="h-6 w-6 text-[#00bc7d]" />
                    </div>
                    User Management
                  </h2>
                  <p className="text-muted-foreground ml-12">Manage system users and their roles</p>
                </div>

                <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                  <Button
                    onClick={() => navigate('/users/new')}
                    className="bg-[#00bc7d] hover:bg-[#00bc7d]/90 text-white rounded-full h-11 px-6 shadow-lg shadow-[#00bc7d]/20"
                  >
                    <UserPlus className="h-4 w-4 mr-2" />
                    Create New User
                  </Button>
                </motion.div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-6 gap-4">
                {[
                  { label: 'Total Users', value: stats.totalUsers, color: 'text-[#00bc7d]' },
                  { label: 'Active', value: stats.activeUsers, color: 'text-blue-600' },
                  { label: 'Admins', value: stats.admins, color: 'text-violet-600' },
                  { label: 'Managers', value: stats.managers, color: 'text-indigo-600' },
                  { label: 'Trainers', value: stats.trainers, color: 'text-cyan-600' },
                  { label: 'Members', value: stats.members, color: 'text-gray-600' },
                ].map((stat, index) => (
                  <motion.div
                    key={stat.label}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.1 }}
                    whileHover={{ scale: 1.02, y: -4 }}
                    className="group relative overflow-hidden rounded-2xl bg-white border border-gray-100 shadow-lg shadow-gray-100/50 p-6 transition-all duration-300"
                  >
                    <div className="relative">
                      <h3 className="text-sm font-medium text-gray-500 mb-2">{stat.label}</h3>
                      <p className={`text-3xl font-bold ${stat.color}`}>
                        {stat.value}
                      </p>
                    </div>
                  </motion.div>
                ))}
              </div>

              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.6 }}
                className="rounded-2xl bg-white border border-gray-100 shadow-lg shadow-gray-100/50 overflow-hidden"
              >
                <CardHeader className="bg-gradient-to-r from-gray-50 to-white border-b border-gray-100">
                  <CardTitle className="flex items-center gap-2 text-gray-900">
                    <Users className="h-5 w-5 text-[#00bc7d]" />
                    Users Directory
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-6">
                  <div className="flex gap-4 mb-6">
                    <div className="flex-1">
                      <div className="relative">
                        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                        <Input
                          placeholder="Search users..."
                          value={searchTerm}
                          onChange={(e) => setSearchTerm(e.target.value)}
                          className="pl-10 rounded-xl border-gray-200 focus:border-[#00bc7d] focus:ring-[#00bc7d]/20 h-11 bg-gray-50/50"
                        />
                      </div>
                    </div>
                    <Select value={roleFilter} onValueChange={setRoleFilter}>
                      <SelectTrigger className="w-48 rounded-xl border-gray-200 focus:border-[#00bc7d] focus:ring-[#00bc7d]/20 h-11 bg-gray-50/50">
                        <SelectValue placeholder="Filter by role" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Roles</SelectItem>
                        <SelectItem value="admin">Admin</SelectItem>
                        <SelectItem value="manager">Manager</SelectItem>
                        <SelectItem value="trainer">Trainer</SelectItem>
                        <SelectItem value="member">Member</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="rounded-xl border border-gray-100 overflow-hidden">
                    <Table>
                      <TableHeader className="bg-gray-50/50">
                        <TableRow className="border-gray-100 hover:bg-transparent">
                          <TableHead className="font-semibold text-gray-600">User</TableHead>
                          <TableHead className="font-semibold text-gray-600">Contact</TableHead>
                          <TableHead className="font-semibold text-gray-600">Role</TableHead>
                          <TableHead className="font-semibold text-gray-600">Status</TableHead>
                          <TableHead className="font-semibold text-gray-600 text-right">Actions</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {isLoading ? (
                          <TableRow>
                            <TableCell colSpan={5} className="text-center py-8">
                              <div className="flex items-center justify-center">
                                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#00bc7d]"></div>
                                <span className="ml-3 text-muted-foreground">Loading users...</span>
                              </div>
                            </TableCell>
                          </TableRow>
                        ) : filteredUsers.length === 0 ? (
                          <TableRow>
                            <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                              No users found
                            </TableCell>
                          </TableRow>
                        ) : (
                          filteredUsers.map((user, index) => (
                            <motion.tr
                              key={user.id}
                              initial={{ opacity: 0, x: -20 }}
                              animate={{ opacity: 1, x: 0 }}
                              transition={{ delay: index * 0.05 }}
                              className="border-gray-100 hover:bg-gray-50/50 transition-colors"
                            >
                              <TableCell>
                                <div className="flex items-center space-x-3">
                                  <Avatar className="h-10 w-10 ring-2 ring-white shadow-sm">
                                    <AvatarFallback className="bg-gradient-to-br from-[#00bc7d] to-teal-600 text-white font-medium">
                                      {user.first_name[0]}{user.last_name[0]}
                                    </AvatarFallback>
                                  </Avatar>
                                  <div>
                                    <div className="font-medium text-gray-900">
                                      {user.first_name} {user.last_name}
                                    </div>
                                    <div className="text-xs text-gray-500">
                                      Joined {new Date(user.created_at).toLocaleDateString()}
                                    </div>
                                  </div>
                                </div>
                              </TableCell>
                              <TableCell>
                                <div className="space-y-1">
                                  <div className="flex items-center gap-2 text-sm text-gray-600">
                                    <Mail className="h-3.5 w-3.5 text-gray-400" />
                                    {user.email}
                                  </div>
                                  {user.phone_number && (
                                    <div className="flex items-center gap-2 text-sm text-gray-600">
                                      <Phone className="h-3.5 w-3.5 text-gray-400" />
                                      {user.phone_number}
                                    </div>
                                  )}
                                </div>
                              </TableCell>
                              <TableCell>
                                <Badge className={`${getRoleColor(user.role)} border rounded-full px-3 py-1 capitalize font-medium shadow-sm`}>
                                  {user.role}
                                </Badge>
                              </TableCell>
                              <TableCell>
                                <Badge
                                  variant={user.is_active ? 'default' : 'secondary'}
                                  className={`rounded-full ${user.is_active ? 'bg-[#00bc7d]/10 text-[#00bc7d] border-[#00bc7d]/20' : 'bg-gray-100 text-gray-500 border-gray-200'} shadow-sm`}
                                >
                                  {user.is_active ? 'Active' : 'Inactive'}
                                </Badge>
                              </TableCell>
                              <TableCell className="text-right">
                                <div className="flex justify-end gap-2">
                                  <Button
                                    variant="ghost"
                                    size="icon"
                                    className="h-8 w-8 text-gray-400 hover:text-[#00bc7d] hover:bg-[#00bc7d]/10"
                                    onClick={() => navigate(`/users/${user.id}`)}
                                  >
                                    <Eye className="h-4 w-4" />
                                  </Button>
                                  <Button
                                    variant="ghost"
                                    size="icon"
                                    className="h-8 w-8 text-gray-400 hover:text-blue-600 hover:bg-blue-50"
                                    onClick={() => navigate(`/users/${user.id}/edit`)}
                                  >
                                    <Edit className="h-4 w-4" />
                                  </Button>
                                  <DropdownMenu>
                                    <DropdownMenuTrigger asChild>
                                      <Button variant="ghost" size="icon" className="h-8 w-8 text-gray-400 hover:text-gray-600">
                                        <MoreVertical className="h-4 w-4" />
                                      </Button>
                                    </DropdownMenuTrigger>
                                    <DropdownMenuContent align="end">
                                      <DropdownMenuItem
                                        className="text-red-600 focus:text-red-600 focus:bg-red-50"
                                        onClick={() => openDeleteDialog(user.id)}
                                      >
                                        <Trash2 className="h-4 w-4 mr-2" />
                                        Delete User
                                      </DropdownMenuItem>
                                    </DropdownMenuContent>
                                  </DropdownMenu>
                                </div>
                              </TableCell>
                            </motion.tr>
                          ))
                        )}
                      </TableBody>
                    </Table>
                  </div>
                </CardContent>
              </motion.div>
            </div>
          )}
        </main>
      </motion.div>

      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent className="rounded-2xl">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-xl font-bold text-gray-900">Are you absolutely sure?</AlertDialogTitle>
            <AlertDialogDescription className="text-gray-500">
              This action cannot be undone. This will permanently delete the user and remove their access to the system.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="rounded-xl">Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={executeDeleteUser}
              className="bg-red-500 hover:bg-red-600 text-white rounded-full shadow-lg shadow-red-500/20"
            >
              Delete User
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div >
  );
};

export default UserManagement;
