import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Member, Payment, PaymentStatus as PaymentStatusType } from '@/types';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
  Search,
  DollarSign,
  AlertTriangle,
  CheckCircle,
  Clock,
  XCircle,
  CreditCard,
  Calendar,
  Users,
  TrendingUp,
  Sparkles,
  Filter
} from 'lucide-react';

import { supabase } from '@/lib/supabase';
import { toast } from 'sonner';
import { createInvoiceForPayment } from '@/lib/invoices';

type PaymentRow = {
  id: string;
  member_id: string;
  amount: number | string;
  status: PaymentStatusType;
  paid_date?: string | null;
  due_date: string;
  method: string;
  description: string;
  created_at: string;
  updated_at?: string | null;
};

type MemberRow = {
  id: string;
  first_name: string;
  last_name: string;
  email: string;
  membership_type?: string | null;
  status?: string | null;
};

const PaymentStatus: React.FC = () => {
  const [payments, setPayments] = useState<Payment[]>([]);
  const [members, setMembers] = useState<Member[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [isLoading, setIsLoading] = useState(true);

  // Fetch data from Supabase
  useEffect(() => {
    const fetchData = async () => {
      try {
        setIsLoading(true);

        // 1. Fetch Payments
        const { data: paymentsData, error: paymentsError } = await supabase
          .from('payments')
          .select('*')
          .order('due_date', { ascending: false });

        if (paymentsError) throw paymentsError;

        const mappedPayments: Payment[] = ((paymentsData ?? []) as PaymentRow[]).map((p) => ({
          id: p.id,
          memberId: p.member_id,
          amount: Number(p.amount),
          status: p.status as PaymentStatusType,
          paymentDate: p.paid_date ? new Date(p.paid_date) : undefined,
          dueDate: new Date(p.due_date),
          method: p.method,
          description: p.description,
          createdAt: new Date(p.created_at),
          updatedAt: new Date(p.updated_at || p.created_at)
        }));

        setPayments(mappedPayments);

        // 2. Fetch Members
        const { data: membersData, error: membersError } = await supabase
          .from('members')
          .select('id, first_name, last_name, email, membership_type, status');

        if (membersError) throw membersError;

        const mappedMembers: Member[] = ((membersData ?? []) as MemberRow[]).map((m) => ({
          id: m.id,
          firstName: m.first_name,
          lastName: m.last_name,
          email: m.email,
          membershipType: m.membership_type,
          isActive: m.status === 'ACTIVE'
        } as Member));

        setMembers(mappedMembers);

      } catch (error) {
        console.error('Error fetching payment status data:', error);
        toast.error('Failed to load payment status');
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, []);

  const getStatusColor = (status: PaymentStatusType) => {
    switch (status) {
      case PaymentStatusType.COMPLETED:
        return 'bg-[#00bc7d]/10 text-[#00bc7d] border-[#00bc7d]/20';
      case PaymentStatusType.PENDING:
        return 'bg-amber-100 text-amber-800 border-amber-200';
      case PaymentStatusType.OVERDUE:
        return 'bg-red-100 text-red-800 border-red-200';
      case PaymentStatusType.FAILED:
        return 'bg-red-100 text-red-800 border-red-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getStatusIcon = (status: PaymentStatusType) => {
    switch (status) {
      case PaymentStatusType.COMPLETED:
        return <CheckCircle className="h-4 w-4" />;
      case PaymentStatusType.PENDING:
        return <Clock className="h-4 w-4" />;
      case PaymentStatusType.OVERDUE:
        return <AlertTriangle className="h-4 w-4" />;
      case PaymentStatusType.FAILED:
        return <XCircle className="h-4 w-4" />;
      default:
        return <Clock className="h-4 w-4" />;
    }
  };

  const getMemberName = (memberId: string) => {
    const member = members.find(m => m.id === memberId);
    return member ? `${member.firstName} ${member.lastName}` : 'Unknown Member';
  };

  const getMemberEmail = (memberId: string) => {
    const member = members.find(m => m.id === memberId);
    return member ? member.email : '';
  };

  const filteredPayments = payments.filter(payment => {
    const memberName = getMemberName(payment.memberId).toLowerCase();
    const memberEmail = getMemberEmail(payment.memberId).toLowerCase();

    const matchesSearch =
      memberName.includes(searchTerm.toLowerCase()) ||
      memberEmail.includes(searchTerm.toLowerCase()) ||
      payment.description.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesStatus = statusFilter === 'all' || payment.status === statusFilter;

    return matchesSearch && matchesStatus;
  });

  const stats = {
    totalPayments: payments.length,
    completedPayments: payments.filter(p => p.status === PaymentStatusType.COMPLETED).length,
    pendingPayments: payments.filter(p => p.status === PaymentStatusType.PENDING).length,
    overduePayments: payments.filter(p => p.status === PaymentStatusType.OVERDUE).length,
    totalRevenue: payments
      .filter(p => p.status === PaymentStatusType.COMPLETED)
      .reduce((sum, p) => sum + p.amount, 0)
  };

  const processPayment = async (paymentId: string) => {
    try {
      const { data, error } = await supabase
        .from('payments')
        .update({
          status: PaymentStatusType.COMPLETED,
          paid_date: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .eq('id', paymentId)
        .select('*')
        .single();

      if (error || !data) {
        throw error;
      }

      await createInvoiceForPayment(paymentId);

      setPayments(prev => prev.map(payment =>
        payment.id === paymentId
          ? {
            ...payment,
            status: PaymentStatusType.COMPLETED,
            paymentDate: new Date(),
            updatedAt: new Date()
          }
          : payment
      ));

      toast.success('Payment completed and invoice generated');
    } catch (error) {
      console.error('Error processing payment:', error);
      toast.error('Failed to process payment');
    }
  };

  return (
    <div className="space-y-8">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-3xl font-bold mb-2 text-gray-900 flex items-center gap-2">
            <Sparkles className="h-7 w-7 text-[#00bc7d]" />
            Payment Status Dashboard
          </h2>
          <p className="text-muted-foreground">Monitor all member payment statuses and transactions</p>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
        {[
          { label: 'Total Payments', value: stats.totalPayments, icon: CreditCard, color: 'text-blue-600', bg: 'bg-blue-500/10', border: 'border-blue-200', delay: 0.1 },
          { label: 'Completed', value: stats.completedPayments, icon: CheckCircle, color: 'text-[#00bc7d]', bg: 'bg-[#00bc7d]/10', border: 'border-[#00bc7d]/20', delay: 0.2 },
          { label: 'Pending', value: stats.pendingPayments, icon: Clock, color: 'text-amber-600', bg: 'bg-amber-500/10', border: 'border-amber-200', delay: 0.3 },
          { label: 'Overdue', value: stats.overduePayments, icon: AlertTriangle, color: 'text-red-600', bg: 'bg-red-500/10', border: 'border-red-200', delay: 0.4 },
          { label: 'Revenue', value: `$${stats.totalRevenue.toFixed(2)}`, icon: TrendingUp, color: 'text-[#00bc7d]', bg: 'bg-[#00bc7d]/10', border: 'border-[#00bc7d]/20', delay: 0.5 },
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

      {/* Payments List */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="rounded-3xl bg-white shadow-2xl shadow-gray-100/50 border border-gray-100 overflow-hidden"
      >
        <div className="p-6 border-b border-gray-100 flex flex-col md:flex-row justify-between items-center gap-4 bg-gradient-to-r from-white to-gray-50/50">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-[#00bc7d]/10 rounded-xl border border-[#00bc7d]/10">
              <CreditCard className="h-6 w-6 text-[#00bc7d]" />
            </div>
            <div>
              <h3 className="text-xl font-bold text-gray-900">Payment Overview</h3>
              <p className="text-sm text-gray-500">Track and manage payments</p>
            </div>
          </div>

          <div className="flex gap-4">
            <div className="relative group">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400 group-focus-within:text-[#00bc7d] transition-colors" />
              <Input
                placeholder="Search payments..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 rounded-xl border-gray-200 h-11 bg-white focus:ring-2 focus:ring-[#00bc7d]/20 focus:border-[#00bc7d] transition-all shadow-sm w-64"
              />
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-48 rounded-xl border-gray-200 h-11 bg-white focus:ring-2 focus:ring-[#00bc7d]/20 focus:border-[#00bc7d] shadow-sm">
                <SelectValue placeholder="Filter by status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Statuses</SelectItem>
                <SelectItem value={PaymentStatusType.COMPLETED}>Completed</SelectItem>
                <SelectItem value={PaymentStatusType.PENDING}>Pending</SelectItem>
                <SelectItem value={PaymentStatusType.OVERDUE}>Overdue</SelectItem>
                <SelectItem value={PaymentStatusType.FAILED}>Failed</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="overflow-x-auto">
          <Table>
            <TableHeader className="bg-gray-50/80 backdrop-blur-sm">
              <TableRow className="border-gray-100 hover:bg-transparent">
                <TableHead className="w-[250px] font-semibold text-gray-500 py-5 pl-8 text-xs uppercase tracking-wider">Member</TableHead>
                <TableHead className="font-semibold text-gray-500 py-5 text-xs uppercase tracking-wider">Description</TableHead>
                <TableHead className="font-semibold text-gray-500 py-5 text-xs uppercase tracking-wider">Amount</TableHead>
                <TableHead className="font-semibold text-gray-500 py-5 text-xs uppercase tracking-wider">Due Date</TableHead>
                <TableHead className="font-semibold text-gray-500 py-5 text-xs uppercase tracking-wider">Status</TableHead>
                <TableHead className="font-semibold text-gray-500 py-5 text-right pr-8 text-xs uppercase tracking-wider">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredPayments.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-16 text-gray-500">
                    <div className="flex flex-col items-center gap-3">
                      <div className="p-4 bg-gray-50 rounded-full border border-gray-100">
                        <DollarSign className="h-8 w-8 text-gray-400" />
                      </div>
                      <p className="text-lg font-medium text-gray-900">No payments found</p>
                      <p className="text-sm text-gray-500">Try adjusting your search or filters.</p>
                    </div>
                  </TableCell>
                </TableRow>
              ) : (
                filteredPayments.map((payment, index) => (
                  <motion.tr
                    key={payment.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.03 }}
                    className="border-gray-50 hover:bg-[#00bc7d]/[0.02] transition-colors group"
                  >
                    <TableCell className="py-5 pl-8">
                      <div className="flex items-center space-x-4">
                        <Avatar className="h-10 w-10 ring-2 ring-white shadow-md group-hover:ring-[#00bc7d]/20 transition-all">
                          <AvatarFallback className="bg-gradient-to-br from-[#00bc7d] to-[#009664] text-white font-bold">
                            {getMemberName(payment.memberId).split(' ').map(n => n[0]).join('')}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <div className="font-bold text-gray-900 group-hover:text-[#00bc7d] transition-colors">
                            {getMemberName(payment.memberId)}
                          </div>
                          <div className="text-xs text-gray-500 flex items-center gap-1">
                            {getMemberEmail(payment.memberId)}
                          </div>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell className="py-5">
                      <div className="flex flex-col gap-1">
                        <span className="font-medium text-gray-900">{payment.description}</span>
                        <span className="text-xs text-gray-500 capitalize">{payment.method.toLowerCase().replace('_', ' ')}</span>
                      </div>
                    </TableCell>
                    <TableCell className="py-5">
                      <span className="font-bold text-gray-900 text-base">
                        ${payment.amount.toFixed(2)}
                      </span>
                    </TableCell>
                    <TableCell className="py-5">
                      <div className="flex items-center gap-1.5 text-sm text-gray-500">
                        <Calendar className="h-4 w-4" />
                        {payment.dueDate.toLocaleDateString()}
                      </div>
                    </TableCell>
                    <TableCell className="py-5">
                      <Badge className={`${getStatusColor(payment.status)} border-0 font-medium px-2.5 py-1 rounded-lg shadow-sm flex w-fit items-center gap-1.5`}>
                        {getStatusIcon(payment.status)}
                        {payment.status}
                      </Badge>
                    </TableCell>
                    <TableCell className="py-5 text-right pr-8">
                      <div className="flex justify-end gap-2 opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-all duration-200">
                        {payment.status === PaymentStatusType.PENDING && (
                          <Button
                            size="sm"
                            onClick={() => processPayment(payment.id)}
                            className="bg-[#00bc7d] hover:bg-[#00bc7d]/90 text-white shadow-md shadow-[#00bc7d]/20 rounded-xl h-9"
                          >
                            Process
                          </Button>
                        )}
                        {payment.status === PaymentStatusType.OVERDUE && (
                          <Button
                            size="sm"
                            variant="destructive"
                            onClick={() => processPayment(payment.id)}
                            className="shadow-md shadow-red-500/20 rounded-xl h-9"
                          >
                            Mark Paid
                          </Button>
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
    </div>
  );
};

export default PaymentStatus;
