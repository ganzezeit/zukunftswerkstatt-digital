// Map user style labels to Recraft V3 style values
const RECRAFT_STYLE_MAP = {
  'Illustration': 'digital_illustration',
  'Foto': 'realistic_image',
  'Cartoon': 'digital_illustration/2d_art_poster',
  'Aquarell': 'digital_illustration/hand_drawn',
  'Pixel Art': 'digital_illustration/pixel_art',
  '3D': 'digital_illustration/handmade_3d',
};

// Map aspect ratios to Recraft V3 size values
const RECRAFT_SIZE_MAP = {
  '1:1': '1024x1024',
  '16:9': '1365x1024',
  '9:16': '1024x1365',
};

exports.handler = async (event) => {
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Allow-Methods': 'POST, OPTIONS'
  };

  if (event.httpMethod === 'OPTIONS') return { statusCode: 200, headers };
  if (event.httpMethod !== 'POST') return { statusCode: 405, headers, body: 'Method not allowed' };

  const startTime = Date.now();
  const log = (msg) => console.log(`[${Date.now() - startTime}ms] ${msg}`);

  try {
    const { prompt, style, aspectRatio, model } = JSON.parse(event.body);
    const useSchnell = model === 'schnell';
    log('Start - model: ' + (useSchnell ? 'schnell' : 'quality') + ' prompt: ' + prompt?.slice(0, 50));

    if (!prompt || prompt.trim().length < 3) {
      return { statusCode: 400, headers, body: JSON.stringify({ error: 'Prompt too short' }) };
    }

    if (!process.env.CLAUDE_API_KEY) {
      return { statusCode: 500, headers, body: JSON.stringify({ error: 'Server config error', details: 'CLAUDE_API_KEY not configured' }) };
    }
    if (!process.env.REPLICATE_API_KEY) {
      return { statusCode: 500, headers, body: JSON.stringify({ error: 'Server config error', details: 'REPLICATE_API_KEY not configured' }) };
    }

    // Step 1 + 2: Safety check AND prompt enhancement in PARALLEL
    log('Starting Claude calls (parallel)');
    const [safetyCheck, enhanceResponse] = await Promise.all([
      fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': process.env.CLAUDE_API_KEY,
          'anthropic-version': '2023-06-01'
        },
        body: JSON.stringify({
          model: 'claude-haiku-4-5-20251001',
          max_tokens: 100,
          messages: [{
            role: 'user',
            content: 'You are a content safety filter for a children educational app (ages 11-15). Check if this image prompt is safe. Reply ONLY "SAFE" or "UNSAFE: reason". No violence, weapons, drugs, sexual content, horror, real people, hate. Educational and creative content is fine.\n\nPrompt: "' + prompt + '"'
          }]
        })
      }),
      fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': process.env.CLAUDE_API_KEY,
          'anthropic-version': '2023-06-01'
        },
        body: JSON.stringify({
          model: 'claude-haiku-4-5-20251001',
          max_tokens: 200,
          messages: [{
            role: 'user',
            content: 'Enhance this image prompt for AI generation. Add artistic details, lighting, composition. Keep child-friendly. Style: ' + (style || 'colorful illustration') + '. Original: "' + prompt + '". Reply with ONLY the enhanced prompt, max 100 words.'
          }]
        })
      })
    ]);

    log('Claude responses received');

    // Check safety
    if (!safetyCheck.ok) {
      const errText = await safetyCheck.text();
      log('Safety HTTP error: ' + safetyCheck.status);
      return { statusCode: 500, headers, body: JSON.stringify({ error: 'Safety check failed', details: 'Claude ' + safetyCheck.status + ': ' + errText.slice(0, 200) }) };
    }
    const safetyResult = await safetyCheck.json();
    if (!safetyResult.content || !safetyResult.content[0]) {
      return { statusCode: 500, headers, body: JSON.stringify({ error: 'Safety check failed', details: 'Unexpected response' }) };
    }
    const safetyText = safetyResult.content[0].text;
    log('Safety: ' + safetyText);
    if (safetyText.startsWith('UNSAFE')) {
      return { statusCode: 400, headers, body: JSON.stringify({ error: 'unsafe', message: safetyText }) };
    }

    // Enhanced prompt (fallback to original)
    let enhancedPrompt = prompt;
    if (enhanceResponse.ok) {
      const enhanceResult = await enhanceResponse.json();
      if (enhanceResult.content && enhanceResult.content[0]) {
        enhancedPrompt = enhanceResult.content[0].text;
      }
    }
    log('Enhanced: ' + enhancedPrompt.slice(0, 80));

    // Step 3: Generate image with selected model
    let replicateUrl, replicateBody;

    if (useSchnell) {
      // FLUX Schnell - fast, cheap
      replicateUrl = 'https://api.replicate.com/v1/models/black-forest-labs/flux-schnell/predictions';
      replicateBody = {
        input: {
          prompt: enhancedPrompt,
          num_outputs: 1,
          aspect_ratio: aspectRatio || '1:1',
          output_format: 'webp',
          output_quality: 90,
          go_fast: true
        }
      };
    } else {
      // Recraft V3 - high quality, best for illustrations
      const recraftStyle = RECRAFT_STYLE_MAP[style] || 'digital_illustration';
      const recraftSize = RECRAFT_SIZE_MAP[aspectRatio] || '1024x1024';
      replicateUrl = 'https://api.replicate.com/v1/models/recraft-ai/recraft-v3/predictions';
      replicateBody = {
        input: {
          prompt: enhancedPrompt,
          style: recraftStyle,
          size: recraftSize
        }
      };
    }

    log('Replicate call: ' + (useSchnell ? 'flux-schnell' : 'recraft-v3'));
    const replicateResponse = await fetch(replicateUrl, {
      method: 'POST',
      headers: {
        'Authorization': 'Bearer ' + process.env.REPLICATE_API_KEY,
        'Content-Type': 'application/json',
        'Prefer': 'wait'
      },
      body: JSON.stringify(replicateBody)
    });

    log('Replicate HTTP: ' + replicateResponse.status);

    if (!replicateResponse.ok) {
      const errText = await replicateResponse.text();
      log('Replicate error: ' + errText.slice(0, 300));

      // If Recraft fails, try FLUX 1.1 Pro as fallback
      if (!useSchnell) {
        log('Falling back to flux-1.1-pro');
        const fallbackResponse = await fetch('https://api.replicate.com/v1/models/black-forest-labs/flux-1.1-pro/predictions', {
          method: 'POST',
          headers: {
            'Authorization': 'Bearer ' + process.env.REPLICATE_API_KEY,
            'Content-Type': 'application/json',
            'Prefer': 'wait'
          },
          body: JSON.stringify({
            input: {
              prompt: enhancedPrompt,
              aspect_ratio: aspectRatio || '1:1',
              output_format: 'webp',
              output_quality: 90,
              safety_tolerance: 2
            }
          })
        });

        if (fallbackResponse.ok) {
          let fbResult = await fallbackResponse.json();
          if (fbResult.status && fbResult.status !== 'succeeded' && fbResult.status !== 'failed') {
            let attempts = 0;
            while (fbResult.status !== 'succeeded' && fbResult.status !== 'failed' && attempts < 30) {
              await new Promise(r => setTimeout(r, 1000));
              const poll = await fetch(fbResult.urls.get, { headers: { 'Authorization': 'Bearer ' + process.env.REPLICATE_API_KEY } });
              fbResult = await poll.json();
              attempts++;
            }
          }
          if (fbResult.status === 'succeeded' && fbResult.output) {
            const imageUrl = Array.isArray(fbResult.output) ? fbResult.output[0] : fbResult.output;
            log('FALLBACK SUCCESS');
            return { statusCode: 200, headers, body: JSON.stringify({ imageUrl, enhancedPrompt, originalPrompt: prompt }) };
          }
        }
      }

      return { statusCode: 500, headers, body: JSON.stringify({ error: 'Replicate API error', details: 'HTTP ' + replicateResponse.status + ': ' + errText.slice(0, 300) }) };
    }

    let result = await replicateResponse.json();
    log('Replicate status: ' + result.status);

    // Poll if not yet complete
    if (result.status && result.status !== 'succeeded' && result.status !== 'failed') {
      log('Polling...');
      let attempts = 0;
      while (result.status !== 'succeeded' && result.status !== 'failed' && attempts < 30) {
        await new Promise(r => setTimeout(r, 1000));
        const poll = await fetch(result.urls.get, { headers: { 'Authorization': 'Bearer ' + process.env.REPLICATE_API_KEY } });
        result = await poll.json();
        attempts++;
      }
    }

    if (result.status === 'succeeded' && result.output) {
      const imageUrl = Array.isArray(result.output) ? result.output[0] : result.output;
      log('SUCCESS - ' + imageUrl.slice(0, 80));
      return { statusCode: 200, headers, body: JSON.stringify({ imageUrl, enhancedPrompt, originalPrompt: prompt }) };
    } else {
      log('Failed: ' + JSON.stringify(result).slice(0, 300));
      return { statusCode: 500, headers, body: JSON.stringify({ error: 'Generation failed', details: result.error || result.status || 'Unknown' }) };
    }

  } catch (err) {
    console.log('CATCH:', err.message, err.stack);
    return { statusCode: 500, headers, body: JSON.stringify({ error: 'Function error', details: err.message }) };
  }
};
