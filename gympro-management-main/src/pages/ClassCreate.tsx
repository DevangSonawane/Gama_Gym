import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useAuth } from '@/hooks/useAuth';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Separator } from '@/components/ui/separator';
import { toast } from 'sonner';
import Sidebar from '@/components/layout/Sidebar';
import Topbar from '@/components/layout/Topbar';
import { 
  ArrowLeft, 
  Users, 
  Clock, 
  DollarSign, 
  Calendar as CalendarIcon, 
  CheckCircle2, 
  Sparkles,
  Tag,
  Layers
} from 'lucide-react';
import { supabase, DEFAULT_GYM_ID } from '@/lib/supabase';
import { Trainer } from '@/types';

type SupabaseTrainerRow = {
  id: string;
  first_name: string;
  last_name: string;
  email: string;
  phone?: string | null;
  specialization?: string[] | null;
  bio?: string | null;
  profile_image?: string | null;
  gym_id?: string;
  created_at: string;
  updated_at: string;
};

const ClassCreate: React.FC = () => {
  const { hasRole } = useAuth();
  const navigate = useNavigate();
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(() => {
    const saved = localStorage.getItem('sidebar-collapsed');
    return saved ? JSON.parse(saved) : false;
  });

  const [formData, setFormData] = useState({
    name: '',
    description: '',
    instructorId: '',
    duration: '60',
    capacity: '20',
    category: '',
    difficulty: 'Beginner',
    price: '15',
    equipment: [] as string[],
    startTime: '',
    endTime: '',
    roomId: '1'
  });

  const [equipmentInput, setEquipmentInput] = useState('');
  const [trainers, setTrainers] = useState<Trainer[]>([]);
  const [isLoadingTrainers, setIsLoadingTrainers] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    const fetchTrainers = async () => {
      try {
        setIsLoadingTrainers(true);
        const { data, error } = await supabase
          .from('staff')
          .select('*')
          .eq('role', 'TRAINER')
          .order('first_name');

        if (error) {
          console.error('Error fetching trainers:', error);
          toast.error('Failed to load trainers');
          return;
        }

        if (data) {
          const mappedTrainers: Trainer[] = data.map((t: SupabaseTrainerRow) => ({
            id: t.id,
            firstName: t.first_name,
            lastName: t.last_name,
            email: t.email,
            phone: t.phone,
            specialization: t.specializations,
            bio: t.bio,
            profileImage: t.profile_image,
            gymId: t.gym_id,
            createdAt: new Date(t.created_at),
            updatedAt: new Date(t.updated_at)
          }));
          setTrainers(mappedTrainers);
        }
      } catch (error) {
        console.error('Error fetching trainers:', error);
      } finally {
        setIsLoadingTrainers(false);
      }
    };

    fetchTrainers();
  }, []);

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

  const handleAddEquipment = () => {
    if (equipmentInput.trim() && !formData.equipment.includes(equipmentInput.trim())) {
      setFormData(prev => ({
        ...prev,
        equipment: [...prev.equipment, equipmentInput.trim()]
      }));
      setEquipmentInput('');
    }
  };

  const handleRemoveEquipment = (item: string) => {
    setFormData(prev => ({
      ...prev,
      equipment: prev.equipment.filter(i => i !== item)
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    
    try {
      // 1. Create Class
      const { data: classData, error: classError } = await supabase
        .from('classes')
        .insert({
          gym_id: DEFAULT_GYM_ID,
          name: formData.name,
          description: formData.description,
          instructor_id: formData.instructorId || null,
          capacity: parseInt(formData.capacity),
          duration: parseInt(formData.duration),
          price: parseFloat(formData.price),
          category: formData.category,
          difficulty: formData.difficulty,
          equipment: formData.equipment,
          is_active: true
        })
        .select()
        .single();

      if (classError) throw classError;

      // 2. Create Schedule (Optional: if time is provided)
      if (formData.startTime && formData.endTime && classData) {
        // Just creating one schedule for today/tomorrow as an example or based on input
        // Since the UI only asks for startTime/endTime but not date, let's assume it's a template
        // or we create one instance for tomorrow.
        // For now, let's create one instance for tomorrow at the given time.
        
        const tomorrow = new Date();
        tomorrow.setDate(tomorrow.getDate() + 1);
        const dateStr = tomorrow.toISOString().split('T')[0];
        
        const { error: scheduleError } = await supabase
          .from('class_schedules')
          .insert({
            gym_id: DEFAULT_GYM_ID,
            class_id: classData.id,
            date: dateStr,
            start_time: formData.startTime,
            end_time: formData.endTime,
            room_id: null, // Default or select
            booked_count: 0,
            waitlist_count: 0,
            status: 'scheduled'
          });

        if (scheduleError) {
          console.warn('Error creating schedule:', scheduleError);
          // Don't fail the whole process if schedule fails, but warn
          toast.warning('Class created but schedule creation failed');
        }
      }

      toast.success('Class created successfully!');
      navigate('/dashboard?tab=classes');
    } catch (error: unknown) {
      console.error('Error creating class:', error);
      const message = error instanceof Error ? error.message : 'Failed to create class';
      toast.error(message);
    } finally {
      setIsSubmitting(false);
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
            
            {/* Header */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
              <div>
                <motion.h2 
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  className="text-3xl font-bold mb-2 text-gray-900 flex items-center gap-3"
                >
                  <div className="p-3 bg-[#00bc7d] rounded-xl shadow-lg shadow-[#00bc7d]/20">
                    <Sparkles className="h-6 w-6 text-white" />
                  </div>
                  Create New Class
                </motion.h2>
                <motion.p 
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.1 }}
                  className="text-muted-foreground ml-16"
                >
                  Set up a new fitness class, schedule, and capacity.
                </motion.p>
              </div>
              <motion.div 
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
              >
                <Button 
                  variant="outline" 
                  onClick={() => navigate('/dashboard?tab=classes')}
                  className="group hover:border-[#00bc7d] hover:text-[#00bc7d] hover:bg-[#00bc7d]/5 rounded-xl border-gray-200"
                >
                  <ArrowLeft className="h-4 w-4 mr-2 group-hover:-translate-x-1 transition-transform" />
                  Back to Classes
                </Button>
              </motion.div>
            </div>

            <motion.form 
              variants={containerVariants}
              initial="hidden"
              animate="visible"
              onSubmit={handleSubmit}
              className="grid grid-cols-1 lg:grid-cols-3 gap-8"
            >
              {/* Left Column - Main Info */}
              <div className="lg:col-span-2 space-y-8">
                
                {/* Basic Information */}
                <motion.div variants={itemVariants}>
                  <Card className="border-0 shadow-lg shadow-gray-100/50 bg-white overflow-hidden rounded-2xl">
                    <CardHeader className="bg-gradient-to-r from-gray-50 to-white border-b border-gray-100 pb-4">
                      <div className="flex items-center gap-2">
                        <div className="p-2 bg-[#00bc7d]/10 rounded-lg">
                          <Tag className="h-5 w-5 text-[#00bc7d]" />
                        </div>
                        <CardTitle className="text-lg font-semibold text-gray-900">Basic Information</CardTitle>
                      </div>
                      <CardDescription>General details about the class</CardDescription>
                    </CardHeader>
                    <CardContent className="p-6 space-y-6">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="space-y-2 md:col-span-2">
                          <Label htmlFor="name">Class Name</Label>
                          <Input 
                            id="name" 
                            placeholder="e.g. Morning Yoga Flow" 
                            value={formData.name}
                            onChange={(e) => setFormData({...formData, name: e.target.value})}
                            className="h-11 focus-visible:ring-[#00bc7d] rounded-xl border-gray-200 transition-all"
                            required
                          />
                        </div>
                        
                        <div className="space-y-2">
                          <Label htmlFor="category">Category</Label>
                          <Select 
                            value={formData.category} 
                            onValueChange={(value) => setFormData({...formData, category: value})}
                          >
                            <SelectTrigger className="h-11 focus:ring-[#00bc7d] rounded-xl border-gray-200">
                              <SelectValue placeholder="Select Category" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="Yoga">Yoga</SelectItem>
                              <SelectItem value="HIIT">HIIT</SelectItem>
                              <SelectItem value="Strength">Strength</SelectItem>
                              <SelectItem value="Cardio">Cardio</SelectItem>
                              <SelectItem value="Pilates">Pilates</SelectItem>
                              <SelectItem value="Boxing">Boxing</SelectItem>
                              <SelectItem value="Dance">Dance</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>

                        <div className="space-y-2">
                          <Label htmlFor="difficulty">Difficulty Level</Label>
                          <Select 
                            value={formData.difficulty} 
                            onValueChange={(value) => setFormData({...formData, difficulty: value})}
                          >
                            <SelectTrigger className="h-11 focus:ring-[#00bc7d] rounded-xl border-gray-200">
                              <SelectValue placeholder="Select Difficulty" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="Beginner">Beginner</SelectItem>
                              <SelectItem value="Intermediate">Intermediate</SelectItem>
                              <SelectItem value="Advanced">Advanced</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="description">Description</Label>
                        <Textarea 
                          id="description" 
                          placeholder="Describe the class content, goals, and what to expect..." 
                          value={formData.description}
                          onChange={(e) => setFormData({...formData, description: e.target.value})}
                          className="min-h-[120px] focus-visible:ring-[#00bc7d] rounded-xl border-gray-200 transition-all"
                        />
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>

                {/* Instructor & Schedule */}
                <motion.div variants={itemVariants}>
                  <Card className="border-0 shadow-lg shadow-gray-100/50 bg-white overflow-hidden rounded-2xl">
                    <CardHeader className="bg-gradient-to-r from-gray-50 to-white border-b border-gray-100 pb-4">
                      <div className="flex items-center gap-2">
                        <div className="p-2 bg-[#00bc7d]/10 rounded-lg">
                          <Users className="h-5 w-5 text-[#00bc7d]" />
                        </div>
                        <CardTitle className="text-lg font-semibold text-gray-900">Instructor & Schedule</CardTitle>
                      </div>
                      <CardDescription>Who is teaching and when</CardDescription>
                    </CardHeader>
                    <CardContent className="p-6 space-y-6">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="space-y-2 md:col-span-2">
                          <Label htmlFor="instructor">Trainer</Label>
                          <Select 
                            value={formData.instructorId} 
                            onValueChange={(value) => setFormData({...formData, instructorId: value})}
                          >
                            <SelectTrigger className="h-11 focus:ring-[#00bc7d] rounded-xl border-gray-200">
                              <SelectValue placeholder={isLoadingTrainers ? "Loading trainers..." : "Select Trainer"} />
                            </SelectTrigger>
                            <SelectContent>
                              {trainers.map(trainer => (
                                <SelectItem key={trainer.id} value={trainer.id}>
                                  {trainer.firstName} {trainer.lastName} {trainer.specialization && trainer.specialization.length > 0 ? `(${trainer.specialization[0]})` : ''}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>

                        <div className="space-y-2">
                          <Label htmlFor="startTime">Start Time</Label>
                          <div className="relative">
                            <Clock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                            <Input 
                              id="startTime" 
                              type="time" 
                              value={formData.startTime}
                              onChange={(e) => setFormData({...formData, startTime: e.target.value})}
                              className="pl-10 h-11 focus-visible:ring-[#00bc7d] rounded-xl border-gray-200"
                            />
                          </div>
                        </div>

                        <div className="space-y-2">
                          <Label htmlFor="endTime">End Time</Label>
                          <div className="relative">
                            <Clock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                            <Input 
                              id="endTime" 
                              type="time" 
                              value={formData.endTime}
                              onChange={(e) => setFormData({...formData, endTime: e.target.value})}
                              className="pl-10 h-11 focus-visible:ring-[#00bc7d] rounded-xl border-gray-200"
                            />
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              </div>

              {/* Right Column - Details */}
              <div className="space-y-8">
                {/* Capacity & Pricing */}
                <motion.div variants={itemVariants}>
                  <Card className="border-0 shadow-lg shadow-gray-100/50 bg-white overflow-hidden rounded-2xl">
                    <CardHeader className="bg-gradient-to-r from-gray-50 to-white border-b border-gray-100 pb-4">
                      <div className="flex items-center gap-2">
                        <div className="p-2 bg-[#00bc7d]/10 rounded-lg">
                          <DollarSign className="h-5 w-5 text-[#00bc7d]" />
                        </div>
                        <CardTitle className="text-lg font-semibold text-gray-900">Capacity & Pricing</CardTitle>
                      </div>
                    </CardHeader>
                    <CardContent className="p-6 space-y-6">
                      <div className="space-y-2">
                        <Label htmlFor="price">Price per Session ($)</Label>
                        <Input 
                          id="price" 
                          type="number" 
                          min="0"
                          step="0.01"
                          value={formData.price}
                          onChange={(e) => setFormData({...formData, price: e.target.value})}
                          className="h-11 focus-visible:ring-[#00bc7d] rounded-xl border-gray-200"
                        />
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="capacity">Max Capacity</Label>
                        <Input 
                          id="capacity" 
                          type="number" 
                          min="1"
                          value={formData.capacity}
                          onChange={(e) => setFormData({...formData, capacity: e.target.value})}
                          className="h-11 focus-visible:ring-[#00bc7d] rounded-xl border-gray-200"
                        />
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="duration">Duration (minutes)</Label>
                        <Select 
                          value={formData.duration} 
                          onValueChange={(value) => setFormData({...formData, duration: value})}
                        >
                          <SelectTrigger className="h-11 focus:ring-[#00bc7d] rounded-xl border-gray-200">
                            <SelectValue placeholder="Select Duration" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="30">30 minutes</SelectItem>
                            <SelectItem value="45">45 minutes</SelectItem>
                            <SelectItem value="60">60 minutes</SelectItem>
                            <SelectItem value="90">90 minutes</SelectItem>
                            <SelectItem value="120">120 minutes</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>

                {/* Equipment */}
                <motion.div variants={itemVariants}>
                  <Card className="border-0 shadow-lg shadow-gray-100/50 bg-white overflow-hidden rounded-2xl">
                    <CardHeader className="bg-gradient-to-r from-gray-50 to-white border-b border-gray-100 pb-4">
                      <div className="flex items-center gap-2">
                        <div className="p-2 bg-[#00bc7d]/10 rounded-lg">
                          <Layers className="h-5 w-5 text-[#00bc7d]" />
                        </div>
                        <CardTitle className="text-lg font-semibold text-gray-900">Equipment</CardTitle>
                      </div>
                    </CardHeader>
                    <CardContent className="p-6 space-y-4">
                      <div className="flex gap-2">
                        <Input 
                          placeholder="Add equipment..." 
                          value={equipmentInput}
                          onChange={(e) => setEquipmentInput(e.target.value)}
                          onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), handleAddEquipment())}
                          className="h-11 focus-visible:ring-[#00bc7d] rounded-xl border-gray-200"
                        />
                        <Button 
                          type="button"
                          onClick={handleAddEquipment}
                          className="h-11 w-11 p-0 rounded-xl bg-[#00bc7d] hover:bg-[#00bc7d]/90 text-white"
                        >
                          <CheckCircle2 className="h-5 w-5" />
                        </Button>
                      </div>

                      <div className="flex flex-wrap gap-2">
                        {formData.equipment.map((item, index) => (
                          <div 
                            key={index}
                            className="flex items-center gap-1 px-3 py-1.5 bg-gray-100 text-gray-700 rounded-lg text-sm group hover:bg-red-50 hover:text-red-600 transition-colors cursor-pointer"
                            onClick={() => handleRemoveEquipment(item)}
                          >
                            <span>{item}</span>
                            <span className="opacity-0 group-hover:opacity-100 transition-opacity">×</span>
                          </div>
                        ))}
                        {formData.equipment.length === 0 && (
                          <span className="text-sm text-gray-400 italic">No equipment added yet</span>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>

                {/* Submit Buttons */}
                <motion.div variants={itemVariants}>
                  <Card className="border-0 shadow-lg shadow-gray-100/50 bg-white overflow-hidden rounded-2xl">
                    <CardContent className="p-6 space-y-4">
                      <Button 
                        type="submit" 
                        className="w-full h-12 bg-[#00bc7d] hover:bg-[#00bc7d]/90 text-white rounded-xl shadow-lg shadow-[#00bc7d]/20 text-base font-semibold"
                        disabled={isSubmitting}
                      >
                        {isSubmitting ? 'Creating Class...' : 'Create Class'}
                      </Button>
                      <Button 
                        type="button" 
                        variant="outline" 
                        className="w-full h-12 border-gray-200 rounded-xl hover:bg-gray-50 text-gray-700"
                        onClick={() => navigate('/dashboard?tab=classes')}
                        disabled={isSubmitting}
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

export default ClassCreate;
