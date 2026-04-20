'use client';

import { Sidebar } from '@/components/layout/Sidebar';
import { TopBar } from '@/components/layout/TopBar';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Input } from '@/components/ui/input';
import {
  User,
  Target,
  Briefcase,
  Bell,
  Shield,
  CheckCircle,
  Circle,
  ChevronLeft,
  ChevronRight,
  Rocket,
  Wallet,
  Brain,
  Star,
  Sparkles,
  Award,
  Database,
  Key,
  Bot,
} from 'lucide-react';
import { useState } from 'react';

// خطوات المعالج
const steps = [
  { id: 1, title: 'المعلومات الشخصية', icon: User, description: 'أدخل معلوماتك الأساسية' },
  { id: 2, title: 'أهداف الاستثمار', icon: Target, description: 'حدد أهدافك المالية' },
  { id: 3, title: 'إعداد المحفظة', icon: Briefcase, description: 'أنشئ محفظتك الأولى' },
  { id: 4, title: 'البيانات و AI', icon: Database, description: 'ربط واجهات API' },
  { id: 5, title: 'التنبيهات', icon: Bell, description: 'إعدادات الإشعارات' },
  { id: 6, title: 'الأمان', icon: Shield, description: 'تأمين حسابك' },
];

// خيارات الأهداف
const investmentGoals = [
  { id: 'growth', title: 'نمو رأس المال', description: 'التركيز على الأسهم ذات النمو العالي', icon: '📈' },
  { id: 'income', title: 'الدخل المنتظم', description: 'التركيز على التوزيعات والعوائد', icon: '💰' },
  { id: 'balanced', title: 'محفظة متوازنة', description: 'توازن بين النمو والدخل', icon: '⚖️' },
  { id: 'sharia', title: 'استثمار شرعي', description: 'الأسهم والصناديق المتوافقة شرعاً', icon: '☪️' },
];

// مستويات المخاطرة
const riskLevels = [
  { id: 'low', title: 'منخفض', description: 'أفضل الأمان على العائد المرتفع', color: 'bg-green-500' },
  { id: 'medium', title: 'متوسط', description: 'توازن بين المخاطرة والعائد', color: 'bg-yellow-500' },
  { id: 'high', title: 'مرتفع', description: 'أقبل المخاطرة مقابل عوائد أعلى', color: 'bg-red-500' },
];

// خيارات التنبيهات
const alertOptions = [
  { id: 'price', title: 'تنبيهات الأسعار', description: 'إشعارات عند وصول السهم للسعر المستهدف' },
  { id: 'news', title: 'أخبار السوق', description: 'تحديثات أخبار الأسهم والمحفظة' },
  { id: 'dividends', title: 'التوزيعات', description: 'تذكير بمواعيد التوزيعات' },
  { id: 'performance', title: 'أداء المحفظة', description: 'تقارير دورية عن أداء محفظتك' },
];

