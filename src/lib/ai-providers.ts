// AI Providers — Single source of truth for all providers and models
// Used by: Settings page, AI pages, portfolio-insights, chatbot, analysis, assistant

export interface AIModel {
  id: string;
  name: string;
  nameAr: string;
  capabilities: string[];
  recommended?: boolean;
  free?: boolean;
}

export interface AIProvider {
  id: string;
  name: string;
  nameAr: string;
  description: string;
  icon: string;
  color: string;
  defaultModel: string;
  isFree?: boolean;
  isDefault?: boolean;
  needsKey: boolean;
  keyPlaceholder?: string;
  keyUrl?: string;
  models: AIModel[];
}

export const AI_PROVIDERS: AIProvider[] = [
  {
    id: 'zai',
    name: 'Z.AI (GLM)',
    nameAr: 'Z.AI (GLM)',
    description: 'GLM + نماذج مجانية: MiMo, MiniMax, Nemotron, BigPickle',
    icon: '🎯',
    color: 'bg-emerald-500',
    defaultModel: 'glm-4.7-flash',
    isDefault: true,
    isFree: true,
    needsKey: false,
    models: [
      { id: 'glm-4.7-flash', name: 'GLM-4.7 Flash', nameAr: 'GLM-4.7 Flash', capabilities: ['مجاني', 'سريع', 'متوازن'], recommended: true, free: true },
      { id: 'glm-4.5-flash', name: 'GLM-4.5 Flash', nameAr: 'GLM-4.5 Flash', capabilities: ['مجاني', 'خفيف'], free: true },
      { id: 'BigPickle-51', name: 'BigPickle 51', nameAr: 'BigPickle 51', capabilities: ['مجاني', '51B'], free: true },
      { id: 'MiMo-V2-Omni', name: 'MiMo V2 Omni', nameAr: 'MiMo V2 Omni', capabilities: ['مجاني', 'Xiaomi', 'متعدد الوسائط'], free: true },
      { id: 'MiMo-V2-Pro', name: 'MiMo V2 Pro', nameAr: 'MiMo V2 Pro', capabilities: ['مجاني', 'Xiaomi'], free: true },
      { id: 'MiniMax-M2.5', name: 'MiniMax M2.5', nameAr: 'MiniMax M2.5', capabilities: ['مجاني', 'إنتاجية'], free: true },
      { id: 'Nemotron-3-Super', name: 'Nemotron 3 Super', nameAr: 'Nemotron 3 Super', capabilities: ['مجاني', 'NVIDIA', '120B'], free: true },
      { id: 'glm-5.1', name: 'GLM-5.1', nameAr: 'GLM-5.1', capabilities: ['أحدث', 'أقوى', 'Agentic', 'كود'] },
      { id: 'glm-5v-turbo', name: 'GLM-5V Turbo', nameAr: 'GLM-5V Turbo', capabilities: ['رؤية + كود', 'متعدد الوسائط', 'Agentic'] },
      { id: 'glm-5', name: 'GLM-5', nameAr: 'GLM-5', capabilities: ['قوي', 'مستقر'] },
      { id: 'glm-5-turbo', name: 'GLM-5 Turbo', nameAr: 'GLM-5 Turbo', capabilities: ['سريع', 'متوازن', 'مهام طويلة'] },
      { id: 'glm-4.7', name: 'GLM-4.7', nameAr: 'GLM-4.7', capabilities: ['متوازن', 'رخيص'] },
      { id: 'glm-4.7-flashx', name: 'GLM-4.7 FlashX', nameAr: 'GLM-4.7 FlashX', capabilities: ['سريع جداً', 'رخيص'] },
      { id: 'glm-4.6', name: 'GLM-4.6', nameAr: 'GLM-4.6', capabilities: ['مستقر', 'رخيص', 'كود'] },
      { id: 'glm-4.6v', name: 'GLM-4.6V', nameAr: 'GLM-4.6V', capabilities: ['رؤية', 'تحليل صور', 'أدوات'] },
      { id: 'glm-4-long', name: 'GLM-4 Long', nameAr: 'GLM-4 Long', capabilities: ['سياق 1M', 'نصوص طويلة جداً'] },
      { id: 'glm-4.5', name: 'GLM-4.5', nameAr: 'GLM-4.5', capabilities: ['مستقر'] },
      { id: 'glm-4.5-x', name: 'GLM-4.5 X', nameAr: 'GLM-4.5 X', capabilities: ['أقوى GLM-4.5'] },
      { id: 'glm-4.5-air', name: 'GLM-4.5 Air', nameAr: 'GLM-4.5 Air', capabilities: ['خفيف', 'رخيص'] },
      { id: 'glm-4.5-airx', name: 'GLM-4.5 AirX', nameAr: 'GLM-4.5 AirX', capabilities: ['خفيف محسّن'] },
      { id: 'glm-4-32b-0414-128k', name: 'GLM-4 32B 128K', nameAr: 'GLM-4 32B 128K', capabilities: ['سياق 128K', 'رخيص جداً'] },
    ],
  },
  {
    id: 'openai',
    name: 'OpenAI',
    nameAr: 'OpenAI',
    description: 'GPT-5.5, GPT-5.4, GPT-5.3-Codex, o3-pro, o4-mini',
    icon: '🤖',
    color: 'bg-teal-500',
    defaultModel: 'gpt-4.1-mini',
    needsKey: true,
    keyPlaceholder: 'sk-...',
    keyUrl: 'https://platform.openai.com/api-keys',
    models: [
      { id: 'gpt-5.5', name: 'GPT-5.5', nameAr: 'GPT-5.5', capabilities: ['أحدث', 'أقوى أداء', 'Agentic', 'سياق 1M'], recommended: true },
      { id: 'gpt-5.5-pro', name: 'GPT-5.5 Pro', nameAr: 'GPT-5.5 Pro', capabilities: ['أقوى Pro', 'استدلال عميق', 'بحث'] },
      { id: 'gpt-5.4', name: 'GPT-5.4', nameAr: 'GPT-5.4', capabilities: ['قوي', 'كود'] },
      { id: 'gpt-5.4-mini', name: 'GPT-5.4 Mini', nameAr: 'GPT-5.4 Mini', capabilities: ['سريع', 'متوازن'] },
      { id: 'gpt-5.4-nano', name: 'GPT-5.4 Nano', nameAr: 'GPT-5.4 Nano', capabilities: ['أسرع', 'أرخص'] },
      { id: 'gpt-5.3-codex', name: 'GPT-5.3 Codex', nameAr: 'GPT-5.3 Codex', capabilities: ['أقوى كود', 'Agentic', 'استخدام الكمبيوتر'] },
      { id: 'gpt-5.3-instant', name: 'GPT-5.3 Instant', nameAr: 'GPT-5.3 Instant', capabilities: ['سريع جداً', 'اقتصادي'] },
      { id: 'gpt-5', name: 'GPT-5', nameAr: 'GPT-5', capabilities: ['قوي', 'مستقر'] },
      { id: 'gpt-4.1', name: 'GPT-4.1', nameAr: 'GPT-4.1', capabilities: ['كود', 'سياق 1M'] },
      { id: 'gpt-4.1-mini', name: 'GPT-4.1 Mini', nameAr: 'GPT-4.1 Mini', capabilities: ['سريع', 'اقتصادي'] },
      { id: 'gpt-4.1-nano', name: 'GPT-4.1 Nano', nameAr: 'GPT-4.1 Nano', capabilities: ['أسرع', 'أرخص'] },
      { id: 'gpt-4o', name: 'GPT-4o', nameAr: 'GPT-4o', capabilities: ['محادثة', 'رؤية', 'صوت'] },
      { id: 'gpt-4o-mini', name: 'GPT-4o Mini', nameAr: 'GPT-4o Mini', capabilities: ['سريع', 'اقتصادي'] },
      { id: 'o3', name: 'o3', nameAr: 'o3', capabilities: ['استدلال متقدم'] },
      { id: 'o3-pro', name: 'o3-pro', nameAr: 'o3-pro', capabilities: ['أقوى استدلال', 'تحليل معقد'] },
      { id: 'o3-mini', name: 'o3-mini', nameAr: 'o3-mini', capabilities: ['استدلال', 'سرعة'] },
      { id: 'o4-mini', name: 'o4-mini', nameAr: 'o4-mini', capabilities: ['استدلال', 'متوازن'] },
      { id: 'o4-mini-high', name: 'o4-mini High', nameAr: 'o4-mini High', capabilities: ['استدلال عميق'] },
      { id: 'o1', name: 'o1', nameAr: 'o1', capabilities: ['استدلال', 'رياضيات'] },
      { id: 'o1-pro', name: 'o1-pro', nameAr: 'o1-pro', capabilities: ['أقوى o1'] },
      { id: 'o1-mini', name: 'o1-mini', nameAr: 'o1-mini', capabilities: ['استدلال خفيف'] },
      { id: 'codex-mini-latest', name: 'Codex Mini', nameAr: 'Codex Mini', capabilities: ['برمجة', 'كود'] },
    ],
  },
  {
    id: 'anthropic',
    name: 'Anthropic Claude',
    nameAr: 'Anthropic Claude',
    description: 'Claude 4.7 Opus, Claude 4.6 Sonnet, Haiku 4.5',
    icon: '🧠',
    color: 'bg-amber-600',
    defaultModel: 'claude-sonnet-4-6-20260220',
    needsKey: true,
    keyPlaceholder: 'sk-ant-...',
    keyUrl: 'https://console.anthropic.com/',
    models: [
      { id: 'claude-opus-4-7-20250410', name: 'Claude Opus 4.7', nameAr: 'Claude Opus 4.7', capabilities: ['أقوى أداء', 'سياق 1M', 'أحدث'], recommended: true },
      { id: 'claude-opus-4-6-20260205', name: 'Claude Opus 4.6', nameAr: 'Claude Opus 4.6', capabilities: ['قوي جداً', 'سياق 1M'] },
      { id: 'claude-sonnet-4-6-20260220', name: 'Claude Sonnet 4.6', nameAr: 'Claude Sonnet 4.6', capabilities: ['متوازن', 'سياق 1M', 'سريع'] },
      { id: 'claude-opus-4-20250514', name: 'Claude Opus 4', nameAr: 'Claude Opus 4', capabilities: ['قوي', 'تحليل معقد'] },
      { id: 'claude-sonnet-4-20250514', name: 'Claude Sonnet 4', nameAr: 'Claude Sonnet 4', capabilities: ['متوازن', 'سرعة ودقة'] },
      { id: 'claude-3-7-sonnet-20250219', name: 'Claude 3.7 Sonnet', nameAr: 'Claude 3.7 Sonnet', capabilities: ['محسّن', 'تحليل متقدم'] },
      { id: 'claude-3-5-sonnet-20241022', name: 'Claude 3.5 Sonnet', nameAr: 'Claude 3.5 Sonnet', capabilities: ['مستقر', 'موثوق'] },
      { id: 'claude-3-5-haiku-20241022', name: 'Claude 3.5 Haiku', nameAr: 'Claude 3.5 Haiku', capabilities: ['سريع جداً', 'اقتصادي'] },
      { id: 'claude-haiku-4-5-20251001', name: 'Claude Haiku 4.5', nameAr: 'Claude Haiku 4.5', capabilities: ['سريع', 'اقتصادي'] },
    ],
  },
  {
    id: 'xai',
    name: 'xAI Grok',
    nameAr: 'xAI Grok',
    description: 'Grok-4.1, Grok-4, Grok-3',
    icon: '🚀',
    color: 'bg-gray-700',
    defaultModel: 'grok-3-mini',
    needsKey: true,
    keyPlaceholder: 'xai-...',
    keyUrl: 'https://console.x.ai/',
    models: [
      { id: 'grok-4', name: 'Grok-4', nameAr: 'Grok-4', capabilities: ['أقوى', 'استدلال متقدم'], recommended: true },
      { id: 'grok-4.1', name: 'Grok-4.1', nameAr: 'Grok-4.1', capabilities: ['أحدث', 'متعدد الوكلاء'] },
      { id: 'grok-4.1-fast', name: 'Grok-4.1 Fast', nameAr: 'Grok-4.1 Fast', capabilities: ['سريع', 'متوازن'] },
      { id: 'grok-3', name: 'Grok-3', nameAr: 'Grok-3', capabilities: ['قوي', 'مستقر'] },
      { id: 'grok-3-fast', name: 'Grok-3 Fast', nameAr: 'Grok-3 Fast', capabilities: ['سريع'] },
      { id: 'grok-3-mini', name: 'Grok-3 Mini', nameAr: 'Grok-3 Mini', capabilities: ['خفيف', 'اقتصادي'] },
      { id: 'grok-3-mini-fast', name: 'Grok-3 Mini Fast', nameAr: 'Grok-3 Mini Fast', capabilities: ['أسرع', 'أرخص'] },
      { id: 'grok-2-1212', name: 'Grok-2', nameAr: 'Grok-2', capabilities: ['مستقر'] },
      { id: 'grok-2-vision-1212', name: 'Grok-2 Vision', nameAr: 'Grok-2 Vision', capabilities: ['رؤية', 'تحليل صور'] },
    ],
  },
  {
    id: 'google',
    name: 'Google Gemini',
    nameAr: 'Google Gemini',
    description: 'Gemini 3.1 Pro, Gemma 4, 2.5 Pro/Flash',
    icon: '🔮',
    color: 'bg-red-500',
    defaultModel: 'gemini-2.5-flash',
    needsKey: true,
    keyPlaceholder: 'AIza...',
    keyUrl: 'https://aistudio.google.com/app/apikey',
    models: [
      { id: 'gemini-3.1-pro-preview', name: 'Gemini 3.1 Pro', nameAr: 'Gemini 3.1 Pro', capabilities: ['أقوى', 'أحدث'], recommended: true },
      { id: 'gemini-3-flash-preview', name: 'Gemini 3 Flash', nameAr: 'Gemini 3 Flash', capabilities: ['سريع', 'مجاني'] },
      { id: 'gemini-3.1-flash-lite-preview', name: 'Gemini 3.1 Flash Lite', nameAr: 'Gemini 3.1 Flash Lite', capabilities: ['خفيف', 'أسرع'] },
      { id: 'gemma-4-31b-it', name: 'Gemma 4 31B', nameAr: 'Gemma 4 31B', capabilities: ['مفتوح', 'كود', 'استدلال', 'سياق 256K'] },
      { id: 'gemma-4-26b-a4b-it', name: 'Gemma 4 26B MoE', nameAr: 'Gemma 4 26B MoE', capabilities: ['MoE', 'فعّال', 'سياق 256K'] },
      { id: 'gemini-2.5-pro', name: 'Gemini 2.5 Pro', nameAr: 'Gemini 2.5 Pro', capabilities: ['تحليل معقد', 'استدلال'] },
      { id: 'gemini-2.5-flash', name: 'Gemini 2.5 Flash', nameAr: 'Gemini 2.5 Flash', capabilities: ['سريع', 'متوازن'] },
      { id: 'gemini-2.5-flash-lite', name: 'Gemini 2.5 Flash Lite', nameAr: 'Gemini 2.5 Flash Lite', capabilities: ['خفيف', 'اقتصادي'] },
      { id: 'gemini-2.0-flash', name: 'Gemini 2.0 Flash', nameAr: 'Gemini 2.0 Flash', capabilities: ['سريع', 'مستقر'] },
      { id: 'gemini-2.0-flash-lite', name: 'Gemini 2.0 Flash Lite', nameAr: 'Gemini 2.0 Flash Lite', capabilities: ['خفيف'] },
      { id: 'gemini-1.5-pro', name: 'Gemini 1.5 Pro', nameAr: 'Gemini 1.5 Pro', capabilities: ['سياق 2M', 'قوي'] },
      { id: 'gemini-1.5-flash', name: 'Gemini 1.5 Flash', nameAr: 'Gemini 1.5 Flash', capabilities: ['سريع', 'اقتصادي'] },
    ],
  },
  {
    id: 'deepseek',
    name: 'DeepSeek',
    nameAr: 'DeepSeek',
    description: 'DeepSeek-V3.2 Chat & Reasoner',
    icon: '🔬',
    color: 'bg-blue-600',
    defaultModel: 'deepseek-chat',
    needsKey: true,
    keyPlaceholder: 'sk-...',
    keyUrl: 'https://platform.deepseek.com/api_keys',
    models: [
      { id: 'deepseek-chat', name: 'DeepSeek-V3.2 (Chat)', nameAr: 'DeepSeek-V3.2', capabilities: ['أحدث', 'قوي', 'رخيص'], recommended: true },
      { id: 'deepseek-reasoner', name: 'DeepSeek-V3.2 (Reasoner)', nameAr: 'DeepSeek Reasoner', capabilities: ['استدلال متقدم', 'رياضيات'] },
      { id: 'deepseek-v4-flash', name: 'DeepSeek V4 Flash', nameAr: 'DeepSeek V4 Flash', capabilities: ['أحدث V4', 'سياق 1M', 'سريع'] },
      { id: 'deepseek-v4-pro', name: 'DeepSeek V4 Pro', nameAr: 'DeepSeek V4 Pro', capabilities: ['أقوى DeepSeek', 'سياق 1M'] },
    ],
  },
  {
    id: 'groq',
    name: 'Groq',
    nameAr: 'Groq',
    description: 'أسرع استجابة — مجاني',
    icon: '⚡',
    color: 'bg-pink-500',
    defaultModel: 'llama-3.3-70b-versatile',
    isFree: true,
    needsKey: true,
    keyPlaceholder: 'gsk_...',
    keyUrl: 'https://console.groq.com/keys',
    models: [
      { id: 'meta-llama/llama-4-scout-17b-16e-instruct', name: 'Llama 4 Scout', nameAr: 'Llama 4 Scout', capabilities: ['أحدث Llama', 'مجاني'], recommended: true, free: true },
      { id: 'meta-llama/llama-4-maverick-17b-128e-instruct', name: 'Llama 4 Maverick', nameAr: 'Llama 4 Maverick', capabilities: ['أقوى Llama 4', 'مجاني'], free: true },
      { id: 'llama-3.3-70b-versatile', name: 'Llama 3.3 70B', nameAr: 'Llama 3.3 70B', capabilities: ['قوي', 'مجاني'], free: true },
      { id: 'llama-3.1-8b-instant', name: 'Llama 3.1 8B', nameAr: 'Llama 3.1 8B', capabilities: ['أسرع', 'مجاني'], free: true },
      { id: 'openai/gpt-oss-120b', name: 'GPT-OSS 120B', nameAr: 'GPT-OSS 120B', capabilities: ['OpenAI مفتوح', 'مجاني'], free: true },
      { id: 'openai/gpt-oss-20b', name: 'GPT-OSS 20B', nameAr: 'GPT-OSS 20B', capabilities: ['خفيف', 'مجاني'], free: true },
      { id: 'qwen/qwen-3-32b', name: 'Qwen 3 32B', nameAr: 'Qwen 3 32B', capabilities: ['أحدث Qwen', 'مجاني'], free: true },
      { id: 'qwen-qwq-32b', name: 'Qwen QwQ 32B', nameAr: 'Qwen QwQ 32B', capabilities: ['استدلال', 'مجاني'], free: true },
      { id: 'qwen/qwen3.6-27b', name: 'Qwen 3.6 27B', nameAr: 'Qwen 3.6 27B', capabilities: ['أقوى كود', 'استدلال', 'مجاني'], recommended: true, free: true },
      { id: 'moonshotai/kimi-k2-instruct-0905', name: 'Kimi K2', nameAr: 'Kimi K2', capabilities: ['برمجة', 'مجاني'], free: true },
      { id: 'deepseek-r1-distill-llama-70b', name: 'DeepSeek R1 Llama 70B', nameAr: 'DeepSeek R1 Llama', capabilities: ['استدلال', 'مجاني'], free: true },
      { id: 'mixtral-8x7b-32768', name: 'Mixtral 8x7B', nameAr: 'Mixtral 8x7B', capabilities: ['متعدد الخبراء', 'مجاني'], free: true },
      { id: 'gemma2-9b-it', name: 'Gemma 2 9B', nameAr: 'Gemma 2 9B', capabilities: ['خفيف', 'مجاني'], free: true },
      { id: 'mistral-saba-24b', name: 'Mistral Saba 24B', nameAr: 'Mistral Saba 24B', capabilities: ['عربي محسّن', 'مجاني'], free: true },
      { id: 'compound-beta', name: 'Compound Beta', nameAr: 'Compound Beta', capabilities: ['مركّب', 'مجاني'], free: true },
      { id: 'compound-beta-mini', name: 'Compound Beta Mini', nameAr: 'Compound Beta Mini', capabilities: ['خفيف مركّب', 'مجاني'], free: true },
    ],
  },
  {
    id: 'mistral',
    name: 'Mistral AI',
    nameAr: 'Mistral AI',
    description: 'Mistral Large 3, Small 4, Magistral',
    icon: '🌊',
    color: 'bg-sky-500',
    defaultModel: 'mistral-large-latest',
    needsKey: true,
    keyPlaceholder: 'أدخل مفتاح Mistral...',
    keyUrl: 'https://console.mistral.ai/',
    models: [
      { id: 'mistral-large-latest', name: 'Mistral Large 3', nameAr: 'Mistral Large 3', capabilities: ['أقوى', 'تحليل معقد'], recommended: true },
      { id: 'mistral-small-latest', name: 'Mistral Small 4', nameAr: 'Mistral Small 4', capabilities: ['هجين', 'استدلال + رؤية'] },
      { id: 'ministral-14b-2512', name: 'Ministral 14B', nameAr: 'Ministral 14B', capabilities: ['حافة', 'متوازن'] },
      { id: 'ministral-8b-2512', name: 'Ministral 8B', nameAr: 'Ministral 8B', capabilities: ['خفيف', 'سريع'] },
      { id: 'ministral-3b-2512', name: 'Ministral 3B', nameAr: 'Ministral 3B', capabilities: ['أخف', 'حافة'] },
      { id: 'magistral-medium-2509', name: 'Magistral Medium', nameAr: 'Magistral Medium', capabilities: ['استدلال', 'تحليل'] },
      { id: 'magistral-small-2509', name: 'Magistral Small', nameAr: 'Magistral Small', capabilities: ['استدلال خفيف'] },
      { id: 'pixtral-large-latest', name: 'Pixtral Large', nameAr: 'Pixtral Large', capabilities: ['رؤية', 'تحليل صور'] },
      { id: 'pixtral-12b-2409', name: 'Pixtral 12B', nameAr: 'Pixtral 12B', capabilities: ['رؤية خفيفة'] },
      { id: 'codestral-latest', name: 'Codestral', nameAr: 'Codestral', capabilities: ['برمجة', 'تحليل كود'] },
      { id: 'open-mistral-nemo', name: 'Mistral Nemo', nameAr: 'Mistral Nemo', capabilities: ['مفتوح', 'خفيف'] },
    ],
  },
  {
    id: 'cohere',
    name: 'Cohere',
    nameAr: 'Cohere',
    description: 'Command A, Aya Expanse',
    icon: '💎',
    color: 'bg-violet-500',
    defaultModel: 'command-a-03-2025',
    needsKey: true,
    keyPlaceholder: 'co-...',
    keyUrl: 'https://dashboard.cohere.com/api-keys',
    models: [
      { id: 'command-a-03-2025', name: 'Command A', nameAr: 'Command A', capabilities: ['أقوى', 'وكلاء', '22 لغة'], recommended: true },
      { id: 'command-a-reasoning-03-2025', name: 'Command A Reasoning', nameAr: 'Command A Reasoning', capabilities: ['استدلال', 'تحليل معقد'] },
      { id: 'command-a-vision-03-2025', name: 'Command A Vision', nameAr: 'Command A Vision', capabilities: ['رؤية', 'صور'] },
      { id: 'command-r-plus-08-2024', name: 'Command R+ (08-2024)', nameAr: 'Command R+', capabilities: ['مستقر', 'RAG'] },
      { id: 'command-r-08-2024', name: 'Command R (08-2024)', nameAr: 'Command R', capabilities: ['متوازن', 'RAG'] },
      { id: 'c4ai-aya-expanse-32b', name: 'Aya Expanse 32B', nameAr: 'Aya Expanse 32B', capabilities: ['متعدد اللغات', 'عربي'] },
      { id: 'c4ai-aya-expanse-8b', name: 'Aya Expanse 8B', nameAr: 'Aya Expanse 8B', capabilities: ['خفيف', 'متعدد اللغات'] },
    ],
  },
  {
    id: 'openrouter',
    name: 'OpenRouter',
    nameAr: 'OpenRouter',
    description: '200+ نموذج — مجاني ومدفوع',
    icon: '🌐',
    color: 'bg-indigo-500',
    defaultModel: 'openrouter/free',
    needsKey: true,
    keyPlaceholder: 'sk-or-...',
    keyUrl: 'https://openrouter.ai/keys',
    models: [
      { id: 'openrouter/free', name: 'Free Auto Router', nameAr: 'راوتر مجاني تلقائي', capabilities: ['مجاني', 'تلقائي'], free: true },
      { id: 'qwen/qwen3.6-27b:free', name: 'Qwen 3.6 27B', nameAr: 'Qwen 3.6 27B', capabilities: ['مجاني', 'أقوى كود', 'استدلال', 'مفتوح'], recommended: true, free: true },
      { id: 'qwen/qwen3.6-plus:free', name: 'Qwen 3.6 Plus', nameAr: 'Qwen 3.6 Plus', capabilities: ['مجاني', 'كود'], free: true },
      { id: 'qwen/qwen3-coder:free', name: 'Qwen3 Coder 480B', nameAr: 'Qwen3 Coder 480B', capabilities: ['مجاني', 'برمجة', '480B'], free: true },
      { id: 'qwen/qwen3-next-80b-a3b-instruct:free', name: 'Qwen3 Next 80B', nameAr: 'Qwen3 Next 80B', capabilities: ['مجاني', 'أحدث Qwen'], free: true },
      { id: 'minimax/minimax-m2.5:free', name: 'MiniMax M2.5', nameAr: 'MiniMax M2.5', capabilities: ['مجاني', 'إنتاجية'], free: true },
      { id: 'xiaomi/mimo-v2-omni', name: 'MiMo V2 Omni', nameAr: 'MiMo V2 Omni', capabilities: ['مجاني تقريباً', 'Xiaomi'], free: true },
      { id: 'xiaomi/mimo-v2-pro', name: 'MiMo V2 Pro', nameAr: 'MiMo V2 Pro', capabilities: ['مجاني تقريباً', 'Xiaomi'], free: true },
      { id: 'nvidia/nemotron-3-super-120b-a12b:free', name: 'Nemotron 3 Super 120B', nameAr: 'Nemotron 3 Super 120B', capabilities: ['مجاني', 'NVIDIA', '120B'], free: true },
      { id: 'nvidia/nemotron-3-nano-30b-a3b:free', name: 'Nemotron 3 Nano 30B', nameAr: 'Nemotron 3 Nano 30B', capabilities: ['مجاني', 'NVIDIA', 'خفيف'], free: true },
      { id: 'nvidia/nemotron-nano-9b-v2:free', name: 'Nemotron Nano 9B V2', nameAr: 'Nemotron Nano 9B', capabilities: ['مجاني', 'NVIDIA', 'أخف'], free: true },
      { id: 'z-ai/glm-4.5-air:free', name: 'GLM 4.5 Air (Free)', nameAr: 'GLM 4.5 Air', capabilities: ['مجاني', 'Z.AI'], free: true },
      { id: 'z-ai/glm-5.1', name: 'GLM-5.1', nameAr: 'GLM-5.1', capabilities: ['أقوى Z.AI', 'Agentic'] },
      { id: 'z-ai/glm-5v-turbo', name: 'GLM-5V Turbo', nameAr: 'GLM-5V Turbo', capabilities: ['رؤية + كود', 'متعدد الوسائط'] },
      { id: 'z-ai/glm-5-turbo', name: 'GLM-5 Turbo', nameAr: 'GLM-5 Turbo', capabilities: ['سريع', 'مهام طويلة'] },
      { id: 'z-ai/glm-4.7-flash', name: 'GLM-4.7 Flash', nameAr: 'GLM-4.7 Flash', capabilities: ['رخيص جداً', 'سريع'] },
      { id: 'openai/gpt-oss-120b:free', name: 'GPT-OSS 120B', nameAr: 'GPT-OSS 120B', capabilities: ['مجاني', 'OpenAI مفتوح'], free: true },
      { id: 'deepseek/deepseek-chat-v3-0324:free', name: 'DeepSeek V3', nameAr: 'DeepSeek V3', capabilities: ['مجاني', 'قوي'], free: true },
      { id: 'deepseek/deepseek-r1:free', name: 'DeepSeek R1', nameAr: 'DeepSeek R1', capabilities: ['مجاني', 'استدلال'], free: true },
      { id: 'meta-llama/llama-4-maverick:free', name: 'Llama 4 Maverick', nameAr: 'Llama 4 Maverick', capabilities: ['مجاني', 'أحدث'], free: true },
      { id: 'meta-llama/llama-4-scout:free', name: 'Llama 4 Scout', nameAr: 'Llama 4 Scout', capabilities: ['مجاني'], free: true },
      { id: 'meta-llama/llama-3.3-70b-instruct:free', name: 'Llama 3.3 70B', nameAr: 'Llama 3.3 70B', capabilities: ['مجاني', 'قوي'], free: true },
      { id: 'google/gemma-4-31b-it:free', name: 'Gemma 4 31B', nameAr: 'Gemma 4 31B', capabilities: ['مجاني', 'أقوى كود', 'Google', 'أحدث'], recommended: true, free: true },
      { id: 'google/gemma-4-26b-a4b-it:free', name: 'Gemma 4 26B MoE', nameAr: 'Gemma 4 26B MoE', capabilities: ['مجاني', 'Google', 'MoE', 'فعّال'], free: true },
      { id: 'google/gemma-3-27b-it:free', name: 'Gemma 3 27B', nameAr: 'Gemma 3 27B', capabilities: ['مجاني', 'Google'], free: true },
      { id: 'nousresearch/hermes-3-llama-3.1-405b:free', name: 'Hermes 3 405B', nameAr: 'Hermes 3 405B', capabilities: ['مجاني', '405B', 'ضخم'], free: true },
      { id: 'microsoft/phi-4:free', name: 'Phi-4', nameAr: 'Phi-4', capabilities: ['مجاني', 'Microsoft'], free: true },
      { id: 'stepfun/step-3.5-flash:free', name: 'Step 3.5 Flash', nameAr: 'Step 3.5 Flash', capabilities: ['مجاني', 'سريع'], free: true },
      { id: 'openai/gpt-oss-20b:free', name: 'GPT-OSS 20B', nameAr: 'GPT-OSS 20B', capabilities: ['مجاني', 'خفيف'], free: true },
      { id: 'openai/gpt-5.5', name: 'GPT-5.5', nameAr: 'GPT-5.5', capabilities: ['أحدث OpenAI', 'Agentic', 'سياق 1M'], recommended: true },
      { id: 'openai/gpt-5.3-codex', name: 'GPT-5.3 Codex', nameAr: 'GPT-5.3 Codex', capabilities: ['أقوى كود', 'Agentic'] },
      { id: 'openai/gpt-5.4', name: 'GPT-5.4', nameAr: 'GPT-5.4', capabilities: ['قوي'] },
      { id: 'openai/gpt-4.1', name: 'GPT-4.1', nameAr: 'GPT-4.1', capabilities: ['كود'] },
      { id: 'openai/o4-mini', name: 'o4-mini', nameAr: 'o4-mini', capabilities: ['استدلال', 'متوازن'] },
      { id: 'openai/o3-pro', name: 'o3-pro', nameAr: 'o3-pro', capabilities: ['أقوى استدلال'] },
      { id: 'anthropic/claude-opus-4.7', name: 'Claude Opus 4.7', nameAr: 'Claude Opus 4.7', capabilities: ['أقوى Claude', 'أحدث'] },
      { id: 'anthropic/claude-opus-4.6', name: 'Claude Opus 4.6', nameAr: 'Claude Opus 4.6', capabilities: ['قوي جداً'] },
      { id: 'anthropic/claude-sonnet-4.6', name: 'Claude Sonnet 4.6', nameAr: 'Claude Sonnet 4.6', capabilities: ['متوازن'] },
      { id: 'google/gemini-3.1-pro', name: 'Gemini 3.1 Pro', nameAr: 'Gemini 3.1 Pro', capabilities: ['أقوى Gemini'] },
      { id: 'google/gemini-2.5-pro', name: 'Gemini 2.5 Pro', nameAr: 'Gemini 2.5 Pro', capabilities: ['تحليل معقد'] },
      { id: 'google/gemma-4-31b-it', name: 'Gemma 4 31B (Paid)', nameAr: 'Gemma 4 31B', capabilities: ['256K سياق', 'كود'] },
      { id: 'google/gemma-4-26b-a4b-it', name: 'Gemma 4 26B MoE (Paid)', nameAr: 'Gemma 4 26B MoE', capabilities: ['MoE', 'فعّال'] },
      { id: 'x-ai/grok-4', name: 'Grok-4', nameAr: 'Grok-4', capabilities: ['أحدث xAI'] },
      { id: 'x-ai/grok-3', name: 'Grok-3', nameAr: 'Grok-3', capabilities: ['مستقر'] },
      { id: 'deepseek/deepseek-v4-flash', name: 'DeepSeek V4 Flash', nameAr: 'DeepSeek V4 Flash', capabilities: ['أحدث', 'سياق 1M'] },
      { id: 'deepseek/deepseek-v4-pro', name: 'DeepSeek V4 Pro', nameAr: 'DeepSeek V4 Pro', capabilities: ['أقوى DeepSeek', 'سياق 1M'] },
      { id: 'deepseek/deepseek-chat-v3-0324', name: 'DeepSeek V3', nameAr: 'DeepSeek V3', capabilities: ['قوي'] },
      { id: 'deepseek/deepseek-r1', name: 'DeepSeek R1', nameAr: 'DeepSeek R1', capabilities: ['استدلال'] },
      { id: 'mistralai/mistral-large', name: 'Mistral Large 3', nameAr: 'Mistral Large 3', capabilities: ['أقوى Mistral'] },
      { id: 'qwen/qwen3.6-plus', name: 'Qwen 3.6 Plus', nameAr: 'Qwen 3.6 Plus', capabilities: ['أقوى Qwen', 'سياق 1M'] },
      { id: 'cohere/command-a', name: 'Command A', nameAr: 'Command A', capabilities: ['وكلاء'] },
    ],
  },
];

export function getProviderById(id: string): AIProvider | undefined {
  return AI_PROVIDERS.find(p => p.id === id);
}

export function getModelsForProvider(providerId: string): AIModel[] {
  return getProviderById(providerId)?.models || [];
}

export function getDefaultModelForProvider(providerId: string): string {
  return getProviderById(providerId)?.defaultModel || 'default';
}

export async function callAI(
  prompt: string,
  providerId: string,
  apiKey: string,
  systemPrompt?: string,
  model?: string
): Promise<string> {
  const providerConfig = getProviderById(providerId);
  const res = await fetch('/api/ai', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      provider: providerId,
      model: model || providerConfig?.defaultModel || undefined,
      prompt,
      apiKey: apiKey || undefined,
      messages: [
        { role: 'system', content: systemPrompt || 'أنت محلل استثماري خبير. أجب بالعربية.' },
        { role: 'user', content: prompt },
      ],
    }),
  });
  const data = await res.json();
  if (!data.success) throw new Error(data.error || 'AI request failed');
  return data.content || '';
}
