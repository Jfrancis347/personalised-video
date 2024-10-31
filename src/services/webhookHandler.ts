import { Contact } from '../types';
import { hubspotApi } from './hubspot';
import { videoGenerationService } from './videoGenerations';

interface WebhookPayload {
  subscriptionType: string;
  objectId: string;
  propertyName?: string;
  propertyValue?: string;
}

class WebhookHandler {
  async handleHubSpotWebhook(payload: WebhookPayload) {
    if (payload.subscriptionType === 'contact.creation') {
      await this.handleNewContact(payload.objectId);
    }
  }

  private async handleNewContact(contactId: string) {
    try {
      // Get contact details from HubSpot
      const contacts = await hubspotApi.getContacts();
      const contact = contacts.find(c => c.id === contactId);
      
      if (!contact) {
        console.error('Contact not found:', contactId);
        return;
      }

      // Get all active templates
      const { data: templates, error } = await supabase
        .from('video_templates')
        .select('*')
        .eq('is_active', true);

      if (error) throw error;

      // Generate videos for each template
      for (const template of templates) {
        try {
          await videoGenerationService.generateVideoForContact(template, contact);
        } catch (error) {
          console.error('Error generating video for template:', template.id, error);
          // Continue with other templates even if one fails
        }
      }
    } catch (error) {
      console.error('Error handling new contact:', error);
      throw error;
    }
  }
}

export const webhookHandler = new WebhookHandler();