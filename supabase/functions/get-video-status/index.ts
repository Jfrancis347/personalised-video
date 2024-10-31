import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';

const HEYGEN_API_URL = 'https://api.heygen.com/v2';

serve(async (req) => {
  try {
    const { videoId } = await req.json();
    const apiKey = Deno.env.get('HEYGEN_API_KEY');

    if (!apiKey) {
      throw new Error('HeyGen API key not configured');
    }

    const response = await fetch(`${HEYGEN_API_URL}/videos/${videoId}`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json'
      }
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(`HeyGen API error: ${JSON.stringify(error)}`);
    }

    const data = await response.json();
    return new Response(JSON.stringify(data), {
      headers: { 'Content-Type': 'application/json' }
    });
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
});