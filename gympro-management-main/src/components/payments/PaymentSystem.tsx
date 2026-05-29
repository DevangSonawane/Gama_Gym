import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Payment, PaymentType, PaymentMethod, PaymentStatus, Invoice, PromoCode } from '@/types';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  CreditCard,
  Plus,
  Search,
  Filter,
  DollarSign,
  Receipt,
  AlertCircle,
  CheckCircle,
  Clock,
  XCircle,
  Download,
  Send,
  Users,
  TrendingUp,
  Edit,
  Trash2,
  Sparkles,
  Tag,
  FileText
} from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import PaymentStatusComponent from './PaymentStatus';

import { supabase } from '@/lib/supabase';
import { toast } from 'sonner';
import PageLoader from '../ui/PageLoader';
import { generateInvoicePdf } from '@/lib/invoicePdf';

type PaymentRow = {
  id: string;
  member_id: string;
  amount: number | string;
  currency: string;
  type: PaymentType;
  method: PaymentMethod;
  status: PaymentStatus;
  description: string;
  transaction_id?: string | null;
  invoice_id?: string | null;
  paid_date?: string | null;
  due_date: string;
  refunded_date?: string | null;
  refund_amount?: number | string | null;
};

type PromoRow = {
  id: string;
  code: string;
  description: string;
  type: 'percentage' | 'fixed';
  value: number | string;
  valid_from: string;
  valid_to: string;
  usage_limit?: number | null;
  used_count?: number | null;
  is_active: boolean;
  applicable_services?: string[] | null;
};

type InvoiceRow = {
  id: string;
  member_id: string;
  amount: number | string;
  currency: string;
  description: string;
  issue_date: string;
  due_date: string;
  paid_date?: string | null;
  status: string;
  items?: unknown[] | null;
  invoice_number?: string | null;
  gstin?: string | null;
  business_name?: string | null;
  billing_address?: string | null;
  hsn_sac?: string | null;
  cgst_rate?: number | null;
  sgst_rate?: number | null;
  cgst_amount?: number | null;
  sgst_amount?: number | null;
  subtotal?: number | null;
  total?: number | null;
  customer_name?: string | null;
  customer_email?: string | null;
  logo_url?: string | null;
  pdf_url?: string | null;
};

