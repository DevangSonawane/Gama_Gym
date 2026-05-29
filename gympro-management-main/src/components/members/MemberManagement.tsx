import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { Member, UserRole } from '@/types';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
  Search,
  UserPlus,
  Eye,
  Users,
  Upload,
  Sparkles,
  Edit,
  Trash2,
  Mail,
  Phone,
  MapPin,
  Calendar,
  CreditCard,
  Activity,
  ShieldAlert,
  FileText,
  Receipt,
  Download
} from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import BulkUploadModal from './BulkUploadModal';
import { supabase, DEFAULT_GYM_ID } from '@/lib/supabase';
import { toast } from 'sonner';
import PageLoader from '@/components/ui/PageLoader';
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import logoImg from '@/asset/gamalog.png';

const MemberManagement: React.FC = () => {
  const navigate = useNavigate();
  const { hasRole } = useAuth();
  const [members, setMembers] = useState<Member[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedMembership, setSelectedMembership] = useState<string>('all');
  const [isBulkUploadOpen, setIsBulkUploadOpen] = useState(false);
  const [isViewDialogOpen, setIsViewDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [selectedMember, setSelectedMember] = useState<Member | null>(null);
  const [editingMember, setEditingMember] = useState<Member | null>(null);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [memberToDelete, setMemberToDelete] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Helper function to convert Supabase member to Member interface
  type DbMember = {
    id: string;
    email: string;
    first_name: string;
    last_name: string;
    phone?: string | null;
    dob?: string | null;
    weight?: string | null;
    height?: string | null;
    membership_type: 'Gym' | 'Gym + Cardio' | 'Gym + Cardio + Crossfit';
    plan_price?: string | number | null;
    status: 'ACTIVE' | 'INACTIVE';
    created_at: string;
    updated_at: string;
  };
  const mapSupabaseMemberToMember = (dbMember: DbMember): Member => {
    // Height is stored in cm in Supabase
    const height = dbMember.height ? parseFloat(dbMember.height) : undefined;
    const heightUnit: 'cm' | 'ft' = 'cm';
    let heightFeet: number | undefined;
    let heightInches: number | undefined;

    if (height) {
      // Height is always in cm in database, convert to feet if needed for display
      // For now, we'll keep it in cm, but you can add conversion logic here if needed
    }

    // Convert weight - assume stored value is in kg
    const weightUnit: 'kg' | 'lbs' = 'kg';
    const weight = dbMember.weight ? parseFloat(dbMember.weight) : undefined;

    return {
      id: dbMember.id,
      email: dbMember.email,
      firstName: dbMember.first_name,
      lastName: dbMember.last_name,
      phone: dbMember.phone || '',
      dateOfBirth: dbMember.dob ? new Date(dbMember.dob) : new Date(),
      weight,
      weightUnit,
      height,
      heightUnit,
      heightFeet,
      heightInches,
      membershipType: dbMember.membership_type as 'Gym' | 'Gym + Cardio' | 'Gym + Cardio + Crossfit',
      planPrice: dbMember.plan_price ? Number(dbMember.plan_price) : undefined,
      membershipStartDate: new Date(),
      membershipEndDate: new Date(new Date().setFullYear(new Date().getFullYear() + 1)),
      isActive: dbMember.status === 'ACTIVE',
      role: UserRole.MEMBER,
      createdAt: new Date(dbMember.created_at),
      updatedAt: new Date(dbMember.updated_at),
      fitnessGoals: [],
      medicalConditions: []
    };
  };

  // Fetch members from Supabase
  useEffect(() => {
    const fetchMembers = async () => {
      try {
        setIsLoading(true);
        const { data, error } = await supabase
          .from('members')
          .select('*')
          .order('created_at', { ascending: false });

        if (error) {
          console.error('Error fetching members:', error);
          toast.error('Failed to load members');
          return;
        }

        if (data) {
          const mappedMembers = data.map(mapSupabaseMemberToMember);
          setMembers(mappedMembers);
        }
      } catch (error) {
        console.error('Error fetching members:', error);
        toast.error('Failed to load members');
      } finally {
        setIsLoading(false);
      }
    };

    fetchMembers();
  }, []);

  if (isLoading) {
    return <PageLoader />;
  }

  const getMembershipColor = (membership: string) => {
    switch (membership) {
      case 'Gym':
        return 'bg-[#00bc7d]/10 text-[#00bc7d] border-[#00bc7d]/20';
      case 'Gym + Cardio':
        return 'bg-teal-500/10 text-teal-700 border-teal-200';
      case 'Gym + Cardio + Crossfit':
        return 'bg-emerald-600/10 text-emerald-700 border-emerald-200';
      default:
        return 'bg-gray-500/10 text-gray-700 border-gray-200';
    }
  };

  const getMembershipPrice = (membership: string) => {
    switch (membership) {
      case 'Gym':
        return 999;
      case 'Gym + Cardio':
        return 1999;
      case 'Gym + Cardio + Crossfit':
        return 3499;
      default:
        return 999;
    }
  };

  const calculateAge = (birthDate: Date) => {
    const today = new Date();
    const age = today.getFullYear() - birthDate.getFullYear();
    const monthDiff = today.getMonth() - birthDate.getMonth();

    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
      return age - 1;
    }
    return age;
  };

  const filteredMembers = members.filter(member => {
    const matchesSearch =
      member.firstName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      member.lastName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      member.email.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesMembership = selectedMembership === 'all' || member.membershipType === selectedMembership;

    return matchesSearch && matchesMembership;
  });

  const handleBulkUpload = (newMembers: Member[]) => {
    setMembers(prev => [...newMembers, ...prev]);
  };

  const handleUpdateMember = async (updatedMember: Member) => {
    try {
      // Convert height to cm if needed
      let heightInCm = updatedMember.height;
      if (updatedMember.heightUnit === 'ft' && updatedMember.heightFeet) {
        const totalInches = (updatedMember.heightFeet * 12) + (updatedMember.heightInches || 0);
        heightInCm = totalInches * 2.54;
      }

      const { error } = await supabase
        .from('members')
        .update({
          first_name: updatedMember.firstName,
          last_name: updatedMember.lastName,
          email: updatedMember.email,
          phone: updatedMember.phone || null,
          dob: updatedMember.dateOfBirth.toISOString().split('T')[0],
          weight: updatedMember.weight ? updatedMember.weight.toString() : null,
          height: heightInCm ? heightInCm.toString() : null,
          membership_type: updatedMember.membershipType,
          plan_price: getMembershipPrice(updatedMember.membershipType).toString(),
          status: updatedMember.isActive ? 'ACTIVE' : 'INACTIVE',
          updated_at: new Date().toISOString()
        })
        .eq('id', updatedMember.id);

      if (error) {
        console.error('Error updating member:', error);
        toast.error('Failed to update member');
        return;
      }

      setMembers(prev => prev.map(m => m.id === updatedMember.id ? updatedMember : m));
      setIsEditDialogOpen(false);
      setEditingMember(null);
      toast.success('Member updated successfully');
    } catch (error) {
      console.error('Error updating member:', error);
      toast.error('Failed to update member');
    }
  };

  const confirmDelete = (memberId: string) => {
    setMemberToDelete(memberId);
    setIsDeleteDialogOpen(true);
  };

  const executeDelete = async () => {
    if (!memberToDelete) return;

    try {
      const { error } = await supabase
        .from('members')
        .delete()
        .eq('id', memberToDelete);

      if (error) {
        console.error('Error deleting member:', error);
        toast.error('Failed to delete member');
        return;
      }

      setMembers(prev => prev.filter(m => m.id !== memberToDelete));
      toast.success('Member deleted successfully');
      setIsDeleteDialogOpen(false);
      setMemberToDelete(null);
    } catch (error) {
      console.error('Error deleting member:', error);
      toast.error('Failed to delete member');
    }
  };



  const EditMemberForm = ({ member }: { member: Member }) => {
    const formatDateForInput = (date: Date) => {
      return date.toISOString().split('T')[0];
    };

    const [formData, setFormData] = useState({
      firstName: member.firstName,
      lastName: member.lastName,
      email: member.email,
      phone: member.phone || '',
      dateOfBirth: formatDateForInput(member.dateOfBirth),
      address: member.address || '',
      weight: member.weight?.toString() || '',
      weightUnit: (member.weightUnit || 'kg') as 'kg' | 'lbs',
      height: member.heightUnit === 'cm' ? (member.height?.toString() || '') : '',
      heightUnit: (member.heightUnit || 'cm') as 'cm' | 'ft',
      heightFeet: member.heightFeet?.toString() || '',
      heightInches: member.heightInches?.toString() || '',
      membershipType: member.membershipType as 'Gym' | 'Gym + Cardio' | 'Gym + Cardio + Crossfit',
      emergencyContactName: member.emergencyContact?.name || '',
      emergencyContactPhone: member.emergencyContact?.phone || '',
      emergencyContactRelationship: member.emergencyContact?.relationship || '',
      medicalConditions: member.medicalConditions?.join(', ') || '',
      fitnessGoals: member.fitnessGoals?.join(', ') || '',
      notes: member.notes || '',
      isActive: member.isActive
    });

    const handleSubmit = (e: React.FormEvent) => {
      e.preventDefault();

      const updatedMember: Member = {
        ...member,
        firstName: formData.firstName,
        lastName: formData.lastName,
        email: formData.email,
        phone: formData.phone,
        dateOfBirth: new Date(formData.dateOfBirth),
        address: formData.address,
        weight: formData.weight ? parseFloat(formData.weight) : undefined,
        weightUnit: formData.weightUnit,
        height: formData.heightUnit === 'cm' ? (formData.height ? parseFloat(formData.height) : undefined) : (formData.heightFeet ? parseFloat(formData.heightFeet) : undefined),
        heightUnit: formData.heightUnit,
        heightFeet: formData.heightUnit === 'ft' ? (formData.heightFeet ? parseFloat(formData.heightFeet) : undefined) : undefined,
        heightInches: formData.heightUnit === 'ft' ? (formData.heightInches ? parseFloat(formData.heightInches) : undefined) : undefined,
        emergencyContact: {
          name: formData.emergencyContactName,
          phone: formData.emergencyContactPhone,
          relationship: formData.emergencyContactRelationship
        },
        membershipType: formData.membershipType,
        isActive: formData.isActive,
        fitnessGoals: formData.fitnessGoals.split(',').map(goal => goal.trim()).filter(goal => goal),
        medicalConditions: formData.medicalConditions.split(',').map(condition => condition.trim()).filter(condition => condition),
        notes: formData.notes,
        updatedAt: new Date()
      };

      handleUpdateMember(updatedMember);
    };

    return (
      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Personal Information */}
          <Card className="border-0 shadow-lg shadow-gray-100/50">
            <CardHeader className="pb-3 border-b border-gray-50 bg-gray-50/30 rounded-t-xl">
              <CardTitle className="text-base font-semibold flex items-center gap-2 text-gray-800">
                <UserPlus className="h-4 w-4 text-[#00bc7d]" />
                Personal Information
              </CardTitle>
            </CardHeader>
            <CardContent className="grid gap-4 p-5">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="edit-firstName" className="text-xs font-medium text-gray-500 uppercase tracking-wide">First Name *</Label>
                  <Input
                    id="edit-firstName"
                    value={formData.firstName}
                    onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                    required
                    className="h-10 border-gray-200 focus:border-[#00bc7d] focus:ring-[#00bc7d]/20 rounded-xl bg-gray-50/50"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="edit-lastName" className="text-xs font-medium text-gray-500 uppercase tracking-wide">Last Name *</Label>
                  <Input
                    id="edit-lastName"
                    value={formData.lastName}
                    onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                    required
                    className="h-10 border-gray-200 focus:border-[#00bc7d] focus:ring-[#00bc7d]/20 rounded-xl bg-gray-50/50"
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-email" className="text-xs font-medium text-gray-500 uppercase tracking-wide">Email *</Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <Input
                    id="edit-email"
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    required
                    className="pl-9 h-10 border-gray-200 focus:border-[#00bc7d] focus:ring-[#00bc7d]/20 rounded-xl bg-gray-50/50"
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="edit-phone" className="text-xs font-medium text-gray-500 uppercase tracking-wide">Phone</Label>
                  <div className="relative">
                    <Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                    <Input
                      id="edit-phone"
                      value={formData.phone}
                      onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                      className="pl-9 h-10 border-gray-200 focus:border-[#00bc7d] focus:ring-[#00bc7d]/20 rounded-xl bg-gray-50/50"
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="edit-dateOfBirth" className="text-xs font-medium text-gray-500 uppercase tracking-wide">Date of Birth *</Label>
                  <Input
                    id="edit-dateOfBirth"
                    type="date"
                    value={formData.dateOfBirth}
                    onChange={(e) => setFormData({ ...formData, dateOfBirth: e.target.value })}
                    required
                    className="h-10 border-gray-200 focus:border-[#00bc7d] focus:ring-[#00bc7d]/20 rounded-xl bg-gray-50/50"
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-address" className="text-xs font-medium text-gray-500 uppercase tracking-wide">Address</Label>
                <div className="relative">
                  <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <Input
                    id="edit-address"
                    value={formData.address}
                    onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                    className="pl-9 h-10 border-gray-200 focus:border-[#00bc7d] focus:ring-[#00bc7d]/20 rounded-xl bg-gray-50/50"
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          <div className="space-y-6">
            {/* Membership & Status */}
            <Card className="border-0 shadow-lg shadow-gray-100/50">
              <CardHeader className="pb-3 border-b border-gray-50 bg-gray-50/30 rounded-t-xl">
                <CardTitle className="text-base font-semibold flex items-center gap-2 text-gray-800">
                  <CreditCard className="h-4 w-4 text-[#00bc7d]" />
                  Membership & Status
                </CardTitle>
              </CardHeader>
              <CardContent className="grid gap-4 p-5">
                <div className="space-y-2">
                  <Label htmlFor="edit-membershipType" className="text-xs font-medium text-gray-500 uppercase tracking-wide">Membership Plan</Label>
                  <Select value={formData.membershipType} onValueChange={(value) => setFormData({ ...formData, membershipType: value as 'Gym' | 'Gym + Cardio' | 'Gym + Cardio + Crossfit' })}>
                    <SelectTrigger className="h-11 border-gray-200 focus:border-[#00bc7d] focus:ring-[#00bc7d]/20 rounded-xl bg-gray-50/50">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Gym" className="focus:bg-[#00bc7d]/10 focus:text-[#00bc7d]">
                        <div className="flex items-center gap-2">
                          <span className="font-medium">Gym Only</span>
                          <Badge variant="outline" className="ml-auto border-[#00bc7d]/20 text-[#00bc7d] bg-[#00bc7d]/5">₹39.99</Badge>
                        </div>
                      </SelectItem>
                      <SelectItem value="Gym + Cardio" className="focus:bg-[#00bc7d]/10 focus:text-[#00bc7d]">
                        <div className="flex items-center gap-2">
                          <span className="font-medium">Gym + Cardio</span>
                          <Badge variant="outline" className="ml-auto border-teal-200 text-teal-700 bg-teal-50">₹59.99</Badge>
                        </div>
                      </SelectItem>
                      <SelectItem value="Gym + Cardio + Crossfit" className="focus:bg-[#00bc7d]/10 focus:text-[#00bc7d]">
                        <div className="flex items-center gap-2">
                          <span className="font-medium">Full Package</span>
                          <Badge variant="outline" className="ml-auto border-emerald-200 text-emerald-700 bg-emerald-50">₹89.99</Badge>
                        </div>
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="edit-status" className="text-xs font-medium text-gray-500 uppercase tracking-wide">Account Status</Label>
                  <Select value={formData.isActive ? 'active' : 'inactive'} onValueChange={(value) => setFormData({ ...formData, isActive: value === 'active' })}>
                    <SelectTrigger className={`h-11 border-gray-200 focus:border-[#00bc7d] focus:ring-[#00bc7d]/20 rounded-xl ${formData.isActive ? 'bg-[#00bc7d]/5 border-[#00bc7d]/30 text-[#00bc7d]' : 'bg-gray-50/50'}`}>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="active">
                        <div className="flex items-center gap-2">
                          <span className="h-2 w-2 rounded-full bg-[#00bc7d] animate-pulse"></span>
                          Active Member
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
              </CardContent>
            </Card>

            {/* Physical Stats */}
            <Card className="border-0 shadow-lg shadow-gray-100/50">
              <CardHeader className="pb-3 border-b border-gray-50 bg-gray-50/30 rounded-t-xl">
                <CardTitle className="text-base font-semibold flex items-center gap-2 text-gray-800">
                  <Activity className="h-4 w-4 text-[#00bc7d]" />
                  Physical Stats
                </CardTitle>
              </CardHeader>
              <CardContent className="grid gap-4 p-5">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="edit-weight" className="text-xs font-medium text-gray-500 uppercase tracking-wide">Weight</Label>
                    <div className="flex space-x-2">
                      <Input
                        id="edit-weight"
                        type="number"
                        step="0.1"
                        value={formData.weight}
                        onChange={(e) => setFormData({ ...formData, weight: e.target.value })}
                        placeholder="70"
                        className="h-10 border-gray-200 focus:border-[#00bc7d] focus:ring-[#00bc7d]/20 rounded-xl bg-gray-50/50"
                      />
                      <Select value={formData.weightUnit} onValueChange={(value) => setFormData({ ...formData, weightUnit: value as 'kg' | 'lbs' })}>
                        <SelectTrigger className="w-20 h-10 border-gray-200 rounded-xl bg-gray-50/50">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="kg">kg</SelectItem>
                          <SelectItem value="lbs">lbs</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="edit-height" className="text-xs font-medium text-gray-500 uppercase tracking-wide">Height</Label>
                    <div className="flex space-x-2">
                      {formData.heightUnit === 'cm' ? (
                        <Input
                          id="edit-height"
                          type="number"
                          value={formData.height}
                          onChange={(e) => setFormData({ ...formData, height: e.target.value })}
                          placeholder="175"
                          className="h-10 border-gray-200 focus:border-[#00bc7d] focus:ring-[#00bc7d]/20 rounded-xl bg-gray-50/50"
                        />
                      ) : (
                        <div className="flex items-center gap-1">
                          <Input
                            id="edit-heightFeet"
                            type="number"
                            value={formData.heightFeet}
                            onChange={(e) => setFormData({ ...formData, heightFeet: e.target.value })}
                            placeholder="5"
                            className="w-14 h-10 border-gray-200 focus:border-[#00bc7d] focus:ring-[#00bc7d]/20 rounded-xl bg-gray-50/50"
                          />
                          <span className="text-gray-400 text-sm">'</span>
                          <Input
                            id="edit-heightInches"
                            type="number"
                            value={formData.heightInches}
                            onChange={(e) => setFormData({ ...formData, heightInches: e.target.value })}
                            placeholder="10"
                            className="w-14 h-10 border-gray-200 focus:border-[#00bc7d] focus:ring-[#00bc7d]/20 rounded-xl bg-gray-50/50"
                          />
                          <span className="text-gray-400 text-sm">"</span>
                        </div>
                      )}
                      <Select value={formData.heightUnit} onValueChange={(value) => setFormData({ ...formData, heightUnit: value as 'cm' | 'ft' })}>
                        <SelectTrigger className="w-20 h-10 border-gray-200 rounded-xl bg-gray-50/50">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="cm">cm</SelectItem>
                          <SelectItem value="ft">ft</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Emergency Contact */}
        <Card className="border-0 shadow-lg shadow-gray-100/50">
          <CardHeader className="pb-3 border-b border-gray-50 bg-gray-50/30 rounded-t-xl">
            <CardTitle className="text-base font-semibold flex items-center gap-2 text-gray-800">
              <ShieldAlert className="h-4 w-4 text-red-500" />
              Emergency Contact
            </CardTitle>
          </CardHeader>
          <CardContent className="p-5">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label htmlFor="edit-emergencyName" className="text-xs font-medium text-gray-500 uppercase tracking-wide">Name</Label>
                <Input
                  id="edit-emergencyName"
                  value={formData.emergencyContactName}
                  onChange={(e) => setFormData({ ...formData, emergencyContactName: e.target.value })}
                  className="h-10 border-gray-200 focus:border-red-200 focus:ring-red-50 rounded-xl bg-red-50/10"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-emergencyPhone" className="text-xs font-medium text-gray-500 uppercase tracking-wide">Phone</Label>
                <Input
                  id="edit-emergencyPhone"
                  value={formData.emergencyContactPhone}
                  onChange={(e) => setFormData({ ...formData, emergencyContactPhone: e.target.value })}
                  className="h-10 border-gray-200 focus:border-red-200 focus:ring-red-50 rounded-xl bg-red-50/10"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-emergencyRelationship" className="text-xs font-medium text-gray-500 uppercase tracking-wide">Relationship</Label>
                <Input
                  id="edit-emergencyRelationship"
                  value={formData.emergencyContactRelationship}
                  onChange={(e) => setFormData({ ...formData, emergencyContactRelationship: e.target.value })}
                  className="h-10 border-gray-200 focus:border-red-200 focus:ring-red-50 rounded-xl bg-red-50/10"
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Additional Info */}
        <Card className="border-0 shadow-lg shadow-gray-100/50">
          <CardHeader className="pb-3 border-b border-gray-50 bg-gray-50/30 rounded-t-xl">
            <CardTitle className="text-base font-semibold flex items-center gap-2 text-gray-800">
              <FileText className="h-4 w-4 text-[#00bc7d]" />
              Additional Information
            </CardTitle>
          </CardHeader>
          <CardContent className="p-5 space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="edit-fitnessGoals" className="text-xs font-medium text-gray-500 uppercase tracking-wide">Fitness Goals</Label>
                <Input
                  id="edit-fitnessGoals"
                  value={formData.fitnessGoals}
                  onChange={(e) => setFormData({ ...formData, fitnessGoals: e.target.value })}
                  placeholder="Weight Loss, Muscle Building"
                  className="h-10 border-gray-200 focus:border-[#00bc7d] focus:ring-[#00bc7d]/20 rounded-xl bg-gray-50/50"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-medicalConditions" className="text-xs font-medium text-gray-500 uppercase tracking-wide">Medical Conditions</Label>
                <Input
                  id="edit-medicalConditions"
                  value={formData.medicalConditions}
                  onChange={(e) => setFormData({ ...formData, medicalConditions: e.target.value })}
                  placeholder="None, Knee Injury"
                  className="h-10 border-gray-200 focus:border-[#00bc7d] focus:ring-[#00bc7d]/20 rounded-xl bg-gray-50/50"
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-notes" className="text-xs font-medium text-gray-500 uppercase tracking-wide">Notes</Label>
              <Textarea
                id="edit-notes"
                value={formData.notes}
                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                rows={3}
                className="min-h-[80px] border-gray-200 focus:border-[#00bc7d] focus:ring-[#00bc7d]/20 rounded-xl bg-gray-50/50 resize-none"
              />
            </div>
          </CardContent>
        </Card>

        <div className="flex justify-end items-center gap-3 pt-4 border-t border-gray-100">
          <Button type="button" variant="outline" onClick={() => {
            setIsEditDialogOpen(false);
            setEditingMember(null);
          }} className="h-11 rounded-xl border-gray-200 hover:bg-gray-50 hover:text-gray-900 px-6">
            Cancel
          </Button>
          <Button type="submit" className="h-11 rounded-xl bg-[#00bc7d] hover:bg-[#00bc7d]/90 text-white shadow-lg shadow-[#00bc7d]/20 px-8">
            Update Member
          </Button>
        </div>
      </form>
    );
  };

  const ViewMemberDialog = ({ member }: { member: Member }) => (
    <div className="space-y-8">
      {/* Header Section */}
      <div className="relative overflow-hidden rounded-3xl bg-[#00bc7d] p-8 shadow-xl shadow-[#00bc7d]/20">
        <div className="absolute top-0 right-0 p-4 opacity-10">
          <Sparkles className="h-32 w-32 text-white" />
        </div>

        <div className="relative flex flex-col md:flex-row items-center md:items-start gap-8">
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="relative"
          >
            <div className="absolute inset-0 bg-white rounded-full blur-xl opacity-20" />
            <Avatar className="h-28 w-28 ring-4 ring-white/30 shadow-2xl">
              <AvatarImage src={member.avatar} />
              <AvatarFallback className="bg-white text-[#00bc7d] text-3xl font-bold">
                {member.firstName[0]}{member.lastName[0]}
              </AvatarFallback>
            </Avatar>
            <div className="absolute -bottom-2 -right-2">
              <Badge className={`${member.isActive ? 'bg-white text-[#00bc7d]' : 'bg-gray-200 text-gray-500'} border-4 border-[#00bc7d] shadow-sm`}>
                {member.isActive ? 'Active' : 'Inactive'}
              </Badge>
            </div>
          </motion.div>

          <div className="text-center md:text-left space-y-3 flex-1 text-white">
            <div>
              <h3 className="text-3xl font-bold">{member.firstName} {member.lastName}</h3>
              <p className="text-white/80 flex items-center justify-center md:justify-start gap-2 text-lg">
                <Mail className="h-4 w-4" /> {member.email}
              </p>
            </div>

            <div className="flex flex-wrap justify-center md:justify-start gap-2 pt-2">
              <Badge variant="secondary" className="bg-white/20 backdrop-blur-md border-white/10 text-white hover:bg-white/30">
                ID: {member.id.slice(0, 8)}
              </Badge>
              <Badge className="bg-white text-[#00bc7d] border-none shadow-sm hover:bg-white/90">
                {member.membershipType}
              </Badge>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Personal Details Card */}
        <Card className="border-0 shadow-lg shadow-gray-100/50 bg-white/50 backdrop-blur-xl">
          <CardHeader className="pb-3">
            <CardTitle className="text-lg flex items-center gap-2">
              <UserPlus className="h-5 w-5 text-[#00bc7d]" />
              Personal Details
            </CardTitle>
          </CardHeader>
          <CardContent className="grid gap-4">
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div className="space-y-1">
                <p className="text-muted-foreground text-xs uppercase tracking-wider">Phone</p>
                <p className="font-medium flex items-center gap-2">
                  <Phone className="h-3 w-3 text-muted-foreground" />
                  {member.phone || 'N/A'}
                </p>
              </div>
              <div className="space-y-1">
                <p className="text-muted-foreground text-xs uppercase tracking-wider">Date of Birth</p>
                <p className="font-medium flex items-center gap-2">
                  <Calendar className="h-3 w-3 text-muted-foreground" />
                  {member.dateOfBirth.toLocaleDateString()} ({calculateAge(member.dateOfBirth)} yrs)
                </p>
              </div>
              <div className="space-y-1">
                <p className="text-muted-foreground text-xs uppercase tracking-wider">Weight</p>
                <p className="font-medium">{member.weight ? `${member.weight} ${member.weightUnit}` : 'N/A'}</p>
              </div>
              <div className="space-y-1">
                <p className="text-muted-foreground text-xs uppercase tracking-wider">Height</p>
                <p className="font-medium">
                  {member.height
                    ? (member.heightUnit === 'cm' ? `${member.height} cm` : `${member.heightFeet}'${member.heightInches}"`)
                    : 'N/A'}
                </p>
              </div>
            </div>
            <div className="space-y-1 pt-2 border-t border-dashed">
              <p className="text-muted-foreground text-xs uppercase tracking-wider">Address</p>
              <p className="font-medium flex items-start gap-2">
                <MapPin className="h-3 w-3 text-muted-foreground mt-0.5" />
                {member.address || 'N/A'}
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Membership & Status Card */}
        <Card className="border-0 shadow-lg shadow-gray-100/50 bg-white/50 backdrop-blur-xl">
          <CardHeader className="pb-3">
            <CardTitle className="text-lg flex items-center gap-2">
              <CreditCard className="h-5 w-5 text-[#00bc7d]" />
              Membership Info
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="p-4 rounded-xl bg-gradient-to-br from-gray-50 to-white border border-gray-100 space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground">Current Plan</span>
                <span className="font-semibold text-[#00bc7d]">{member.membershipType}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground">Monthly Fee</span>
                <span className="font-bold text-lg">₹{getMembershipPrice(member.membershipType)}</span>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4 text-sm">
              <div className="space-y-1">
                <p className="text-muted-foreground text-xs uppercase tracking-wider">Start Date</p>
                <p className="font-medium">{member.membershipStartDate.toLocaleDateString()}</p>
              </div>
              <div className="space-y-1">
                <p className="text-muted-foreground text-xs uppercase tracking-wider">End Date</p>
                <p className="font-medium">{member.membershipEndDate.toLocaleDateString()}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Health & Emergency Card - Full Width */}
        <Card className="md:col-span-2 border-0 shadow-lg shadow-gray-100/50 bg-white/50 backdrop-blur-xl">
          <CardHeader className="pb-3">
            <CardTitle className="text-lg flex items-center gap-2">
              <Activity className="h-5 w-5 text-[#00bc7d]" />
              Health & Emergency
            </CardTitle>
          </CardHeader>
          <CardContent className="grid md:grid-cols-2 gap-6">
            <div className="space-y-4">
              {member.emergencyContact && (
                <div className="space-y-2">
                  <h4 className="text-sm font-semibold text-gray-900 flex items-center gap-2">
                    <ShieldAlert className="h-4 w-4 text-red-500" />
                    Emergency Contact
                  </h4>
                  <div className="p-3 rounded-lg bg-red-50 border border-red-100">
                    <p className="font-medium text-red-900">{member.emergencyContact.name}</p>
                    <p className="text-sm text-red-700">{member.emergencyContact.relationship}</p>
                    <p className="text-sm text-red-700 font-mono mt-1">{member.emergencyContact.phone}</p>
                  </div>
                </div>
              )}
            </div>

            <div className="space-y-4">
              {member.fitnessGoals && member.fitnessGoals.length > 0 && (
                <div className="space-y-2">
                  <h4 className="text-sm font-semibold text-gray-900">Fitness Goals</h4>
                  <div className="flex flex-wrap gap-2">
                    {member.fitnessGoals.map((goal, i) => (
                      <Badge key={i} variant="outline" className="bg-[#00bc7d]/10 text-[#00bc7d] border-[#00bc7d]/20">
                        {goal}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}

              {member.medicalConditions && member.medicalConditions.length > 0 && (
                <div className="space-y-2">
                  <h4 className="text-sm font-semibold text-gray-900">Medical Conditions</h4>
                  <div className="flex flex-wrap gap-2">
                    {member.medicalConditions.map((condition, i) => (
                      <Badge key={i} variant="outline" className="bg-red-50 text-red-700 border-red-200">
                        {condition}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {member.notes && (
          <Card className="md:col-span-2 border-0 shadow-lg shadow-gray-100/50 bg-amber-50/30 backdrop-blur-xl border-amber-100/50">
            <CardContent className="p-4">
              <h4 className="text-sm font-semibold text-amber-900 mb-1 flex items-center gap-2">
                <FileText className="h-4 w-4" /> Notes
              </h4>
              <p className="text-sm text-amber-900/80 italic">{member.notes}</p>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );

  const handleDownloadReceipt = async (member: Member) => {
    try {
      const doc = new jsPDF();
      const pageWidth = doc.internal.pageSize.getWidth();
      const pageHeight = doc.internal.pageSize.getHeight();
      const margin = 14;
      const contentWidth = pageWidth - 2 * margin;

      // ── Page background ──────────────────────────────────────────────
      doc.setFillColor(244, 247, 250);
      doc.rect(0, 0, pageWidth, pageHeight, 'F');

      // ── White header bar ─────────────────────────────────────────────
      doc.setFillColor(255, 255, 255);
      doc.rect(0, 0, pageWidth, 58, 'F');

      // Green accent strip under header
      doc.setFillColor(0, 188, 125);
      doc.rect(0, 58, pageWidth, 4, 'F');

      // Thin top green stripe
      doc.setFillColor(0, 188, 125);
      doc.rect(0, 0, pageWidth, 3, 'F');

      // Logo (gamalog.png is on white so it renders perfectly on white header)
      try {
        const img = new Image();
        img.src = logoImg;
        await new Promise(resolve => { img.onload = resolve; });
        doc.addImage(img, 'PNG', margin, 8, 55, 22);
      } catch {
        doc.setTextColor(0, 150, 100);
        doc.setFontSize(20);
        doc.setFont('helvetica', 'bold');
        doc.text('GAMA', margin + 2, 26);
      }

      // Gym name + contact (right-aligned in header, dark text on white)
      doc.setTextColor(15, 23, 42);
      doc.setFontSize(13);
      doc.setFont('helvetica', 'bold');
      doc.text('GAMA FITNESS CENTER', pageWidth - margin, 18, { align: 'right' });
      doc.setFontSize(7.5);
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(100, 116, 139);
      doc.text('support@gamagym.com  |  www.gamagym.com', pageWidth - margin, 27, { align: 'right' });
      doc.text('+91 98765 43210  |  123 Fitness Street, Mumbai', pageWidth - margin, 35, { align: 'right' });

      // RECEIPT label bottom-left of header
      doc.setTextColor(0, 188, 125);
      doc.setFontSize(8);
      doc.setFont('helvetica', 'bold');
      doc.text('MEMBERSHIP RECEIPT', margin, 52);

      // ── Receipt meta strip ───────────────────────────────────────────
      const receiptNumber = `REC-${Date.now().toString().slice(-8)}`;
      const receiptDate = new Date().toLocaleDateString('en-IN', { year: 'numeric', month: 'long', day: 'numeric' });

      doc.setFillColor(15, 23, 42);
      doc.roundedRect(margin, 68, contentWidth, 24, 4, 4, 'F');

      // Labels
      doc.setTextColor(100, 116, 139);
      doc.setFontSize(7);
      doc.setFont('helvetica', 'normal');
      doc.text('RECEIPT NUMBER', margin + 8, 76);
      doc.text('DATE ISSUED', pageWidth / 2 - 10, 76);
      doc.text('STATUS', pageWidth - margin - 8, 76, { align: 'right' });

      // Values
      doc.setTextColor(226, 232, 240);
      doc.setFontSize(9);
      doc.setFont('helvetica', 'bold');
      doc.text(receiptNumber, margin + 8, 86);
      doc.text(receiptDate, pageWidth / 2 - 10, 86);

      // PAID badge
      doc.setFillColor(0, 188, 125);
      doc.roundedRect(pageWidth - margin - 32, 78, 26, 10, 2, 2, 'F');
      doc.setTextColor(255, 255, 255);
      doc.setFontSize(7.5);
      doc.setFont('helvetica', 'bold');
      doc.text('PAID', pageWidth - margin - 19, 85, { align: 'center' });

      let y = 102;

      // ── Section helper ───────────────────────────────────────────────
      const drawSectionHeader = (title: string, yPos: number) => {
        doc.setFillColor(0, 188, 125);
        doc.rect(margin, yPos, 3, 12, 'F');
        doc.setTextColor(15, 23, 42);
        doc.setFontSize(10);
        doc.setFont('helvetica', 'bold');
        doc.text(title, margin + 8, yPos + 8);
      };

      // ── Member Information ───────────────────────────────────────────
      drawSectionHeader('MEMBER INFORMATION', y);
      y += 16;

      doc.setFillColor(255, 255, 255);
      doc.roundedRect(margin, y, contentWidth, 44, 4, 4, 'F');

      // Avatar circle with initials
      doc.setFillColor(209, 250, 229);
      doc.circle(margin + 20, y + 22, 14, 'F');
      doc.setTextColor(0, 150, 100);
      doc.setFontSize(13);
      doc.setFont('helvetica', 'bold');
      const initials = `${member.firstName[0]}${member.lastName[0]}`;
      doc.text(initials, margin + 20, y + 26.5, { align: 'center' });

      // Two-column info layout
      const c1 = margin + 42;
      const c2 = pageWidth / 2 + 6;

      doc.setTextColor(100, 116, 139);
      doc.setFontSize(7);
      doc.setFont('helvetica', 'normal');
      doc.text('FULL NAME', c1, y + 9);
      doc.text('EMAIL ADDRESS', c2, y + 9);

      doc.setTextColor(15, 23, 42);
      doc.setFontSize(10);
      doc.setFont('helvetica', 'bold');
      doc.text(`${member.firstName} ${member.lastName}`, c1, y + 17);

      doc.setFontSize(9);
      doc.setFont('helvetica', 'normal');
      doc.text(member.email, c2, y + 17);

      doc.setTextColor(100, 116, 139);
      doc.setFontSize(7);
      doc.text('PHONE NUMBER', c1, y + 27);
      doc.text('DATE OF BIRTH', c2, y + 27);

      doc.setTextColor(15, 23, 42);
      doc.setFontSize(9);
      doc.setFont('helvetica', 'normal');
      doc.text(member.phone || 'Not provided', c1, y + 35);
      doc.text(member.dateOfBirth.toLocaleDateString('en-IN', { year: 'numeric', month: 'long', day: 'numeric' }), c2, y + 35);

      y += 54;

      // ── Membership Details ───────────────────────────────────────────
      drawSectionHeader('MEMBERSHIP DETAILS', y);
      y += 16;

      autoTable(doc, {
        body: [
          ['Membership Plan', member.membershipType],
          ['Account Status', member.isActive ? 'Active' : 'Inactive'],
          ['Member Since', member.createdAt.toLocaleDateString('en-IN', { year: 'numeric', month: 'long', day: 'numeric' })],
          ['Valid From', member.membershipStartDate.toLocaleDateString('en-IN', { year: 'numeric', month: 'long', day: 'numeric' })],
          ['Valid Until', member.membershipEndDate.toLocaleDateString('en-IN', { year: 'numeric', month: 'long', day: 'numeric' })],
        ],
        startY: y,
        theme: 'plain',
        styles: {
          fontSize: 9.5,
          cellPadding: { top: 6, right: 10, bottom: 6, left: 10 },
          textColor: [15, 23, 42],
        },
        alternateRowStyles: { fillColor: [240, 253, 244] },
        columnStyles: {
          0: { fontStyle: 'bold', cellWidth: 65, textColor: [71, 85, 105], fontSize: 8.5 },
          1: { cellWidth: 'auto' },
        },
        margin: { left: margin, right: margin },
        tableLineColor: [226, 232, 240],
        tableLineWidth: 0.3,
      });

      y = (doc as unknown as { lastAutoTable: { finalY: number } }).lastAutoTable.finalY + 14;

      // ── Payment Summary ──────────────────────────────────────────────
      drawSectionHeader('PAYMENT SUMMARY', y);
      y += 16;

      doc.setFillColor(255, 255, 255);
      doc.roundedRect(margin, y, contentWidth, 58, 4, 4, 'F');

      const baseFee = getMembershipPrice(member.membershipType) * 80;
      const gst = baseFee * 0.18;
      const total = baseFee + gst;
      const fmtINR = (n: number) => `₹${n.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

      const lx = margin + 10;
      const rx = pageWidth - margin - 10;

      // Row 1: base fee
      doc.setTextColor(71, 85, 105);
      doc.setFontSize(9.5);
      doc.setFont('helvetica', 'normal');
      doc.text('Monthly Membership Fee', lx, y + 13);
      doc.setTextColor(15, 23, 42);
      doc.text(fmtINR(baseFee), rx, y + 13, { align: 'right' });

      // Row 2: GST
      doc.setTextColor(71, 85, 105);
      doc.text('GST (18%)', lx, y + 25);
      doc.setTextColor(15, 23, 42);
      doc.text(fmtINR(gst), rx, y + 25, { align: 'right' });

      // Divider
      doc.setDrawColor(226, 232, 240);
      doc.setLineWidth(0.4);
      doc.line(margin + 6, y + 32, pageWidth - margin - 6, y + 32);

      // Total row (dark pill)
      doc.setFillColor(15, 23, 42);
      doc.roundedRect(margin + 6, y + 37, contentWidth - 12, 14, 3, 3, 'F');
      doc.setTextColor(255, 255, 255);
      doc.setFontSize(10);
      doc.setFont('helvetica', 'bold');
      doc.text('TOTAL AMOUNT', lx, y + 47);
      doc.setTextColor(0, 188, 125);
      doc.text(fmtINR(total), rx, y + 47, { align: 'right' });

      y += 68;

      // ── Disclaimer note ──────────────────────────────────────────────
      doc.setFillColor(254, 252, 232);
      doc.roundedRect(margin, y, contentWidth, 20, 3, 3, 'F');
      doc.setDrawColor(253, 224, 71);
      doc.setLineWidth(0.4);
      doc.roundedRect(margin, y, contentWidth, 20, 3, 3, 'S');

      doc.setTextColor(133, 77, 14);
      doc.setFontSize(7.5);
      doc.setFont('helvetica', 'bold');
      doc.text('NOTE:', margin + 6, y + 8);
      doc.setFont('helvetica', 'normal');
      doc.text('This is a computer-generated receipt and does not require a physical signature.', margin + 22, y + 8);
      doc.text('Please retain this for your records. Queries? Reach us at support@gamagym.com', margin + 6, y + 15);

      // ── Footer ───────────────────────────────────────────────────────
      doc.setFillColor(15, 23, 42);
      doc.rect(0, pageHeight - 28, pageWidth, 28, 'F');
      doc.setFillColor(0, 188, 125);
      doc.rect(0, pageHeight - 28, pageWidth, 2, 'F');

      doc.setTextColor(255, 255, 255);
      doc.setFontSize(10.5);
      doc.setFont('helvetica', 'bold');
      doc.text('Thank you for being part of the GAMA Family!', pageWidth / 2, pageHeight - 17, { align: 'center' });
      doc.setTextColor(100, 116, 139);
      doc.setFontSize(7.5);
      doc.setFont('helvetica', 'normal');
      doc.text('support@gamagym.com  •  www.gamagym.com  •  +91 98765 43210', pageWidth / 2, pageHeight - 8, { align: 'center' });

      doc.save(`Receipt_${member.firstName}_${member.lastName}_${receiptNumber}.pdf`);
      toast.success('Receipt downloaded successfully!');
    } catch (error) {
      console.error('Error generating PDF:', error);
      toast.error('Failed to download receipt');
    }
  };

  const stats = {
    totalMembers: members.length,
    activeMembers: members.filter(m => m.isActive).length,
    gymMembers: members.filter(m => m.membershipType === 'Gym').length,
    gymCardioMembers: members.filter(m => m.membershipType === 'Gym + Cardio').length,
    fullMembers: members.filter(m => m.membershipType === 'Gym + Cardio + Crossfit').length
  };

  return (
    <div className="space-y-8">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h2 className="text-4xl font-extrabold text-gray-900 tracking-tight flex items-center gap-3">
            <Sparkles className="h-8 w-8 text-[#00bc7d]" />
            Member Management
          </h2>
          <p className="text-gray-500 text-lg mt-2">Manage your gym members, memberships, and more.</p>
        </div>
        <div className="flex gap-3">
          <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
            <Button
              variant="outline"
              onClick={() => setIsBulkUploadOpen(true)}
              className="rounded-xl border-gray-200 hover:border-[#00bc7d] hover:text-[#00bc7d] h-12 px-6"
            >
              <Upload className="h-4 w-4 mr-2" />
              Bulk Upload
            </Button>
          </motion.div>
          <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
            <Button
              className="rounded-xl h-12 px-6 shadow-lg shadow-[#00bc7d]/20 bg-[#00bc7d] hover:bg-[#00bc7d]/90 text-white"
              onClick={() => navigate('/members/new')}
            >
              <UserPlus className="h-4 w-4 mr-2" />
              Add Member
            </Button>
          </motion.div>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        {[
          { label: 'Total Members', value: stats.totalMembers, icon: Users, color: 'bg-[#00bc7d]', text: 'text-[#00bc7d]', delay: 0.1 },
          { label: 'Active', value: stats.activeMembers, icon: Activity, color: 'bg-emerald-500', text: 'text-emerald-500', delay: 0.2 },
          { label: 'Gym', value: stats.gymMembers, icon: Users, color: 'bg-teal-500', text: 'text-teal-500', delay: 0.3 },
          { label: 'Gym + Cardio', value: stats.gymCardioMembers, icon: Users, color: 'bg-cyan-500', text: 'text-cyan-500', delay: 0.4 },
          { label: 'Full Package', value: stats.fullMembers, icon: Users, color: 'bg-green-600', text: 'text-green-600', delay: 0.5 },
        ].map((stat, index) => (
          <motion.div
            key={stat.label}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: stat.delay }}
            whileHover={{ scale: 1.02, y: -4 }}
            className="relative overflow-hidden rounded-2xl bg-white p-6 shadow-sm border border-gray-100 hover:shadow-md transition-all duration-300"
          >
            <div className="flex items-start justify-between mb-4">
              <div className={`p-3 rounded-xl ${stat.color} bg-opacity-10`}>
                <stat.icon className={`h-6 w-6 ${stat.text}`} />
              </div>
            </div>
            <h3 className="text-sm font-medium text-gray-500 mb-1">{stat.label}</h3>
            <p className="text-3xl font-bold text-gray-900">
              {stat.value}
            </p>
          </motion.div>
        ))}
      </div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.6 }}
        className="rounded-3xl bg-white shadow-2xl shadow-gray-100/50 border border-gray-100 overflow-hidden"
      >
        <div className="p-6 border-b border-gray-100 flex flex-col md:flex-row justify-between items-center gap-4 bg-gradient-to-r from-white to-gray-50/50">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-[#00bc7d]/10 rounded-xl border border-[#00bc7d]/10">
              <Users className="h-6 w-6 text-[#00bc7d]" />
            </div>
            <div>
              <h3 className="text-xl font-bold text-gray-900">Members Directory</h3>
              <p className="text-sm text-gray-500">Manage and view all your gym members</p>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row gap-3 w-full md:w-auto">
            <div className="relative flex-1 sm:min-w-[320px] group">
              <Search className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400 group-focus-within:text-[#00bc7d] transition-colors" />
              <Input
                placeholder="Search members by name, email..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-11 rounded-xl border-gray-200 h-11 bg-white focus:ring-2 focus:ring-[#00bc7d]/20 focus:border-[#00bc7d] transition-all shadow-sm"
              />
            </div>
            <Select value={selectedMembership} onValueChange={setSelectedMembership}>
              <SelectTrigger className="w-full sm:w-[200px] rounded-xl border-gray-200 h-11 bg-white focus:ring-2 focus:ring-[#00bc7d]/20 focus:border-[#00bc7d] shadow-sm">
                <SelectValue placeholder="Filter by plan" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Memberships</SelectItem>
                <SelectItem value="Gym">Gym Only</SelectItem>
                <SelectItem value="Gym + Cardio">Gym + Cardio</SelectItem>
                <SelectItem value="Gym + Cardio + Crossfit">Full Package</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="overflow-x-auto">
          <Table>
            <TableHeader className="bg-gray-50/80 backdrop-blur-sm">
              <TableRow className="border-gray-100 hover:bg-transparent">
                <TableHead className="w-[300px] font-semibold text-gray-500 py-5 pl-8 text-xs uppercase tracking-wider">Member</TableHead>
                <TableHead className="font-semibold text-gray-500 py-5 text-xs uppercase tracking-wider">Membership Details</TableHead>
                <TableHead className="font-semibold text-gray-500 py-5 text-xs uppercase tracking-wider">Join Date</TableHead>
                <TableHead className="font-semibold text-gray-500 py-5 text-xs uppercase tracking-wider">Status</TableHead>
                <TableHead className="font-semibold text-gray-500 py-5 text-right pr-8 text-xs uppercase tracking-wider">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow>
                  <TableCell colSpan={5} className="text-center py-16">
                    <div className="flex flex-col items-center justify-center">
                      <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-[#00bc7d]"></div>
                      <span className="mt-4 text-gray-500 font-medium">Loading members...</span>
                    </div>
                  </TableCell>
                </TableRow>
              ) : filteredMembers.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="text-center py-16 text-gray-500">
                    <div className="flex flex-col items-center gap-3">
                      <div className="p-4 bg-gray-50 rounded-full border border-gray-100">
                        <Users className="h-8 w-8 text-gray-400" />
                      </div>
                      <p className="text-lg font-medium text-gray-900">No members found</p>
                      <p className="text-sm text-gray-500">Try adjusting your search or filters to find who you're looking for.</p>
                    </div>
                  </TableCell>
                </TableRow>
              ) : (
                filteredMembers.map((member, index) => (
                  <motion.tr
                    key={member.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.03 }}
                    className="border-gray-50 hover:bg-[#00bc7d]/[0.02] transition-colors group"
                  >
                    <TableCell className="py-5 pl-8">
                      <div className="flex items-center space-x-4">
                        <div className="relative">
                          <Avatar className="h-12 w-12 ring-2 ring-white shadow-md group-hover:ring-[#00bc7d]/20 transition-all">
                            <AvatarImage src={member.avatar} />
                            <AvatarFallback className="bg-gradient-to-br from-[#00bc7d] to-[#009664] text-white font-bold text-lg">
                              {member.firstName[0]}{member.lastName[0]}
                            </AvatarFallback>
                          </Avatar>
                          <span className={`absolute bottom-0 right-0 h-3 w-3 rounded-full border-2 border-white ${member.isActive ? 'bg-[#00bc7d]' : 'bg-gray-300'}`}></span>
                        </div>
                        <div>
                          <div className="font-bold text-gray-900 text-base group-hover:text-[#00bc7d] transition-colors">
                            {member.firstName} {member.lastName}
                          </div>
                          <div className="text-sm text-gray-500 flex items-center gap-1">
                            <Mail className="h-3 w-3" />
                            {member.email}
                          </div>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell className="py-5">
                      <div className="flex flex-col gap-1.5">
                        <Badge variant="outline" className={`${getMembershipColor(member.membershipType)} border-0 font-medium w-fit px-2.5 py-0.5 rounded-lg shadow-sm`}>
                          {member.membershipType}
                        </Badge>
                        <span className="text-xs text-gray-500 font-medium ml-1">
                          ₹{member.planPrice ?? getMembershipPrice(member.membershipType)}/mo
                        </span>
                      </div>
                    </TableCell>
                    <TableCell className="py-5">
                      <div className="flex flex-col gap-0.5">
                        <div className="text-gray-900 font-medium flex items-center gap-1.5">
                          <Calendar className="h-3.5 w-3.5 text-gray-400" />
                          {member.membershipStartDate.toLocaleDateString()}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell className="py-5">
                      <div className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium border ${member.isActive ? 'bg-[#00bc7d]/10 text-[#00bc7d] border-[#00bc7d]/20' : 'bg-gray-100 text-gray-500 border-gray-200'}`}>
                        <span className={`h-1.5 w-1.5 rounded-full ${member.isActive ? 'bg-[#00bc7d] animate-pulse' : 'bg-gray-400'}`}></span>
                        {member.isActive ? 'Active' : 'Inactive'}
                      </div>
                    </TableCell>
                    <TableCell className="py-5 text-right pr-8">
                      <div className="flex justify-end gap-1 opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-all duration-200">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleDownloadReceipt(member)}
                          className="h-9 w-9 rounded-xl text-gray-500 hover:bg-[#00bc7d]/10 hover:text-[#00bc7d] hover:scale-105 transition-all"
                          title="Download Receipt"
                        >
                          <Receipt className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => navigate(`/members/${member.id}`)}
                          className="h-9 w-9 rounded-xl text-gray-500 hover:bg-[#00bc7d]/10 hover:text-[#00bc7d] hover:scale-105 transition-all"
                          title="View Details"
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
                        {hasRole(UserRole.STAFF) && (
                          <>
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => navigate(`/members/${member.id}/edit`)}
                              className="h-9 w-9 rounded-xl text-gray-500 hover:bg-[#00bc7d]/10 hover:text-[#00bc7d] hover:scale-105 transition-all"
                              title="Edit Member"
                            >
                              <Edit className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => confirmDelete(member.id)}
                              className="h-9 w-9 rounded-xl text-gray-500 hover:bg-red-50 hover:text-red-600 hover:scale-105 transition-all"
                              title="Delete Member"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </>
                        )}
                      </div>
                    </TableCell>
                  </motion.tr>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </motion.div>

      <BulkUploadModal
        isOpen={isBulkUploadOpen}
        onClose={() => setIsBulkUploadOpen(false)}
        onMembersUploaded={handleBulkUpload}
      />

      {/* View Member Dialog */}
      <Dialog open={isViewDialogOpen} onOpenChange={setIsViewDialogOpen}>
        <DialogContent className="max-w-4xl rounded-2xl border-0 shadow-2xl">
          <DialogHeader>
            <DialogTitle className="text-2xl">Member Details</DialogTitle>
            <DialogDescription>
              View complete member information
            </DialogDescription>
          </DialogHeader>
          {selectedMember && <ViewMemberDialog member={selectedMember} />}
        </DialogContent>
      </Dialog>

      {/* Edit Member Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-hidden flex flex-col rounded-2xl">
          <DialogHeader className="pb-4 border-b">
            <DialogTitle className="text-2xl flex items-center gap-2">
              <Edit className="h-6 w-6 text-[#00bc7d]" />
              Edit Member
            </DialogTitle>
            <DialogDescription>
              Update {editingMember?.firstName}'s information
            </DialogDescription>
          </DialogHeader>
          <div className="flex-1 overflow-y-auto py-4 px-1">
            {editingMember && <EditMemberForm member={editingMember} />}
          </div>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent className="rounded-2xl">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-xl font-bold text-gray-900">Are you absolutely sure?</AlertDialogTitle>
            <AlertDialogDescription className="text-gray-500">
              This action cannot be undone. This will permanently delete the member
              and remove their data from our servers.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="rounded-xl">Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={executeDelete}
              className="bg-red-500 hover:bg-red-600 text-white rounded-xl shadow-lg shadow-red-500/20"
            >
              Delete Member
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default MemberManagement;
