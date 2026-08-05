export interface ModelConfig {
  oneCreditTokens: number;
  functionName: 'generateAnthropic' | 'generateOpenRouter' | 'generate4oMini';
  imageSupport?: boolean;
  defaultParams?: {
    maxTokens: number;
    temperature: number;
    model: string;
  };
  keywords: string[];
}

export const modelKeywordMap: Record<string, ModelConfig> = {
  'glm-text': {
    oneCreditTokens: 8192,
    functionName: 'generateOpenRouter',
    imageSupport: false,
    defaultParams: {
      maxTokens: 8192,
      temperature: 0.5,
      model: 'z-ai/glm-5.2',
    },
    keywords: ['fix', 'debug', 'quick', 'fast', 'quick fix', 'minor change', 'small', 'simple', 'basic','instant'],
  },
  'glm-vision': {
    oneCreditTokens: 4096,
    functionName: 'generateOpenRouter',
    imageSupport: true,
    defaultParams: {
      maxTokens: 8192,
      temperature: 0.7,
      model: 'z-ai/glm-4.6v',
    },
    keywords: [
      'improve',
      'optimize',
      'architecture',
      'design',
      'complex',
      'best practices',
      'advanced',
      'enhance',
      'professional',
      'system',
      'detailed',
      'expert',
      'top',
      'best',
      'generate',
      'create',
    ],
  },

  // 'gpt-4o': {
  //   oneCreditTokens: 1800,
  //   functionName: 'generateOpenRouter',
  //   imageSupport: true,
  //   defaultParams: {
  //     maxTokens: 4096,
  //     temperature: 0.5,
  //     model: 'gpt-4',
  //   },
  //   keywords: [
  //     'fix',
  //     'explain',
  //     'algorithm',
  //     'complex system',
  //     'design pattern',
  //     'architecture',
  //     'optimize',
  //     'advanced',
  //     'large',
  //   ],
  // },
  // 'gpt-4o-mini': {
  //   oneCreditTokens: 300,
  //   functionName: 'generate4oMini',
  //   imageSupport: true,
  //   defaultParams: {
  //     maxTokens: 18192,
  //     temperature: 0.5,
  //     model: 'openai/gpt-4o-mini',
  //   },
  //   keywords: ['small', 'simple', 'basic', 'quick', 'minimal'],
  // },
    // 'double-haiku': {
  //   oneCreditTokens: 2048,
  //   functionName: 'generateOpenRouter',
  //   imageSupport: false,
  //   defaultParams: {
  //     maxTokens: 4096,
  //     temperature: 0.5,
  //     model: 'anthropic/claude-3.5-haiku',
  //   },
  //   keywords: [
  //     'validate',
  //     'verify',
  //     'check',
  //     'review',
  //     'test',
  //     'evaluate',
  //     'analyze',
  //     'compare',
  //     'assess',
  //     'think',
  //   ],
  // },
};
