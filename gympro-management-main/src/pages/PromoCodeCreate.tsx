import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useAuth } from '@/hooks/useAuth';
import { UserRole, PromoCode } from '@/types';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { supabase } from '@/lib/supabase';
import { toast } from 'sonner';
import Sidebar from '@/components/layout/Sidebar';
import Topbar from '@/components/layout/Topbar';
import {
  Tag,
  ArrowLeft,
  Calendar,
  Percent,
  DollarSign,
  Hash,
  FileText,
  Sparkles,
  CheckCircle2,
  AlertCircle
} from 'lucide-react';

const PromoCodeCreate: React.FC = () => {
  const { hasRole } = useAuth();
  const navigate = useNavigate();
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(() => {
    const saved = localStorage.getItem('sidebar-collapsed');
    return saved ? JSON.parse(saved) : false;
  });
  
  const [formData, setFormData] = useState({
    code: '',
    description: '',
    type: 'percentage' as 'percentage' | 'fixed',
    value: '',
    validFrom: '',
    validTo: '',
    usageLimit: ''
  });

  const allowed = hasRole(UserRole.ADMIN) || hasRole(UserRole.MANAGER);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const promoData = {
        code: formData.code.toUpperCase(),
        description: formData.description,
        type: formData.type,
        value: parseFloat(formData.value),
        valid_from: formData.validFrom,
        valid_to: formData.validTo,
        usage_limit: formData.usageLimit ? parseInt(formData.usageLimit) : null,
        used_count: 0,
        is_active: true,
        applicable_services: ['membership', 'class']
      };

      const { error } = await supabase
        .from('promo_codes')
        .insert(promoData);

      if (error) {
        toast.error(error.message || 'Failed to create promo code');
        return;
      }
      toast.success('Promo code created successfully');
      navigate('/dashboard?tab=payments');
    } catch (error) {
      toast.error('Failed to create promo code');
    }
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

            {/* Header Section */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
              <div>
                <motion.h2
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  className="text-3xl font-bold mb-2 text-gray-900 flex items-center gap-3"
                >
                  <div className="p-3 bg-[#00bc7d] rounded-xl shadow-lg shadow-[#00bc7d]/20">
                    <Tag className="h-6 w-6 text-white" />
                  </div>
                  Create Promo Code
                </motion.h2>
                <motion.p
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.1 }}
                  className="text-muted-foreground ml-16"
                >
                  Generate a new discount code for memberships and services
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
                  <ArrowLeft className="h-4 w-4 mr-2 group-hover:-translate-x-1 transition-transform" />
                  Back to Payments
                </Button>
              </motion.div>
            </div>

            {!allowed ? (
              <Card className="border-red-200 bg-red-50 rounded-2xl">
                <CardContent className="p-6 text-center text-red-600">
                  Access denied. You do not have permission to create promo codes.
                </CardContent>
              </Card>
            ) : (
              <form onSubmit={handleSubmit}>
                <motion.div
                  variants={containerVariants}
                  initial="hidden"
                  animate="visible"
                  className="grid grid-cols-1 lg:grid-cols-3 gap-8"
                >

                  {/* Left Column - Main Info */}
                  <div className="lg:col-span-2 space-y-8">

                    {/* Basic Information Card */}
                    <motion.div variants={itemVariants}>
                      <Card className="border-0 shadow-lg shadow-gray-100/50 bg-white overflow-hidden rounded-2xl">
                        <CardHeader className="bg-gradient-to-r from-gray-50 to-white border-b border-gray-100 pb-4">
                          <div className="flex items-center gap-2">
                            <div className="p-2 bg-[#00bc7d]/10 rounded-lg">
                              <Sparkles className="h-5 w-5 text-[#00bc7d]" />
                            </div>
                            <CardTitle className="text-lg text-gray-900">Code Details</CardTitle>
                          </div>
                          <CardDescription>Set up the code and discount value</CardDescription>
                        </CardHeader>
                        <CardContent className="p-6 grid grid-cols-1 md:grid-cols-2 gap-6">
                          <div className="space-y-2">
                            <Label htmlFor="code">Promo Code *</Label>
                            <div className="relative">
                              <Hash className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                              <Input
                                id="code"
                                value={formData.code}
                                onChange={(e) => setFormData({ ...formData, code: e.target.value.toUpperCase() })}
                                required
                                className="pl-10 focus-visible:ring-[#00bc7d] rounded-xl border-gray-200 font-mono uppercase"
                                placeholder="SUMMER2024"
                              />
                            </div>
                          </div>
                          <div className="space-y-2">
                            <Label htmlFor="type">Discount Type</Label>
                            <Select 
                              value={formData.type} 
                              onValueChange={(value) => setFormData({ ...formData, type: value as 'percentage' | 'fixed' })}
                            >
                              <SelectTrigger className="rounded-xl border-gray-200 focus:ring-[#00bc7d]">
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="percentage">Percentage (%)</SelectItem>
                                <SelectItem value="fixed">Fixed Amount ($)</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                          <div className="space-y-2 md:col-span-2">
                            <Label htmlFor="value">Discount Value *</Label>
                            <div className="relative">
                              {formData.type === 'fixed' ? (
                                <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                              ) : (
                                <Percent className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                              )}
                              <Input
                                id="value"
                                type="number"
                                step={formData.type === 'percentage' ? '1' : '0.01'}
                                value={formData.value}
                                onChange={(e) => setFormData({ ...formData, value: e.target.value })}
                                required
                                className="pl-10 focus-visible:ring-[#00bc7d] rounded-xl border-gray-200"
                                placeholder={formData.type === 'percentage' ? '20' : '10.00'}
                              />
                            </div>
                          </div>
                          <div className="space-y-2 md:col-span-2">
                            <Label htmlFor="description">Description *</Label>
                            <div className="relative">
                              <FileText className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                              <Input
                                id="description"
                                value={formData.description}
                                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                                required
                                className="pl-10 focus-visible:ring-[#00bc7d] rounded-xl border-gray-200"
                                placeholder="Special summer discount for new members"
                              />
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    </motion.div>

                    {/* Validity & Limits Card */}
                    <motion.div variants={itemVariants}>
                      <Card className="border-0 shadow-lg shadow-gray-100/50 bg-white overflow-hidden rounded-2xl">
                        <CardHeader className="bg-gradient-to-r from-gray-50 to-white border-b border-gray-100 pb-4">
                          <div className="flex items-center gap-2">
                            <div className="p-2 bg-[#00bc7d]/10 rounded-lg">
                              <Calendar className="h-5 w-5 text-[#00bc7d]" />
                            </div>
                            <CardTitle className="text-lg text-gray-900">Validity & Limits</CardTitle>
                          </div>
                          <CardDescription>Define when and how often this code can be used</CardDescription>
                        </CardHeader>
                        <CardContent className="p-6 grid grid-cols-1 md:grid-cols-2 gap-6">
                          <div className="space-y-2">
                            <Label htmlFor="validFrom">Valid From *</Label>
                            <Input
                              id="validFrom"
                              type="date"
                              value={formData.validFrom}
                              onChange={(e) => setFormData({ ...formData, validFrom: e.target.value })}
                              required
                              className="focus-visible:ring-[#00bc7d] rounded-xl border-gray-200"
                            />
                          </div>
                          <div className="space-y-2">
                            <Label htmlFor="validTo">Valid To *</Label>
                            <Input
                              id="validTo"
                              type="date"
                              value={formData.validTo}
                              onChange={(e) => setFormData({ ...formData, validTo: e.target.value })}
                              required
                              className="focus-visible:ring-[#00bc7d] rounded-xl border-gray-200"
                            />
                          </div>
                          <div className="space-y-2 md:col-span-2">
                            <Label htmlFor="usageLimit">Usage Limit (Optional)</Label>
                            <Input
                              id="usageLimit"
                              type="number"
                              value={formData.usageLimit}
                              onChange={(e) => setFormData({ ...formData, usageLimit: e.target.value })}
                              placeholder="100"
                              className="focus-visible:ring-[#00bc7d] rounded-xl border-gray-200"
                            />
                            <p className="text-xs text-muted-foreground mt-1">Leave blank for unlimited usage</p>
                          </div>
                        </CardContent>
                      </Card>
                    </motion.div>
                  </div>

                  {/* Right Column - Preview & Actions */}
                  <div className="space-y-8">

                    {/* Summary Card */}
                    <motion.div variants={itemVariants}>
                      <Card className="border-0 shadow-xl shadow-[#00bc7d]/5 bg-white overflow-hidden h-full rounded-2xl relative">
                        <div className="absolute top-0 right-0 p-32 bg-[#00bc7d]/5 rounded-full blur-3xl -mr-16 -mt-16 pointer-events-none" />
                        <CardHeader className="bg-gradient-to-r from-[#00bc7d] to-[#009664] text-white pb-6 relative overflow-hidden">
                          <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-10"></div>
                          <div className="relative z-10 flex items-center gap-2">
                            <Tag className="h-5 w-5" />
                            <CardTitle className="text-lg text-white">Summary</CardTitle>
                          </div>
                          <CardDescription className="text-[#00bc7d]-100 relative z-10 opacity-90">Preview your promo code</CardDescription>
                        </CardHeader>
                        <CardContent className="p-6 space-y-6 relative">
                          <div className="text-center p-6 bg-gray-50 rounded-2xl border-2 border-dashed border-gray-200">
                            <p className="text-sm text-gray-500 mb-2">Code</p>
                            <div className="text-3xl font-bold text-[#00bc7d] font-mono tracking-wider">
                              {formData.code || 'CODE'}
                            </div>
                          </div>

                          <div className="space-y-4">
                            <div className="flex justify-between items-center py-2 border-b border-gray-100">
                              <span className="text-gray-500">Discount</span>
                              <span className="font-semibold text-gray-900">
                                {formData.value ? (
                                  formData.type === 'percentage' ? `${formData.value}% OFF` : `$${formData.value} OFF`
                                ) : '-'}
                              </span>
                            </div>
                            <div className="flex justify-between items-center py-2 border-b border-gray-100">
                              <span className="text-gray-500">Duration</span>
                              <div className="text-right">
                                <div className="font-semibold text-gray-900 text-sm">{formData.validFrom || '-'}</div>
                                <div className="text-xs text-gray-400">to</div>
                                <div className="font-semibold text-gray-900 text-sm">{formData.validTo || '-'}</div>
                              </div>
                            </div>
                            <div className="flex justify-between items-center py-2 border-b border-gray-100">
                              <span className="text-gray-500">Usage Limit</span>
                              <span className="font-semibold text-gray-900">{formData.usageLimit || 'Unlimited'}</span>
                            </div>
                          </div>

                          <Button 
                            type="submit" 
                            className="w-full h-12 text-lg font-semibold bg-[#00bc7d] hover:bg-[#00bc7d]/90 shadow-lg shadow-[#00bc7d]/20 rounded-xl transition-all hover:scale-[1.02] active:scale-[0.98]"
                          >
                            Create Code
                            <CheckCircle2 className="ml-2 h-5 w-5" />
                          </Button>
                        </CardContent>
                      </Card>
                    </motion.div>

                    {/* Tips Card */}
                    <motion.div variants={itemVariants}>
                      <Card className="border-0 shadow-lg shadow-gray-100/50 bg-[#00bc7d]/5 overflow-hidden rounded-2xl border-l-4 border-[#00bc7d]">
                        <CardContent className="p-4 flex gap-4">
                          <div className="p-2 bg-white rounded-full h-fit shadow-sm">
                            <AlertCircle className="h-5 w-5 text-[#00bc7d]" />
                          </div>
                          <div>
                            <h4 className="font-semibold text-[#00bc7d] mb-1">Pro Tip</h4>
                            <p className="text-sm text-[#00bc7d]/80">
                              Short, memorable codes like "SUMMER24" or "WELCOME" work best. Make sure to set a reasonable expiration date.
                            </p>
                          </div>
                        </CardContent>
                      </Card>
                    </motion.div>

                  </div>
                </motion.div>
              </form>
            )}
          </div>
        </main>
      </motion.div>
    </div>
  );
};

export default PromoCodeCreate;