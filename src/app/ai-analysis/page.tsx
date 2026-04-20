'use client';

import { useState, useRef, useEffect } from 'react';
import { Sidebar } from '@/components/layout/Sidebar';
import { TopBar } from '@/components/layout/TopBar';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Bot,
  Send,
  User,
  Trash2,
  Sparkles,
  TrendingUp,
  PieChart,
  BarChart3,
  Shield,
  RefreshCw,
  Loader2,
  Brain,
  MessageSquare,
  Lightbulb,
  AlertTriangle,
  Copy,
  ThumbsUp,
  ThumbsDown,
  Search,
  Target,
  Zap,
  Settings,
} from 'lucide-react';
import { AI_PROVIDERS, getModelsForProvider, getDefaultModelForProvider } from '@/lib/ai-providers';
import { resolveProvider, getAISettings, getApiKey, saveApiKeys, saveDefaults } from '@/lib/api-keys';
import { cn } from '@/lib/utils';
import Link from 'next/link';

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
}

const QUICK_ACTIONS = [
  { label: 'تحليل المحفظة الكامل', icon: <PieChart className="h-4 w-4" />, prompt: 'قم بتحليل شامل لمحفظتي الاستثمارية. حلل التنويع، المخاطر، الأداء، وأعطني توصيات محددة لتحسين المحفظة.' },
  { label: 'توصيات شراء/بيع', icon: <TrendingUp className="h-4 w-4" />, prompt: 'بناءً على أداء محفظتي، ما هي الأسهم التي توصي ببيعها وأيها يجب الاحتفاظ بها؟ وهل هناك فرص شراء جديدة؟' },
  { label: 'إعادة توازن المحفظة', icon: <BarChart3 className="h-4 w-4" />, prompt: 'محفظتي تحتاج إعادة توازن. اقترح توزيعاً مثالياً للأصول بناءً على المخاطر والعوائد المتوقعة.' },
  { label: 'تحليل الشريعة', icon: <Shield className="h-4 w-4" />, prompt: 'راجع محفظتي من الناحية الشرعية. أي أسهم متوافقة مع الشريعة وأيها يحتاج مراجعة؟' },
  { label: 'تحليل سهم محدد', icon: <Search className="h-4 w-4" />, prompt: 'أعطني تحليلاً فنياً وأساسياً مفصلاً لأفضل سهم في محفظتي مع تحديد نقاط الدخول والخروج والمستهدف السعري.' },
  { label: 'تقييم المخاطر', icon: <AlertTriangle className="h-4 w-4" />, prompt: 'ما هي أهم المخاطر في محفظتي الحالية؟ وكيف يمكنني تقليلها مع الحفاظ على العوائد؟' },
];

const SYSTEM_PROMPT = `أنت مستشار استثماري محترف يتحدث بالعربية. متخصص في الأسواق المالية العربية والعالمية.
تساعد المستثمرين في:
- تحليل المحافظ الاستثمارية وتقييم الأداء
- تقديم توصيات شراء/بيع/احتفاظ مبنية على التحليل الفني والأساسي
- تقييم المخاطر وتحديد نقاط الوقف
- إعادة توازن المحفظة
- تحليل الامتثال الشرعي
- تحليل السلع والعملات المشفرة والفوركس

أجب بشكل منظم باستخدام عناوين ونقاط. كن محدداً وعملياً في توصياتك. استخدم الرموز التعبيرية للتوضيح.`;

