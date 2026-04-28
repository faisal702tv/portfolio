import { NextRequest, NextResponse } from 'next/server';
import { getProviderApiKey } from '@/lib/ai-server-keys';
import { verifyToken } from '@/lib/auth';

// ================================
// Unified AI API - Multi-Provider Support
// Supports: Z.AI, OpenAI, Anthropic, x.ai, Google, DeepSeek, Groq, Mistral, Cohere, OpenRouter
// ================================

// Type definitions
type Provider = 'zai' | 'openai' | 'anthropic' | 'xai' | 'google' | 'deepseek' | 'groq' | 'mistral' | 'cohere' | 'openrouter';

interface ChatMessage {
  role: 'system' | 'user' | 'assistant';
  content: string | ContentPart[];
}

interface ContentPart {
  type: 'text' | 'image_url';
  text?: string;
  image_url?: { url: string };
}

interface AIRequest {
  provider?: Provider;
  model?: string;
  messages?: ChatMessage[];
  prompt?: string;
  type?: 'chat' | 'image' | 'vision';
  image?: string;
  size?: string;
  apiKey?: string;
  temperature?: number;
  max_tokens?: number;
  stream?: boolean;
}

interface AIResponse {
  success: boolean;
  type: string;
  content?: string;
  data?: string;
  model?: string;
  usage?: {
    prompt_tokens?: number;
    completion_tokens?: number;
    total_tokens?: number;
  };
  error?: string;
}

