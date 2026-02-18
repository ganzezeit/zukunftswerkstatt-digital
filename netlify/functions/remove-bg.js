exports.handler = async (event) => {
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Allow-Methods': 'POST, OPTIONS'
  };

  if (event.httpMethod === 'OPTIONS') return { statusCode: 200, headers };
  if (event.httpMethod !== 'POST') return { statusCode: 405, headers, body: 'Method not allowed' };

  try {
    const { imageUrl } = JSON.parse(event.body);

    if (!imageUrl) {
      return { statusCode: 400, headers, body: JSON.stringify({ error: 'Missing imageUrl' }) };
    }
    if (!process.env.REPLICATE_API_KEY) {
      return { statusCode: 500, headers, body: JSON.stringify({ error: 'Server config error', details: 'REPLICATE_API_KEY not configured' }) };
    }

    // Start background removal prediction
    const response = await fetch('https://api.replicate.com/v1/models/cjwbw/rembg/predictions', {
      method: 'POST',
      headers: {
        'Authorization': 'Bearer ' + process.env.REPLICATE_API_KEY,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        input: { image: imageUrl }
      })
    });

    if (!response.ok) {
      const errText = await response.text();
      return { statusCode: 500, headers, body: JSON.stringify({ error: 'Replicate API error', details: errText.slice(0, 200) }) };
    }

    const prediction = await response.json();

    // Check if completed immediately
    if (prediction.status === 'succeeded' && prediction.output) {
      const outputUrl = typeof prediction.output === 'string' ? prediction.output : prediction.output[0];
      return { statusCode: 200, headers, body: JSON.stringify({ outputUrl }) };
    }

    // Poll for completion (rembg is usually fast, ~5-15s)
    if (prediction.urls?.get) {
      let polls = 0;
      while (polls < 30) {
        await new Promise(r => setTimeout(r, 1000));
        polls++;

        const pollRes = await fetch(prediction.urls.get, {
          headers: { 'Authorization': 'Bearer ' + process.env.REPLICATE_API_KEY }
        });

        if (!pollRes.ok) continue;

        const result = await pollRes.json();

        if (result.status === 'succeeded' && result.output) {
          const outputUrl = typeof result.output === 'string' ? result.output : result.output[0];
          return { statusCode: 200, headers, body: JSON.stringify({ outputUrl }) };
        }

        if (result.status === 'failed' || result.status === 'canceled') {
          return { statusCode: 500, headers, body: JSON.stringify({ error: 'Background removal failed', details: result.error || 'Unknown error' }) };
        }
      }

      return { statusCode: 500, headers, body: JSON.stringify({ error: 'Timeout waiting for background removal' }) };
    }

    return { statusCode: 500, headers, body: JSON.stringify({ error: 'Unexpected response', details: JSON.stringify(prediction).slice(0, 200) }) };

  } catch (err) {
    return { statusCode: 500, headers, body: JSON.stringify({ error: 'Function error', details: err.message }) };
  }
};