const PaymentSystem: React.FC = () => {
  const navigate = useNavigate();
  const { hasRole } = useAuth();
  const [payments, setPayments] = useState<Payment[]>([]);
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [promoCodes, setPromoCodes] = useState<PromoCode[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedStatus, setSelectedStatus] = useState<string>('all');
  const [isPaymentDialogOpen, setIsPaymentDialogOpen] = useState(false);
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
          .order('created_at', { ascending: false });

        if (paymentsError) throw paymentsError;

        const mappedPayments: Payment[] = ((paymentsData ?? []) as PaymentRow[]).map((p) => ({
          id: p.id,
          memberId: p.member_id,
          amount: Number(p.amount),
          currency: p.currency,
          type: p.type as PaymentType,
          method: p.method as PaymentMethod,
          status: p.status as PaymentStatus,
          description: p.description,
          transactionId: p.transaction_id,
          invoiceId: p.invoice_id,
          paidDate: p.paid_date ? new Date(p.paid_date) : undefined,
          dueDate: new Date(p.due_date),
          refundedDate: p.refunded_date ? new Date(p.refunded_date) : undefined,
          refundAmount: p.refund_amount ? Number(p.refund_amount) : undefined
        }));

        setPayments(mappedPayments);

        // 2. Fetch Promo Codes
        const { data: promoData, error: promoError } = await supabase
          .from('promo_codes')
          .select('*')
          .order('created_at', { ascending: false });

        if (promoError) throw promoError;

        const mappedPromoCodes: PromoCode[] = ((promoData ?? []) as PromoRow[]).map((p) => ({
          id: p.id,
          code: p.code,
          description: p.description,
          type: p.type as 'percentage' | 'fixed',
          value: Number(p.value),
          validFrom: new Date(p.valid_from),
          validTo: new Date(p.valid_to),
          usageLimit: p.usage_limit,
          usedCount: p.used_count || 0,
          isActive: p.is_active,
          applicableServices: p.applicable_services || []
        }));

        setPromoCodes(mappedPromoCodes);

        // 3. Fetch Invoices (if table exists)
        // Assuming invoices table exists
        const { data: invoicesData, error: invoicesError } = await supabase
          .from('invoices')
          .select('*')
          .order('issue_date', { ascending: false });

        if (!invoicesError && invoicesData) {
          const mappedInvoices: Invoice[] = (invoicesData as InvoiceRow[]).map((i) => ({
            id: i.id,
            memberId: i.member_id,
            amount: Number(i.amount),
            currency: i.currency,
            description: i.description,
            issueDate: new Date(i.issue_date),
            dueDate: new Date(i.due_date),
            paidDate: i.paid_date ? new Date(i.paid_date) : undefined,
            status: i.status,
            items: (i.items as Invoice['items']) || [],
            invoiceNumber: i.invoice_number || undefined,
            gstin: i.gstin || undefined,
            businessName: i.business_name || undefined,
            billingAddress: i.billing_address || undefined,
            hsnSac: i.hsn_sac || undefined,
            cgstRate: i.cgst_rate ?? undefined,
            sgstRate: i.sgst_rate ?? undefined,
            cgstAmount: i.cgst_amount ?? undefined,
            sgstAmount: i.sgst_amount ?? undefined,
            subtotal: i.subtotal ?? undefined,
            total: i.total ?? undefined,
            customerName: i.customer_name || undefined,
            customerEmail: i.customer_email || undefined,
            logoUrl: i.logo_url || undefined,
            pdfUrl: i.pdf_url || undefined
          }));
          setInvoices(mappedInvoices);
        }

      } catch (error) {
        console.error('Error fetching payment data:', error);
        toast.error('Failed to load payment data');
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, []);

  if (isLoading) {
    return <PageLoader />;
  }

  const getStatusColor = (status: PaymentStatus) => {
    switch (status) {
      case PaymentStatus.COMPLETED:
        return 'bg-[#00bc7d]/10 text-[#00bc7d] border-[#00bc7d]/20';
      case PaymentStatus.PENDING:
        return 'bg-[#00bc7d]/10 text-[#00bc7d] border-[#00bc7d]/20';
      case PaymentStatus.FAILED:
        return 'bg-[#00bc7d]/10 text-[#00bc7d] border-[#00bc7d]/20';
      case PaymentStatus.OVERDUE:
        return 'bg-[#00bc7d]/10 text-[#00bc7d] border-[#00bc7d]/20';
      case PaymentStatus.REFUNDED:
        return 'bg-[#00bc7d]/10 text-[#00bc7d] border-[#00bc7d]/20';
      case PaymentStatus.CANCELLED:
        return 'bg-[#00bc7d]/10 text-[#00bc7d] border-[#00bc7d]/20';
      default:
        return 'bg-[#00bc7d]/10 text-[#00bc7d] border-[#00bc7d]/20';
    }
  };

  const getStatusIcon = (status: PaymentStatus) => {
    switch (status) {
      case PaymentStatus.COMPLETED:
        return <CheckCircle className="h-4 w-4" />;
      case PaymentStatus.PENDING:
        return <Clock className="h-4 w-4" />;
      case PaymentStatus.FAILED:
      case PaymentStatus.OVERDUE:
        return <XCircle className="h-4 w-4" />;
      case PaymentStatus.REFUNDED:
        return <AlertCircle className="h-4 w-4" />;
      default:
        return <Clock className="h-4 w-4" />;
    }
  };

  const getMethodColor = (method: PaymentMethod) => {
    switch (method) {
      case PaymentMethod.STRIPE:
        return 'bg-purple-50 text-purple-700 border-purple-200';
      case PaymentMethod.CASH:
        return 'bg-emerald-50 text-emerald-700 border-emerald-200';
      case PaymentMethod.BANK_TRANSFER:
        return 'bg-blue-50 text-blue-700 border-blue-200';
      default:
        return 'bg-gray-50 text-gray-700 border-gray-200';
    }
  };

  const filteredPayments = payments.filter(payment => {
    const matchesSearch =
      (payment.description?.toLowerCase() || '').includes(searchTerm.toLowerCase()) ||
      (payment.memberId?.toLowerCase() || '').includes(searchTerm.toLowerCase()) ||
      (payment.transactionId?.toLowerCase() || '').includes(searchTerm.toLowerCase());

    const matchesStatus = selectedStatus === 'all' || payment.status === selectedStatus;

    return matchesSearch && matchesStatus;
  });

  const stats = {
    totalRevenue: payments
      .filter(p => p.status === PaymentStatus.COMPLETED)
      .reduce((sum, p) => sum + p.amount, 0),
    completedPayments: payments.filter(p => p.status === PaymentStatus.COMPLETED).length,
    pendingPayments: payments.filter(p => p.status === PaymentStatus.PENDING).length,
    overduePayments: payments.filter(p => p.status === PaymentStatus.OVERDUE).length,
    failedPayments: payments.filter(p => p.status === PaymentStatus.FAILED).length,
  };

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

  const handleDownloadInvoice = async (invoice: Invoice) => {
    try {
      await generateInvoicePdf(invoice);
    } catch (error) {
      console.error('Failed to generate invoice PDF', error);
      toast.error('Failed to generate invoice PDF');
    }
  };

  return (
    <div className="space-y-8">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h2 className="text-3xl font-bold mb-2 text-gray-900 flex items-center gap-3">
            <div className="p-3 bg-[#00bc7d] rounded-xl shadow-lg shadow-[#00bc7d]/20">
              <Sparkles className="h-6 w-6 text-white" />
            </div>
            Payment System
          </h2>
          <p className="text-muted-foreground ml-16">Manage payments, invoices, and promo codes</p>
        </div>
        <div className="flex gap-3">
          <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
            <Button
              variant="outline"
              className="rounded-xl border-2 h-11 px-6 hover:border-[#00bc7d] hover:text-[#00bc7d] hover:bg-[#00bc7d]/5"
              onClick={() => navigate('/promocodes/new')}
            >
              <Plus className="h-4 w-4 mr-2" />
              Promo Code
            </Button>
          </motion.div>
          <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
            <Button
              className="rounded-xl h-11 px-6 shadow-lg shadow-[#00bc7d]/20 bg-[#00bc7d] hover:bg-[#00bc7d]/90 text-white"
              onClick={() => navigate('/payments/new')}
            >
              <Plus className="h-4 w-4 mr-2" />
              Process Payment
            </Button>
          </motion.div>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
        {[
          { label: 'Total Revenue', value: `$${stats.totalRevenue.toFixed(2)}`, icon: DollarSign, gradient: 'from-[#00bc7d] to-emerald-600', delay: 0.1 },
          { label: 'Completed', value: stats.completedPayments, icon: CheckCircle, gradient: 'from-[#00bc7d] to-teal-500', delay: 0.2 },
          { label: 'Pending', value: stats.pendingPayments, icon: Clock, gradient: 'from-amber-400 to-orange-500', delay: 0.3 },
          { label: 'Overdue', value: stats.overduePayments, icon: AlertCircle, gradient: 'from-red-500 to-rose-600', delay: 0.4 },
          { label: 'Failed', value: stats.failedPayments, icon: XCircle, gradient: 'from-red-400 to-red-600', delay: 0.5 },
        ].map((stat, index) => (
          <motion.div
            key={stat.label}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: stat.delay }}
            whileHover={{ scale: 1.02, y: -4 }}
            className="group relative overflow-hidden rounded-2xl bg-white border border-gray-100 shadow-lg shadow-gray-100/50 p-6 transition-all duration-300"
          >
            <div className={`absolute inset-0 bg-gradient-to-br ${stat.gradient} opacity-0 group-hover:opacity-5 transition-opacity duration-500`} />
            <div className="relative">
              <div className="flex items-start justify-between mb-4">
                <div className={`p-3 rounded-xl bg-gradient-to-br ${stat.gradient} shadow-lg text-white`}>
                  <stat.icon className="h-5 w-5" />
                </div>
              </div>
              <h3 className="text-sm font-medium text-muted-foreground mb-2">{stat.label}</h3>
              <p className="text-2xl font-bold text-gray-900">
                {stat.value}
              </p>
            </div>
          </motion.div>
        ))}
      </div>

      <Tabs defaultValue="status" className="space-y-6">
        <div className="flex justify-start w-full overflow-x-auto pb-2">
          <TabsList className="bg-white p-1.5 rounded-xl border border-gray-100 shadow-sm h-auto gap-2 inline-flex">
            <TabsTrigger
              value="status"
              className="rounded-lg px-6 py-2.5 text-gray-500 data-[state=active]:bg-[#00bc7d] data-[state=active]:text-white data-[state=active]:shadow-md transition-all"
            >
              Payment Status
            </TabsTrigger>
            <TabsTrigger
              value="history"
              className="rounded-lg px-6 py-2.5 text-gray-500 data-[state=active]:bg-[#00bc7d] data-[state=active]:text-white data-[state=active]:shadow-md transition-all"
            >
              Payment History
            </TabsTrigger>
            <TabsTrigger
              value="invoices"
              className="rounded-lg px-6 py-2.5 text-gray-500 data-[state=active]:bg-[#00bc7d] data-[state=active]:text-white data-[state=active]:shadow-md transition-all"
            >
              Invoices
            </TabsTrigger>
            <TabsTrigger
              value="promo-codes"
              className="rounded-lg px-6 py-2.5 text-gray-500 data-[state=active]:bg-[#00bc7d] data-[state=active]:text-white data-[state=active]:shadow-md transition-all"
            >
              Promo Codes
            </TabsTrigger>
          </TabsList>
        </div>

        <TabsContent value="status" className="space-y-4 focus-visible:outline-none focus-visible:ring-0">
          <PaymentStatusComponent />
        </TabsContent>

        <TabsContent value="history" className="space-y-4">
          <motion.div
            variants={containerVariants}
            initial="hidden"
            animate="visible"
          >
            <Card className="border-0 shadow-lg shadow-gray-100/50 bg-white overflow-hidden rounded-2xl">
              <CardHeader className="bg-gradient-to-r from-gray-50 to-white border-b border-gray-100 pb-4">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                  <div className="flex items-center gap-2">
                    <div className="p-2 bg-[#00bc7d]/10 rounded-lg">
                      <Receipt className="h-5 w-5 text-[#00bc7d]" />
                    </div>
                    <div>
                      <CardTitle className="text-lg text-gray-900">Payment History</CardTitle>
                      <CardDescription>View and manage transaction records</CardDescription>
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                      <Input
                        placeholder="Search payments..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="pl-9 h-10 w-64 bg-white border-gray-200 focus-visible:ring-[#00bc7d] rounded-xl"
                      />
                    </div>
                    <Select value={selectedStatus} onValueChange={setSelectedStatus}>
                      <SelectTrigger className="w-40 h-10 rounded-xl border-gray-200 focus:ring-[#00bc7d]">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Status</SelectItem>
                        <SelectItem value={PaymentStatus.COMPLETED}>Completed</SelectItem>
                        <SelectItem value={PaymentStatus.PENDING}>Pending</SelectItem>
                        <SelectItem value={PaymentStatus.OVERDUE}>Overdue</SelectItem>
                        <SelectItem value={PaymentStatus.FAILED}>Failed</SelectItem>
                        <SelectItem value={PaymentStatus.REFUNDED}>Refunded</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="p-0">
                <Table>
                  <TableHeader>
                    <TableRow className="hover:bg-transparent border-gray-100 bg-gray-50/50">
                      <TableHead className="pl-6">Transaction ID</TableHead>
                      <TableHead>Member</TableHead>
                      <TableHead>Description</TableHead>
                      <TableHead>Amount</TableHead>
                      <TableHead>Method</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Date</TableHead>
                      <TableHead className="text-right pr-6">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredPayments.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={8} className="h-32 text-center text-muted-foreground">
                          No payments found matching your criteria.
                        </TableCell>
                      </TableRow>
                    ) : (
                      filteredPayments.map((payment, index) => (
                        <motion.tr
                          key={payment.id}
                          variants={itemVariants}
                          className="group hover:bg-[#00bc7d]/5 transition-colors border-gray-100"
                        >
                          <TableCell className="pl-6 font-mono text-sm text-gray-500">
                            {payment.transactionId || 'N/A'}
                          </TableCell>
                          <TableCell className="font-medium text-gray-900">{payment.memberId}</TableCell>
                          <TableCell className="max-w-[200px] truncate text-gray-500">{payment.description}</TableCell>
                          <TableCell className="font-bold text-gray-900">
                            ${payment.amount.toFixed(2)}
                          </TableCell>
                          <TableCell>
                            <Badge variant="outline" className={`${getMethodColor(payment.method)} rounded-lg px-2 py-0.5 font-normal`}>
                              {payment.method}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center space-x-2">
                              <Badge className={`${getStatusColor(payment.status)} rounded-lg px-2 py-0.5 border font-normal flex items-center gap-1.5`}>
                                {getStatusIcon(payment.status)}
                                {payment.status}
                              </Badge>
                            </div>
                          </TableCell>
                          <TableCell className="text-gray-500">
                            {payment.paidDate?.toLocaleDateString() || payment.dueDate?.toLocaleDateString() || 'N/A'}
                          </TableCell>
                          <TableCell className="text-right pr-6">
                            <div className="flex justify-end space-x-2 opacity-0 group-hover:opacity-100 transition-opacity">
                              <Button variant="ghost" size="sm" className="h-8 w-8 p-0 rounded-lg hover:bg-[#00bc7d]/10 hover:text-[#00bc7d]">
                                <Receipt className="h-4 w-4" />
                              </Button>
                              <Button variant="ghost" size="sm" className="h-8 w-8 p-0 rounded-lg hover:bg-[#00bc7d]/10 hover:text-[#00bc7d]">
                                <Download className="h-4 w-4" />
                              </Button>
                            </div>
                          </TableCell>
                        </motion.tr>
                      ))
                    )}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </motion.div>
        </TabsContent>

        <TabsContent value="invoices" className="space-y-4">
          <motion.div
            variants={containerVariants}
            initial="hidden"
            animate="visible"
          >
            <Card className="border-0 shadow-lg shadow-gray-100/50 bg-white overflow-hidden rounded-2xl">
              <CardHeader className="bg-gradient-to-r from-gray-50 to-white border-b border-gray-100 pb-4">
                <div className="flex items-center gap-2">
                  <div className="p-2 bg-[#00bc7d]/10 rounded-lg">
                    <FileText className="h-5 w-5 text-[#00bc7d]" />
                  </div>
                  <div>
                    <CardTitle className="text-lg text-gray-900">Invoices</CardTitle>
                    <CardDescription>Manage and send invoices to members</CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="p-0">
                {invoices.length > 0 ? (
                  <Table>
                    <TableHeader>
                      <TableRow className="hover:bg-transparent border-gray-100 bg-gray-50/50">
                        <TableHead className="pl-6">Invoice ID</TableHead>
                        <TableHead>Member</TableHead>
                        <TableHead>Amount</TableHead>
                        <TableHead>Issue Date</TableHead>
                        <TableHead>Due Date</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead className="text-right pr-6">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {invoices.map((invoice) => (
                        <motion.tr
                          key={invoice.id}
                          variants={itemVariants}
                          className="group hover:bg-[#00bc7d]/5 transition-colors border-gray-100"
                        >
                          <TableCell className="pl-6 font-mono text-sm text-gray-500">#{invoice.id.slice(0, 8)}</TableCell>
                          <TableCell className="font-medium text-gray-900">{invoice.memberId}</TableCell>
                          <TableCell className="font-bold text-gray-900">${invoice.amount.toFixed(2)}</TableCell>
                          <TableCell className="text-gray-500">{invoice.issueDate.toLocaleDateString()}</TableCell>
                          <TableCell className="text-gray-500">{invoice.dueDate.toLocaleDateString()}</TableCell>
                          <TableCell>
                            <Badge variant="outline" className={`rounded-lg px-2 py-0.5 font-normal ${invoice.status === 'PAID' ? 'bg-[#00bc7d]/10 text-[#00bc7d] border-[#00bc7d]/20' :
                              invoice.status === 'OVERDUE' ? 'bg-red-50 text-red-600 border-red-200' :
                                'bg-yellow-50 text-yellow-600 border-yellow-200'
                              }`}>
                              {invoice.status}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-right pr-6">
                            <div className="flex justify-end space-x-2 opacity-0 group-hover:opacity-100 transition-opacity">
                              <Button variant="ghost" size="sm" className="h-8 w-8 p-0 rounded-lg hover:bg-[#00bc7d]/10 hover:text-[#00bc7d]">
                                <Send className="h-4 w-4" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                className="h-8 w-8 p-0 rounded-lg hover:bg-[#00bc7d]/10 hover:text-[#00bc7d]"
                                onClick={() => handleDownloadInvoice(invoice)}
                              >
                                <Download className="h-4 w-4" />
                              </Button>
                            </div>
                          </TableCell>
                        </motion.tr>
                      ))}
                    </TableBody>
                  </Table>
                ) : (
                  <div className="text-center py-16 text-muted-foreground bg-gray-50/30">
                    <div className="bg-gray-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                      <Receipt className="h-8 w-8 text-gray-400" />
                    </div>
                    <p className="font-medium text-gray-900">No invoices found</p>
                    <p className="text-sm mt-1">Create a new invoice to get started</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </motion.div>
        </TabsContent>

        <TabsContent value="promo-codes" className="space-y-4">
          <motion.div
            variants={containerVariants}
            initial="hidden"
            animate="visible"
          >
            <Card className="border-0 shadow-lg shadow-gray-100/50 bg-white overflow-hidden rounded-2xl">
              <CardHeader className="bg-gradient-to-r from-gray-50 to-white border-b border-gray-100 pb-4">
                <div className="flex items-center gap-2">
                  <div className="p-2 bg-[#00bc7d]/10 rounded-lg">
                    <Tag className="h-5 w-5 text-[#00bc7d]" />
                  </div>
                  <div>
                    <CardTitle className="text-lg text-gray-900">Promotional Codes</CardTitle>
                    <CardDescription>Manage discount codes and promotions</CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="p-0">
                <Table>
                  <TableHeader>
                    <TableRow className="hover:bg-transparent border-gray-100 bg-gray-50/50">
                      <TableHead className="pl-6">Code</TableHead>
                      <TableHead>Discount</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Usage</TableHead>
                      <TableHead>Valid Until</TableHead>
                      <TableHead className="text-right pr-6">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {promoCodes.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={6} className="h-32 text-center text-muted-foreground">
                          No promo codes active.
                        </TableCell>
                      </TableRow>
                    ) : (
                      promoCodes.map((promo) => (
                        <motion.tr
                          key={promo.id}
                          variants={itemVariants}
                          className="group hover:bg-[#00bc7d]/5 transition-colors border-gray-100"
                        >
                          <TableCell className="pl-6">
                            <div className="flex flex-col">
                              <code className="bg-gray-100 px-2 py-1 rounded-md text-sm font-mono text-gray-900 w-fit">
                                {promo.code}
                              </code>
                              <span className="text-xs text-muted-foreground mt-1">{promo.description}</span>
                            </div>
                          </TableCell>
                          <TableCell className="font-medium text-gray-900">
                            {promo.type === 'percentage' ? `${promo.value}%` : `$${promo.value}`}
                          </TableCell>
                          <TableCell>
                            <Badge variant={promo.isActive ? 'default' : 'secondary'} className={`rounded-lg px-2 py-0.5 font-normal ${promo.isActive
                              ? 'bg-[#00bc7d]/10 text-[#00bc7d] border-[#00bc7d]/20'
                              : 'bg-gray-100 text-gray-500 border-gray-200'
                              }`}>
                              {promo.isActive ? 'Active' : 'Inactive'}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-gray-500">
                            {promo.usedCount} / {promo.usageLimit || '∞'}
                          </TableCell>
                          <TableCell className="text-gray-500">
                            {promo.validTo.toLocaleDateString()}
                          </TableCell>
                          <TableCell className="text-right pr-6">
                            <div className="flex justify-end space-x-2 opacity-0 group-hover:opacity-100 transition-opacity">
                              <Button variant="ghost" size="sm" className="h-8 w-8 p-0 rounded-lg hover:bg-[#00bc7d]/10 hover:text-[#00bc7d]">
                                <Edit className="h-4 w-4" />
                              </Button>
                              <Button variant="ghost" size="sm" className="h-8 w-8 p-0 rounded-lg hover:bg-red-50 hover:text-red-600">
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </div>
                          </TableCell>
                        </motion.tr>
                      ))
                    )}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </motion.div>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default PaymentSystem;