// Model configurations — ALL available models per provider (updated April 2026)
const MODEL_CONFIGS: Record<Provider, { models: string[]; endpoint: string }> = {
  zai: {
    models: [
      'glm-4.7-flash', 'glm-4.5-flash',
      'BigPickle-51', 'MiMo-V2-Omni', 'MiMo-V2-Pro',
      'MiniMax-M2.5', 'Nemotron-3-Super',
      'glm-5.1', 'glm-5', 'glm-5-turbo', 'glm-5v-turbo',
      'glm-4.7', 'glm-4.7-flashx', 'glm-4.6', 'glm-4.6v',
      'glm-4-long',
      'glm-4.5', 'glm-4.5-x', 'glm-4.5-air', 'glm-4.5-airx',
      'glm-4-32b-0414-128k',
    ],
    endpoint: 'https://api.z.ai/api/paas/v4/chat/completions'
  },
  openai: {
    models: [
      // GPT-5.5 series (latest April 2026)
      'gpt-5.5', 'gpt-5.5-pro',
      // GPT-5.4 series
      'gpt-5.4', 'gpt-5.4-mini', 'gpt-5.4-nano',
      // GPT-5.3 series
      'gpt-5.3-codex', 'gpt-5.3-instant', 'gpt-5',
      // GPT-4.1 series
      'gpt-4.1', 'gpt-4.1-mini', 'gpt-4.1-nano',
      // GPT-4o series
      'gpt-4o', 'gpt-4o-mini',
      // o-series (reasoning)
      'o3', 'o3-pro', 'o3-mini', 'o4-mini', 'o4-mini-high',
      'o1', 'o1-pro', 'o1-mini',
      // Codex
      'codex-mini-latest',
    ],
    endpoint: 'https://api.openai.com/v1/chat/completions'
  },
  anthropic: {
    models: [
      // Claude 4.7 (latest 2026)
      'claude-opus-4-7-20250410',
      // Claude 4.6 (latest 2026)
      'claude-opus-4-6-20260205', 'claude-sonnet-4-6-20260220',
      // Claude 4
      'claude-opus-4-20250514', 'claude-sonnet-4-20250514',
      // Claude 3.7
      'claude-3-7-sonnet-20250219',
      // Claude 3.5
      'claude-3-5-sonnet-20241022', 'claude-3-5-haiku-20241022',
      // Haiku 4.5
      'claude-haiku-4-5-20251001',
    ],
    endpoint: 'https://api.anthropic.com/v1/messages'
  },
  xai: {
    models: [
      // Grok 4 series (latest 2026)
      'grok-4', 'grok-4.1', 'grok-4.1-fast',
      // Grok 3 series
      'grok-3', 'grok-3-fast', 'grok-3-mini', 'grok-3-mini-fast',
      // Grok 2
      'grok-2-1212', 'grok-2-vision-1212',
    ],
    endpoint: 'https://api.x.ai/v1/chat/completions'
  },
  google: {
    models: [
      // Gemma 4 (latest 2026)
      'gemma-4-31b-it', 'gemma-4-26b-a4b-it',
      // Gemini 3.1 (latest 2026)
      'gemini-3.1-pro-preview',
      // Gemini 3
      'gemini-3-flash-preview', 'gemini-3.1-flash-lite-preview',
      // Gemini 2.5
      'gemini-2.5-pro', 'gemini-2.5-flash', 'gemini-2.5-flash-lite',
      // Gemini 2.0
      'gemini-2.0-flash', 'gemini-2.0-flash-lite',
      // Gemini 1.5
      'gemini-1.5-pro', 'gemini-1.5-flash',
    ],
    endpoint: 'https://generativelanguage.googleapis.com/v1beta/models'
  },
  deepseek: {
    models: [
      // V4 (latest 2026)
      'deepseek-v4-flash', 'deepseek-v4-pro',
      // V3.2 (current API)
      'deepseek-chat', 'deepseek-reasoner',
    ],
    endpoint: 'https://api.deepseek.com/v1/chat/completions'
  },
  groq: {
    models: [
      // Llama 4
      'meta-llama/llama-4-scout-17b-16e-instruct',
      'meta-llama/llama-4-maverick-17b-128e-instruct',
      // Llama 3.3/3.1
      'llama-3.3-70b-versatile', 'llama-3.1-8b-instant',
      // OpenAI open-source
      'openai/gpt-oss-120b', 'openai/gpt-oss-20b',
      // Qwen
      'qwen/qwen-3-32b', 'qwen-qwq-32b', 'qwen/qwen3.6-27b',
      // Kimi
      'moonshotai/kimi-k2-instruct-0905',
      // DeepSeek on Groq
      'deepseek-r1-distill-llama-70b',
      // Mixtral / Gemma
      'mixtral-8x7b-32768', 'gemma2-9b-it',
      // Mistral
      'mistral-saba-24b',
      // Compound
      'compound-beta', 'compound-beta-mini',
    ],
    endpoint: 'https://api.groq.com/openai/v1/chat/completions'
  },
  mistral: {
    models: [
      // Mistral Large 3
      'mistral-large-latest',
      // Mistral Small 4 (latest 2026)
      'mistral-small-latest',
      // Ministral 3 series
      'ministral-14b-2512', 'ministral-8b-2512', 'ministral-3b-2512',
      // Magistral (reasoning)
      'magistral-medium-2509', 'magistral-small-2509',
      // Vision
      'pixtral-large-latest', 'pixtral-12b-2409',
      // Code
      'codestral-latest',
      // Open source
      'open-mistral-nemo',
    ],
    endpoint: 'https://api.mistral.ai/v1/chat/completions'
  },
  cohere: {
    models: [
      // Command A (latest)
      'command-a-03-2025', 'command-a-reasoning-03-2025', 'command-a-vision-03-2025',
      // Command R+ / R
      'command-r-plus-08-2024', 'command-r-08-2024',
      // Aya
      'c4ai-aya-expanse-32b', 'c4ai-aya-expanse-8b',
    ],
    endpoint: 'https://api.cohere.ai/v2/chat'
  },
  openrouter: {
    models: [
      'openrouter/free',
      'qwen/qwen3.6-27b:free', 'qwen/qwen3.6-plus:free', 'qwen/qwen3-coder:free', 'qwen/qwen3-next-80b-a3b-instruct:free',
      'minimax/minimax-m2.5:free',
      'xiaomi/mimo-v2-omni', 'xiaomi/mimo-v2-pro',
      'nvidia/nemotron-3-super-120b-a12b:free', 'nvidia/nemotron-3-nano-30b-a3b:free', 'nvidia/nemotron-nano-9b-v2:free',
      'z-ai/glm-4.5-air:free',
      'z-ai/glm-5.1', 'z-ai/glm-5v-turbo', 'z-ai/glm-5-turbo', 'z-ai/glm-4.7-flash',
      'openai/gpt-oss-120b:free',
      'deepseek/deepseek-chat-v3-0324:free', 'deepseek/deepseek-r1:free',
      'meta-llama/llama-4-maverick:free', 'meta-llama/llama-4-scout:free',
      'meta-llama/llama-3.3-70b-instruct:free',
      'google/gemma-4-31b-it:free', 'google/gemma-4-26b-a4b-it:free',
      'google/gemma-3-27b-it:free',
      'nousresearch/hermes-3-llama-3.1-405b:free',
      'microsoft/phi-4:free',
      'stepfun/step-3.5-flash:free',
      'openai/gpt-5.5', 'openai/gpt-5.3-codex', 'openai/gpt-5.4', 'openai/gpt-4.1', 'openai/o3-pro', 'openai/o4-mini',
      'anthropic/claude-opus-4.7', 'anthropic/claude-opus-4.6', 'anthropic/claude-sonnet-4.6',
      'google/gemini-3.1-pro', 'google/gemini-2.5-pro',
      'google/gemma-4-31b-it', 'google/gemma-4-26b-a4b-it',
      'x-ai/grok-4', 'x-ai/grok-3',
      'deepseek/deepseek-v4-flash', 'deepseek/deepseek-v4-pro',
      'deepseek/deepseek-chat-v3-0324', 'deepseek/deepseek-r1',
      'qwen/qwen3.6-plus',
      'mistralai/mistral-large', 'cohere/command-a',
    ],
    endpoint: 'https://openrouter.ai/api/v1/chat/completions'
  }
};

