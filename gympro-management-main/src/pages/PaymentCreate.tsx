import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useAuth } from '@/hooks/useAuth';
import { PaymentType, PaymentMethod, PaymentStatus } from '@/types';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { toast } from 'sonner';
import Sidebar from '@/components/layout/Sidebar';
import Topbar from '@/components/layout/Topbar';
import { supabase } from '@/lib/supabase';
import { createInvoiceForPayment } from '@/lib/invoices';
import {
  ArrowLeft,
  CreditCard,
  DollarSign,
  User,
  Tag,
  FileText,
  CheckCircle2,
  Receipt,
  Sparkles
} from 'lucide-react';

const PaymentCreate: React.FC = () => {
  const { hasRole } = useAuth();
  const navigate = useNavigate();
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(() => {
    const saved = localStorage.getItem('sidebar-collapsed');
    return saved ? JSON.parse(saved) : false;
  });

  const [formData, setFormData] = useState({
    memberId: '',
    amount: '',
    type: PaymentType.MEMBERSHIP,
    method: PaymentMethod.STRIPE,
    description: '',
    promoCode: ''
  });

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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      const { data, error } = await supabase
        .from('payments')
        .insert({
          member_id: formData.memberId,
          amount: Number(formData.amount || 0),
          currency: 'INR',
          type: formData.type,
          method: formData.method,
          status: PaymentStatus.COMPLETED,
          description: formData.description,
          paid_date: new Date().toISOString(),
          due_date: new Date().toISOString()
        })
        .select('*')
        .single();

      if (error || !data) {
        throw error;
      }

      await createInvoiceForPayment(data.id);

      toast.success('Payment processed and invoice generated');
      navigate('/dashboard?tab=payments');
    } catch (error) {
      console.error('Failed to process payment', error);
      toast.error('Failed to process payment');
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
                    <Receipt className="h-6 w-6 text-white" />
                  </div>
                  Process Payment
                </motion.h2>
                <motion.p
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.1 }}
                  className="text-muted-foreground ml-16"
                >
                  Record a new transaction for a member
                </motion.p>
              </div>
              <motion.div
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
              >
                <Button
                  variant="outline"
                  onClick={() => navigate('/dashboard?tab=payments')}
                  className="group hover:border-[#00bc7d] hover:text-[#00bc7d] hover:bg-[#00bc7d]/5 rounded-xl border-gray-200"
                >
                  <ArrowLeft className="mr-2 h-4 w-4 group-hover:-translate-x-1 transition-transform" />
                  Back to Payments
                </Button>
              </motion.div>
            </div>

            <form onSubmit={handleSubmit}>
              <motion.div
                variants={containerVariants}
                initial="hidden"
                animate="visible"
                className="grid grid-cols-1 lg:grid-cols-3 gap-8"
              >
                {/* Left Column - Main Info */}
                <div className="lg:col-span-2 space-y-8">

                  {/* Transaction Details */}
                  <motion.div variants={itemVariants}>
                    <Card className="border-0 shadow-lg shadow-gray-100/50 bg-white overflow-hidden rounded-2xl">
                      <CardHeader className="bg-gradient-to-r from-gray-50 to-white border-b border-gray-100 pb-4">
                        <div className="flex items-center gap-2">
                          <div className="p-2 bg-[#00bc7d]/10 rounded-lg">
                            <CreditCard className="h-5 w-5 text-[#00bc7d]" />
                          </div>
                          <CardTitle className="text-lg text-gray-900">Transaction Details</CardTitle>
                        </div>
                        <CardDescription>Basic payment information</CardDescription>
                      </CardHeader>
                      <CardContent className="p-6 space-y-6">
                        <div className="space-y-2">
                          <Label htmlFor="memberId">Member ID</Label>
                          <div className="relative">
                            <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                            <Input
                              id="memberId"
                              placeholder="Enter member ID or search..."
                              value={formData.memberId}
                              onChange={(e) => setFormData({ ...formData, memberId: e.target.value })}
                              className="pl-10 h-11 bg-white border-gray-200 focus-visible:ring-[#00bc7d] rounded-xl"
                              required
                            />
                          </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                          <div className="space-y-2">
                            <Label htmlFor="type">Payment Type</Label>
                            <Select
                              value={formData.type}
                              onValueChange={(value) => setFormData({ ...formData, type: value as PaymentType })}
                            >
                              <SelectTrigger className="h-11 bg-white border-gray-200 focus:ring-[#00bc7d] rounded-xl">
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value={PaymentType.MEMBERSHIP}>Membership</SelectItem>
                                <SelectItem value={PaymentType.CLASS}>Class</SelectItem>
                                <SelectItem value={PaymentType.PERSONAL_TRAINING}>Personal Training</SelectItem>
                                <SelectItem value={PaymentType.EQUIPMENT_RENTAL}>Equipment Rental</SelectItem>
                                <SelectItem value={PaymentType.LATE_FEE}>Late Fee</SelectItem>
                                <SelectItem value={PaymentType.OTHER}>Other</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>

                          <div className="space-y-2">
                            <Label htmlFor="method">Payment Method</Label>
                            <Select
                              value={formData.method}
                              onValueChange={(value) => setFormData({ ...formData, method: value as PaymentMethod })}
                            >
                              <SelectTrigger className="h-11 bg-white border-gray-200 focus:ring-[#00bc7d] rounded-xl">
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value={PaymentMethod.STRIPE}>Stripe (Credit Card)</SelectItem>
                                <SelectItem value={PaymentMethod.PAYPAL}>PayPal</SelectItem>
                                <SelectItem value={PaymentMethod.CASH}>Cash</SelectItem>
                                <SelectItem value={PaymentMethod.BANK_TRANSFER}>Bank Transfer</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                        </div>

                        <div className="space-y-2">
                          <Label htmlFor="description">Description</Label>
                          <div className="relative">
                            <FileText className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                            <Textarea
                              id="description"
                              placeholder="Add details about this payment..."
                              value={formData.description}
                              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                              className="pl-10 min-h-[80px] bg-white border-gray-200 focus-visible:ring-[#00bc7d] rounded-xl resize-none"
                              required
                            />
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </motion.div>

                  {/* Promo Code Info */}
                  <motion.div variants={itemVariants}>
                    <Card className="border-0 shadow-lg shadow-gray-100/50 bg-white overflow-hidden rounded-2xl">
                      <CardHeader className="bg-gradient-to-r from-gray-50 to-white border-b border-gray-100 pb-4">
                        <div className="flex items-center gap-2">
                          <div className="p-2 bg-[#00bc7d]/10 rounded-lg">
                            <Tag className="h-5 w-5 text-[#00bc7d]" />
                          </div>
                          <CardTitle className="text-lg text-gray-900">Discounts & Promo</CardTitle>
                        </div>
                      </CardHeader>
                      <CardContent className="p-6 space-y-6">
                        <div className="space-y-2">
                          <Label htmlFor="promoCode">Promo Code (Optional)</Label>
                          <div className="flex gap-2">
                            <Input
                              id="promoCode"
                              placeholder="e.g. SUMMER2024"
                              value={formData.promoCode}
                              onChange={(e) => setFormData({ ...formData, promoCode: e.target.value })}
                              className="h-11 bg-white border-gray-200 focus-visible:ring-[#00bc7d] rounded-xl"
                            />
                            <Button type="button" variant="outline" className="h-11 rounded-xl border-gray-200 hover:border-[#00bc7d] hover:text-[#00bc7d]">
                              Apply
                            </Button>
                          </div>
                          <p className="text-xs text-muted-foreground flex items-center gap-1">
                            <Sparkles className="h-3 w-3 text-[#00bc7d]" />
                            Enter a valid promo code to apply discount automatically.
                          </p>
                        </div>
                      </CardContent>
                    </Card>
                  </motion.div>
                </div>

                {/* Right Column - Amount & Summary */}
                <div className="space-y-8">

                  {/* Amount Card */}
                  <motion.div variants={itemVariants}>
                    <Card className="border-0 shadow-xl shadow-[#00bc7d]/5 bg-white overflow-hidden h-full rounded-2xl relative">
                      <div className="absolute top-0 right-0 p-32 bg-[#00bc7d]/5 rounded-full blur-3xl -mr-16 -mt-16 pointer-events-none" />
                      <CardHeader className="bg-gradient-to-r from-[#00bc7d] to-[#009664] text-white pb-6 relative overflow-hidden">
                        <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-10"></div>
                        <div className="relative z-10 flex items-center gap-2">
                          <DollarSign className="h-5 w-5" />
                          <CardTitle className="text-lg text-white">Total Amount</CardTitle>
                        </div>
                        <CardDescription className="text-[#00bc7d]-100 relative z-10 opacity-90">Enter payment amount</CardDescription>
                      </CardHeader>
                      <CardContent className="p-6 space-y-6 relative z-10">
                        <div className="space-y-2">
                          <Label htmlFor="amount" className="sr-only">Amount</Label>
                          <div className="relative">
                            <DollarSign className="absolute left-4 top-1/2 -translate-y-1/2 h-8 w-8 text-gray-400" />
                            <Input
                              id="amount"
                              type="number"
                              value={formData.amount}
                              onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                              className="pl-14 h-20 text-4xl font-bold bg-gray-50 border-2 border-gray-200 focus-visible:ring-0 focus:border-[#00bc7d] transition-colors rounded-2xl"
                              placeholder="0.00"
                              required
                            />
                          </div>
                        </div>

                        <div className="bg-[#00bc7d]/5 rounded-xl p-4 border border-[#00bc7d]/10">
                          <div className="flex justify-between items-center mb-2">
                            <span className="text-sm text-gray-600">Subtotal</span>
                            <span className="font-semibold text-gray-900">${formData.amount || '0.00'}</span>
                          </div>
                          <div className="flex justify-between items-center mb-2">
                            <span className="text-sm text-gray-600">Tax (0%)</span>
                            <span className="font-semibold text-gray-900">$0.00</span>
                          </div>
                          <div className="border-t border-[#00bc7d]/10 my-2 pt-2 flex justify-between items-center">
                            <span className="font-bold text-gray-900">Total</span>
                            <span className="font-bold text-xl text-[#00bc7d]">${formData.amount || '0.00'}</span>
                          </div>
                        </div>

                        <Button
                          type="submit"
                          className="w-full h-12 text-lg font-semibold bg-[#00bc7d] hover:bg-[#00bc7d]/90 shadow-lg shadow-[#00bc7d]/20 rounded-xl transition-all hover:scale-[1.02] active:scale-[0.98]"
                        >
                          Process Payment
                          <CheckCircle2 className="ml-2 h-5 w-5" />
                        </Button>
                      </CardContent>
                    </Card>
                  </motion.div>
                </div>
              </motion.div>
            </form>
          </div>
        </main>
      </motion.div>
    </div>
  );
};

export default PaymentCreate;
