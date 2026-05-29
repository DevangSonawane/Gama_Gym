import React, { useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import Sidebar from '@/components/layout/Sidebar';
import Topbar from '@/components/layout/Topbar';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import {
  Settings as SettingsIcon,
  Bell,
  Shield,
  CreditCard,
  Users,
  Mail,
  Phone,
  MapPin,
  Globe,
  Clock,
  CheckCircle2,
  UserPlus
} from 'lucide-react';

const Settings: React.FC = () => {
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(() => {
    const saved = localStorage.getItem('sidebar-collapsed');
    return saved ? JSON.parse(saved) : false;
  });

  const notifications = useMemo(
    () => ({
      email: [
        { id: 'new-members', label: 'New member registrations', enabled: true },
        { id: 'class-bookings', label: 'Class bookings and cancellations', enabled: true },
        { id: 'payment-confirm', label: 'Payment confirmations', enabled: true },
        { id: 'trainer-changes', label: 'Trainer schedule changes', enabled: false },
        { id: 'equipment-alerts', label: 'Equipment maintenance alerts', enabled: true }
      ],
      push: [
        { id: 'new-members-push', label: 'New member registrations', enabled: false },
        { id: 'capacity-alerts', label: 'Class capacity alerts', enabled: true },
        { id: 'payment-failed', label: 'Payment failed alerts', enabled: true }
      ]
    }),
    []
  );

  const plans = [
    {
      id: 'basic',
      title: 'Basic',
      price: '$49',
      features: ['Gym access', 'Basic equipment', 'Locker room'],
      highlight: false
    },
    {
      id: 'premium',
      title: 'Premium',
      price: '$99',
      features: ['All Basic features', 'Group classes', 'Sauna access'],
      highlight: true
    },
    {
      id: 'elite',
      title: 'Elite',
      price: '$199',
      features: ['All Premium features', 'Personal training', 'Nutrition plan'],
      highlight: false
    }
  ];


  return (
    <div className="min-h-screen bg-gray-50">
      <Sidebar isCollapsed={isSidebarCollapsed} onToggle={() => setIsSidebarCollapsed(!isSidebarCollapsed)} />
      <div className={`transition-all duration-300 ${isSidebarCollapsed ? 'ml-20' : 'ml-64'}`}>
        <Topbar onToggleSidebar={() => setIsSidebarCollapsed(!isSidebarCollapsed)} isSidebarCollapsed={isSidebarCollapsed} />
        <main className="p-8">
          <div className="max-w-7xl mx-auto space-y-8">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Settings</h1>
              <p className="text-sm text-gray-500">Manage your gym preferences</p>
            </div>

            <Tabs defaultValue="general" className="space-y-6">
              <TabsList className="w-full justify-between bg-gray-100 p-1.5 rounded-full h-auto">
                <TabsTrigger
                  value="general"
                  className="flex-1 rounded-full py-2.5 text-sm data-[state=active]:bg-white data-[state=active]:shadow-sm"
                >
                  <SettingsIcon className="h-4 w-4 mr-2" />
                  General
                </TabsTrigger>
                <TabsTrigger
                  value="notifications"
                  className="flex-1 rounded-full py-2.5 text-sm data-[state=active]:bg-white data-[state=active]:shadow-sm"
                >
                  <Bell className="h-4 w-4 mr-2" />
                  Notifications
                </TabsTrigger>
                <TabsTrigger
                  value="security"
                  className="flex-1 rounded-full py-2.5 text-sm data-[state=active]:bg-white data-[state=active]:shadow-sm"
                >
                  <Shield className="h-4 w-4 mr-2" />
                  Security
                </TabsTrigger>
                <TabsTrigger
                  value="billing"
                  className="flex-1 rounded-full py-2.5 text-sm data-[state=active]:bg-white data-[state=active]:shadow-sm"
                >
                  <CreditCard className="h-4 w-4 mr-2" />
                  Billing
                </TabsTrigger>
                
              </TabsList>

              <TabsContent value="general" className="space-y-6">
                <Card className="border-gray-100 shadow-lg shadow-gray-100/40 rounded-3xl">
                  <CardHeader>
                    <CardTitle>Gym Information</CardTitle>
                    <CardDescription>Basic details about your gym</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-5">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="space-y-2">
                        <Label htmlFor="gym-name">Gym Name</Label>
                        <div className="relative">
                          <Input id="gym-name" placeholder="Iron Pulse Fitness" className="pl-9" />
                          <SettingsIcon className="h-4 w-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
                        </div>
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="gym-email">Email Address</Label>
                        <div className="relative">
                          <Input id="gym-email" placeholder="contact@ironpulse.com" className="pl-9" />
                          <Mail className="h-4 w-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
                        </div>
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="gym-phone">Phone Number</Label>
                        <div className="relative">
                          <Input id="gym-phone" placeholder="+1 234 567 8900" className="pl-9" />
                          <Phone className="h-4 w-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
                        </div>
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="gym-website">Website</Label>
                        <div className="relative">
                          <Input id="gym-website" placeholder="www.ironpulse.com" className="pl-9" />
                          <Globe className="h-4 w-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
                        </div>
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="gym-address">Address</Label>
                      <div className="relative">
                        <Input id="gym-address" placeholder="123 Fitness Street, New York, NY 10001" className="pl-9" />
                        <MapPin className="h-4 w-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card className="border-gray-100 shadow-lg shadow-gray-100/40 rounded-3xl">
                  <CardHeader>
                    <CardTitle>Operating Hours</CardTitle>
                    <CardDescription>Set opening and closing times</CardDescription>
                  </CardHeader>
                  <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <Label htmlFor="weekday-open">Weekday Opening</Label>
                      <div className="relative">
                        <Input id="weekday-open" placeholder="05:00 AM" className="pl-9" />
                        <Clock className="h-4 w-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="weekday-close">Weekday Closing</Label>
                      <div className="relative">
                        <Input id="weekday-close" placeholder="11:00 PM" className="pl-9" />
                        <Clock className="h-4 w-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="weekend-open">Weekend Opening</Label>
                      <div className="relative">
                        <Input id="weekend-open" placeholder="07:00 AM" className="pl-9" />
                        <Clock className="h-4 w-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="weekend-close">Weekend Closing</Label>
                      <div className="relative">
                        <Input id="weekend-close" placeholder="09:00 PM" className="pl-9" />
                        <Clock className="h-4 w-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <div className="flex justify-end">
                  <Button className="rounded-xl bg-[#00bc7d] hover:bg-[#00bc7d]/90 text-white shadow-lg shadow-[#00bc7d]/20">
                    Save Changes
                  </Button>
                </div>
              </TabsContent>

              <TabsContent value="notifications" className="space-y-6">
                <Card className="border-gray-100 shadow-lg shadow-gray-100/40 rounded-3xl">
                  <CardHeader>
                    <CardTitle>Email Notifications</CardTitle>
                    <CardDescription>Choose which emails you want to receive</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {notifications.email.map(item => (
                      <div key={item.id} className="flex items-center justify-between rounded-2xl border border-gray-100 bg-gray-50 px-4 py-3">
                        <div className="flex items-center gap-3">
                          <Mail className="h-4 w-4 text-gray-400" />
                          <span className="text-sm font-medium text-gray-700">{item.label}</span>
                        </div>
                        <Switch defaultChecked={item.enabled} />
                      </div>
                    ))}
                  </CardContent>
                </Card>

                <Card className="border-gray-100 shadow-lg shadow-gray-100/40 rounded-3xl">
                  <CardHeader>
                    <CardTitle>Push Notifications</CardTitle>
                    <CardDescription>Mobile and in-app alerts</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {notifications.push.map(item => (
                      <div key={item.id} className="flex items-center justify-between rounded-2xl border border-gray-100 bg-gray-50 px-4 py-3">
                        <div className="flex items-center gap-3">
                          <Bell className="h-4 w-4 text-gray-400" />
                          <span className="text-sm font-medium text-gray-700">{item.label}</span>
                        </div>
                        <Switch defaultChecked={item.enabled} />
                      </div>
                    ))}
                  </CardContent>
                </Card>

                <div className="flex justify-end">
                  <Button className="rounded-xl bg-[#00bc7d] hover:bg-[#00bc7d]/90 text-white shadow-lg shadow-[#00bc7d]/20">
                    Save Changes
                  </Button>
                </div>
              </TabsContent>

              <TabsContent value="security" className="space-y-6">
                <Card className="border-gray-100 shadow-lg shadow-gray-100/40 rounded-3xl">
                  <CardHeader>
                    <CardTitle>Change Password</CardTitle>
                    <CardDescription>Update your account password</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="current-password">Current Password</Label>
                      <Input id="current-password" type="password" />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="new-password">New Password</Label>
                      <Input id="new-password" type="password" />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="confirm-password">Confirm New Password</Label>
                      <Input id="confirm-password" type="password" />
                    </div>
                    <Button className="rounded-xl bg-[#00bc7d] hover:bg-[#00bc7d]/90 text-white shadow-lg shadow-[#00bc7d]/20">
                      Update Password
                    </Button>
                  </CardContent>
                </Card>

                <Card className="border-gray-100 shadow-lg shadow-gray-100/40 rounded-3xl">
                  <CardHeader>
                    <CardTitle>Two-Factor Authentication</CardTitle>
                    <CardDescription>Add an extra layer of security</CardDescription>
                  </CardHeader>
                  <CardContent className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-700">Enable 2FA</p>
                      <p className="text-xs text-gray-500">Protect your account with verification codes.</p>
                    </div>
                    <Switch />
                  </CardContent>
                </Card>

                <div className="flex justify-end">
                  <Button className="rounded-xl bg-[#00bc7d] hover:bg-[#00bc7d]/90 text-white shadow-lg shadow-[#00bc7d]/20">
                    Save Changes
                  </Button>
                </div>
              </TabsContent>

              <TabsContent value="billing" className="space-y-6">
                <Card className="border-gray-100 shadow-lg shadow-gray-100/40 rounded-3xl">
                  <CardHeader>
                    <CardTitle>Subscription Plans</CardTitle>
                    <CardDescription>Choose the best plan for your gym</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                      {plans.map(plan => (
                        <div
                          key={plan.id}
                          className={`rounded-2xl border p-5 ${plan.highlight ? 'border-[#00bc7d]' : 'border-gray-100'} bg-white shadow-sm`}
                        >
                          <div className="flex items-center justify-between">
                            <p className="text-lg font-semibold text-gray-900">{plan.title}</p>
                            {plan.highlight && (
                              <Badge className="bg-[#00bc7d]/10 text-[#00bc7d] border border-[#00bc7d]/20 text-xs">
                                Most Popular
                              </Badge>
                            )}
                          </div>
                          <div className="mt-4 flex items-baseline gap-1">
                            <span className="text-3xl font-bold text-gray-900">{plan.price}</span>
                            <span className="text-xs text-gray-500">/mo</span>
                          </div>
                          <ul className="mt-4 space-y-2 text-sm text-gray-600">
                            {plan.features.map(feature => (
                              <li key={feature} className="flex items-center gap-2">
                                <CheckCircle2 className="h-4 w-4 text-[#00bc7d]" />
                                {feature}
                              </li>
                            ))}
                          </ul>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>

                <div className="flex justify-end">
                  <Button className="rounded-xl bg-[#00bc7d] hover:bg-[#00bc7d]/90 text-white shadow-lg shadow-[#00bc7d]/20">
                    Save Changes
                  </Button>
                </div>
              </TabsContent>

              
            </Tabs>
          </div>
        </main>
      </div>
    </div>
  );
};

export default Settings;
