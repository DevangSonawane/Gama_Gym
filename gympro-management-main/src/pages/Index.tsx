// This is a template for the welcome page, you must rewrite this file to your own homepage
import React from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Sparkles, Dumbbell, ShieldCheck, BarChart3 } from 'lucide-react';

export default function WelcomePage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-background to-secondary">
      <header className="relative overflow-hidden">
        <div className="absolute inset-0 opacity-20 bg-brand-gradient-br" />
        <div className="container mx-auto px-6 pt-24 pb-16 relative">
          <div className="max-w-3xl mx-auto text-center space-y-6">
            <div className="inline-flex items-center gap-2 rounded-full px-3 py-1 bg-white/60 backdrop-blur-xl border border-white/20 shadow-sm">
              <Sparkles className="h-4 w-4 text-brand-gradient" />
              <span className="text-xs font-medium text-muted-foreground">Premium gym management</span>
            </div>
            <h1 className="text-5xl md:text-6xl font-extrabold tracking-tight text-brand-gradient">
              Elevate your gym experience
            </h1>
            <p className="text-lg md:text-xl text-muted-foreground">
              Modern, fast, and beautiful. Manage members, classes, payments, and analytics with a unified premium interface.
            </p>
            <div className="flex items-center justify-center gap-3 pt-2">
              <Button variant="brand" size="lg" className="rounded-full px-8">
                Get Started
              </Button>
              <Button variant="outline" size="lg" className="rounded-full">
                Learn More
              </Button>
            </div>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-6 pb-24">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card className="glass-surface rounded-2xl">
            <CardHeader className="flex-row items-center justify-between">
              <CardTitle className="text-xl">Member-first design</CardTitle>
              <Dumbbell className="h-5 w-5 text-brand-gradient" />
            </CardHeader>
            <CardContent>
              <CardDescription>
                Smooth onboarding, rich profiles, and delightful interactions powered by a consistent gradient aesthetic.
              </CardDescription>
            </CardContent>
          </Card>

          <Card className="glass-surface rounded-2xl">
            <CardHeader className="flex-row items-center justify-between">
              <CardTitle className="text-xl">Secure payments</CardTitle>
              <ShieldCheck className="h-5 w-5 text-brand-gradient" />
            </CardHeader>
            <CardContent>
              <CardDescription>
                Unified payment flows with clear statuses and premium UI feedback for confidence at checkout.
              </CardDescription>
            </CardContent>
          </Card>

          <Card className="glass-surface rounded-2xl">
            <CardHeader className="flex-row items-center justify-between">
              <CardTitle className="text-xl">Actionable analytics</CardTitle>
              <BarChart3 className="h-5 w-5 text-brand-gradient" />
            </CardHeader>
            <CardContent>
              <CardDescription>
                Beautiful dashboards with consistent colors and typography that make trends immediately clear.
              </CardDescription>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
}
