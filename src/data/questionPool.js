// questionPool.js — Question pool organized by FEB project goal indicators
// Used by QuizRandomizer to generate random quizzes for Einzelquiz and Live Quiz

export const INDICATOR_LABELS = {
  'kinderrechte-grundwissen': 'Kinderrechte Grundwissen',
  'un-konvention': 'UN-Kinderrechtskonvention',
  'globale-bildung-sdgs': 'Globale Bildung & SDGs',
  'tansania-kulturaustausch': 'Tansania & Kulturaustausch',
  'kinderrechte-alltag': 'Kinderrechte im Alltag',
  'beteiligung-handeln': 'Beteiligung & Handeln',
};

export const INDICATOR_COLORS = {
  'kinderrechte-grundwissen': '#E74C3C',
  'un-konvention': '#2980B9',
  'globale-bildung-sdgs': '#27AE60',
  'tansania-kulturaustausch': '#E67E22',
  'kinderrechte-alltag': '#9B59B6',
  'beteiligung-handeln': '#16A085',
};

export const QUESTION_POOL = [
  // ===== 1. Kinderrechte Grundwissen =====
  {
    indicator: 'kinderrechte-grundwissen',
    type: 'mc',
    text: 'Was sind Kinderrechte?',
    options: [
      'Regeln, die nur in Deutschland gelten',
      'Rechte, die jedes Kind auf der Welt hat',
      'Wünsche, die Kinder haben',
      'Gesetze nur für Erwachsene',
    ],
    correctIndex: 1,
  },
  {
    indicator: 'kinderrechte-grundwissen',
    type: 'mc',
    text: 'Welches ist KEIN Kinderrecht?',
    options: [
      'Recht auf Bildung',
      'Recht auf Schutz',
      'Recht auf ein eigenes Smartphone',
      'Recht auf Freizeit',
    ],
    correctIndex: 2,
  },
  {
    indicator: 'kinderrechte-grundwissen',
    type: 'tf',
    text: 'Alle Kinder auf der Welt haben die gleichen Rechte.',
    options: ['Richtig', 'Falsch'],
    correctIndex: 0,
  },
  {
    indicator: 'kinderrechte-grundwissen',
    type: 'mc',
    text: 'Was gehört zum Recht auf Bildung?',
    options: [
      'Jedes Kind darf zur Schule gehen',
      'Kinder müssen immer Hausaufgaben machen',
      'Nur Jungen dürfen lernen',
      'Schule ist nur für reiche Kinder',
    ],
    correctIndex: 0,
  },
  {
    indicator: 'kinderrechte-grundwissen',
    type: 'tf',
    text: 'Kinder dürfen ihre Meinung sagen und müssen gehört werden.',
    options: ['Richtig', 'Falsch'],
    correctIndex: 0,
  },
  {
    indicator: 'kinderrechte-grundwissen',
    type: 'mc',
    text: 'Welches Recht schützt Kinder vor Gewalt?',
    options: [
      'Recht auf Freizeit',
      'Recht auf Schutz',
      'Recht auf Bildung',
      'Recht auf Gleichheit',
    ],
    correctIndex: 1,
  },
  {
    indicator: 'kinderrechte-grundwissen',
    type: 'open',
    text: 'Nenne ein Kinderrecht, das dir besonders wichtig ist.',
    acceptedAnswers: ['Bildung', 'Schutz', 'Gesundheit', 'Freizeit', 'Gleichheit', 'Mitbestimmung', 'Privatsphäre', 'Würde', 'Recht auf Bildung', 'Recht auf Schutz', 'Recht auf Gesundheit', 'Recht auf Freizeit'],
  },
  {
    indicator: 'kinderrechte-grundwissen',
    type: 'wordcloud',
    text: 'Welche Kinderrechte kennt ihr? Schreibt jeweils ein Recht auf.',
    maxSubmissions: 3,
  },
  {
    indicator: 'kinderrechte-grundwissen',
    type: 'sorting',
    text: 'Sortiere die Kinderrechte nach der Reihenfolge, in der wir sie gelernt haben.',
    items: ['Schutz', 'Bildung', 'Mitbestimmung', 'Freizeit'],
    timeLimit: 30,
  },

  // ===== 2. UN-Kinderrechtskonvention =====
  {
    indicator: 'un-konvention',
    type: 'mc',
    text: 'Wann wurde die UN-Kinderrechtskonvention verabschiedet?',
    options: ['1945', '1989', '2000', '2015'],
    correctIndex: 1,
  },
  {
    indicator: 'un-konvention',
    type: 'mc',
    text: 'Wie viele Kinderrechte stehen in der UN-Kinderrechtskonvention?',
    options: ['10', '27', '54', '100'],
    correctIndex: 2,
  },
  {
    indicator: 'un-konvention',
    type: 'tf',
    text: 'Fast alle Länder der Welt haben die UN-Kinderrechtskonvention unterschrieben.',
    options: ['Richtig', 'Falsch'],
    correctIndex: 0,
  },
  {
    indicator: 'un-konvention',
    type: 'mc',
    text: 'Was bedeutet "UN" in UN-Kinderrechtskonvention?',
    options: [
      'Unser Netzwerk',
      'United Nations (Vereinte Nationen)',
      'Universelle Normen',
      'Unter Naturschutz',
    ],
    correctIndex: 1,
  },
  {
    indicator: 'un-konvention',
    type: 'tf',
    text: 'Die UN-Kinderrechtskonvention gilt nur in Europa.',
    options: ['Richtig', 'Falsch'],
    correctIndex: 1,
  },
  {
    indicator: 'un-konvention',
    type: 'mc',
    text: 'Welches Land hat die UN-Kinderrechtskonvention NICHT unterschrieben?',
    options: [
      'Deutschland',
      'Tansania',
      'USA',
      'Frankreich',
    ],
    correctIndex: 2,
  },
  {
    indicator: 'un-konvention',
    type: 'open',
    text: 'In welchem Jahr wurde die UN-Kinderrechtskonvention verabschiedet?',
    acceptedAnswers: ['1989'],
  },
  {
    indicator: 'un-konvention',
    type: 'slider',
    text: 'Wie viele Länder haben die UN-Kinderrechtskonvention unterschrieben?',
    min: 50,
    max: 250,
    correctValue: 196,
    tolerance: 20,
    unit: 'Länder',
  },

  // ===== 3. Globale Bildung & SDGs =====
  {
    indicator: 'globale-bildung-sdgs',
    type: 'mc',
    text: 'Was bedeutet SDG?',
    options: [
      'Super Deutsche Gesetze',
      'Sustainable Development Goals',
      'Schüler-Demokratie-Gruppe',
      'Soziale Dienste Gemeinschaft',
    ],
    correctIndex: 1,
  },
  {
    indicator: 'globale-bildung-sdgs',
    type: 'slider',
    text: 'Wie viele Kinder weltweit gehen NICHT zur Schule? (in Millionen)',
    min: 0,
    max: 1000,
    correctValue: 250,
    tolerance: 100,
    unit: 'Mio.',
  },
  {
    indicator: 'globale-bildung-sdgs',
    type: 'mc',
    text: 'Wie viele SDGs (Nachhaltigkeitsziele) gibt es?',
    options: ['5', '10', '17', '25'],
    correctIndex: 2,
  },
  {
    indicator: 'globale-bildung-sdgs',
    type: 'tf',
    text: 'SDG 4 steht für "Hochwertige Bildung".',
    options: ['Richtig', 'Falsch'],
    correctIndex: 0,
  },
  {
    indicator: 'globale-bildung-sdgs',
    type: 'mc',
    text: 'Welches SDG-Ziel hat mit Kinderrechten zu tun?',
    options: [
      'Nur SDG 4 (Bildung)',
      'SDG 1 (Armut) und SDG 4 (Bildung)',
      'Viele SDGs betreffen Kinderrechte',
      'Keines der SDGs',
    ],
    correctIndex: 2,
  },
  {
    indicator: 'globale-bildung-sdgs',
    type: 'tf',
    text: 'Kinderarbeit ist überall auf der Welt verboten.',
    options: ['Richtig', 'Falsch'],
    correctIndex: 1,
  },
  {
    indicator: 'globale-bildung-sdgs',
    type: 'slider',
    text: 'Wie viele Kinder weltweit müssen arbeiten statt zur Schule zu gehen? (in Millionen)',
    min: 0,
    max: 500,
    correctValue: 160,
    tolerance: 50,
    unit: 'Mio.',
  },
  {
    indicator: 'globale-bildung-sdgs',
    type: 'wordcloud',
    text: 'Welche SDG-Ziele kennt ihr? Schreibt ein Ziel auf.',
    maxSubmissions: 2,
  },

  // ===== 4. Tansania & Kulturaustausch =====
  {
    indicator: 'tansania-kulturaustausch',
    type: 'mc',
    text: 'Was haben Deutschland und Tansania gemeinsam?',
    options: [
      'Das gleiche Wetter',
      'Die gleiche Sprache',
      'Die gleichen Kinderrechte',
      'Die gleiche Währung',
    ],
    correctIndex: 2,
  },
  {
    indicator: 'tansania-kulturaustausch',
    type: 'tf',
    text: 'In Tansania gehen alle Kinder zur Schule.',
    options: ['Richtig', 'Falsch'],
    correctIndex: 1,
  },
  {
    indicator: 'tansania-kulturaustausch',
    type: 'mc',
    text: 'Auf welchem Kontinent liegt Tansania?',
    options: ['Asien', 'Europa', 'Afrika', 'Südamerika'],
    correctIndex: 2,
  },
  {
    indicator: 'tansania-kulturaustausch',
    type: 'mc',
    text: 'Welche Sprache wird in Tansania gesprochen?',
    options: ['Englisch', 'Spanisch', 'Swahili', 'Arabisch'],
    correctIndex: 2,
  },
  {
    indicator: 'tansania-kulturaustausch',
    type: 'tf',
    text: 'Tansania hat den höchsten Berg Afrikas: den Kilimandscharo.',
    options: ['Richtig', 'Falsch'],
    correctIndex: 0,
  },
  {
    indicator: 'tansania-kulturaustausch',
    type: 'mc',
    text: 'Was ist ein wichtiger Unterschied im Schulalltag zwischen Deutschland und Tansania?',
    options: [
      'In Tansania gibt es keine Lehrer',
      'In Tansania tragen viele Kinder Schuluniformen',
      'In Deutschland gibt es keine Pausen',
      'In Tansania gibt es keine Schulen',
    ],
    correctIndex: 1,
  },
  {
    indicator: 'tansania-kulturaustausch',
    type: 'open',
    text: 'Wie heißt der höchste Berg Afrikas?',
    acceptedAnswers: ['Kilimandscharo', 'Kilimanjaro', 'Mount Kilimanjaro'],
  },
  {
    indicator: 'tansania-kulturaustausch',
    type: 'slider',
    text: 'Wie viele Einwohner hat Tansania ungefähr? (in Millionen)',
    min: 10,
    max: 150,
    correctValue: 65,
    tolerance: 15,
    unit: 'Mio.',
  },
  {
    indicator: 'tansania-kulturaustausch',
    type: 'wordcloud',
    text: 'Was fällt euch ein, wenn ihr an Tansania denkt?',
    maxSubmissions: 3,
  },
  {
    indicator: 'tansania-kulturaustausch',
    type: 'sorting',
    text: 'Sortiere die Länder nach Einwohnerzahl (kleinstes zuerst).',
    items: ['Tansania', 'Deutschland', 'Indien', 'Schweiz'],
    timeLimit: 30,
  },

  // ===== 5. Kinderrechte im Alltag =====
  {
    indicator: 'kinderrechte-alltag',
    type: 'mc',
    text: 'Welches Kinderrecht wird verletzt, wenn ein Kind nicht zur Schule gehen darf?',
    options: [
      'Recht auf Freizeit',
      'Recht auf Bildung',
      'Recht auf Privatsphäre',
      'Recht auf Gesundheit',
    ],
    correctIndex: 1,
  },
  {
    indicator: 'kinderrechte-alltag',
    type: 'mc',
    text: 'Was kannst du tun, wenn dein Kinderrecht verletzt wird?',
    options: [
      'Nichts, Kinder haben keine Macht',
      'Einer Vertrauensperson davon erzählen',
      'Einfach ignorieren',
      'Weglaufen',
    ],
    correctIndex: 1,
  },
  {
    indicator: 'kinderrechte-alltag',
    type: 'tf',
    text: 'Kinder haben das Recht, in der Schule mitzubestimmen.',
    options: ['Richtig', 'Falsch'],
    correctIndex: 0,
  },
  {
    indicator: 'kinderrechte-alltag',
    type: 'mc',
    text: 'Welche Situation zeigt das Recht auf Freizeit?',
    options: [
      'Ein Kind muss den ganzen Tag arbeiten',
      'Ein Kind spielt auf dem Spielplatz',
      'Ein Kind macht Hausaufgaben',
      'Ein Kind putzt das Haus',
    ],
    correctIndex: 1,
  },
  {
    indicator: 'kinderrechte-alltag',
    type: 'tf',
    text: 'Wenn ein Kind krank ist, hat es das Recht auf Hilfe von einem Arzt.',
    options: ['Richtig', 'Falsch'],
    correctIndex: 0,
  },
  {
    indicator: 'kinderrechte-alltag',
    type: 'mc',
    text: 'Was bedeutet "Gleichheit" bei Kinderrechten?',
    options: [
      'Alle Kinder müssen das Gleiche essen',
      'Alle Kinder haben die gleichen Rechte, egal woher sie kommen',
      'Alle Kinder müssen gleich gut in der Schule sein',
      'Alle Kinder tragen die gleiche Kleidung',
    ],
    correctIndex: 1,
  },
  {
    indicator: 'kinderrechte-alltag',
    type: 'open',
    text: 'Nenne einen Ort in deiner Schule, an dem ein Kinderrecht gelebt wird.',
    acceptedAnswers: ['Klassenzimmer', 'Schulhof', 'Bibliothek', 'Turnhalle', 'Mensa', 'Spielplatz', 'Pausenhof'],
  },
  {
    indicator: 'kinderrechte-alltag',
    type: 'wordcloud',
    text: 'Wo in eurem Alltag erlebt ihr Kinderrechte? Schreibt einen Ort auf.',
    maxSubmissions: 2,
  },

  // ===== 6. Beteiligung & Handeln =====
  {
    indicator: 'beteiligung-handeln',
    type: 'mc',
    text: 'Was bedeutet "Mitbestimmung" bei Kinderrechten?',
    options: [
      'Kinder bestimmen alles alleine',
      'Kinder dürfen ihre Meinung sagen und werden gehört',
      'Nur Erwachsene entscheiden',
      'Kinder müssen gehorchen',
    ],
    correctIndex: 1,
  },
  {
    indicator: 'beteiligung-handeln',
    type: 'tf',
    text: 'Auch Kinder können sich für die Rechte anderer Kinder einsetzen.',
    options: ['Richtig', 'Falsch'],
    correctIndex: 0,
  },
  {
    indicator: 'beteiligung-handeln',
    type: 'mc',
    text: 'Wie kannst du dich für Kinderrechte einsetzen?',
    options: [
      'Andere Kinder informieren',
      'Nichts tun und warten',
      'Nur Erwachsene können etwas tun',
      'Es ist egal',
    ],
    correctIndex: 0,
  },
  {
    indicator: 'beteiligung-handeln',
    type: 'mc',
    text: 'Was haben wir in der Projektwoche gemacht, um Kinderrechte kennenzulernen?',
    options: [
      'Nur Bücher gelesen',
      'Mit Kindern in Tansania gesprochen und Projekte gemacht',
      'Fernsehen geschaut',
      'Nichts',
    ],
    correctIndex: 1,
  },
  {
    indicator: 'beteiligung-handeln',
    type: 'tf',
    text: 'Durch den Austausch mit Tansania haben wir gelernt, dass Kinderrechte überall wichtig sind.',
    options: ['Richtig', 'Falsch'],
    correctIndex: 0,
  },
  {
    indicator: 'beteiligung-handeln',
    type: 'open',
    text: 'Was kannst du tun, um Kinderrechte in deiner Schule zu stärken?',
    acceptedAnswers: ['informieren', 'erzählen', 'helfen', 'Plakat machen', 'anderen helfen', 'Poster machen', 'darüber reden', 'mitbestimmen'],
  },
  {
    indicator: 'beteiligung-handeln',
    type: 'wordcloud',
    text: 'Was wollt ihr nach der Projektwoche über Kinderrechte machen? Schreibt eine Idee.',
    maxSubmissions: 2,
  },
  {
    indicator: 'beteiligung-handeln',
    type: 'sorting',
    text: 'Sortiere die Schritte, um sich für Kinderrechte einzusetzen.',
    items: ['Kinderrechte kennenlernen', 'Problem erkennen', 'Idee entwickeln', 'Handeln'],
    timeLimit: 30,
  },
];