// Default models for each provider
const DEFAULT_MODELS: Record<Provider, string> = {
  zai: 'glm-4.7-flash',
  openai: 'gpt-4.1',
  anthropic: 'claude-sonnet-4-6-20260220',
  xai: 'grok-3-mini',
  google: 'gemini-2.5-flash',
  deepseek: 'deepseek-chat',
  groq: 'llama-3.3-70b-versatile',
  mistral: 'mistral-large-latest',
  cohere: 'command-a-03-2025',
  openrouter: 'openrouter/free'
};

// Normalize messages to a consistent format
function normalizeMessages(messages: ChatMessage[]): { role: string; content: string | ContentPart[] }[] {
  return messages.map(msg => ({
    role: msg.role,
    content: msg.content
  }));
}

// Convert messages to Anthropic format
function toAnthropicMessages(messages: ChatMessage[]): { system?: string; messages: { role: string; content: string | ContentPart[] }[] } {
  const systemMessage = messages.find(m => m.role === 'system');
  const otherMessages = messages.filter(m => m.role !== 'system');
  
  return {
    system: typeof systemMessage?.content === 'string' ? systemMessage.content : undefined,
    messages: otherMessages.map(msg => ({
      role: msg.role === 'assistant' ? 'assistant' : 'user',
      content: msg.content
    }))
  };
}

