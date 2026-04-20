'use client';

import { Sidebar } from '@/components/layout/Sidebar';
import { TopBar } from '@/components/layout/TopBar';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import {
  Rocket,
  BookOpen,
  Target,
  Brain,
  TrendingUp,
  Shield,
  Award,
  Star,
  CheckCircle,
  Circle,
  Lock,
  Zap,
  Users,
  BarChart3,
  LineChart,
  Calculator,
  Newspaper,
  Lightbulb,
  GraduationCap,
  Trophy,
  ChevronLeft,
} from 'lucide-react';
import { useState } from 'react';

// مراحل خريطة المضاربة
const roadmapPhases = [
  {
    id: 1,
    title: 'المرحلة التأسيسية',
    subtitle: 'أساسيات الاستثمار والمضاربة',
    icon: BookOpen,
    color: 'from-blue-500 to-cyan-600',
    progress: 100,
    unlocked: true,
    lessons: [
      { id: 1, title: 'ما هو سوق الأوراق المالية؟', duration: '15 دقيقة', completed: true },
      { id: 2, title: 'كيف تعمل الأسهم؟', duration: '20 دقيقة', completed: true },
      { id: 3, title: 'أنواع المستثمرين والمضاربين', duration: '15 دقيقة', completed: true },
      { id: 4, title: 'فتح حساب تداول', duration: '25 دقيقة', completed: true },
      { id: 5, title: 'قراءة شاشة الأسعار', duration: '20 دقيقة', completed: true },
    ],
  },
  {
    id: 2,
    title: 'التحليل الأساسي',
    subtitle: 'فهم القيمة الحقيقية للأسهم',
    icon: Target,
    color: 'from-emerald-500 to-teal-600',
    progress: 60,
    unlocked: true,
    lessons: [
      { id: 1, title: 'قراءة القوائم المالية', duration: '30 دقيقة', completed: true },
      { id: 2, title: 'تحليل الربحية والعوائد', duration: '25 دقيقة', completed: true },
      { id: 3, title: 'مؤشرات التقييم (P/E, P/B, PEG)', duration: '20 دقيقة', completed: false },
      { id: 4, title: 'تحليل القطاعات', duration: '25 دقيقة', completed: false },
      { id: 5, title: 'العوامل الاقتصادية الكلية', duration: '30 دقيقة', completed: false },
    ],
  },
  {
    id: 3,
    title: 'التحليل الفني',
    subtitle: 'قراءة الرسوم البيانية والأنماط',
    icon: LineChart,
    color: 'from-purple-500 to-violet-600',
    progress: 0,
    unlocked: true,
    lessons: [
      { id: 1, title: 'أساسيات الرسوم البيانية', duration: '20 دقيقة', completed: false },
      { id: 2, title: 'الشموع اليابانية', duration: '30 دقيقة', completed: false },
      { id: 3, title: 'خطوط الدعم والمقاومة', duration: '25 دقيقة', completed: false },
      { id: 4, title: 'المتوسطات المتحركة', duration: '20 دقيقة', completed: false },
      { id: 5, title: 'المؤشرات الفنية (RSI, MACD)', duration: '30 دقيقة', completed: false },
      { id: 6, title: 'أنماط الشموع المهمة', duration: '35 دقيقة', completed: false },
    ],
  },
  {
    id: 4,
    title: 'إدارة المخاطر',
    subtitle: 'حماية رأس المال وتقليل الخسائر',
    icon: Shield,
    color: 'from-red-500 to-rose-600',
    progress: 0,
    unlocked: false,
    lessons: [
      { id: 1, title: 'قواعد إدارة رأس المال', duration: '25 دقيقة', completed: false },
      { id: 2, title: 'تحديد حجم الصفقة', duration: '20 دقيقة', completed: false },
      { id: 3, title: 'وقف الخسارة وجني الأرباح', duration: '30 دقيقة', completed: false },
      { id: 4, title: 'تنويع المحفظة', duration: '25 دقيقة', completed: false },
      { id: 5, title: 'علم النفس في التداول', duration: '35 دقيقة', completed: false },
    ],
  },
  {
    id: 5,
    title: 'استراتيجيات التداول',
    subtitle: 'خطط واضحة للدخول والخروج',
    icon: Brain,
    color: 'from-amber-500 to-orange-600',
    progress: 0,
    unlocked: false,
    lessons: [
      { id: 1, title: 'الاستثمار طويل المدى', duration: '30 دقيقة', completed: false },
      { id: 2, title: 'المضاربة اليومية', duration: '35 دقيقة', completed: false },
      { id: 3, title: 'استراتيجية المتوسطات', duration: '25 دقيقة', completed: false },
      { id: 4, title: 'تداول الاختراقات', duration: '30 دقيقة', completed: false },
      { id: 5, title: 'بناء خطة تداول شخصية', duration: '40 دقيقة', completed: false },
    ],
  },
  {
    id: 6,
    title: 'التداول المتقدم',
    subtitle: 'تقنيات وأدوات احترافية',
    icon: TrendingUp,
    color: 'from-pink-500 to-rose-600',
    progress: 0,
    unlocked: false,
    lessons: [
      { id: 1, title: 'التداول بالهامش', duration: '30 دقيقة', completed: false },
      { id: 2, title: 'البيع على المكشوف', duration: '35 دقيقة', completed: false },
      { id: 3, title: 'المشتقات المالية', duration: '40 دقيقة', completed: false },
      { id: 4, title: 'التحليل المتعدد الأطر الزمنية', duration: '30 دقيقة', completed: false },
      { id: 5, title: 'التداول الخوارزمي', duration: '45 دقيقة', completed: false },
    ],
  },
];