/**
 * Generate a random quiz from the question pool.
 * @param {Object} options
 * @param {number} options.count - Number of questions (default: 10)
 * @param {string[]} options.indicators - Which indicators to include (default: all)
 * @param {string[]} options.types - Which question types to include (default: all available for mode)
 * @param {'einzelquiz'|'live'} options.mode - Quiz mode determines available types
 * @returns {{ title: string, questions: Object[] }}
 */
export function generateRandomQuiz({
  count = 10,
  indicators = null,
  types = null,
  mode = 'einzelquiz',
} = {}) {
  const einzelquizTypes = ['mc', 'tf', 'open', 'slider'];
  const liveTypes = ['mc', 'tf', 'open', 'slider', 'wordcloud', 'sorting'];
  const allowedTypes = types || (mode === 'live' ? liveTypes : einzelquizTypes);

  let pool = QUESTION_POOL.filter(q => allowedTypes.includes(q.type));
  if (indicators && indicators.length > 0) {
    pool = pool.filter(q => indicators.includes(q.indicator));
  }

  // Shuffle using Fisher-Yates
  const shuffled = [...pool];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }

  // Try to get a balanced mix of indicators
  const selected = [];
  const usedIndicators = {};

  // First pass: one question per indicator
  if (!indicators || indicators.length > 1) {
    const indicatorKeys = [...new Set(shuffled.map(q => q.indicator))];
    for (const ind of indicatorKeys) {
      if (selected.length >= count) break;
      const q = shuffled.find(sq => sq.indicator === ind && !selected.includes(sq));
      if (q) {
        selected.push(q);
        usedIndicators[ind] = (usedIndicators[ind] || 0) + 1;
      }
    }
  }

  // Fill remaining slots
  for (const q of shuffled) {
    if (selected.length >= count) break;
    if (!selected.includes(q)) {
      selected.push(q);
    }
  }

  // Shuffle final selection
  for (let i = selected.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [selected[i], selected[j]] = [selected[j], selected[i]];
  }

  // Strip indicator field from output questions and add imageUrl
  const questions = selected.map(q => {
    const { indicator, ...rest } = q;
    return { ...rest, imageUrl: rest.imageUrl || null };
  });

  // Add timeLimit for live quiz questions that need it
  if (mode === 'live') {
    questions.forEach(q => {
      if (!q.timeLimit) {
        if (q.type === 'mc') q.timeLimit = 20;
        else if (q.type === 'tf') q.timeLimit = 15;
        else if (q.type === 'open') q.timeLimit = 20;
        else if (q.type === 'slider') q.timeLimit = 20;
        else if (q.type === 'sorting') q.timeLimit = 30;
        // wordcloud doesn't need timeLimit
      }
    });
  }

  const indicatorNames = [...new Set(selected.map(q => q.indicator))].map(i => INDICATOR_LABELS[i]).join(', ');
  const title = `Zufallsquiz (${selected.length} Fragen)`;

  return { title, questions };
}