// Convert messages to Google Gemini format
function toGeminiMessages(messages: ChatMessage[]): { contents: { role: string; parts: { text?: string; inlineData?: { mimeType: string; data: string } }[] }[] } {
  const contents = messages
    .filter(m => m.role !== 'system')
    .map(msg => {
      const parts: { text?: string; inlineData?: { mimeType: string; data: string } }[] = [];
      
      if (typeof msg.content === 'string') {
        parts.push({ text: msg.content });
      } else if (Array.isArray(msg.content)) {
        for (const part of msg.content) {
          if (part.type === 'text' && part.text) {
            parts.push({ text: part.text });
          } else if (part.type === 'image_url' && part.image_url?.url) {
            // Handle base64 image
            const url = part.image_url.url;
            if (url.startsWith('data:')) {
              const [header, data] = url.split(',');
              const mimeType = header.match(/data:([^;]+)/)?.[1] || 'image/png';
              parts.push({ inlineData: { mimeType, data } });
            }
          }
        }
      }
      
      return {
        role: msg.role === 'assistant' ? 'model' : 'user',
        parts
      };
    });
  
  return { contents };
}

// Convert messages to Cohere format
function toCohereMessages(messages: ChatMessage[]): { message: string; chat_history?: { role: string; message: string }[] } {
  const lastUserMessage = messages.filter(m => m.role === 'user').pop();
  const chatHistory = messages.slice(0, -1).map(m => ({
    role: m.role === 'user' ? 'USER' : m.role === 'assistant' ? 'CHATBOT' : 'SYSTEM',
    message: typeof m.content === 'string' ? m.content : ''
  }));
  
  return {
    message: typeof lastUserMessage?.content === 'string' ? lastUserMessage.content : '',
    chat_history: chatHistory.length > 0 ? chatHistory : undefined
  };
}

