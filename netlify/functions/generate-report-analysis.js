const headers = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'Content-Type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Content-Type': 'application/json',
};

exports.handler = async (event) => {
  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 200, headers, body: '' };
  }
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, headers, body: JSON.stringify({ error: 'Method not allowed' }) };
  }

  const apiKey = process.env.CLAUDE_API_KEY;
  if (!apiKey) {
    return { statusCode: 500, headers, body: JSON.stringify({ error: 'API key not configured' }) };
  }

  let reportData;
  try {
    reportData = JSON.parse(event.body);
  } catch {
    return { statusCode: 400, headers, body: JSON.stringify({ error: 'Invalid JSON' }) };
  }

  const systemPrompt = `Du bist ein erfahrener Bildungsexperte und Evaluator. Du erstellst professionelle Wochenberichte für Projektwochen im Rahmen des FEB-Programms (Fördermittel für Engagement und Beteiligung).

Schreibe ausschließlich auf Deutsch. Sei professionell aber zugänglich. Verwende konkrete Zahlen und Daten aus den bereitgestellten Informationen.

Erstelle basierend auf den folgenden Projektdaten:

1. ZUSAMMENFASSUNG (2-3 Absätze):
   Was wurde in dieser Projektwoche gemacht? Welche Schwerpunkte gab es? Wie war die Beteiligung?

2. ERKENNTNISSE (3-5 Punkte):
   Wichtige Beobachtungen, Stärken der Woche, was gut funktioniert hat.

3. QUIZ-ANALYSE:
   Wenn Vortest und Nachtest vorliegen: Vergleichende Analyse der Ergebnisse. Welche Themen haben sich verbessert? Wo gibt es noch Lücken?
   Wenn nur einzelne Quizze: Zusammenfassung der Ergebnisse.

4. ENGAGEMENT-ANALYSE:
   Wie aktiv waren die Schüler:innen? (Board-Beiträge, KI-Kreationen, Quiz-Teilnahmen)

5. EMPFEHLUNGEN (2-3 Punkte):
   Was könnte in zukünftigen Projektwochen verbessert werden?

6. FEB-WIRKUNGSINDIKATOREN:
   Ordne die Ergebnisse den FEB-Wirkungszielen zu:
   - Wirkungsziel 2: Mediale Ergebnisse (Anzahl produzierter Medien)
   - Wirkungsziel 3: Medienkompetenz (Vortest/Nachtest Vergleich, aktive Medienproduktion)
   - Wirkungsziel 4: Austausch mit Tansania (Board-Beiträge, Video-Call Dokumentation)
   - Wirkungsziel 5: SDG-Wissen (Quiz-Ergebnisse, Handlungsoptionen)

Antworte NUR mit dem formatierten Berichtstext. Keine Einleitung oder Meta-Kommentare. Verwende Markdown-Formatierung (## fuer Ueberschriften, **fett**, - fuer Listen).`;

  // Summarize data to fit in context (strip large arrays)
  const summary = {
    projectName: reportData.projectName,
    className: reportData.className,
    studentCount: reportData.studentCount,
    teacherName: reportData.teacherName,
    dateRange: reportData.dateRange,
    dailyReports: reportData.dailyReports,
    gameProgress: reportData.gameProgress,
    quizResults: (reportData.quizResults || []).map(q => ({
      quizTitle: q.quizTitle,
      date: q.date,
      participantCount: q.participantCount,
      overallAverage: q.overallAverage,
      questions: q.questions,
    })),
    einzelquizResults: {
      vortest: reportData.einzelquizResults?.vortest ? {
        participantCount: reportData.einzelquizResults.vortest.participants?.length || 0,
        averagePercent: reportData.einzelquizResults.vortest.participants?.length > 0
          ? Math.round(reportData.einzelquizResults.vortest.participants.reduce((s, p) => s + p.percent, 0) / reportData.einzelquizResults.vortest.participants.length)
          : 0,
        questionAverages: reportData.einzelquizResults.vortest.questionAverages,
      } : null,
      nachtest: reportData.einzelquizResults?.nachtest ? {
        participantCount: reportData.einzelquizResults.nachtest.participants?.length || 0,
        averagePercent: reportData.einzelquizResults.nachtest.participants?.length > 0
          ? Math.round(reportData.einzelquizResults.nachtest.participants.reduce((s, p) => s + p.percent, 0) / reportData.einzelquizResults.nachtest.participants.length)
          : 0,
        questionAverages: reportData.einzelquizResults.nachtest.questionAverages,
      } : null,
      comparison: reportData.einzelquizResults?.comparison,
    },
    boards: (reportData.boards || []).map(b => ({
      boardName: b.boardName,
      totalPosts: b.totalPosts,
      totalPhotos: b.totalPhotos,
      columnNames: b.columns?.map(c => c.name) || [],
    })),
    artCreations: reportData.artCreations?.totals || { images: 0, videos: 0, music: 0 },
  };

  try {
    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: 'claude-haiku-4-5-20251001',
        max_tokens: 2500,
        messages: [
          { role: 'user', content: systemPrompt + '\n\n--- PROJEKTDATEN ---\n\n' + JSON.stringify(summary, null, 2) },
        ],
      }),
    });

    if (!response.ok) {
      const errText = await response.text();
      console.error('Claude API error:', response.status, errText.slice(0, 300));
      return {
        statusCode: 500,
        headers,
        body: JSON.stringify({ error: 'AI analysis failed', details: `HTTP ${response.status}` }),
      };
    }

    const result = await response.json();
    const analysis = result.content?.[0]?.text || '';

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({ analysis }),
    };
  } catch (err) {
    console.error('Report analysis error:', err);
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ error: 'AI analysis failed', details: err.message }),
    };
  }
};
