// einzelquizQuestions.js — Default questions for Vortest/Nachtest

export const QUIZ_TYPE_LABELS = {
  vortest: 'Vortest',
  nachtest: 'Nachtest',
  uebung: 'Übung',
};

export const QUIZ_TYPE_COLORS = {
  vortest: '#2980B9',
  nachtest: '#27AE60',
  uebung: '#E67E22',
};

export const DEFAULT_EINZELQUIZ_QUESTIONS = [
  {
    type: 'mc',
    text: 'Was sind Kinderrechte?',
    options: [
      'Regeln, die nur in Deutschland gelten',
      'Rechte, die jedes Kind auf der Welt hat',
      'Wünsche, die Kinder haben',
      'Gesetze nur für Erwachsene',
    ],
    correctIndex: 1,
    imageUrl: null,
  },
  {
    type: 'mc',
    text: 'Wann wurde die UN-Kinderrechtskonvention verabschiedet?',
    options: ['1945', '1989', '2000', '2015'],
    correctIndex: 1,
    imageUrl: null,
  },
  {
    type: 'mc',
    text: 'Welches ist KEIN Kinderrecht?',
    options: [
      'Recht auf Bildung',
      'Recht auf Schutz',
      'Recht auf ein eigenes Smartphone',
      'Recht auf Freizeit',
    ],
    correctIndex: 2,
    imageUrl: null,
  },
  {
    type: 'tf',
    text: 'Alle Kinder auf der Welt haben die gleichen Rechte.',
    options: ['Richtig', 'Falsch'],
    correctIndex: 0,
    imageUrl: null,
  },
  {
    type: 'tf',
    text: 'In Tansania gehen alle Kinder zur Schule.',
    options: ['Richtig', 'Falsch'],
    correctIndex: 1,
    imageUrl: null,
  },
  {
    type: 'mc',
    text: 'Was bedeutet SDG?',
    options: [
      'Super Deutsche Gesetze',
      'Sustainable Development Goals',
      'Schüler-Demokratie-Gruppe',
      'Soziale Dienste Gemeinschaft',
    ],
    correctIndex: 1,
    imageUrl: null,
  },
  {
    type: 'mc',
    text: 'Wie viele Kinderrechte stehen in der UN-Kinderrechtskonvention?',
    options: ['10', '27', '54', '100'],
    correctIndex: 2,
    imageUrl: null,
  },
  {
    type: 'slider',
    text: 'Wie viele Kinder weltweit gehen NICHT zur Schule? (in Millionen)',
    min: 0,
    max: 1000,
    correctValue: 250,
    tolerance: 100,
    unit: 'Mio.',
    imageUrl: null,
  },
  {
    type: 'mc',
    text: 'Was gehört zum Recht auf Bildung?',
    options: [
      'Jedes Kind darf zur Schule gehen',
      'Kinder müssen immer Hausaufgaben machen',
      'Nur Jungen dürfen lernen',
      'Schule ist nur für reiche Kinder',
    ],
    correctIndex: 0,
    imageUrl: null,
  },
  {
    type: 'tf',
    text: 'Kinder dürfen ihre Meinung sagen und müssen gehört werden.',
    options: ['Richtig', 'Falsch'],
    correctIndex: 0,
    imageUrl: null,
  },
  {
    type: 'mc',
    text: 'Was haben Deutschland und Tansania gemeinsam?',
    options: [
      'Das gleiche Wetter',
      'Die gleiche Sprache',
      'Die gleichen Kinderrechte',
      'Die gleiche Währung',
    ],
    correctIndex: 2,
    imageUrl: null,
  },
  {
    type: 'tf',
    text: 'Kinderarbeit ist überall auf der Welt verboten.',
    options: ['Richtig', 'Falsch'],
    correctIndex: 1,
    imageUrl: null,
  },
];
