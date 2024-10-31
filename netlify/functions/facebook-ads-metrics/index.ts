import { Handler } from '@netlify/functions';
import fetch from 'node-fetch';

export const handler: Handler = async (event) => {
  const accessToken = event.headers.authorization?.replace('Bearer ', '');

  if (!accessToken) {
    return {
      statusCode: 401,
      body: JSON.stringify({ error: 'No access token provided' })
    };
  }

  try {
    // Fetch ad account metrics from Facebook Marketing API
    const response = await fetch(
      'https://graph.facebook.com/v19.0/me/adaccounts?' + 
      'fields=account_id,name,insights.date_preset(last_30d){' +
      'spend,impressions,clicks,actions,ctr,cpc,cpm,cost_per_action_type' +
      '}',
      {
        headers: {
          'Authorization': `Bearer ${accessToken}`
        }
      }
    );

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error?.message || 'Failed to fetch Facebook Ads data');
    }

    const data = await response.json();

    if (!data.data || !Array.isArray(data.data)) {
      throw new Error('Invalid response format from Facebook API');
    }

    // Aggregate metrics across all ad accounts
    const metrics = data.data.reduce((acc: any, account: any) => {
      const insights = account.insights?.data?.[0] || {};
      const conversions = insights.actions?.find((a: any) => 
        a.action_type === 'purchase' || 
        a.action_type === 'complete_registration' || 
        a.action_type === 'lead'
      )?.value || 0;

      return {
        spend: acc.spend + parseFloat(insights.spend || 0),
        impressions: acc.impressions + parseInt(insights.impressions || 0),
        clicks: acc.clicks + parseInt(insights.clicks || 0),
        conversions: acc.conversions + parseInt(conversions),
        ctr: acc.ctr + parseFloat(insights.ctr || 0),
        cpc: acc.cpc + parseFloat(insights.cpc || 0),
        cpm: acc.cpm + parseFloat(insights.cpm || 0)
      };
    }, { 
      spend: 0, 
      impressions: 0, 
      clicks: 0, 
      conversions: 0,
      ctr: 0,
      cpc: 0,
      cpm: 0
    });

    // Average the rate metrics across accounts
    const accountCount = data.data.length;
    if (accountCount > 0) {
      metrics.ctr /= accountCount;
      metrics.cpc /= accountCount;
      metrics.cpm /= accountCount;
    }

    return {
      statusCode: 200,
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(metrics)
    };
  } catch (error) {
    console.error('Error fetching Facebook Ads metrics:', error);
    return {
      statusCode: 500,
      body: JSON.stringify({ 
        error: error instanceof Error ? error.message : 'Failed to fetch ad metrics' 
      })
    };
  }
};