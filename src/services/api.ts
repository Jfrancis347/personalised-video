import { env } from '../config/env';

export interface Contact {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  company?: string;
}

class HubSpotAPI {
  private isDevelopment = import.meta.env.DEV;

  async getContacts(): Promise<Contact[]> {
    if (this.isDevelopment) {
      return this.getMockContacts();
    }

    try {
      const response = await fetch('/.netlify/functions/hubspot-contacts');

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      return data;
    } catch (error) {
      console.error('Error fetching contacts:', error);
      throw error;
    }
  }

  private getMockContacts(): Contact[] {
    return [
      {
        id: '1',
        firstName: 'John',
        lastName: 'Doe',
        email: 'john.doe@example.com',
        company: 'Acme Corp'
      },
      {
        id: '2',
        firstName: 'Jane',
        lastName: 'Smith',
        email: 'jane.smith@example.com',
        company: 'Tech Solutions'
      }
    ];
  }

  async validateApiToken(): Promise<boolean> {
    if (this.isDevelopment) {
      return true;
    }

    try {
      const response = await fetch('/.netlify/functions/hubspot-contacts');
      return response.ok;
    } catch (error) {
      console.error('Error validating API token:', error);
      return false;
    }
  }
}

export const hubspotApi = new HubSpotAPI();