// Z.AI / Free fallback handler
// Tries: 1) Z.AI SDK  2) Any key from DB/env (Groq → OpenRouter → OpenAI → DeepSeek → Anthropic → Google)
async function handleZAI(request: AIRequest, userId?: string): Promise<AIResponse> {
  const msgs = (request.messages?.map(m => ({
    role: m.role,
    content: typeof m.content === 'string' ? m.content : JSON.stringify(m.content),
  }))) || [
    { role: 'system' as const, content: 'أنت مساعد ذكي متخصص في الاستثمار والأسواق المالية. أجب بالعربية.' },
    { role: 'user' as const, content: request.prompt || 'مرحبا' }
  ];

  // 1) Try Z.AI API key via OpenAI-compatible endpoint first
  const zaiKey = request.apiKey || await getProviderApiKey('zai', undefined, userId) || '';
  if (zaiKey && !zaiKey.includes('dummy') && zaiKey.trim().length >= 10) {
    const result = await handleOpenAICompatible(
      { ...request, messages: msgs as ChatMessage[], model: request.model || 'glm-4.7-flash' },
      'https://api.z.ai/api/paas/v4/chat/completions',
      zaiKey,
      'zai'
    );
    if (result.success) return result;
  }

  // 2) Try Z.AI SDK (reads from .z-ai-config)
  try {
    const ZAI = (await import('z-ai-web-dev-sdk')).default;
    const zai = await ZAI.create();
    if (zai && typeof zai.chat?.completions?.create === 'function') {
      const completion = await zai.chat.completions.create({ messages: msgs });
      if (completion.choices?.[0]?.message?.content) {
        return {
          success: true,
          type: 'chat',
          content: completion.choices[0].message.content,
          model: completion.model || 'z-ai',
          usage: completion.usage,
        };
      }
    }
  } catch (e: unknown) {
    const errMsg = e instanceof Error ? e.message : '';
    if (errMsg.includes('404') || errMsg.includes('Configuration file not found')) {
      // Z.AI SDK config is broken/missing, skip to fallbacks
    } else {
      // Other error, still try fallbacks
    }
  }

  // Fallback chain: try resolving keys from DB + env for each provider
  // Fallback chain: try resolving keys from DB + env for each provider
  const openaiCompatible: [string, string, string][] = [
    ['groq', 'llama-3.3-70b-versatile', 'https://api.groq.com/openai/v1/chat/completions'],
    ['openrouter', 'openrouter/free', 'https://openrouter.ai/api/v1/chat/completions'],
    ['openai', 'gpt-4o-mini', 'https://api.openai.com/v1/chat/completions'],
    ['deepseek', 'deepseek-chat', 'https://api.deepseek.com/v1/chat/completions'],
    ['xai', 'grok-3-mini', 'https://api.x.ai/v1/chat/completions'],
    ['mistral', 'mistral-small-latest', 'https://api.mistral.ai/v1/chat/completions'],
  ];

  for (const [id, model, endpoint] of openaiCompatible) {
    try {
      const key = await getProviderApiKey(id, undefined, userId) || await getProviderApiKey(
        id === 'google' ? 'google_gemini' : id === 'anthropic' ? 'anthropic_claude' : id === 'xai' ? 'xai_grok' : id,
        undefined,
        userId
      );
      if (!key || key.includes('dummy') || key.trim().length < 10) continue;
      return await handleOpenAICompatible(
        { ...request, messages: msgs as ChatMessage[], model },
        endpoint, key, id as Provider
      );
    } catch { /* try next */ }
  }

  // Try Anthropic
  try {
    const anthropicKey = await getProviderApiKey('anthropic', undefined, userId) || await getProviderApiKey('anthropic_claude', undefined, userId);
    if (anthropicKey && !anthropicKey.includes('dummy') && anthropicKey.trim().length >= 10) {
      return await handleAnthropic(
        { ...request, messages: msgs as ChatMessage[], model: DEFAULT_MODELS.anthropic },
        anthropicKey
      );
    }
  } catch { /* try next */ }

  // Try Google
  try {
    const googleKey = await getProviderApiKey('google', undefined, userId) || await getProviderApiKey('google_gemini', undefined, userId);
    if (googleKey && !googleKey.includes('dummy') && googleKey.trim().length >= 10) {
      return await handleGoogle(
        { ...request, messages: msgs as ChatMessage[], model: DEFAULT_MODELS.google },
        googleKey
      );
    }
  } catch { /* try next */ }

  // Try Cohere
  try {
    const cohereKey = await getProviderApiKey('cohere', undefined, userId);
    if (cohereKey && !cohereKey.includes('dummy') && cohereKey.trim().length >= 10) {
      return await handleCohere(
        { ...request, messages: msgs as ChatMessage[], model: DEFAULT_MODELS.cohere },
        cohereKey
      );
    }
  } catch { /* try next */ }

  // All providers failed
  return {
    success: false,
    type: 'error',
    error: 'لا يوجد مزود ذكاء اصطناعي متاح. يرجى إضافة مفتاح API من صفحة الملف الشخصي والإعدادات.\n\n' +
      'المزودين المدعومين:\n' +
      '1. Groq (مجاني) — groq.com\n' +
      '2. OpenRouter (نماذج مجانية) — openrouter.ai\n' +
      '3. Google Gemini — ai.google.dev\n' +
      '4. OpenAI — platform.openai.com\n' +
      '5. DeepSeek — deepseek.com\n' +
      '6. Anthropic — anthropic.com\n\n' +
      'أدخل مفتاح API في صفحة الملف الشخصي والإعدادات → قسم API والاشتراكات',
  };
}

// OpenAI-compatible API handler (OpenAI, x.ai, DeepSeek, Groq, Mistral, OpenRouter)
async function handleOpenAICompatible(
  request: AIRequest,
  endpoint: string,
  apiKey: string,
  providerHint?: Provider
): Promise<AIResponse> {
  try {
    const fallbackProvider = providerHint || 'openai';
    const model = request.model || DEFAULT_MODELS[fallbackProvider] || DEFAULT_MODELS.openai;
    
    const response = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model,
        messages: request.messages ? normalizeMessages(request.messages) : [
          { role: 'system', content: 'You are a helpful assistant.' },
          { role: 'user', content: request.prompt || 'Hello' }
        ],
        temperature: request.temperature,
        max_tokens: request.max_tokens,
        stream: false,
      }),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.error?.message || `API request failed with status ${response.status}`);
    }

    const data = await response.json();
    
    return {
      success: true,
      type: 'chat',
      content: data.choices?.[0]?.message?.content,
      model: data.model,
      usage: data.usage,
    };
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return {
      success: false,
      type: 'error',
      error: errorMessage,
    };
  }
}

