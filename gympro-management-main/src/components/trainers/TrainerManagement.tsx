import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Trainer, UserRole } from '@/types';
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
  Users,
  Sparkles,
  Dumbbell
} from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { supabase, DEFAULT_GYM_ID } from '@/lib/supabase';
import { toast } from 'sonner';
import PageLoader from '../ui/PageLoader';

type SupabaseTrainerRow = {
  id: string;
  email: string;
  first_name: string;
  last_name: string;
  phone?: string | null;
  bio?: string | null;
  profile_image?: string | null;
  specialization?: string[] | null;
  created_at: string;
  updated_at: string;
  gym_id?: string;
};

const TrainerManagement: React.FC = () => {
  const navigate = useNavigate();
  const { hasRole } = useAuth();
  const [trainers, setTrainers] = useState<Trainer[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedSpecialization, setSelectedSpecialization] = useState<string>('all');
  const [isLoading, setIsLoading] = useState(true);

  // Helper function to convert Supabase trainer to Trainer interface
  const mapSupabaseTrainerToTrainer = (dbTrainer: SupabaseTrainerRow): Trainer => {
    return {
      id: dbTrainer.id,
      email: dbTrainer.email,
      firstName: dbTrainer.first_name,
      lastName: dbTrainer.last_name,
      phone: dbTrainer.phone || '',
      bio: dbTrainer.bio || '',
      profileImage: dbTrainer.profile_image || '',
      specialization: dbTrainer.specialization || [],
      createdAt: new Date(dbTrainer.created_at),
      updatedAt: new Date(dbTrainer.updated_at),
      gymId: dbTrainer.gym_id
    };
  };

  // Fetch trainers from Supabase
  useEffect(() => {
    const fetchTrainers = async () => {
      try {
        setIsLoading(true);
        const { data, error } = await supabase
          .from('staff')
          .select('*')
          .eq('gym_id', DEFAULT_GYM_ID)
          .eq('role', 'TRAINER')
          .order('created_at', { ascending: false });

        if (error) {
          console.error('Error fetching trainers:', error);
          toast.error('Failed to load trainers');
          return;
        }

        if (data) {
          const mappedTrainers = data.map(mapSupabaseTrainerToTrainer);
          setTrainers(mappedTrainers);
        }
      } catch (error) {
        console.error('Error fetching trainers:', error);
        toast.error('Failed to load trainers');
      } finally {
        setIsLoading(false);
      }
    };

    fetchTrainers();
  }, []);

  if (isLoading) {
    return <PageLoader />;
  }

  const getInitials = (firstName: string, lastName: string) => {
    const first = firstName?.[0] || '';
    const last = lastName?.[0] || '';
    return `${first}${last}`.toUpperCase();
  };

  const filteredTrainers = trainers.filter(trainer => {
    const matchesSearch =
      trainer.firstName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      trainer.lastName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      trainer.email.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesSpecialization = selectedSpecialization === 'all' || 
      (trainer.specialization && trainer.specialization.includes(selectedSpecialization));

    return matchesSearch && matchesSpecialization;
  });

  const handleDeleteTrainer = async (trainerId: string) => {
    if (!window.confirm('Are you sure you want to delete this trainer?')) {
      return;
    }

    try {
      const { error } = await supabase
        .from('staff')
        .delete()
        .eq('id', trainerId);

      if (error) {
        console.error('Error deleting trainer:', error);
        toast.error('Failed to delete trainer');
        return;
      }

      setTrainers(prev => prev.filter(t => t.id !== trainerId));
      toast.success('Trainer deleted successfully');
    } catch (error) {
      console.error('Error deleting trainer:', error);
      toast.error('Failed to delete trainer');
    }
  };

  // Collect all unique specializations for the filter
  const allSpecializations = Array.from(new Set(trainers.flatMap(t => t.specialization || [])));

  return (
    <div className="space-y-8">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-3xl font-bold mb-2 text-gray-900 flex items-center gap-2">
            <Dumbbell className="h-7 w-7 text-[#00bc7d]" />
            Trainer Management
          </h2>
          <p className="text-muted-foreground">Manage gym trainers and schedules</p>
        </div>
        <div className="flex gap-3">
          <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
            <Button
              className="rounded-xl h-11 px-6 shadow-lg shadow-[#00bc7d]/20 bg-[#00bc7d] hover:bg-[#00bc7d]/90 text-white"
              onClick={() => navigate('/staff/new')}
            >
              <UserPlus className="h-4 w-4 mr-2" />
              Add Trainer
            </Button>
          </motion.div>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {[
          { label: 'Total Trainers', value: trainers.length, icon: Users, color: 'text-[#00bc7d]', bg: 'bg-[#00bc7d]/10', border: 'border-[#00bc7d]/20', delay: 0.1 },
          { label: 'Specializations', value: allSpecializations.length, icon: Sparkles, color: 'text-blue-600', bg: 'bg-blue-500/10', border: 'border-blue-200', delay: 0.2 },
          { label: 'Active Schedules', value: '0', icon: Calendar, color: 'text-purple-600', bg: 'bg-purple-500/10', border: 'border-purple-200', delay: 0.3 }, // Placeholder for now
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
              <h3 className="text-xl font-bold text-gray-900">Trainer Directory</h3>
              <p className="text-sm text-gray-500">Manage your training team</p>
            </div>
          </div>

          <div className="flex gap-4">
            <div className="relative group">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400 group-focus-within:text-[#00bc7d] transition-colors" />
              <Input
                placeholder="Search trainers..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 rounded-xl border-gray-200 h-11 bg-white focus:ring-2 focus:ring-[#00bc7d]/20 focus:border-[#00bc7d] transition-all shadow-sm w-64"
              />
            </div>
            <Select value={selectedSpecialization} onValueChange={setSelectedSpecialization}>
              <SelectTrigger className="w-48 rounded-xl border-gray-200 h-11 bg-white focus:ring-2 focus:ring-[#00bc7d]/20 focus:border-[#00bc7d] shadow-sm">
                <SelectValue placeholder="Filter by Specialization" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Specializations</SelectItem>
                {allSpecializations.map(spec => (
                  <SelectItem key={spec} value={spec}>{spec}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="p-6">
          {filteredTrainers.length === 0 ? (
            <div className="text-center py-16 text-gray-500">
              <div className="flex flex-col items-center gap-3">
                <div className="p-4 bg-gray-50 rounded-full border border-gray-100">
                  <Users className="h-8 w-8 text-gray-400" />
                </div>
                <p className="text-lg font-medium text-gray-900">No trainers found</p>
                <p className="text-sm text-gray-500">Try adjusting your search or filters, or add a new trainer.</p>
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
              {filteredTrainers.map((trainer, index) => (
                <motion.div
                  key={trainer.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.03 }}
                  className="rounded-3xl bg-white border border-gray-100 shadow-xl shadow-gray-100/50 p-6 flex flex-col gap-5"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-4">
                      <Avatar className="h-14 w-14 ring-2 ring-white shadow-md">
                        <AvatarImage src={trainer.profileImage} />
                        <AvatarFallback className="bg-gradient-to-br from-[#00bc7d] to-[#009664] text-white font-bold text-lg">
                          {getInitials(trainer.firstName, trainer.lastName)}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <p className="text-lg font-bold text-gray-900">
                          {trainer.firstName} {trainer.lastName}
                        </p>
                        <p className="text-sm text-gray-500 truncate max-w-[150px]" title={trainer.bio}>{trainer.bio || 'No bio available'}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-1">
                      {hasRole(UserRole.MANAGER) && (
                        <>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => navigate(`/staff/${trainer.id}/edit`)}
                            className="h-9 w-9 rounded-xl text-gray-500 hover:bg-[#00bc7d]/10 hover:text-[#00bc7d] transition-all"
                            title="Edit Trainer"
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleDeleteTrainer(trainer.id)}
                            className="h-9 w-9 rounded-xl text-gray-500 hover:bg-red-50 hover:text-red-600 transition-all"
                            title="Delete Trainer"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </>
                      )}
                    </div>
                  </div>

                  <div className="flex flex-wrap gap-2 text-sm">
                    {trainer.specialization && trainer.specialization.length > 0 ? (
                      trainer.specialization.map((spec, i) => (
                        <Badge key={i} className="bg-[#00bc7d]/10 text-[#00bc7d] border-[#00bc7d]/20 border px-2.5 py-0.5 rounded-full text-xs font-semibold">
                          {spec}
                        </Badge>
                      ))
                    ) : (
                      <Badge className="bg-gray-500/10 text-gray-700 border-gray-200 border px-2.5 py-0.5 rounded-full text-xs font-semibold">
                        General
                      </Badge>
                    )}
                  </div>

                  <div className="space-y-2 text-sm text-gray-600 mt-2">
                    <div className="flex items-center gap-2">
                      <Mail className="h-4 w-4 text-gray-400" />
                      <span>{trainer.email}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Phone className="h-4 w-4 text-gray-400" />
                      <span>{trainer.phone || 'N/A'}</span>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 mt-auto">
                    <Button
                      variant="outline"
                      className="flex-1 rounded-xl h-11 border-gray-200 text-gray-700 hover:border-[#00bc7d] hover:text-[#00bc7d] hover:bg-[#00bc7d]/5"
                      onClick={() => navigate(`/staff/${trainer.id}`)}
                    >
                      <Calendar className="h-4 w-4 mr-2" />
                      Schedule
                    </Button>
                    <Button
                      className="flex-1 rounded-xl h-11 bg-[#00bc7d] hover:bg-[#00bc7d]/90 text-white shadow-lg shadow-[#00bc7d]/20"
                      onClick={() => navigate(`/staff/${trainer.id}`)}
                    >
                      View Profile
                    </Button>
                  </div>
                </motion.div>
              ))}
            </div>
          )}
        </div>
      </motion.div>
    </div>
  );
};

export default TrainerManagement;
