import React, { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  ArrowLeft,
  Edit,
  Dumbbell,
  Phone,
  Mail,
  CheckCircle2,
  ShieldCheck,
  User
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { toast } from 'sonner';
import Sidebar from '@/components/layout/Sidebar';
import Topbar from '@/components/layout/Topbar';
import PageLoader from '@/components/ui/PageLoader';
import { supabase } from '@/lib/supabase';

type DbTrainerFull = {
  id: string;
  email: string;
  first_name: string;
  last_name: string;
  phone_number?: string | null;
  bio?: string | null;
  profile_image?: string | null;
  specializations?: string[] | null;
  role?: string | null;
  gym_id?: string | null;
  created_at: string;
  updated_at: string;
};

const TrainerEdit: React.FC = () => {
  const navigate = useNavigate();
  const { id } = useParams();
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(() => {
    const saved = localStorage.getItem('sidebar-collapsed');
    return saved ? JSON.parse(saved) : false;
  });
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [trainer, setTrainer] = useState<DbTrainerFull | null>(null);

  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    specializations: '',
    bio: ''
  });

  useEffect(() => {
    const fetchTrainer = async () => {
      try {
        const { data, error } = await supabase
          .from('users')
          .select('*')
          .eq('id', id)
          .single();

        if (error) {
          toast.error('Failed to load trainer details');
          return;
        }

        const t = data as DbTrainerFull;
        setTrainer(t);
        setFormData({
          firstName: t.first_name,
          lastName: t.last_name,
          email: t.email,
          phone: t.phone_number || '',
          specializations: (t.specializations || []).join(', '),
          bio: t.bio || ''
        });
      } catch {
        toast.error('Failed to load trainer details');
      } finally {
        setIsLoading(false);
      }
    };

    if (id) fetchTrainer();
  }, [id]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!trainer) return;

    setIsSaving(true);
    try {
      const specializationsArray = formData.specializations
        .split(',')
        .map(s => s.trim())
        .filter(s => s.length > 0);

      const { error } = await supabase
        .from('users')
        .update({
          first_name: formData.firstName,
          last_name: formData.lastName,
          email: formData.email,
          phone_number: formData.phone || null,
          specializations: specializationsArray,
          bio: formData.bio || null,
          updated_at: new Date().toISOString()
        })
        .eq('id', trainer.id);

      if (error) {
        toast.error(error.message || 'Failed to update trainer');
        return;
      }

      toast.success('Trainer updated successfully!');
      navigate(`/trainers/${trainer.id}`);
    } catch {
      toast.error('Failed to update trainer');
    } finally {
      setIsSaving(false);
    }
  };

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: { opacity: 1, transition: { staggerChildren: 0.1 } }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0 }
  };

  if (isLoading) return <PageLoader />;

  if (!trainer) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Trainer Not Found</h2>
          <Button onClick={() => navigate('/trainers')} variant="outline">Return to Trainers</Button>
        </div>
      </div>
    );
  }

  const initials = `${formData.firstName[0] || ''}${formData.lastName[0] || ''}`.toUpperCase();

  return (
    <div className="min-h-screen bg-gray-50 flex">
      <Sidebar
        isCollapsed={isSidebarCollapsed}
        onToggle={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
      />

      <motion.div
        animate={{ marginLeft: isSidebarCollapsed ? '5rem' : '16rem' }}
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
                  onClick={() => navigate(`/trainers/${id}`)}
                >
                  <ArrowLeft className="mr-2 h-4 w-4" />
                  Back to Trainer Profile
                </Button>
                <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
                  <div className="p-3 rounded-xl bg-[#00bc7d] text-white shadow-lg shadow-[#00bc7d]/20">
                    <Edit className="h-6 w-6" />
                  </div>
                  Edit Trainer Profile
                </h1>
                <p className="text-muted-foreground mt-2 ml-16">
                  Update trainer information and professional details.
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
              {/* Left Column */}
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
                          {formData.specializations && (
                            <div className="flex flex-wrap gap-2 mt-2">
                              {formData.specializations.split(',').map(s => s.trim()).filter(Boolean).map((spec, i) => (
                                <Badge key={i} variant="outline" className="bg-[#00bc7d]/10 text-[#00bc7d] border-[#00bc7d]/20">
                                  {spec}
                                </Badge>
                              ))}
                            </div>
                          )}
                        </div>

                        <div className="space-y-2">
                          <Label htmlFor="bio">Professional Bio</Label>
                          <Textarea
                            id="bio"
                            placeholder="Brief professional biography..."
                            value={formData.bio}
                            onChange={(e) => setFormData({ ...formData, bio: e.target.value })}
                            className="min-h-[110px] focus-visible:ring-[#00bc7d] rounded-xl border-gray-200 resize-none"
                          />
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              </div>

              {/* Right Column */}
              <div className="space-y-8">

                {/* Trainer Card */}
                <motion.div variants={itemVariants}>
                  <Card className="border-0 shadow-xl shadow-[#00bc7d]/5 bg-white overflow-hidden rounded-2xl relative">
                    <div className="absolute top-0 right-0 p-32 bg-[#00bc7d]/5 rounded-full blur-3xl -mr-16 -mt-16 pointer-events-none" />
                    <CardHeader className="bg-gradient-to-br from-[#00bc7d] to-[#009664] text-white pb-6 relative overflow-hidden">
                      <div className="absolute top-0 right-0 opacity-10">
                        <Dumbbell className="h-28 w-28 text-white" />
                      </div>
                      <div className="relative z-10 flex flex-col items-center gap-3 pt-2">
                        <Avatar className="h-20 w-20 ring-4 ring-white/30 shadow-xl">
                          <AvatarFallback className="bg-white text-[#00bc7d] text-2xl font-bold">
                            {initials || <User className="h-8 w-8" />}
                          </AvatarFallback>
                        </Avatar>
                        <div className="text-center">
                          <p className="text-xl font-bold text-white">
                            {formData.firstName || 'First'} {formData.lastName || 'Last'}
                          </p>
                          <Badge className="mt-2 bg-white/20 text-white border-white/20 hover:bg-white/30">
                            Trainer
                          </Badge>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent className="p-6 space-y-4 relative z-10">
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-muted-foreground">Role</span>
                        <span className="font-semibold text-[#00bc7d]">TRAINER</span>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>

                {/* Actions */}
                <motion.div variants={itemVariants}>
                  <Card className="border-0 shadow-lg shadow-gray-100/50 bg-white overflow-hidden rounded-2xl">
                    <CardContent className="p-6 space-y-3">
                      <Button
                        type="submit"
                        disabled={isSaving}
                        className="w-full h-12 text-base font-semibold bg-[#00bc7d] hover:bg-[#00bc7d]/90 shadow-lg shadow-[#00bc7d]/20 rounded-xl"
                      >
                        {isSaving ? 'Saving...' : (
                          <>
                            Save Changes
                            <CheckCircle2 className="ml-2 h-5 w-5" />
                          </>
                        )}
                      </Button>
                      <Button
                        type="button"
                        variant="ghost"
                        onClick={() => navigate(`/trainers/${id}`)}
                        className="w-full text-muted-foreground hover:text-gray-900 hover:bg-gray-100 rounded-xl"
                      >
                        Cancel
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

export default TrainerEdit;
