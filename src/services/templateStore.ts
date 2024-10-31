import { ScriptTemplate } from '../types';

class TemplateStore {
  private templates: Map<string, ScriptTemplate> = new Map();
  private static instance: TemplateStore;

  private constructor() {}

  static getInstance(): TemplateStore {
    if (!TemplateStore.instance) {
      TemplateStore.instance = new TemplateStore();
    }
    return TemplateStore.instance;
  }

  async createTemplate(template: Omit<ScriptTemplate, 'id'>): Promise<ScriptTemplate> {
    const id = crypto.randomUUID();
    const newTemplate: ScriptTemplate = { ...template, id };
    this.templates.set(id, newTemplate);
    return newTemplate;
  }

  async getTemplate(id: string): Promise<ScriptTemplate | null> {
    return this.templates.get(id) || null;
  }

  async getAllTemplates(): Promise<ScriptTemplate[]> {
    return Array.from(this.templates.values());
  }

  async getActiveTemplates(): Promise<ScriptTemplate[]> {
    return Array.from(this.templates.values());
  }

  async updateTemplate(id: string, template: Partial<ScriptTemplate>): Promise<ScriptTemplate | null> {
    const existing = this.templates.get(id);
    if (!existing) return null;

    const updated = { ...existing, ...template };
    this.templates.set(id, updated);
    return updated;
  }

  async deleteTemplate(id: string): Promise<boolean> {
    return this.templates.delete(id);
  }
}

export const templateStore = TemplateStore.getInstance();