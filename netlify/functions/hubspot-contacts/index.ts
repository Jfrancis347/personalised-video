import { Handler } from '@netlify/functions';
import fetch from 'node-fetch';

const HUBSPOT_API_KEY = process.env.HUBSPOT_PRIVATE_APP_TOKEN;
const HUBSPOT_API_URL = 'https://api.hubapi.com';

export const handler: Handler = async (event) => {
  // Only allow GET requests
  if (event.httpMethod !== 'GET') {
    return {
      statusCode: 405,
      body: JSON.stringify({ error: 'Method not allowed' })
    };
  }

  if (!HUBSPOT_API_KEY) {
    return {
      statusCode: 500,
      body: JSON.stringify({ error: 'HubSpot API key not configured' })
    };
  }

  try {
    const response = await fetch(
      `${HUBSPOT_API_URL}/crm/v3/objects/contacts?limit=100&properties=firstname,lastname,email,company,createdate`,
      {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${HUBSPOT_API_KEY}`,
          'Content-Type': 'application/json',
        },
      }
    );

    if (!response.ok) {
      throw new Error(`HubSpot API error: ${response.status}`);
    }

    const data = await response.json();
    
    const contacts = data.results.map((contact: any) => ({
      id: contact.id,
      firstName: contact.properties.firstname || '',
      lastName: contact.properties.lastname || '',
      email: contact.properties.email || '',
      company: contact.properties.company || '',
      createdAt: contact.properties.createdate || '',
    }));

    return {
      statusCode: 200,
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(contacts)
    };
  } catch (error) {
    console.error('Error fetching contacts:', error);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' })
    };
  }
};