// Anthropic Claude handler
async function handleAnthropic(
  request: AIRequest,
  apiKey: string
): Promise<AIResponse> {
  try {
    const model = request.model || DEFAULT_MODELS.anthropic;
    const { system, messages } = toAnthropicMessages(request.messages || [
      { role: 'user', content: request.prompt || 'Hello' }
    ]);

    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01',
        'anthropic-dangerous-direct-browser-access': 'true',
      },
      body: JSON.stringify({
        model,
        max_tokens: request.max_tokens || 4096,
        system,
        messages,
        temperature: request.temperature,
      }),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.error?.message || `API request failed with status ${response.status}`);
    }

    const data = await response.json();
    
    // Extract text content from response
    let content = '';
    if (data.content && Array.isArray(data.content)) {
      content = data.content
        .filter((block: { type: string }) => block.type === 'text')
        .map((block: { text: string }) => block.text)
        .join('');
    }

    return {
      success: true,
      type: 'chat',
      content,
      model: data.model,
      usage: {
        prompt_tokens: data.usage?.input_tokens,
        completion_tokens: data.usage?.output_tokens,
        total_tokens: (data.usage?.input_tokens || 0) + (data.usage?.output_tokens || 0),
      },
    };
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return {
      success: false,
      type: 'error',
      error: errorMessage,
    };
  }
}

// Google Gemini handler
async function handleGoogle(
  request: AIRequest,
  apiKey: string
): Promise<AIResponse> {
  try {
    const model = request.model || DEFAULT_MODELS.google;
    const { contents } = toGeminiMessages(request.messages || [
      { role: 'user', content: request.prompt || 'Hello' }
    ]);

    // Get system instruction from system message
    const systemMessage = request.messages?.find(m => m.role === 'system');
    const systemInstruction = typeof systemMessage?.content === 'string' 
      ? { parts: [{ text: systemMessage.content }] }
      : undefined;

    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          contents,
          systemInstruction,
          generationConfig: {
            temperature: request.temperature,
            maxOutputTokens: request.max_tokens,
          },
        }),
      }
    );

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.error?.message || `API request failed with status ${response.status}`);
    }

    const data = await response.json();
    
    // Extract text from Gemini response
    const content = data.candidates?.[0]?.content?.parts
      ?.map((part: { text?: string }) => part.text)
      .filter(Boolean)
      .join('') || '';

    return {
      success: true,
      type: 'chat',
      content,
      model: model,
      usage: {
        prompt_tokens: data.usageMetadata?.promptTokenCount,
        completion_tokens: data.usageMetadata?.candidatesTokenCount,
        total_tokens: data.usageMetadata?.totalTokenCount,
      },
    };
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return {
      success: false,
      type: 'error',
      error: errorMessage,
    };
  }
}

// Cohere handler
async function handleCohere(
  request: AIRequest,
  apiKey: string
): Promise<AIResponse> {
  try {
    const model = request.model || DEFAULT_MODELS.cohere;
    const { message, chat_history } = toCohereMessages(request.messages || [
      { role: 'user', content: request.prompt || 'Hello' }
    ]);

    const response = await fetch('https://api.cohere.ai/v1/chat', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model,
        message,
        chat_history,
        temperature: request.temperature,
        max_tokens: request.max_tokens,
      }),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.message || `API request failed with status ${response.status}`);
    }

    const data = await response.json();
    
    return {
      success: true,
      type: 'chat',
      content: data.text,
      model: model,
      usage: {
        prompt_tokens: data.meta?.tokens?.input_tokens,
        completion_tokens: data.meta?.tokens?.output_tokens,
        total_tokens: (data.meta?.tokens?.input_tokens || 0) + (data.meta?.tokens?.output_tokens || 0),
      },
    };
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return {
      success: false,
      type: 'error',
      error: errorMessage,
    };
  }
}