export default function AIChatPage() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [provider, setProvider] = useState(AI_PROVIDERS[0].id);
  const [selectedModel, setSelectedModel] = useState(AI_PROVIDERS[0].defaultModel);
  const [showSettings, setShowSettings] = useState(false);
  const [apiKey, setApiKey] = useState('');
  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    scrollRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, loading]);

  useEffect(() => {
    const settings = getAISettings();
    const defaultProv = settings.defaultProvider || 'zai';
    const defaultMod = settings.defaultModel || getDefaultModelForProvider(defaultProv);
    const key = getApiKey(defaultProv);
    const isValid = defaultProv === 'zai' || (key && !key.includes('dummy') && key.trim().length >= 10);
    if (isValid) {
      setProvider(defaultProv);
      setSelectedModel(defaultMod);
      setApiKey(key);
    } else {
      setProvider('zai');
      setSelectedModel(getDefaultModelForProvider('zai'));
      setApiKey('');
    }
  }, []);

  const sendMessage = async (text: string) => {
    if (!text.trim() || loading) return;

    const userMsg: Message = { id: crypto.randomUUID(), role: 'user', content: text.trim() };
    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setLoading(true);

    try {
      const resolved = resolveProvider(provider);
      const effectiveProvider = (provider !== 'zai' && !apiKey) ? resolved.provider : provider;
      const effectiveKey = apiKey || resolved.apiKey || undefined;

      const res = await fetch('/api/ai', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          provider: effectiveProvider,
          model: selectedModel || resolved.model || undefined,
          apiKey: effectiveKey,
          messages: [
            { role: 'system', content: SYSTEM_PROMPT },
            ...messages.map(m => ({ role: m.role, content: m.content })),
            { role: 'user', content: text.trim() }
          ]
        })
      });

      const data = await res.json();
      if (!data.success) throw new Error(data.error);
      setMessages(prev => [...prev, { id: crypto.randomUUID(), role: 'assistant', content: data.content || '' }]);
    } catch (err) {
      setMessages(prev => [...prev, {
        id: crypto.randomUUID(), role: 'assistant',
        content: `⚠️ خطأ: ${err instanceof Error ? err.message : 'حدث خطأ غير متوقع'}`
      }]);
    } finally { setLoading(false); }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendMessage(input); }
  };

  const renderContent = (text: string) => {
    return text.split('\n').map((line, i) => {
      if (line.startsWith('### ')) return <h3 key={i} className="text-lg font-bold mt-4 mb-2">{line.slice(4)}</h3>;
      if (line.startsWith('## ')) return <h2 key={i} className="text-base font-bold mt-3 mb-1">{line.slice(3)}</h2>;
      if (line.startsWith('# ')) return <h1 key={i} className="text-lg font-bold mt-3 mb-2">{line.slice(2)}</h1>;
      if (line.startsWith('- ') || line.startsWith('* ')) return <li key={i} className="mr-4 mb-1 text-sm">{line.slice(2)}</li>;
      if (line.startsWith('**') && line.endsWith('**')) return <p key={i} className="font-bold my-1 text-sm">{line.slice(2, -2)}</p>;
      if (line === '---') return <hr key={i} className="my-3 border-border" />;
      if (line.trim() === '') return <br key={i} />;
      const formatted = line.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
      return <p key={i} className="mb-1 text-sm" dangerouslySetInnerHTML={{ __html: formatted }} />;
    });
  };

  const currentProvider = AI_PROVIDERS.find(p => p.id === provider);
  const keyVal = getApiKey(provider);
  const hasKey = provider === 'zai' || (keyVal && !keyVal.includes('dummy') && keyVal.trim().length >= 10);

  return (
    <div className="flex min-h-screen bg-background" dir="rtl">
      <Sidebar />
      <main className="flex-1 mr-16 lg:mr-64 flex flex-col h-screen transition-all duration-300">
        <TopBar title="تحليل AI" />

        {/* Header Bar */}
        <div className="border-b px-4 py-2.5 flex items-center gap-3 bg-card/50 flex-wrap">
          <Brain className="h-5 w-5 text-primary shrink-0" />

          <Select value={provider} onValueChange={(v) => {
            setProvider(v);
            const m = getDefaultModelForProvider(v);
            setSelectedModel(m);
            setApiKey(getApiKey(v));
            saveDefaults(v, m);
          }}>
            <SelectTrigger className="w-[160px] h-8 text-xs">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {AI_PROVIDERS.map(p => (
                <SelectItem key={p.id} value={p.id}>
                  <span className="flex items-center gap-1.5">{p.icon} {p.nameAr}</span>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select value={selectedModel} onValueChange={(v) => { setSelectedModel(v); saveDefaults(provider, v); }}>
            <SelectTrigger className="w-[180px] h-8 text-xs">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {getModelsForProvider(provider).map(m => (
                <SelectItem key={m.id} value={m.id}>
                  <div className="flex items-center gap-1.5">
                    <span>{m.nameAr || m.name}</span>
                    {m.recommended && <Badge variant="secondary" className="text-[9px] bg-emerald-100 text-emerald-800 px-1 py-0">موصى</Badge>}
                    {m.free && <Badge variant="secondary" className="text-[9px] bg-blue-100 text-blue-800 px-1 py-0">مجاني</Badge>}
                  </div>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Badge variant="outline" className={cn("text-[11px]", hasKey ? "text-green-600 border-green-300" : "text-amber-600 border-amber-300")}>
            {hasKey ? '✓ متصل' : '⚠ بدون مفتاح'}
          </Badge>

          <button onClick={() => setShowSettings(!showSettings)} className="mr-auto p-1.5 rounded-md hover:bg-muted transition-colors">
            <Settings className={cn("h-4 w-4", showSettings && "text-primary")} />
          </button>
        </div>

        {/* API Key Settings Panel */}
        {showSettings && (
          <div className="border-b px-4 py-3 bg-amber-50/50 dark:bg-amber-950/20 space-y-2">
            <div className="flex items-center gap-2 text-xs font-medium text-amber-700">
              <Lightbulb className="h-3.5 w-3.5" />
              إعدادات المزود — {currentProvider?.nameAr}
            </div>
            {currentProvider?.needsKey && (
              <div className="flex items-center gap-2">
                <input
                  type="password"
                  value={apiKey}
                  onChange={(e) => setApiKey(e.target.value)}
                  placeholder={currentProvider.keyPlaceholder || 'مفتاح API...'}
                  className="flex-1 max-w-md rounded-md border border-input bg-background px-3 py-1.5 text-xs"
                />
                <Button size="sm" className="h-7 text-xs"
                  onClick={() => {
                    const keys = getAISettings().apiKeys;
                    keys[provider] = apiKey.trim();
                    const aliasMap: Record<string, string> = { anthropic: 'anthropic_claude', google: 'google_gemini', xai: 'xai_grok' };
                    if (aliasMap[provider]) keys[aliasMap[provider]] = apiKey.trim();
                    saveApiKeys(keys);
                    saveDefaults(provider, selectedModel);
                    toast({ title: 'تم الحفظ', description: `مفتاح ${currentProvider.nameAr}` });
                  }}
                  disabled={!apiKey?.trim()}
                >حفظ</Button>
              </div>
            )}
            {!currentProvider?.needsKey && <p className="text-xs text-muted-foreground">هذا المزود لا يتطلب مفتاح API</p>}
            <p className="text-[10px] text-muted-foreground">
              يمكنك أيضاً إدارة المفاتيح من <Link href="/settings" className="text-primary underline">صفحة الإعدادات</Link>
            </p>
          </div>
        )}

        {/* Main Chat Area */}
        <ScrollArea className="flex-1">
          {messages.length === 0 ? (
            <div className="flex flex-col items-center justify-center min-h-[60vh] text-center py-12 px-6">
              <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center mb-6 shadow-lg shadow-violet-500/25">
                <Brain className="h-10 w-10 text-white" />
              </div>
              <h2 className="text-2xl font-bold mb-2">مساعد الاستثمار الذكي</h2>
              <p className="text-muted-foreground mb-8 max-w-lg text-sm">
                اسألني عن محفظتك، توصيات الأسهم، إعادة التوازن، تحليل المخاطر، أو أي سؤال استثماري.
                <br />مدعوم بـ {currentProvider?.nameAr} — {AI_PROVIDERS.find(p => p.id === provider)?.models.find(m => m.id === selectedModel)?.nameAr || selectedModel}
              </p>

              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 max-w-2xl w-full">
                {QUICK_ACTIONS.map((action) => (
                  <button
                    key={action.label}
                    onClick={() => sendMessage(action.prompt)}
                    className="flex items-center gap-2 p-3 rounded-xl border hover:bg-muted/50 hover:shadow-sm transition-all text-right"
                  >
                    <span className="text-primary shrink-0">{action.icon}</span>
                    <span className="text-xs font-medium">{action.label}</span>
                  </button>
                ))}
              </div>
            </div>
          ) : (
            <div className="max-w-4xl mx-auto p-6 space-y-4 pb-4">
              {messages.map((msg) => (
                <div key={msg.id} className={cn("flex gap-3", msg.role === 'user' && "flex-row-reverse")}>
                  <div className={cn(
                    "flex-shrink-0 w-9 h-9 rounded-xl flex items-center justify-center shadow-sm",
                    msg.role === 'user'
                      ? "bg-gradient-to-br from-primary to-primary/80 text-primary-foreground"
                      : "bg-gradient-to-br from-violet-500 to-purple-600 text-white"
                  )}>
                    {msg.role === 'user' ? <User className="h-4 w-4" /> : <Bot className="h-4 w-4" />}
                  </div>
                  <div className={cn("max-w-[80%] rounded-2xl px-4 py-3", msg.role === 'user' ? "bg-primary text-primary-foreground rounded-tl-none" : "bg-muted rounded-tr-none")}>
                    {msg.role === 'assistant' ? renderContent(msg.content) : <p className="text-sm">{msg.content}</p>}
                  </div>
                </div>
              ))}

              {loading && (
                <div className="flex gap-3">
                  <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-violet-500 to-purple-600 text-white flex items-center justify-center">
                    <Bot className="h-4 w-4" />
                  </div>
                  <div className="bg-muted rounded-2xl rounded-tr-none px-4 py-3">
                    <div className="flex items-center gap-2">
                      <RefreshCw className="h-4 w-4 animate-spin text-violet-500" />
                      <span className="text-sm text-muted-foreground">جاري التحليل...</span>
                    </div>
                  </div>
                </div>
              )}
              <div ref={scrollRef} />
            </div>
          )}
        </ScrollArea>

        {/* Input Bar */}
        <div className="border-t p-4 bg-card/50">
          <div className="max-w-4xl mx-auto flex gap-3 items-end">
            {messages.length > 0 && (
              <Button variant="ghost" size="icon" onClick={() => setMessages([])} className="shrink-0 h-10 w-10 rounded-xl" title="مسح المحادثة">
                <Trash2 className="h-4 w-4" />
              </Button>
            )}
            <textarea
              ref={inputRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="اكتب سؤالك الاستثماري هنا... (Enter للإرسال)"
              className="flex-1 resize-none rounded-xl border bg-background px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary min-h-[48px] max-h-[120px] overflow-y-auto"
              rows={1}
              disabled={loading}
            />
            <Button
              size="lg"
              onClick={() => sendMessage(input)}
              disabled={!input.trim() || loading}
              className="rounded-xl px-5 bg-gradient-to-r from-violet-500 to-purple-600 hover:from-violet-600 hover:to-purple-700 shrink-0"
            >
              {loading ? <Loader2 className="h-5 w-5 animate-spin" /> : <Send className="h-5 w-5" />}
            </Button>
          </div>
        </div>
      </main>
    </div>
  );
}

// Inline toast to avoid circular imports
function toast(_: { title: string; description?: string }) {
  if (typeof window !== 'undefined') {
    const event = new CustomEvent('toast', { detail: _ });
    window.dispatchEvent(event);
  }
}
