import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';

const HEYGEN_API_URL = 'https://api.heygen.com/v2';

serve(async (req) => {
  try {
    const { projectId, script, contact } = await req.json();
    const apiKey = Deno.env.get('HEYGEN_API_KEY');

    if (!apiKey) {
      throw new Error('HeyGen API key not configured');
    }

    const response = await fetch(`${HEYGEN_API_URL}/videos`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        project_id: projectId,
        background: {
          type: "color",
          value: "#ffffff"
        },
        clips: [
          {
            avatar_id: projectId,
            avatar_style: "normal",
            input_text: script,
            voice_id: "en-US-JennyNeural",
            voice_settings: {
              stability: 0.5,
              similarity: 0.75
            },
            background: {
              type: "color",
              value: "#ffffff"
            },
            video_settings: {
              ratio: "16:9",
              quality: "high"
            }
          }
        ],
        test: false
      })
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