export default function OnboardingPage() {
  const [currentStep, setCurrentStep] = useState(1);
  const [completedSteps, setCompletedSteps] = useState<number[]>([]);

  // بيانات النموذج
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    goals: [] as string[],
    riskLevel: '',
    initialInvestment: '',
    apiKeys: {
      alpha_vantage: '',
      openai: '',
    },
    alerts: [] as string[],
    twoFactor: false,
    biometric: false,
  });

  const progress = ((completedSteps.length / steps.length) * 100);

  const isStepCompleted = (stepId: number) => completedSteps.includes(stepId);

  const handleNext = () => {
    if (!completedSteps.includes(currentStep)) {
      setCompletedSteps([...completedSteps, currentStep]);
    }
    if (currentStep < steps.length) {
      setCurrentStep(currentStep + 1);
    }
  };

  const handlePrev = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  const toggleGoal = (goalId: string) => {
    setFormData(prev => ({
      ...prev,
      goals: prev.goals.includes(goalId)
        ? prev.goals.filter(g => g !== goalId)
        : [...prev.goals, goalId]
    }));
  };

  const toggleAlert = (alertId: string) => {
    setFormData(prev => ({
      ...prev,
      alerts: prev.alerts.includes(alertId)
        ? prev.alerts.filter(a => a !== alertId)
        : [...prev.alerts, alertId]
    }));
  };

  const renderStepContent = () => {
    switch (currentStep) {
      case 1:
        return (
          <div className="space-y-6">
            <div className="text-center mb-8">
              <div className="flex h-16 w-16 mx-auto items-center justify-center rounded-2xl bg-gradient-to-br from-blue-500 to-cyan-600 shadow-lg mb-4">
                <User className="h-8 w-8 text-white" />
              </div>
              <h2 className="text-2xl font-bold">مرحباً بك! 🎉</h2>
              <p className="text-muted-foreground mt-2">أدخل معلوماتك الأساسية للبدء</p>
            </div>

            <div className="grid gap-4 max-w-md mx-auto">
              <div className="space-y-2">
                <label className="text-sm font-medium">الاسم الكامل</label>
                <Input
                  placeholder="أدخل اسمك الكامل"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">البريد الإلكتروني</label>
                <Input
                  type="email"
                  placeholder="example@email.com"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">رقم الجوال</label>
                <Input
                  type="tel"
                  placeholder="05xxxxxxxx"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                />
              </div>
            </div>
          </div>
        );

      case 2:
        return (
          <div className="space-y-6">
            <div className="text-center mb-8">
              <div className="flex h-16 w-16 mx-auto items-center justify-center rounded-2xl bg-gradient-to-br from-purple-500 to-violet-600 shadow-lg mb-4">
                <Target className="h-8 w-8 text-white" />
              </div>
              <h2 className="text-2xl font-bold">أهدافك الاستثمارية</h2>
              <p className="text-muted-foreground mt-2">حدد ما تسعى لتحقيقه من الاستثمار</p>
            </div>

            <div className="grid gap-4 max-w-2xl mx-auto">
              <div className="space-y-3">
                <label className="text-sm font-medium">اختر أهدافك (يمكنك اختيار أكثر من هدف)</label>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {investmentGoals.map((goal) => (
                    <Card
                      key={goal.id}
                      className={`border-2 cursor-pointer transition-all ${formData.goals.includes(goal.id)
                          ? 'border-primary bg-primary/5'
                          : 'hover:border-primary/50'
                        }`}
                      onClick={() => toggleGoal(goal.id)}
                    >
                      <CardContent className="p-4">
                        <div className="flex items-center gap-3">
                          <span className="text-2xl">{goal.icon}</span>
                          <div>
                            <p className="font-medium">{goal.title}</p>
                            <p className="text-xs text-muted-foreground">{goal.description}</p>
                          </div>
                          {formData.goals.includes(goal.id) && (
                            <CheckCircle className="h-5 w-5 text-primary mr-auto" />
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>

              <div className="space-y-3">
                <label className="text-sm font-medium">مستوى تحمل المخاطرة</label>
                <div className="grid grid-cols-3 gap-3">
                  {riskLevels.map((level) => (
                    <Card
                      key={level.id}
                      className={`border-2 cursor-pointer transition-all ${formData.riskLevel === level.id
                          ? 'border-primary bg-primary/5'
                          : 'hover:border-primary/50'
                        }`}
                      onClick={() => setFormData({ ...formData, riskLevel: level.id })}
                    >
                      <CardContent className="p-4 text-center">
                        <div className={`h-3 w-3 rounded-full ${level.color} mx-auto mb-2`} />
                        <p className="font-medium">{level.title}</p>
                        <p className="text-xs text-muted-foreground mt-1">{level.description}</p>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>

              <div className="space-y-2 max-w-xs mx-auto">
                <label className="text-sm font-medium">رأس المال الأولي (اختياري)</label>
                <Input
                  type="number"
                  placeholder="مثال: 100000"
                  value={formData.initialInvestment}
                  onChange={(e) => setFormData({ ...formData, initialInvestment: e.target.value })}
                />
              </div>
            </div>
          </div>
        );

      case 3:
        return (
          <div className="space-y-6">
            <div className="text-center mb-8">
              <div className="flex h-16 w-16 mx-auto items-center justify-center rounded-2xl bg-gradient-to-br from-amber-500 to-orange-600 shadow-lg mb-4">
                <Briefcase className="h-8 w-8 text-white" />
              </div>
              <h2 className="text-2xl font-bold">إعداد المحفظة</h2>
              <p className="text-muted-foreground mt-2">أنشئ محفظتك الاستثمارية الأولى</p>
            </div>

            <div className="grid gap-6 max-w-2xl mx-auto">
              <Card className="border-2 border-dashed">
                <CardContent className="p-8 text-center">
                  <Wallet className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                  <h3 className="font-bold text-lg">إنشاء محفظة جديدة</h3>
                  <p className="text-sm text-muted-foreground mt-2 mb-4">
                    أدخل اسم محفظتك الأولى وابدأ بتتبع استثماراتك
                  </p>
                  <Input
                    placeholder="اسم المحفظة (مثال: المحفظة الرئيسية)"
                    className="max-w-xs mx-auto"
                  />
                  <Button className="mt-4 gap-2">
                    <Sparkles className="h-4 w-4" />
                    إنشاء المحفظة
                  </Button>
                </CardContent>
              </Card>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Card className="border-2 hover:border-primary/50 transition-colors cursor-pointer">
                  <CardContent className="p-4">
                    <Brain className="h-8 w-8 text-purple-500 mb-3" />
                    <h4 className="font-bold">اقتراحات AI</h4>
                    <p className="text-sm text-muted-foreground mt-1">
                      دع الذكاء الاصطناعي يقترح عليك أسهم مناسبة
                    </p>
                  </CardContent>
                </Card>
                <Card className="border-2 hover:border-primary/50 transition-colors cursor-pointer">
                  <CardContent className="p-4">
                    <Star className="h-8 w-8 text-yellow-500 mb-3" />
                    <h4 className="font-bold">الأسهم المميزة</h4>
                    <p className="text-sm text-muted-foreground mt-1">
                      استكشف الأسهم الأكثر متابعة
                    </p>
                  </CardContent>
                </Card>
              </div>
            </div>
          </div>
        );

      case 4:
        return (
          <div className="space-y-6">
            <div className="text-center mb-8">
              <div className="flex h-16 w-16 mx-auto items-center justify-center rounded-2xl bg-gradient-to-br from-indigo-500 to-purple-600 shadow-lg mb-4">
                <Database className="h-8 w-8 text-white" />
              </div>
              <h2 className="text-2xl font-bold">مزودي البيانات والذكاء الاصطناعي</h2>
              <p className="text-muted-foreground mt-2">عزز محفظتك بالبيانات الحية والتحليلات الذكية (خطوة اختيارية)</p>
            </div>

            <div className="grid gap-6 max-w-2xl mx-auto">
              <Card className="border-2 transition-colors">
                <CardHeader className="pb-3">
                  <CardTitle className="text-base flex items-center gap-2">
                    <Key className="h-5 w-5 text-indigo-500" />
                    مزود أسعار السوق (Alpha Vantage)
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground mb-4">
                    للحصول على أسعار الأسهم العالمية والمؤشرات بشكل حي، يرجى إدخال مفتاح API الخاص بك.
                  </p>
                  <Input
                    type="password"
                    placeholder="أدخل مفتاح Alpha Vantage..."
                    value={formData.apiKeys.alpha_vantage}
                    onChange={(e) => setFormData({ ...formData, apiKeys: { ...formData.apiKeys, alpha_vantage: e.target.value } })}
                    dir="ltr"
                  />
                </CardContent>
              </Card>

              <Card className="border-2 transition-colors">
                <CardHeader className="pb-3">
                  <CardTitle className="text-base flex items-center gap-2">
                    <Bot className="h-5 w-5 text-purple-500" />
                    مزود الذكاء الاصطناعي (OpenAI)
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground mb-4">
                    للحصول على تحليلات ذكية ومخصصة لمحفظتك، قم بإدخال مفتاح OpenAI الخاص بك.
                  </p>
                  <Input
                    type="password"
                    placeholder="sk-..."
                    value={formData.apiKeys.openai}
                    onChange={(e) => setFormData({ ...formData, apiKeys: { ...formData.apiKeys, openai: e.target.value } })}
                    dir="ltr"
                  />
                </CardContent>
              </Card>

              <div className="text-center text-sm text-muted-foreground">
                يمكنك تخطي هذه الخطوة وإعداد المفاتيح لاحقاً من صفحة الإعدادات
              </div>
            </div>
          </div>
        );

      case 5:
        return (
          <div className="space-y-6">
            <div className="text-center mb-8">
              <div className="flex h-16 w-16 mx-auto items-center justify-center rounded-2xl bg-gradient-to-br from-green-500 to-emerald-600 shadow-lg mb-4">
                <Bell className="h-8 w-8 text-white" />
              </div>
              <h2 className="text-2xl font-bold">إعدادات التنبيهات</h2>
              <p className="text-muted-foreground mt-2">اختر الإشعارات التي تريد تلقيها</p>
            </div>

            <div className="grid gap-3 max-w-md mx-auto">
              {alertOptions.map((alert) => (
                <Card
                  key={alert.id}
                  className={`border-2 cursor-pointer transition-all ${formData.alerts.includes(alert.id)
                      ? 'border-primary bg-primary/5'
                      : 'hover:border-primary/50'
                    }`}
                  onClick={() => toggleAlert(alert.id)}
                >
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className={`flex h-8 w-8 items-center justify-center rounded-lg ${formData.alerts.includes(alert.id)
                            ? 'bg-primary text-primary-foreground'
                            : 'bg-muted'
                          }`}>
                          {formData.alerts.includes(alert.id) ? (
                            <CheckCircle className="h-4 w-4" />
                          ) : (
                            <Circle className="h-4 w-4" />
                          )}
                        </div>
                        <div>
                          <p className="font-medium">{alert.title}</p>
                          <p className="text-xs text-muted-foreground">{alert.description}</p>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>

            <div className="text-center text-sm text-muted-foreground">
              يمكنك تغيير هذه الإعدادات لاحقاً من صفحة الإعدادات
            </div>
          </div>
        );

      case 6:
        return (
          <div className="space-y-6">
            <div className="text-center mb-8">
              <div className="flex h-16 w-16 mx-auto items-center justify-center rounded-2xl bg-gradient-to-br from-red-500 to-rose-600 shadow-lg mb-4">
                <Shield className="h-8 w-8 text-white" />
              </div>
              <h2 className="text-2xl font-bold">تأمين حسابك</h2>
              <p className="text-muted-foreground mt-2">حماية إضافية لحسابك الاستثماري</p>
            </div>

            <div className="grid gap-4 max-w-md mx-auto">
              <Card
                className={`border-2 cursor-pointer transition-all ${formData.twoFactor
                    ? 'border-primary bg-primary/5'
                    : 'hover:border-primary/50'
                  }`}
                onClick={() => setFormData({ ...formData, twoFactor: !formData.twoFactor })}
              >
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className={`flex h-10 w-10 items-center justify-center rounded-xl ${formData.twoFactor ? 'bg-primary text-primary-foreground' : 'bg-muted'
                        }`}>
                        <Shield className="h-5 w-5" />
                      </div>
                      <div>
                        <p className="font-bold">المصادقة الثنائية</p>
                        <p className="text-xs text-muted-foreground">حماية إضافية باستخدام رمز التحقق</p>
                      </div>
                    </div>
                    {formData.twoFactor && <CheckCircle className="h-5 w-5 text-primary" />}
                  </div>
                </CardContent>
              </Card>

              <Card
                className={`border-2 cursor-pointer transition-all ${formData.biometric
                    ? 'border-primary bg-primary/5'
                    : 'hover:border-primary/50'
                  }`}
                onClick={() => setFormData({ ...formData, biometric: !formData.biometric })}
              >
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className={`flex h-10 w-10 items-center justify-center rounded-xl ${formData.biometric ? 'bg-primary text-primary-foreground' : 'bg-muted'
                        }`}>
                        <User className="h-5 w-5" />
                      </div>
                      <div>
                        <p className="font-bold">تسجيل الدخول بالبصمة</p>
                        <p className="text-xs text-muted-foreground">استخدم البصمة أو Face ID</p>
                      </div>
                    </div>
                    {formData.biometric && <CheckCircle className="h-5 w-5 text-primary" />}
                  </div>
                </CardContent>
              </Card>
            </div>

            <div className="p-4 rounded-xl bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 max-w-md mx-auto">
              <p className="text-sm text-amber-700 dark:text-amber-400">
                💡 ننصح بتفعيل المصادقة الثنائية لحماية حسابك من الاختراق
              </p>
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-background" dir="rtl">
      <Sidebar />

      <div className="mr-16 lg:mr-64 transition-all duration-300">
        <TopBar
          title="معالج البداية"
          subtitle="إعداد حسابك خطوة بخطوة"
        />

        <main className="p-6">
          {/* شريط التقدم */}
          <Card className="border-2 mb-6">
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h3 className="font-bold">التقدم</h3>
                  <p className="text-sm text-muted-foreground">
                    أكملت {completedSteps.length} من {steps.length} خطوات
                  </p>
                </div>
                <Badge className="text-lg">{Math.round(progress)}%</Badge>
              </div>
              <Progress value={progress} className="h-2" />

              {/* الخطوات */}
              <div className="flex items-center justify-between mt-6">
                {steps.map((step, index) => {
                  const Icon = step.icon;
                  const isActive = currentStep === step.id;
                  const isCompleted = isStepCompleted(step.id);

                  return (
                    <div key={step.id} className="flex flex-col items-center">
                      <button
                        onClick={() => setCurrentStep(step.id)}
                        className={`flex h-12 w-12 items-center justify-center rounded-xl transition-all ${isActive
                            ? 'bg-primary text-primary-foreground scale-110 shadow-lg'
                            : isCompleted
                              ? 'bg-green-500 text-white'
                              : 'bg-muted hover:bg-muted/80'
                          }`}
                      >
                        {isCompleted ? (
                          <CheckCircle className="h-6 w-6" />
                        ) : (
                          <Icon className="h-5 w-5" />
                        )}
                      </button>
                      <p className={`text-xs mt-2 text-center hidden md:block ${isActive ? 'font-bold' : ''}`}>
                        {step.title}
                      </p>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>

          {/* محتوى الخطوة */}
          <Card className="border-2">
            <CardContent className="p-8">
              {renderStepContent()}
            </CardContent>
          </Card>

          {/* أزرار التنقل */}
          <div className="flex items-center justify-between mt-6">
            <Button
              variant="outline"
              onClick={handlePrev}
              disabled={currentStep === 1}
              className="gap-2"
            >
              <ChevronRight className="h-4 w-4" />
              السابق
            </Button>

            {currentStep === steps.length ? (
              <Button className="gap-2 bg-gradient-to-r from-emerald-500 to-teal-600">
                <Rocket className="h-4 w-4" />
                بدء الاستخدام
              </Button>
            ) : (
              <Button onClick={handleNext} className="gap-2">
                التالي
                <ChevronLeft className="h-4 w-4" />
              </Button>
            )}
          </div>

          {/* رسالة حفظ */}
          <div className="text-center mt-4 text-sm text-muted-foreground">
            سيتم حفظ تقدمك تلقائياً
          </div>
        </main>
      </div>
    </div>
  );
}