// x.ai (Grok) handler
async function handleXAI(
  request: AIRequest,
  apiKey: string
): Promise<AIResponse> {
  try {
    const model = request.model || DEFAULT_MODELS.xai;
    
    const response = await fetch('https://api.x.ai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model,
        messages: request.messages ? normalizeMessages(request.messages) : [
          { role: 'system', content: 'You are a helpful assistant.' },
          { role: 'user', content: request.prompt || 'Hello' }
        ],
        temperature: request.temperature,
        max_tokens: request.max_tokens,
        stream: false,
      }),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.error?.message || `API request failed with status ${response.status}`);
    }

    const data = await response.json();
    
    return {
      success: true,
      type: 'chat',
      content: data.choices?.[0]?.message?.content,
      model: data.model,
      usage: data.usage,
    };
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return {
      success: false,
      type: 'error',
      error: errorMessage,
    };
  }
}

// Main route handler for detecting provider from model name
function detectProviderFromModel(model: string): Provider {
  // Z.AI / GLM models
  if (model.startsWith('glm-')) return 'zai';
  
  // Anthropic models
  if (model.startsWith('claude-')) return 'anthropic';
  
  // x.ai models
  if (model.startsWith('grok-')) return 'xai';
  
  // Google models
  if (model.startsWith('gemini-')) return 'google';
  
  // DeepSeek models
  if (model.startsWith('deepseek-')) return 'deepseek';
  
  // Mistral models
  if (model.includes('mistral') || model.includes('codestral')) return 'mistral';
  
  // OpenAI models
  if (model.startsWith('gpt-') || model.startsWith('o1-') || model.startsWith('o3') || model.startsWith('o4') || model.startsWith('chatgpt-') || model.startsWith('codex-')) return 'openai';
  
  // OpenRouter models (contains /)
  if (model.includes('/')) return 'openrouter';
  
  // Default to zai
  return 'zai';
}

