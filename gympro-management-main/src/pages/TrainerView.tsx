import React, { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useAuth } from '@/hooks/useAuth';
import { Trainer, UserRole } from '@/types';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { supabase } from '@/lib/supabase';
import { toast } from 'sonner';
import Sidebar from '@/components/layout/Sidebar';
import Topbar from '@/components/layout/Topbar';
import PageLoader from '@/components/ui/PageLoader';
import {
  ArrowLeft,
  User,
  Briefcase,
  Mail,
  Phone,
  Calendar,
  Clock,
  Edit,
  CheckCircle2,
  Sparkles,
  Dumbbell
} from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';

type DbTrainer = {
  id: string;
  email: string;
  first_name: string;
  last_name: string;
  phone?: string | null;
  bio?: string | null;
  profile_image?: string | null;
  specializations?: string[] | null;
  created_at: string;
  updated_at: string;
  gym_id?: string;
};

const mapSupabaseTrainerToTrainer = (dbTrainer: DbTrainer): Trainer => {
  return {
    id: dbTrainer.id,
    email: dbTrainer.email,
    firstName: dbTrainer.first_name,
    lastName: dbTrainer.last_name,
    phone: dbTrainer.phone || '',
    bio: dbTrainer.bio || '',
    profileImage: dbTrainer.profile_image || '',
    specialization: dbTrainer.specializations || [],
    createdAt: new Date(dbTrainer.created_at),
    updatedAt: new Date(dbTrainer.updated_at),
    gymId: dbTrainer.gym_id
  };
};

const TrainerView: React.FC = () => {
  const { hasRole } = useAuth();
  const navigate = useNavigate();
  const { id } = useParams();
  const [trainer, setTrainer] = useState<Trainer | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(() => {
    const saved = localStorage.getItem('sidebar-collapsed');
    return saved ? JSON.parse(saved) : false;
  });

  useEffect(() => {
    const fetchTrainer = async () => {
      try {
        const { data, error } = await supabase.from('staff').select('*').eq('id', id).single();
        if (error) {
          console.error('Error fetching trainer:', error);
          toast.error('Failed to load trainer details');
          return;
        }
        setTrainer(mapSupabaseTrainerToTrainer(data as DbTrainer));
      } catch (error) {
        console.error('Error fetching trainer:', error);
        toast.error('Failed to load trainer details');
      } finally {
        setIsLoading(false);
      }
    };
    if (id) fetchTrainer();
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

  const getInitials = (firstName: string, lastName: string) => {
    const first = firstName?.[0] || '';
    const last = lastName?.[0] || '';
    return `${first}${last}`.toUpperCase();
  };

  if (isLoading) {
    return <PageLoader />;
  }

  if (!trainer) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Trainer Not Found</h2>
          <Button onClick={() => navigate('/dashboard?tab=staff')} variant="outline">
            Return to Trainer List
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
          marginLeft: isSidebarCollapsed ? '80px' : '280px'
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
                      {trainer.firstName} {trainer.lastName}
                    </h2>
                    <div className="flex items-center gap-2 mt-1">
                      <Badge className="bg-[#00bc7d]/10 text-[#00bc7d] border-[#00bc7d]/20">
                        TRAINER
                      </Badge>
                      <span className="text-sm text-gray-500 ml-1">Joined {trainer.createdAt.toLocaleDateString()}</span>
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
                    onClick={() => navigate(`/staff/${trainer.id}/edit`)}
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
                       <div className="md:col-span-2 flex justify-center mb-4">
                        <Avatar className="h-24 w-24 ring-4 ring-[#00bc7d]/10">
                          <AvatarImage src={trainer.profileImage} />
                          <AvatarFallback className="bg-gradient-to-br from-[#00bc7d] to-[#009664] text-white font-bold text-2xl">
                            {getInitials(trainer.firstName, trainer.lastName)}
                          </AvatarFallback>
                        </Avatar>
                      </div>
                      <div className="space-y-1">
                        <p className="text-sm text-gray-500 font-medium flex items-center gap-2">
                          <Mail className="h-4 w-4" /> Email Address
                        </p>
                        <p className="text-base font-semibold text-gray-900">{trainer.email}</p>
                      </div>
                      <div className="space-y-1">
                        <p className="text-sm text-gray-500 font-medium flex items-center gap-2">
                          <Phone className="h-4 w-4" /> Phone Number
                        </p>
                        <p className="text-base font-semibold text-gray-900">{trainer.phone || 'N/A'}</p>
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
                          <Dumbbell className="h-5 w-5 text-[#00bc7d]" />
                        </div>
                        <CardTitle className="text-lg text-gray-900">Professional Details</CardTitle>
                      </div>
                    </CardHeader>
                    <CardContent className="p-6 space-y-6">
                       <div className="space-y-3">
                        <h4 className="text-sm font-medium text-gray-500 flex items-center gap-2">
                           <Sparkles className="h-4 w-4" /> Specializations
                        </h4>
                        <div className="flex flex-wrap gap-2">
                          {trainer.specialization && trainer.specialization.length > 0 ? (
                            trainer.specialization.map((spec, i) => (
                              <Badge key={i} variant="secondary" className="bg-[#00bc7d]/10 text-[#00bc7d] hover:bg-[#00bc7d]/20 border-[#00bc7d]/20">
                                {spec}
                              </Badge>
                            ))
                          ) : (
                            <span className="text-gray-400 text-sm italic">No specializations listed</span>
                          )}
                        </div>
                      </div>
                      
                      <div className="space-y-2">
                         <h4 className="text-sm font-medium text-gray-500 flex items-center gap-2">
                           <Briefcase className="h-4 w-4" /> Bio
                        </h4>
                        <p className="text-gray-700 leading-relaxed bg-gray-50 p-4 rounded-xl border border-gray-100">
                          {trainer.bio || 'No biography provided.'}
                        </p>
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
                        <CardTitle className="text-lg text-gray-900">Status</CardTitle>
                      </div>
                    </CardHeader>
                    <CardContent className="p-6 relative z-10 space-y-6">
                      <div className="p-4 rounded-xl bg-[#00bc7d]/5 border border-[#00bc7d]/10 space-y-3">
                        <div className="flex justify-between items-center pt-2">
                          <span className="text-sm text-gray-600">Account Status</span>
                          <Badge className="bg-[#00bc7d] hover:bg-[#00bc7d]/90">
                            Active
                          </Badge>
                        </div>
                      </div>

                      <div className="space-y-3 pt-2">
                        <div className="flex justify-between text-sm">
                          <span className="text-gray-500">Joined</span>
                          <span className="font-medium">{trainer.createdAt.toLocaleDateString()}</span>
                        </div>
                        <div className="flex justify-between text-sm">
                          <span className="text-gray-500">Last Updated</span>
                          <span className="font-medium">{trainer.updatedAt.toLocaleDateString()}</span>
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
                        <CardTitle className="text-lg text-gray-900">Upcoming Classes</CardTitle>
                      </div>
                    </CardHeader>
                    <CardContent className="p-6">
                      <div className="text-center py-6">
                         <Calendar className="h-10 w-10 text-gray-300 mx-auto mb-3" />
                         <p className="text-gray-500 text-sm">No upcoming classes scheduled</p>
                         <Button variant="link" className="text-[#00bc7d] mt-2">
                           View Full Schedule
                         </Button>
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

export default TrainerView;
