'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { TrendingUp, Mail, Lock, User, Eye, EyeOff, AlertCircle, CheckCircle } from 'lucide-react';
import { useAuth } from '@/hooks/use-auth';

export default function LoginPage() {
  const router = useRouter();
  const { login, register: authRegister } = useAuth();
  const [activeTab, setActiveTab] = useState('login');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // Login form state
  const [loginForm, setLoginForm] = useState({
    identifier: '', // email or username
    password: '',
  });

  // Register form state
  const [registerForm, setRegisterForm] = useState({
    email: '',
    username: '',
    password: '',
    confirmPassword: '',
    name: '',
  });

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const result = await login(loginForm.identifier, loginForm.password);

      if (!result.success) {
        setError(result.error || 'حدث خطأ أثناء تسجيل الدخول');
        return;
      }

      setSuccess('تم تسجيل الدخول بنجاح! جاري التحويل...');

      setTimeout(() => {
        router.push('/');
      }, 1000);
    } catch {
      setError('حدث خطأ في الاتصال بالخادم');
    } finally {
      setLoading(false);
    }
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    // Validate passwords match
    if (registerForm.password !== registerForm.confirmPassword) {
      setError('كلمات المرور غير متطابقة');
      return;
    }

    // Validate username length
    if (registerForm.username.length < 6) {
      setError('اسم المستخدم يجب أن يكون 6 أحرف على الأقل');
      return;
    }

    // Validate username format
    if (!/^[a-zA-Z0-9_]+$/.test(registerForm.username)) {
      setError('اسم المستخدم يجب أن يحتوي على أحرف إنجليزية وأرقام فقط');
      return;
    }

    // Validate password length
    if (registerForm.password.length < 8) {
      setError('كلمة المرور يجب أن تكون 8 أحرف على الأقل');
      return;
    }

    setLoading(true);

    try {
      const result = await authRegister(registerForm.email, registerForm.username, registerForm.password, registerForm.name || undefined);

      if (!result.success) {
        setError(result.error || 'حدث خطأ أثناء إنشاء الحساب');
        return;
      }

      setSuccess('تم إنشاء الحساب بنجاح! جاري التحويل...');

      setTimeout(() => {
        router.push('/');
      }, 1000);
    } catch {
      setError('حدث خطأ في الاتصال بالخادم');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-primary/5 flex items-center justify-center p-4" dir="rtl">
      {/* Background Pattern */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-primary/10 rounded-full blur-3xl" />
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-primary/5 rounded-full blur-3xl" />
      </div>

      <div className="relative w-full max-w-md">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center gap-3 mb-4">
            <div className="flex h-14 w-14 items-center justify-center rounded-xl gradient-gold shadow-lg">
              <TrendingUp className="h-8 w-8 text-white" />
            </div>
            <div className="text-right">
              <h1 className="text-2xl font-bold">Portfolio Pro</h1>
              <p className="text-sm text-muted-foreground">نظام إدارة الاستثمار</p>
            </div>
          </div>
        </div>

        {/* Auth Card */}
        <Card className="border-primary/20 shadow-xl">
          <CardHeader className="text-center pb-4">
            <CardTitle className="text-xl">مرحباً بك</CardTitle>
            <CardDescription>
              سجل دخولك أو أنشئ حساباً جديداً
            </CardDescription>
          </CardHeader>
          <CardContent>
            {/* Error Alert */}
            {error && (
              <Alert variant="destructive" className="mb-4">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            {/* Success Alert */}
            {success && (
              <Alert className="mb-4 border-green-500 bg-green-50 text-green-800">
                <CheckCircle className="h-4 w-4 text-green-500" />
                <AlertDescription>{success}</AlertDescription>
              </Alert>
            )}

            <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
              <TabsList className="grid w-full grid-cols-2 mb-6">
                <TabsTrigger value="login">تسجيل الدخول</TabsTrigger>
                <TabsTrigger value="register">حساب جديد</TabsTrigger>
              </TabsList>

              {/* Login Tab */}
              <TabsContent value="login">
                <form onSubmit={handleLogin} className="space-y-4">
                  <p className="text-sm text-muted-foreground mb-2">
                    ادخل اسم المستخدم أو البريد الإلكتروني وكلمة المرور
                  </p>
                  <div className="space-y-2">
                    <Label htmlFor="login-identifier">اسم المستخدم أو البريد الإلكتروني</Label>
                    <div className="relative">
                      <User className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <Input
                        id="login-identifier"
                        type="text"
                        placeholder="اسم المستخدم أو البريد الإلكتروني"
                        value={loginForm.identifier}
                        onChange={(e) => setLoginForm({ ...loginForm, identifier: e.target.value })}
                        className="pr-10"
                        required
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="login-password">كلمة المرور</Label>
                    <div className="relative">
                      <Lock className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <Input
                        id="login-password"
                        type={showPassword ? 'text' : 'password'}
                        placeholder="••••••••"
                        value={loginForm.password}
                        onChange={(e) => setLoginForm({ ...loginForm, password: e.target.value })}
                        className="pr-10 pl-10"
                        required
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                      >
                        {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </button>
                    </div>
                  </div>

                  <Button type="submit" className="w-full" disabled={loading}>
                    {loading ? 'جاري التحقق...' : 'تسجيل الدخول'}
                  </Button>
                </form>
              </TabsContent>

              {/* Register Tab */}
              <TabsContent value="register">
                <form onSubmit={handleRegister} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="register-name">الاسم (اختياري)</Label>
                    <div className="relative">
                      <User className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <Input
                        id="register-name"
                        type="text"
                        placeholder="الاسم الكامل"
                        value={registerForm.name}
                        onChange={(e) => setRegisterForm({ ...registerForm, name: e.target.value })}
                        className="pr-10"
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="register-username">اسم المستخدم</Label>
                    <div className="relative">
                      <User className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <Input
                        id="register-username"
                        type="text"
                        placeholder="username"
                        value={registerForm.username}
                        onChange={(e) => setRegisterForm({ ...registerForm, username: e.target.value })}
                        className="pr-10"
                        required
                        minLength={6}
                        maxLength={20}
                      />
                    </div>
                    <p className="text-xs text-muted-foreground">6-20 حرف، أحرف إنجليزية وأرقام فقط</p>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="register-email">البريد الإلكتروني</Label>
                    <div className="relative">
                      <Mail className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <Input
                        id="register-email"
                        type="email"
                        placeholder="example@email.com"
                        value={registerForm.email}
                        onChange={(e) => setRegisterForm({ ...registerForm, email: e.target.value })}
                        className="pr-10"
                        required
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="register-password">كلمة المرور</Label>
                    <div className="relative">
                      <Lock className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <Input
                        id="register-password"
                        type={showPassword ? 'text' : 'password'}
                        placeholder="••••••••"
                        value={registerForm.password}
                        onChange={(e) => setRegisterForm({ ...registerForm, password: e.target.value })}
                        className="pr-10 pl-10"
                        required
                        minLength={8}
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                      >
                        {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </button>
                    </div>
                    <p className="text-xs text-muted-foreground">8 أحرف على الأقل</p>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="register-confirm">تأكيد كلمة المرور</Label>
                    <div className="relative">
                      <Lock className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <Input
                        id="register-confirm"
                        type="password"
                        placeholder="••••••••"
                        value={registerForm.confirmPassword}
                        onChange={(e) => setRegisterForm({ ...registerForm, confirmPassword: e.target.value })}
                        className="pr-10"
                        required
                      />
                    </div>
                  </div>

                  <Button type="submit" className="w-full" disabled={loading}>
                    {loading ? 'جاري إنشاء الحساب...' : 'إنشاء حساب'}
                  </Button>
                </form>
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>

        {/* Footer */}
        <p className="text-center text-xs text-muted-foreground mt-6">
          بالمتابعة، أنت توافق على شروط الاستخدام وسياسة الخصوصية
        </p>
      </div>
    </div>
  );
}
