import React, { useState } from 'react';
import { supabase } from '@/api/supabaseClient'; // Direct supabase usage for auth UI
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardHeader, CardContent, CardFooter, CardTitle, CardDescription } from '@/components/ui/card';
import { useToast } from '@/components/ui/use-toast';

const Login = () => {
    const [email, setEmail] = useState('');
    const [loading, setLoading] = useState(false);

    const { toast } = useToast();

    const handleLogin = async (e) => {
        e.preventDefault();
        setLoading(true);

        try {
            // Magic Link Login
            const { error } = await supabase.auth.signInWithOtp({
                email,
                options: {
                    emailRedirectTo: window.location.origin,
                },
            });

            if (error) throw error;

            toast({
                title: "Magic Link Sent!",
                description: "Check your email for the login link.",
            });
        } catch (error) {
            toast({
                title: "Error",
                description: error.message || "Failed to sign in",
                variant: "destructive",
            });
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="flex items-center justify-center min-h-screen bg-zinc-950 p-4">
            <Card className="w-full max-w-md bg-zinc-900 border-zinc-800 text-zinc-100">
                <CardHeader>
                    <CardTitle className="text-2xl text-center text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-emerald-400">
                        CineTracker Login
                    </CardTitle>
                    <CardDescription className="text-center text-zinc-400">
                        Sign in to your shared database account
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    {/* Role tabs removed for single login flow */}

                    <form onSubmit={handleLogin} className="space-y-4">
                        <div className="space-y-2">
                            <label htmlFor="email" className="text-sm font-medium text-zinc-300">Email Address</label>
                            <Input
                                id="email"
                                type="email"
                                placeholder="you@example.com"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                required
                                className="bg-zinc-800 border-zinc-700 text-white placeholder:text-zinc-500 focus:ring-purple-500"
                            />
                        </div>
                        <Button
                            type="submit"
                            className="w-full bg-gradient-to-r from-purple-600 to-emerald-600 hover:from-purple-700 hover:to-emerald-700 text-white border-0"
                            disabled={loading}
                        >
                            {loading ? 'Sending Link...' : 'Send Magic Link'}
                        </Button>
                    </form>


                </CardContent>
            </Card>
        </div>
    );
};

export default Login;
