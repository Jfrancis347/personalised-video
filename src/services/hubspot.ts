import { env } from '../config/env';
import type { Contact } from '../types';

// Sample contacts for development
const SAMPLE_CONTACTS: Contact[] = [
  {
    id: '1',
    firstName: 'John',
    lastName: 'Doe',
    email: 'john.doe@example.com',
    company: 'Acme Corp',
    createdAt: new Date().toISOString()
  },
  {
    id: '2',
    firstName: 'Jane',
    lastName: 'Smith',
    email: 'jane.smith@example.com',
    company: 'Tech Solutions',
    createdAt: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString() // Yesterday
  }
];

class HubSpotAPI {
  private isDevelopment = import.meta.env.DEV;

  async getContacts(): Promise<Contact[]> {
    // In development mode, return sample contacts
    if (this.isDevelopment) {
      console.log('Using sample contacts in development mode');
      return SAMPLE_CONTACTS;
    }

    try {
      const response = await fetch('/.netlify/functions/hubspot-contacts');

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const contacts = await response.json();
      return contacts;
    } catch (error) {
      console.error('Error fetching contacts:', error);
      throw error;
    }
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