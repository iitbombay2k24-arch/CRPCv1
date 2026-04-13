import React, { useState } from 'react';
import { loginUser, registerUser } from '../services/authService';
import useAuthStore from '../store/authStore';
import useNotificationStore from '../store/notificationStore';
import Button from '../components/ui/Button';
import Input from '../components/ui/Input';
import Card from '../components/ui/Card';
import { isValidDomain } from '../lib/rbac';
import { Lock, Mail, User, GraduationCap, Briefcase } from 'lucide-react';

export default function AuthPage() {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [prn, setPrn] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  
  const { setUser, setFirebaseUser } = useAuthStore();
  const { success, error } = useNotificationStore();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      if (isLogin) {
        const userProfile = await loginUser(email, password);
        if (userProfile) {
          setUser(userProfile);
          success('Welcome back!');
        }
      } else {
        // Registration validation
        if (!isValidDomain(email)) {
          error('Please use your @dypiuinternational.ac.in email', 'Domain Restricted');
          setIsLoading(false);
          return;
        }

        if (password.length < 8) {
          error('Password must be at least 8 characters long');
          setIsLoading(false);
          return;
        }

        const userProfile = await registerUser({
          email,
          password,
          name,
          prn,
          role: 'Student' // Default to Student for registration
        });
        
        setUser(userProfile);
        success('Account created successfully! Please verify your email.', 'Registration Successful');
      }
    } catch (err) {
      error(err.message || 'Authentication failed');
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 flex items-center justify-center p-4 relative overflow-hidden">
      {/* Background Decorative Elements */}
      <div className="absolute top-0 -left-1/4 w-1/2 h-1/2 bg-indigo-600/10 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute bottom-0 -right-1/4 w-1/2 h-1/2 bg-purple-600/10 rounded-full blur-[120px] pointer-events-none" />

      <Card variant="elevated" className="w-full max-w-md animate-slide-up" padding="lg">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-indigo-600/20 rounded-2xl mb-4 animate-pulse-glow">
            <GraduationCap className="text-indigo-400" size={32} />
          </div>
          <h1 className="text-2xl font-bold text-white tracking-tight">
            {isLogin ? 'Welcome Back' : 'Join DYPIU Collab'}
          </h1>
          <p className="text-slate-400 text-sm mt-2">
            {isLogin ? 'Sign in to your academic super-app' : 'Create your account with university email'}
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {!isLogin && (
            <>
              <Input 
                label="Full Name" 
                placeholder="Ex: John Doe" 
                leftIcon={User}
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
              />
              <Input 
                label="PRN Number (Optional)" 
                placeholder="Ex: 2021010..." 
                leftIcon={Briefcase}
                value={prn}
                onChange={(e) => setPrn(e.target.value)}
              />
            </>
          )}
          
          <Input 
            label="University Email" 
            type="email" 
            placeholder="name.last@dypiuinternational.ac.in" 
            leftIcon={Mail}
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            helperText="Only @dypiuinternational.ac.in emails are allowed"
          />
          
          <Input 
            label="Password" 
            type="password" 
            placeholder="••••••••" 
            leftIcon={Lock}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />

          {isLogin && (
            <div className="flex justify-end">
              <button type="button" className="text-xs text-indigo-400 hover:text-indigo-300 font-medium transition-colors">
                Forgot password?
              </button>
            </div>
          )}

          <Button 
            type="submit" 
            className="w-full" 
            loading={isLoading}
            size="lg"
          >
            {isLogin ? 'Sign In' : 'Create Account'}
          </Button>
        </form>

        <div className="mt-8 text-center">
          <p className="text-sm text-slate-500">
            {isLogin ? "Don't have an account?" : "Already have an account?"}{' '}
            <button 
              onClick={() => setIsLogin(!isLogin)}
              className="text-indigo-400 hover:text-indigo-300 font-bold transition-colors"
            >
              {isLogin ? 'Sign Up' : 'Sign In'}
            </button>
          </p>
        </div>
      </Card>
      
      {/* Bottom Footer Info */}
      <p className="absolute bottom-8 left-1/2 -translate-x-1/2 text-slate-600 text-[10px] font-medium uppercase tracking-widest whitespace-nowrap">
        Security First • Collaboration Focused • Enterprise Grade
      </p>
    </div>
  );
}