// إنجازات
const achievements = [
  { id: 1, title: 'المتعلم النشط', description: 'أكمل 5 دروس', icon: BookOpen, unlocked: true },
  { id: 2, title: 'المحلل المبتدئ', description: 'أكمل مرحلة التحليل الأساسي', icon: Target, unlocked: false },
  { id: 3, title: 'قارئ الشموع', description: 'أتقن قراءة الشموع اليابانية', icon: LineChart, unlocked: false },
  { id: 4, title: 'حارس رأس المال', description: 'أكمل مرحلة إدارة المخاطر', icon: Shield, unlocked: false },
  { id: 5, title: 'المضارب المحترف', description: 'أكمل جميع المراحل', icon: Trophy, unlocked: false },
];

// نصائح يومية
const dailyTips = [
  'لا تستثمر أموالاً لا تتحمل خسارتها',
  'التنويع هو مفتاح تقليل المخاطر',
  'اشترِ عند الخوف وبع عند الطمع',
  'الصبر فضيلة في عالم الاستثمار',
  'تعلم من أخطائك ولا تكررها',
];

export default function TradingRoadmapPage() {
  const [selectedPhase, setSelectedPhase] = useState(roadmapPhases[0]);
  const [tipIndex, setTipIndex] = useState(0);

  const totalLessons = roadmapPhases.reduce((acc, phase) => acc + phase.lessons.length, 0);
  const completedLessons = roadmapPhases.reduce(
    (acc, phase) => acc + phase.lessons.filter(l => l.completed).length, 
    0
  );
  const overallProgress = (completedLessons / totalLessons) * 100;

  const nextTip = () => {
    setTipIndex((prev) => (prev + 1) % dailyTips.length);
  };

  return (
    <div className="min-h-screen bg-background" dir="rtl">
      <Sidebar />
      
      <div className="mr-16 lg:mr-64 transition-all duration-300">
        <TopBar
          title="خريطة المضاربة"
          subtitle="رحلتك لتصبح مضارباً محترفاً"
        />
        
        <main className="p-6 space-y-6">
          {/* التقدم العام */}
          <Card className="border-2 bg-gradient-to-br from-primary/5 to-primary/10">
            <CardContent className="p-6">
              <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
                <div className="flex items-center gap-4">
                  <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-primary to-primary/80 shadow-lg">
                    <GraduationCap className="h-8 w-8 text-primary-foreground" />
                  </div>
                  <div>
                    <h2 className="text-2xl font-bold">رحلة التعلم</h2>
                    <p className="text-muted-foreground">
                      أكملت {completedLessons} من {totalLessons} درس
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  <div className="text-center">
                    <p className="text-3xl font-bold text-primary">{Math.round(overallProgress)}%</p>
                    <p className="text-sm text-muted-foreground">التقدم الكلي</p>
                  </div>
                  <Progress value={overallProgress} className="w-32 h-3" />
                </div>
              </div>
            </CardContent>
          </Card>
          
          {/* النصيحة اليومية */}
          <Card className="border-2 border-amber-200 dark:border-amber-900/50 bg-gradient-to-br from-amber-50 to-orange-50 dark:from-amber-900/20 dark:to-orange-900/20">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Lightbulb className="h-6 w-6 text-amber-500" />
                  <div>
                    <p className="text-sm font-medium text-amber-700 dark:text-amber-400">نصيحة اليوم</p>
                    <p className="font-medium">{dailyTips[tipIndex]}</p>
                  </div>
                </div>
                <Button variant="ghost" size="sm" onClick={nextTip}>
                  نصيحة أخرى
                  <ChevronLeft className="h-4 w-4 mr-1" />
                </Button>
              </div>
            </CardContent>
          </Card>
          
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* المراحل */}
            <div className="lg:col-span-1 space-y-4">
              <h3 className="font-bold text-lg flex items-center gap-2">
                <Rocket className="h-5 w-5 text-primary" />
                مراحل الرحلة
              </h3>
              <div className="space-y-3">
                {roadmapPhases.map((phase, index) => {
                  const Icon = phase.icon;
                  const isSelected = selectedPhase.id === phase.id;
                  
                  return (
                    <Card 
                      key={phase.id}
                      className={`border-2 cursor-pointer transition-all ${
                        isSelected 
                          ? 'border-primary bg-primary/5 shadow-lg' 
                          : phase.unlocked 
                            ? 'hover:border-primary/50' 
                            : 'opacity-60'
                      }`}
                      onClick={() => phase.unlocked && setSelectedPhase(phase)}
                    >
                      <CardContent className="p-4">
                        <div className="flex items-center gap-3">
                          <div className={`flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br ${phase.color} shadow-lg ${!phase.unlocked && 'grayscale'}`}>
                            {phase.unlocked ? (
                              <Icon className="h-6 w-6 text-white" />
                            ) : (
                              <Lock className="h-5 w-5 text-white" />
                            )}
                          </div>
                          <div className="flex-1">
                            <div className="flex items-center gap-2">
                              <h4 className="font-bold">{phase.title}</h4>
                              {phase.progress === 100 && (
                                <CheckCircle className="h-4 w-4 text-green-500" />
                              )}
                            </div>
                            <p className="text-xs text-muted-foreground">{phase.subtitle}</p>
                            <div className="flex items-center gap-2 mt-2">
                              <Progress value={phase.progress} className="h-1.5 flex-1" />
                              <span className="text-xs text-muted-foreground">{phase.progress}%</span>
                            </div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            </div>
            
            {/* محتوى المرحلة */}
            <div className="lg:col-span-2 space-y-4">
              <Card className="border-2">
                <CardHeader>
                  <div className="flex items-center gap-3">
                    <div className={`flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br ${selectedPhase.color} shadow-lg`}>
                      <selectedPhase.icon className="h-6 w-6 text-white" />
                    </div>
                    <div>
                      <CardTitle>{selectedPhase.title}</CardTitle>
                      <p className="text-sm text-muted-foreground">{selectedPhase.subtitle}</p>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {selectedPhase.lessons.map((lesson, index) => (
                      <Card 
                        key={lesson.id}
                        className={`border transition-all cursor-pointer hover:shadow-md ${
                          lesson.completed 
                            ? 'border-green-200 dark:border-green-900/50 bg-green-50/50 dark:bg-green-900/10' 
                            : 'hover:border-primary/50'
                        }`}
                      >
                        <CardContent className="p-4">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                              <div className={`flex h-10 w-10 items-center justify-center rounded-lg ${
                                lesson.completed 
                                  ? 'bg-green-500 text-white' 
                                  : 'bg-muted'
                              }`}>
                                {lesson.completed ? (
                                  <CheckCircle className="h-5 w-5" />
                                ) : (
                                  <span className="font-bold text-muted-foreground">{index + 1}</span>
                                )}
                              </div>
                              <div>
                                <h4 className="font-medium">{lesson.title}</h4>
                                <div className="flex items-center gap-2 mt-1">
                                  <Badge variant="outline" className="text-xs">
                                    {lesson.duration}
                                  </Badge>
                                  {lesson.completed && (
                                    <Badge className="bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400 text-xs">
                                      مكتمل
                                    </Badge>
                                  )}
                                </div>
                              </div>
                            </div>
                            <Button variant="ghost" size="sm" className="gap-1">
                              {lesson.completed ? 'إعادة مشاهدة' : 'ابدأ'}
                              <ChevronLeft className="h-4 w-4" />
                            </Button>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                </CardContent>
              </Card>
              
              {/* الإنجازات */}
              <Card className="border-2">
                <CardHeader>
                  <div className="flex items-center gap-2">
                    <Award className="h-5 w-5 text-primary" />
                    <CardTitle>الإنجازات</CardTitle>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3">
                    {achievements.map((achievement) => (
                      <div 
                        key={achievement.id}
                        className={`p-3 rounded-xl text-center transition-all ${
                          achievement.unlocked 
                            ? 'bg-gradient-to-br from-amber-50 to-orange-50 dark:from-amber-900/20 dark:to-orange-900/20 border border-amber-200 dark:border-amber-800' 
                            : 'bg-muted/50 opacity-50'
                        }`}
                      >
                        <div className={`flex h-10 w-10 mx-auto items-center justify-center rounded-xl ${
                          achievement.unlocked 
                            ? 'bg-gradient-to-br from-amber-400 to-orange-500 text-white' 
                            : 'bg-muted'
                        }`}>
                          <achievement.icon className="h-5 w-5" />
                        </div>
                        <p className="font-medium text-sm mt-2">{achievement.title}</p>
                        <p className="text-xs text-muted-foreground mt-1">{achievement.description}</p>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
          
          {/* موارد إضافية */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card className="border-2 hover:border-primary/50 transition-colors cursor-pointer">
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-blue-500 to-cyan-600">
                    <Calculator className="h-5 w-5 text-white" />
                  </div>
                  <div>
                    <h4 className="font-bold">حاسبة المستثمر</h4>
                    <p className="text-xs text-muted-foreground">حساب العوائد والأرباح</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            
            <Card className="border-2 hover:border-primary/50 transition-colors cursor-pointer">
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-purple-500 to-violet-600">
                    <Newspaper className="h-5 w-5 text-white" />
                  </div>
                  <div>
                    <h4 className="font-bold">أخبار التعلم</h4>
                    <p className="text-xs text-muted-foreground">آخر مقالات التعليم</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            
            <Card className="border-2 hover:border-primary/50 transition-colors cursor-pointer">
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-green-500 to-emerald-600">
                    <Users className="h-5 w-5 text-white" />
                  </div>
                  <div>
                    <h4 className="font-bold">مجتمع المستثمرين</h4>
                    <p className="text-xs text-muted-foreground">انضم للنقاشات</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </main>
      </div>
    </div>
  );
}
