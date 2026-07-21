/**
 * Catalogue des fournisseurs IA supportés (ADR.16). Source unique pour : le test de connexion réel,
 * l'endpoint de guidage `/ai/providers` (fournisseurs + modèles suggérés + où trouver la clé), et la
 * sélection d'adaptateur. Les modèles suggérés sont **compatibles vision** (1er cas d'usage : OCR) ;
 * l'utilisateur peut toujours saisir un autre modèle.
 */
export type AiProviderKind = 'openai-compatible' | 'anthropic' | 'gemini';

export interface AiProviderInfo {
  id: string;
  label: string;
  kind: AiProviderKind;
  baseUrl: string;
  suggestedModels: string[];
  requiresKey: boolean;
  keyUrl?: string;
  keyHint?: string;
}

export const AI_PROVIDERS: AiProviderInfo[] = [
  {
    id: 'openai',
    label: 'OpenAI',
    kind: 'openai-compatible',
    baseUrl: 'https://api.openai.com/v1',
    suggestedModels: ['gpt-4o-mini', 'gpt-4o'],
    requiresKey: true,
    keyUrl: 'https://platform.openai.com/api-keys',
    keyHint: 'sk-…',
  },
  {
    id: 'anthropic',
    label: 'Anthropic (Claude)',
    kind: 'anthropic',
    baseUrl: 'https://api.anthropic.com/v1',
    suggestedModels: ['claude-3-5-sonnet-latest', 'claude-3-5-haiku-latest'],
    requiresKey: true,
    keyUrl: 'https://console.anthropic.com/settings/keys',
    keyHint: 'sk-ant-…',
  },
  {
    id: 'gemini',
    label: 'Google Gemini',
    kind: 'gemini',
    baseUrl: 'https://generativelanguage.googleapis.com/v1beta',
    suggestedModels: ['gemini-1.5-flash', 'gemini-1.5-pro'],
    requiresKey: true,
    keyUrl: 'https://aistudio.google.com/app/apikey',
    keyHint: 'AIza…',
  },
  {
    id: 'mistral',
    label: 'Mistral AI',
    kind: 'openai-compatible',
    baseUrl: 'https://api.mistral.ai/v1',
    suggestedModels: ['pixtral-12b-2409', 'pixtral-large-latest'],
    requiresKey: true,
    keyUrl: 'https://console.mistral.ai/api-keys',
    keyHint: '…',
  },
  {
    id: 'ollama',
    label: 'Ollama (local)',
    kind: 'openai-compatible',
    baseUrl: 'http://localhost:11434/v1',
    suggestedModels: ['llava', 'llama3.2-vision'],
    requiresKey: false,
    keyHint: 'aucune clé requise (local)',
  },
];

export function findProvider(id: string): AiProviderInfo | undefined {
  return AI_PROVIDERS.find((provider) => provider.id === id);
}
