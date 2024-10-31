import { Handler } from '@netlify/functions';

const HEYGEN_API_URL = 'https://api.heygen.com/v1';
const HEYGEN_API_KEY = process.env.HEYGEN_API_KEY;

export const handler: Handler = async (event) => {
  // Only allow POST requests
  if (event.httpMethod !== 'POST') {
    return {
      statusCode: 405,
      body: JSON.stringify({ error: 'Method not allowed' })
    };
  }

  if (!HEYGEN_API_KEY) {
    return {
      statusCode: 500,
      body: JSON.stringify({ error: 'HeyGen API key not configured' })
    };
  }

  try {
    const { endpoint, method = 'GET', body } = JSON.parse(event.body || '{}');

    if (!endpoint) {
      throw new Error('Endpoint is required');
    }

    const response = await fetch(`${HEYGEN_API_URL}${endpoint}`, {
      method,
      headers: {
        'Authorization': `Bearer ${HEYGEN_API_KEY}`,
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      },
      ...(body && { body: JSON.stringify(body) })
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(JSON.stringify(data));
    }

    return {
      statusCode: 200,
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(data)
    };
  } catch (error) {
    console.error('Error proxying request to HeyGen:', error);
    return {
      statusCode: 500,
      body: JSON.stringify({ 
        error: error instanceof Error ? error.message : 'Unknown error occurred' 
      })
    };
  }
};