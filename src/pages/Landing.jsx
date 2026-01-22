import React, { useEffect, useState } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { base44 } from "@/api/base44Client";
import { useNavigate } from 'react-router-dom';
import { createPageUrl } from "@/utils";
import { Sparkles, Crown, ArrowRight, Film, Calendar, BarChart3, Trophy, CheckCircle2, Star } from "lucide-react";


export default function LandingPage() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  //const [showPricing, setShowPricing] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    checkAuthAndSubscription();
  }, []);

  const checkAuthAndSubscription = async () => {
      try {
        const currentUser = await base44.auth.me();
        setUser(currentUser);

        // Admin always goes to home
        if (currentUser.role === 'admin') {
          window.location.href = '/Home';
          return;
        }

        // Check if user has active subscription
        const subscriptions = await base44.entities.Subscription.filter({
          user_email: currentUser.email,
          status: ['trial', 'active']
        });

        if (subscriptions && subscriptions.length > 0) {
          // User has active subscription, redirect to Home
          window.location.href = '/Home';
          return;
        }

        // Authenticated user without subscription - show pricing
        setShowPricing(true);
      } catch (error) {
        // Not logged in - show landing page with CTA
        setShowPricing(false);
      } finally {
        setLoading(false);
      }
    };



    const handleLogin = () => {
      // Redirect to Base44 authentication (Google) and return to Landing
      base44.auth.redirectToLogin(window.location.origin + '/Landing');
    };

  if (loading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="text-white">Loading...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-black via-zinc-900 to-purple-900/20">
      {/* Hero Section */}
      <div className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-r from-purple-500/10 to-emerald-500/10 blur-3xl" />
        
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 sm:py-20">
          {/* Header */}
          <div className="flex items-center justify-between mb-12">
            <div className="flex items-center gap-3">
              <img 
                src="https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/693d661aca82e178be7bb96f/ab2cb46cf_IMG_0700.png"
                alt="CineTracker" 
                className="w-12 h-12 rounded-full border-2 border-emerald-500/50"
              />
              <h2 className="text-2xl font-bold bg-gradient-to-r from-amber-400 to-purple-400 bg-clip-text text-transparent">
                CineTracker
              </h2>
            </div>
            
            {!user && (
              <Button onClick={handleLogin} variant="outline" className="text-white border-zinc-700 hover:bg-zinc-800">
                Login
              </Button>
            )}
          </div>

          {/* Hero Content */}
          <div className="text-center max-w-4xl mx-auto mb-16">
            <Badge className="mb-4 bg-purple-500/20 text-purple-300 border border-purple-500/30">
              <Sparkles className="w-3 h-3 mr-1" />
              Your Personal Media Companion
            </Badge>
            
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-white mb-6 leading-tight">
              Track Every Movie, Series & Book
              <span className="block mt-2 bg-gradient-to-r from-purple-400 via-emerald-400 to-amber-400 bg-clip-text text-transparent">
                Never Miss a Moment
              </span>
            </h1>
            
            <p className="text-lg sm:text-xl text-zinc-400 mb-8 max-w-2xl mx-auto">
              Organize your watchlist, schedule viewing sessions, track progress, and celebrate achievements. 
              The ultimate platform for serious entertainment enthusiasts.
            </p>

            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button 
                onClick={() => navigate(createPageUrl('Pricing'))}
                size="lg"
                className="bg-gradient-to-r from-purple-500 to-emerald-500 hover:from-purple-600 hover:to-emerald-600 text-white text-lg px-8 py-6"
              >
                <Crown className="w-5 h-5 mr-2" />
                View Plans
                <ArrowRight className="w-5 h-5 ml-2" />
              </Button>
              
              {!user && (
                <Button 
                  onClick={handleLogin}
                  size="lg"
                  variant="outline"
                  className="text-white border-zinc-700 hover:bg-zinc-800 text-lg px-8 py-6"
                >
                  Login
                </Button>
              )}
            </div>

            <p className="text-sm text-zinc-500 mt-4">
              7-day free trial • No credit card required
            </p>
          </div>

          {/* Feature Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-16">
            {[
              { icon: Film, title: "Smart Library", desc: "Organize movies, series & books" },
              { icon: Calendar, title: "Schedule Viewing", desc: "Plan your entertainment" },
              { icon: BarChart3, title: "Deep Analytics", desc: "Track viewing patterns" },
              { icon: Trophy, title: "Achievements", desc: "Unlock milestones" }
            ].map((feature, idx) => (
              <Card key={idx} className="bg-zinc-900/50 border-zinc-800 hover:border-purple-500/50 transition-all">
                <CardContent className="p-6 text-center">
                  <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-emerald-500 rounded-full flex items-center justify-center mx-auto mb-4">
                    <feature.icon className="w-6 h-6 text-white" />
                  </div>
                  <h3 className="text-white font-semibold mb-2">{feature.title}</h3>
                  <p className="text-sm text-zinc-400">{feature.desc}</p>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Features Detail */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 mb-16">
            <div>
              <h3 className="text-2xl font-bold text-white mb-6">Why CineTracker?</h3>
              <div className="space-y-4">
                {[
                  "Never forget what to watch next",
                  "Schedule viewing with friends & family",
                  "Track your reading & watching progress",
                  "Discover patterns in your entertainment",
                  "Unlock achievements as you watch",
                  "Beautiful illustrated book reader"
                ].map((item, idx) => (
                  <div key={idx} className="flex items-start gap-3">
                    <CheckCircle2 className="w-5 h-5 text-emerald-400 flex-shrink-0 mt-0.5" />
                    <span className="text-zinc-300">{item}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="bg-zinc-900/50 border border-zinc-800 rounded-2xl p-8">
              <Star className="w-10 h-10 text-amber-400 mb-4" />
              <blockquote className="text-white text-lg mb-4">
                "Finally, a tool that helps me organize my massive watchlist and actually finish what I start!"
              </blockquote>
              <p className="text-zinc-400">— Entertainment Enthusiast</p>
            </div>
          </div>

          {/* CTA Section */}
          <div className="bg-gradient-to-r from-purple-900/50 to-emerald-900/50 border border-purple-500/30 rounded-2xl p-8 sm:p-12 text-center">
            <h2 className="text-3xl font-bold text-white mb-4">Ready to Get Started?</h2>
            <p className="text-zinc-300 mb-6 max-w-2xl mx-auto">
              Join thousands of users organizing their entertainment life. View our plans and start your journey today.
            </p>
            <Button 
              onClick={() => navigate(createPageUrl('Pricing'))}
              size="lg"
              className="bg-gradient-to-r from-purple-500 to-emerald-500 hover:from-purple-600 hover:to-emerald-600 text-white text-lg px-12 py-6"
            >
              <Crown className="w-5 h-5 mr-2" />
              View Plans & Pricing
              <ArrowRight className="w-5 h-5 ml-2" />
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}