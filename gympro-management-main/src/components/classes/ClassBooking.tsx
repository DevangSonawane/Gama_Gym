import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Class, ClassSchedule, Trainer, UserRole } from '@/types';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import {
  Clock,
  Users,
  MapPin,
  Plus,
  Search,
  Calendar as CalendarIcon,
  Sparkles,
  Dumbbell
} from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';

import { supabase } from '@/lib/supabase';
import { toast } from 'sonner';
import PageLoader from '../ui/PageLoader';

type ClassRow = {
  id: string;
  name: string;
  description?: string | null;
  instructor_id?: string | null;
  capacity: number;
  duration: number;
  price: number;
  category: string;
  difficulty: string;
  equipment?: string[] | null;
  is_active?: boolean | null;
};

type TrainerRow = {
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

type ScheduleRow = {
  id: string;
  class_id: string;
  date: string;
  start_time: string;
  end_time: string;
  room_id?: string | null;
  gym_id: string;
  booked_count?: number | null;
  waitlist_count?: number | null;
  status?: string | null;
};

const ClassBooking: React.FC = () => {
  const navigate = useNavigate();
  const { user, hasRole } = useAuth();
  const [classSchedules, setClassSchedules] = useState<ClassSchedule[]>([]);
  const [selectedClass, setSelectedClass] = useState<ClassSchedule | null>(null);
  const [isBookingDialogOpen, setIsBookingDialogOpen] = useState(false);
  const [filterCategory, setFilterCategory] = useState<string>('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [isLoading, setIsLoading] = useState(true);

  // Fetch data from Supabase
  useEffect(() => {
    const fetchData = async () => {
      try {
        setIsLoading(true);

        // 1. Fetch Classes
        const { data: classesData, error: classesError } = await supabase
          .from('classes')
          .select('*');

        if (classesError) throw classesError;

        const classRows = (classesData ?? []) as ClassRow[];

        if (classRows.length === 0) {
          setClassSchedules([]);
          setIsLoading(false);
          return;
        }

        // 2. Fetch Trainers
        const trainerIds = [...new Set(classRows.map((c) => c.instructor_id).filter(Boolean))] as string[];
        let trainersMap = new Map<string, TrainerRow>();

        if (trainerIds.length > 0) {
          const { data: trainersData, error: trainersError } = await supabase
            .from('staff')
            .select('*')
            .in('id', trainerIds);

          if (trainersError) {
            console.warn('Could not fetch trainers', trainersError);
          } else if (trainersData) {
            const trainerRows = trainersData as TrainerRow[];
            trainersMap = new Map(trainerRows.map((t) => [t.id, t]));
          }
        }

        const mappedClasses: Class[] = classRows.map((c) => {
          const trainer = c.instructor_id ? trainersMap.get(c.instructor_id) : undefined;
          
          return {
            id: c.id,
            name: c.name,
            description: c.description || '',
            instructorId: c.instructor_id || 'unknown',
            instructor: trainer ? {
              id: trainer.id,
              email: trainer.email,
              firstName: trainer.first_name,
              lastName: trainer.last_name,
              phone: trainer.phone || '',
              bio: trainer.bio || '',
              profileImage: trainer.profile_image || '',
              specialization: trainer.specializations || [],
              createdAt: new Date(trainer.created_at),
              updatedAt: new Date(trainer.updated_at),
              gymId: trainer.gym_id
            } : {
              // Fallback instructor if missing
              id: 'unknown',
              email: '',
              firstName: 'Unknown',
              lastName: 'Trainer',
              createdAt: new Date(),
              updatedAt: new Date()
            },
            capacity: c.capacity,
            duration: c.duration,
            price: Number(c.price) || 0,
            category: c.category || 'General',
            difficulty: (c.difficulty as 'Beginner' | 'Intermediate' | 'Advanced') || 'Beginner',
            equipment: c.equipment || [],
            isActive: c.is_active ?? true
          };
        });

        // 3. Fetch Rooms (mock)
        const roomsMap = new Map();

        // 4. Fetch Class Schedules
        const { data: schedulesData, error: schedulesError } = await supabase
          .from('class_schedules')
          .select('*')
          .order('date', { ascending: true });

        if (schedulesError) throw schedulesError;

        const scheduleRows = (schedulesData ?? []) as ScheduleRow[];

        if (scheduleRows.length === 0) {
          setClassSchedules([]);
          setIsLoading(false);
          return;
        }

        const mappedSchedules: ClassSchedule[] = scheduleRows.map((s) => {
          const relatedClass = mappedClasses.find(c => c.id === s.class_id);
          const relatedRoom = roomsMap.get(s.room_id);

          // Fallback mock room if not found
          const room = relatedRoom ? {
            id: relatedRoom.id,
            name: relatedRoom.name,
            capacity: relatedRoom.capacity,
            equipment: relatedRoom.equipment || [],
            amenities: relatedRoom.amenities || [],
            isActive: relatedRoom.is_active
          } : {
            id: '0',
            name: 'Main Studio',
            capacity: 20,
            isActive: true
          };

          if (!relatedClass) return null;

          return {
            id: s.id,
            gymId: s.gym_id,
            classId: s.class_id,
            class: relatedClass,
            date: new Date(s.date),
            startTime: s.start_time,
            endTime: s.end_time,
            roomId: s.room_id || '0',
            room: room,
            bookedCount: s.booked_count || 0,
            waitlistCount: s.waitlist_count || 0,
            status: (s.status as 'scheduled' | 'cancelled' | 'completed') || 'scheduled'
          };
        }).filter(Boolean) as ClassSchedule[];

        setClassSchedules(mappedSchedules);

      } catch (error) {
        console.error('Error fetching class data:', error);
        toast.error('Failed to load class schedule');
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, []);

  const handleBookClass = (schedule: ClassSchedule) => {
    setSelectedClass(schedule);
    setIsBookingDialogOpen(true);
  };

  const confirmBooking = () => {
    toast.success('Class booked successfully!');
    setIsBookingDialogOpen(false);
  };

  const filteredSchedules = classSchedules.filter(schedule => {
    const matchesCategory = filterCategory === 'all' || schedule.class.category === filterCategory;
    const matchesSearch = schedule.class.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         schedule.class.instructor?.firstName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         schedule.class.instructor?.lastName.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  if (isLoading) {
    return <PageLoader />;
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h2 className="text-3xl font-bold mb-2 text-gray-900 flex items-center gap-2">
            <CalendarIcon className="h-7 w-7 text-[#00bc7d]" />
            Class Schedule
          </h2>
          <p className="text-muted-foreground">Book and manage your fitness classes</p>
        </div>
        
        {hasRole(UserRole.MANAGER) && (
          <Button 
            onClick={() => navigate('/classes/new')}
            className="rounded-xl h-11 px-6 shadow-lg shadow-[#00bc7d]/20 bg-[#00bc7d] hover:bg-[#00bc7d]/90 text-white"
          >
            <Plus className="h-4 w-4 mr-2" />
            Create Class
          </Button>
        )}
      </div>

      {/* Filters */}
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="rounded-3xl bg-white shadow-2xl shadow-gray-100/50 border border-gray-100 p-6"
      >
        <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
          <div className="flex gap-4 w-full md:w-auto">
             <div className="relative group w-full md:w-64">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400 group-focus-within:text-[#00bc7d] transition-colors" />
              <Input
                placeholder="Search classes or instructors..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 rounded-xl border-gray-200 h-11 bg-white focus:ring-2 focus:ring-[#00bc7d]/20 focus:border-[#00bc7d] transition-all shadow-sm"
              />
            </div>
            
            <Select value={filterCategory} onValueChange={setFilterCategory}>
              <SelectTrigger className="w-full md:w-48 rounded-xl border-gray-200 h-11 bg-white focus:ring-2 focus:ring-[#00bc7d]/20 focus:border-[#00bc7d] shadow-sm">
                <SelectValue placeholder="Category" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Categories</SelectItem>
                <SelectItem value="Yoga">Yoga</SelectItem>
                <SelectItem value="HIIT">HIIT</SelectItem>
                <SelectItem value="Strength">Strength</SelectItem>
                <SelectItem value="Cardio">Cardio</SelectItem>
                <SelectItem value="Pilates">Pilates</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </motion.div>

      {/* Schedule Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
        {filteredSchedules.map((schedule, index) => (
          <motion.div
            key={schedule.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.05 }}
            className="group relative overflow-hidden rounded-3xl bg-white shadow-xl shadow-gray-100/50 border border-gray-100 hover:shadow-2xl hover:shadow-[#00bc7d]/5 transition-all duration-300"
          >
            <div className="p-6 space-y-4">
              {/* Header */}
              <div className="flex justify-between items-start">
                <div>
                  <Badge 
                    variant="secondary" 
                    className="mb-2 bg-[#00bc7d]/10 text-[#00bc7d] hover:bg-[#00bc7d]/20 border-0 rounded-lg px-3 py-1"
                  >
                    {schedule.class.category}
                  </Badge>
                  <h3 className="text-xl font-bold text-gray-900 mb-1">{schedule.class.name}</h3>
                  <div className="flex items-center text-sm text-gray-500">
                    <Clock className="h-4 w-4 mr-1" />
                    {schedule.startTime} - {schedule.endTime} ({schedule.class.duration} min)
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-lg font-bold text-[#00bc7d]">
                    ${schedule.class.price}
                  </div>
                  <div className="text-xs text-gray-400">per session</div>
                </div>
              </div>

              {/* Instructor & Room */}
              <div className="flex items-center justify-between py-4 border-t border-b border-gray-50">
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-full bg-gray-100 flex items-center justify-center overflow-hidden">
                    {schedule.class.instructor?.profileImage ? (
                      <img src={schedule.class.instructor.profileImage} alt="Instructor" className="h-full w-full object-cover" />
                    ) : (
                      <Users className="h-5 w-5 text-gray-400" />
                    )}
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-900">
                      {schedule.class.instructor?.firstName} {schedule.class.instructor?.lastName}
                    </p>
                    <p className="text-xs text-gray-500">Instructor</p>
                  </div>
                </div>
                <div className="text-right">
                  <div className="flex items-center justify-end text-sm text-gray-600 mb-1">
                    <MapPin className="h-4 w-4 mr-1 text-gray-400" />
                    {schedule.room.name}
                  </div>
                  <Badge variant="outline" className="text-xs font-normal border-gray-200 text-gray-500">
                    {schedule.class.difficulty}
                  </Badge>
                </div>
              </div>

              {/* Footer */}
              <div className="flex items-center justify-between pt-2">
                <div className="text-sm">
                  <span className="font-medium text-gray-900">{schedule.bookedCount}</span>
                  <span className="text-gray-500">/{schedule.class.capacity} spots</span>
                </div>
                <Button 
                  onClick={() => handleBookClass(schedule)}
                  className="rounded-xl bg-gray-900 text-white hover:bg-gray-800 shadow-lg shadow-gray-900/20"
                >
                  Book Now
                </Button>
              </div>
            </div>
            
            {/* Progress Bar */}
            <div className="absolute bottom-0 left-0 w-full h-1 bg-gray-50">
              <div 
                className="h-full bg-[#00bc7d]" 
                style={{ width: `${(schedule.bookedCount / schedule.class.capacity) * 100}%` }}
              />
            </div>
          </motion.div>
        ))}
      </div>

      {/* Booking Dialog */}
      <Dialog open={isBookingDialogOpen} onOpenChange={setIsBookingDialogOpen}>
        <DialogContent className="sm:max-w-md rounded-3xl">
          <DialogHeader>
            <DialogTitle>Confirm Booking</DialogTitle>
            <DialogDescription>
              You are about to book a spot in {selectedClass?.class.name}
            </DialogDescription>
          </DialogHeader>
          
          {selectedClass && (
            <div className="space-y-4 py-4">
              <div className="p-4 bg-gray-50 rounded-2xl space-y-3">
                <div className="flex justify-between">
                  <span className="text-gray-500">Date</span>
                  <span className="font-medium">{selectedClass.date.toLocaleDateString()}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Time</span>
                  <span className="font-medium">{selectedClass.startTime} - {selectedClass.endTime}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Instructor</span>
                  <span className="font-medium">
                    {selectedClass.class.instructor?.firstName} {selectedClass.class.instructor?.lastName}
                  </span>
                </div>
                <div className="pt-3 border-t border-gray-200 flex justify-between items-center">
                  <span className="font-medium text-gray-900">Total</span>
                  <span className="text-xl font-bold text-[#00bc7d]">${selectedClass.class.price}</span>
                </div>
              </div>
              
              <Button 
                onClick={confirmBooking} 
                className="w-full h-12 rounded-xl bg-[#00bc7d] hover:bg-[#00bc7d]/90 text-white text-base font-semibold shadow-lg shadow-[#00bc7d]/20"
              >
                Confirm Booking
              </Button>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default ClassBooking;
