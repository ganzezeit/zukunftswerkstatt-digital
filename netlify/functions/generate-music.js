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
    const { prompt, model, lyrics, genre, instrumental } = JSON.parse(event.body);
    const selectedModel = model || 'schnell';
    const isInstrumental = instrumental === true;
    log('Start - model: ' + selectedModel + ', genre: ' + (genre || 'none') + ', instrumental: ' + isInstrumental + ', prompt: ' + prompt?.slice(0, 50));

    if (!prompt || prompt.trim().length < 3) {
      return { statusCode: 400, headers, body: JSON.stringify({ error: 'Prompt too short' }) };
    }

    if (!process.env.CLAUDE_API_KEY) {
      return { statusCode: 500, headers, body: JSON.stringify({ error: 'Server config error', details: 'CLAUDE_API_KEY not configured' }) };
    }
    if (!process.env.REPLICATE_API_KEY) {
      return { statusCode: 500, headers, body: JSON.stringify({ error: 'Server config error', details: 'REPLICATE_API_KEY not configured' }) };
    }

    const genreHint = genre ? ' Genre/Style: ' + genre + '.' : '';
    const lyricsHint = lyrics ? ' The user has provided lyrics to incorporate.' : '';

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
            content: 'You are a content safety filter for a children\'s educational art app (ages 11-15) at a German primary school.\n\nIMPORTANT: Prompts will usually be in GERMAN. Common German words are NOT inappropriate:\n- "Kinder" = children, "Menschen" = people, "Lied" = song, "Musik" = music\n- These are normal, innocent words. Do NOT flag them.\n\nOnly flag content that is genuinely harmful: explicit violence/gore, drugs, sexual content, horror, hate speech, or content promoting discrimination.\n\nALLOW: Songs about nature, friendship, school, rights, cultures, animals, celebrations, emotions, educational topics.\n\nReply ONLY "SAFE" or "UNSAFE: reason".\n\nMusic prompt: "' + prompt + '"' + (lyrics ? '\nLyrics: "' + lyrics.slice(0, 200) + '"' : '')
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
          max_tokens: 300,
          messages: [{
            role: 'user',
            content: 'You are a music production expert. Enhance this music prompt for AI music generation.\n\nThe prompt may be in German or other languages - translate and enhance to English.\n\nAdd details about: instruments, tempo (BPM range), mood, arrangement style, production quality, musical influences.' + genreHint + lyricsHint + '\n\nRULES:\n- Keep child-friendly at all times\n- Be specific about instruments and arrangement\n- Include mood and energy descriptors\n- If genre is specified, lean into that genre\'s characteristics\n- Keep under 200 words\n- Reply with ONLY the enhanced prompt, no explanations\n\nOriginal prompt: "' + prompt + '"'
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
    log('Enhanced: ' + enhancedPrompt.slice(0, 100));

    // Step 3: Start music generation
    const apiKey = process.env.REPLICATE_API_KEY;
    let replicateUrl, replicateBody;

    if (selectedModel === 'quality') {
      // MiniMax Music-1.5: supports lyrics, up to 4 minutes
      // prompt = lyrics with section markers, lyrics_prompt = style/genre description
      replicateUrl = 'https://api.replicate.com/v1/models/minimax/music-1.5/predictions';
      const userLyrics = (lyrics && lyrics.trim() && !isInstrumental) ? lyrics.trim().slice(0, 600) : '[instrumental]';
      replicateBody = {
        input: {
          prompt: enhancedPrompt.slice(0, 300),
          lyrics: userLyrics,
          lyrics_prompt: enhancedPrompt.slice(0, 300),
        }
      };
    } else {
      // Schnell / default: Stable Audio 2.5 - fast, instrumental
      replicateUrl = 'https://api.replicate.com/v1/models/stability-ai/stable-audio-2.5/predictions';
      replicateBody = {
        input: {
          prompt: enhancedPrompt,
          seconds_total: 60,
          seconds_start: 0,
        }
      };
    }

    log('Starting Replicate music prediction: ' + selectedModel);
    const response = await fetch(replicateUrl, {
      method: 'POST',
      headers: {
        'Authorization': 'Bearer ' + apiKey,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(replicateBody)
    });

    if (!response.ok) {
      const errText = await response.text();
      log('Replicate start error ' + response.status + ': ' + errText.slice(0, 300));
      return { statusCode: 500, headers, body: JSON.stringify({ error: 'Replicate API error', details: errText.slice(0, 200) }) };
    }

    const prediction = await response.json();
    log('Prediction started: ' + prediction.id + ' status: ' + prediction.status);

    // Check if completed immediately
    if (prediction.status === 'succeeded' && prediction.output) {
      const output = prediction.output;
      let audioUrl;
      if (typeof output === 'string') audioUrl = output;
      else if (Array.isArray(output)) audioUrl = output[0];
      else if (output.audio) audioUrl = output.audio;
      else if (output.url) audioUrl = output.url;

      if (audioUrl) {
        log('Instant success: ' + audioUrl.slice(0, 80));
        return { statusCode: 200, headers, body: JSON.stringify({ audioUrl, enhancedPrompt, originalPrompt: prompt, model: selectedModel }) };
      }
    }

    // Return poll URL for client-side polling
    if (prediction.urls?.get) {
      log('Returning poll URL for async completion');
      return { statusCode: 200, headers, body: JSON.stringify({
        status: 'processing',
        pollUrl: prediction.urls.get,
        enhancedPrompt,
        originalPrompt: prompt,
        model: selectedModel,
      })};
    }

    return { statusCode: 500, headers, body: JSON.stringify({ error: 'Unexpected response', details: JSON.stringify(prediction).slice(0, 200) }) };

  } catch (err) {
    console.log('CATCH:', err.message, err.stack);
    return { statusCode: 500, headers, body: JSON.stringify({ error: 'Function error', details: err.message }) };
  }
};