// Main POST handler
export async function POST(request: NextRequest) {
  try {
    const authHeader = request.headers.get('authorization');
    const authUser = authHeader?.startsWith('Bearer ')
      ? verifyToken(authHeader.substring(7))
      : null;
    const userId = authUser?.id;

    const body: AIRequest = await request.json();
    const { 
      provider: requestedProvider, 
      model, 
      messages, 
      prompt, 
      type = 'chat',
      image,
      size = '1024x1024',
      apiKey,
      temperature,
      max_tokens
    } = body;

    // Determine provider
    let provider: Provider = requestedProvider || 'zai';
    
    // Auto-detect provider from model if not specified
    if (!requestedProvider && model) {
      provider = detectProviderFromModel(model);
    }

    // Resolve API key: DB (encrypted) → request body → env variable
    let resolvedKey = apiKey;
    if (provider !== 'zai') {
      const serverKey = await getProviderApiKey(provider, apiKey, userId);
      if (serverKey) {
        resolvedKey = serverKey;
      }
      // Validate we have a real key (not dummy/empty)
      if (!resolvedKey || resolvedKey.includes('dummy') || resolvedKey.trim().length < 10) {
        return NextResponse.json({
          success: false,
          type: 'error',
          error: `مفتاح API غير صالح لمزود ${provider}. يرجى إدخال مفتاح صحيح في صفحة الملف الشخصي والإعدادات أو إضافته في ملف .env\n\nAPI key is required for ${provider}. Add it in the Profile & Settings page or set the environment variable.`,
        }, { status: 400 });
      }
    }

    // Prepare the request object
    const aiRequest: AIRequest = {
      provider,
      model,
      messages,
      prompt,
      type,
      image,
      size,
      apiKey: resolvedKey,
      temperature,
      max_tokens,
    };

    let result: AIResponse;

    // Ensure model is set per provider default
    if (!aiRequest.model || aiRequest.model === 'default' || aiRequest.model.trim() === '') {
      aiRequest.model = DEFAULT_MODELS[provider] || DEFAULT_MODELS.openai;
    }

    // Route to appropriate handler
    switch (provider) {
      case 'zai':
        result = await handleZAI(aiRequest, userId);
        break;
        
      case 'anthropic':
        result = await handleAnthropic(aiRequest, resolvedKey!);
        break;

      case 'xai':
        result = await handleXAI(aiRequest, resolvedKey!);
        break;

      case 'google':
        result = await handleGoogle(aiRequest, resolvedKey!);
        break;

      case 'cohere':
        result = await handleCohere(aiRequest, resolvedKey!);
        break;

      case 'openai':
        result = await handleOpenAICompatible(aiRequest, 'https://api.openai.com/v1/chat/completions', resolvedKey!, 'openai');
        break;

      case 'deepseek':
        result = await handleOpenAICompatible(aiRequest, 'https://api.deepseek.com/v1/chat/completions', resolvedKey!, 'deepseek');
        break;

      case 'groq':
        result = await handleOpenAICompatible(aiRequest, 'https://api.groq.com/openai/v1/chat/completions', resolvedKey!, 'groq');
        break;

      case 'mistral':
        result = await handleOpenAICompatible(aiRequest, 'https://api.mistral.ai/v1/chat/completions', resolvedKey!, 'mistral');
        break;

      case 'openrouter':
        result = await handleOpenAICompatible(aiRequest, 'https://openrouter.ai/api/v1/chat/completions', resolvedKey!, 'openrouter');
        break;
        
      default:
        result = {
          success: false,
          type: 'error',
          error: `Unknown provider: ${provider}`,
        };
    }

    return NextResponse.json(result);

  } catch (error: unknown) {
    console.error('AI API Error:', error);
    const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred';
    return NextResponse.json({
      success: false,
      type: 'error',
      error: errorMessage,
    }, { status: 500 });
  }
}

// GET handler for simple queries
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const query = searchParams.get('query');
    const provider = searchParams.get('provider') as Provider | null;
    const model = searchParams.get('model');
    const apiKey = searchParams.get('apiKey');
    
    if (!query) {
      return NextResponse.json({
        success: false,
        type: 'error',
        error: 'Query parameter is required',
      }, { status: 400 });
    }

    // Default to Z.AI for GET requests if no provider specified
    const selectedProvider = provider || 'zai';

    if (selectedProvider !== 'zai' && !apiKey) {
      return NextResponse.json({
        success: false,
        type: 'error',
        error: `API key is required for ${selectedProvider} provider. Please provide it in the apiKey parameter.`,
      }, { status: 400 });
    }

    // Prepare request for POST handler
    const postHeaders: Record<string, string> = { 'Content-Type': 'application/json' };
    const forwardedAuth = request.headers.get('authorization');
    if (forwardedAuth) {
      postHeaders.Authorization = forwardedAuth;
    }

    const postRequest = new NextRequest(request.url, {
      method: 'POST',
      headers: postHeaders,
      body: JSON.stringify({
        provider: selectedProvider,
        model,
        messages: [{ role: 'user', content: query }],
        apiKey,
      }),
    });

    return POST(postRequest);

  } catch (error: unknown) {
    console.error('AI GET Error:', error);
    const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred';
    return NextResponse.json({
      success: false,
      type: 'error',
      error: errorMessage,
    }, { status: 500 });
  }
}

// Export model configurations for frontend use
export async function OPTIONS() {
  return NextResponse.json({
    providers: Object.keys(MODEL_CONFIGS),
    models: MODEL_CONFIGS,
    defaultModels: DEFAULT_MODELS,
  });
}
