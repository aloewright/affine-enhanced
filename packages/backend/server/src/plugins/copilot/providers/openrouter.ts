import { Injectable } from '@nestjs/common';
import { AIProvider, AIProviderID } from './provider';
import { CopilotProviderConfig } from '../config';

@Injectable()
export class OpenRouter extends AIProvider {
  provider = AIProviderID.OpenRouter;

  constructor(private readonly config: CopilotProviderConfig) {
    super();
  }

  async getModels() {
    const res = await fetch('https://openrouter.ai/api/v1/models', {
      headers: {
        Authorization: `Bearer ${this.config.openRouter.apiKey}`,
      },
    });

    if (!res.ok) {
      throw new Error(`Failed to fetch models from OpenRouter: ${res.statusText}`);
    }

    const { data } = await res.json();
    return data.map((model: any) => model.id);
  }
}

