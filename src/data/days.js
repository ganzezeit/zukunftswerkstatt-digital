// days.js — Complete 5-day structure for Weltverbinder Projektwoche

export const DAYS = [
  // ===== TAG 1: Kinderrechte =====
  {
    id: 1,
    name: "Tag 1",
    sub: "Kinderrechte entdecken",
    emoji: "\u{1F4D6}",
    color: "#FF6B35",
    iconImage: "/images/day-icons/tag1-icon.png",
    steps: [
      {
        id: "t1-1",
        title: "Kinderrechte entdecken",
        icon: "\u{1F4DD}",
        type: "multi-step",
        energyCost: 15,
        content: {
          subSteps: [
            {
              title: "Lernkarten: Wichtige Begriffe",
              subType: "lernkarten",
              text: "Lernt die wichtigsten Begriffe der Projektwoche kennen!"
            },
            {
              title: "Kinderrechte-Präsentation",
              subType: "slides",
              content: {
                slides: "tag1-rechte.pdf",
                slideCount: 3
              }
            },
            {
              title: "Video: Kinderrechte erklärt",
              subType: "video",
              content: {
                src: "/videos/kinderrechte.mp4",
                startTime: 0,
                endTime: 94
              }
            }
          ]
        }
      },
      {
        id: "t1-2",
        title: "Kahoot: Kinderrechte",
        icon: "\u{1F3AF}",
        type: "kahoot",
        energyCost: 10,
        content: {
          url: "https://create.kahoot.it/share/projektwoche-kinderrechte-was-brauchst-du-wirklich/4abe5852-982d-4007-9370-6fdcbb253f86",
          label: "Quiz starten!"
        }
      },
      {
        id: "t1-3",
        title: "Kinderrechte vertiefen",
        icon: "\u{1F4FA}",
        type: "multi-step",
        energyCost: 10,
        content: {
          subSteps: [
            {
              title: "Video: Kinderrechte weltweit",
              subType: "video",
              content: {
                src: "/videos/kinderrechte.mp4",
                startTime: 94,
                endTime: null
              }
            },
            {
              title: "Bingo: Kinderrechte im Alltag",
              subType: "text",
              text: "Spielt zusammen das Kinderrechte-Bingo! Findet Beispiele für Kinderrechte in eurem Alltag und kreuzt sie auf eurem Bingo-Feld an. Wer zuerst eine Reihe voll hat, ruft \u2018Bingo!\u2019"
            }
          ]
        }
      },
      {
        id: "t1-4",
        title: "Fotorallye",
        icon: "\u{1F4F7}",
        type: "multi-step",
        energyCost: 15,
        content: {
          subSteps: [
            {
              title: "Fotorallye: Einführung",
              subType: "text",
              text: "Bei der Fotorallye sucht ihr in der Schule und Umgebung nach Orten, die mit Kinderrechten zu tun haben. Fotografiert diese Orte mit dem Tablet!"
            },
            {
              title: "Fotorallye: Aufgaben",
              subType: "text",
              text: "Sucht Orte, die für folgende Rechte stehen: Bildung, Freizeit, Schutz, Gesundheit. Macht zu jedem Recht mindestens ein Foto und überlegt, warum dieser Ort zu dem Recht passt."
            },
            {
              title: "Fotorallye: Auswertung",
              subType: "text",
              text: "Schaut euch gemeinsam eure Fotos an. Besprecht: Welche Orte habt ihr gefunden? Warum passen sie zu den Kinderrechten? Gibt es Orte, die zu mehreren Rechten passen?",
              boardConfig: { taskId: "t1-4-auswertung", title: "Fotorallye-Board", columns: ["Bildung \u{1F4DA}", "Freizeit \u26BD", "Schutz \u{1F6E1}\uFE0F", "Gesundheit \u{1F3E5}"], buttonLabel: "\u{1F4CB} Klassen-Board öffnen" }
            }
          ]
        }
      },
      {
        id: "t1-5",
        title: "Lebensweltkarten",
        icon: "\u{1F5FA}\uFE0F",
        type: "multi-step",
        energyCost: 15,
        content: {
          subSteps: [
            {
              title: "Lebensweltkarten: Anleitung",
              subType: "slides",
              content: {
                slides: "tag1-lebenswelt.pdf",
                slideCount: 4
              }
            },
            {
              title: "Ergebnisse",
              subType: "text",
              text: "Fotografiert und ladet eure Zeichnungen mit eurem Namen hier hoch!",
              boardConfig: { taskId: "t1-5-ergebnisse", title: "Lebensweltkarten-Board", mode: "gallery", buttonLabel: "\u{1F4CB} Board \u00f6ffnen" }
            },
            {
              title: "Lebensweltkarten: Gestalten",
              subType: "text",
              text: "Gestaltet eure eigene Lebensweltkarte! Zeichnet eine Karte eurer Umgebung und markiert wichtige Orte: Wo spielt ihr? Wo f\u00fchlt ihr euch sicher? Wo lernt ihr? Wo trefft ihr Freunde?"
            },
            {
              title: "Lebensweltkarten: Präsentation",
              subType: "text",
              text: "Stellt eure Lebensweltkarten der Klasse vor. Erkl\u00e4rt, welche Orte euch wichtig sind und warum. Vergleicht: Was haben eure Karten gemeinsam? Was ist unterschiedlich?",
              boardConfig: { taskId: "t1-5-ergebnisse", title: "Lebensweltkarten-Board", mode: "gallery", buttonLabel: "\u{1F4CB} Board \u00f6ffnen" }
            }
          ]
        }
      },
      {
        id: "t1-6",
        title: "Pausenspiel und Ausblick",
        icon: "\u{1F31F}",
        type: "multi-step",
        energyCost: 10,
        desc: "Denkt an euer Lieblings-Pausenspiel und schreibt die Regeln auf \u2014 die Kinder in Tansania bekommen es!",
        content: {
          subSteps: [
            {
              title: "Pausenspiel-Erfinder",
              subType: "text",
              text: "\u26BD Euer Lieblings-Pausenspiel!\n\nDenkt an ein Spiel, das ihr in der Pause gerne spielt.\n\n\u{1F4DD} Schreibt die Regeln auf (maximal 5 Regeln).\n\u{1F3A8} Zeichnet, wie das Spiel aussieht.\n\u{1F4E6} Dieses Spiel schicken wir an die Kinder in Tansania!\n\u{1F30D} Die Kinder in Tansania machen das Gleiche \u2014 sie schicken uns ihr Lieblings-Pausenspiel zurück.\n\u{1F4F9} Am Tag 2 tauschen wir die Spiele beim Video-Call aus!"
            },
            {
              title: "Ausblick auf morgen",
              subType: "text",
              text: "Morgen reisen wir nach Tansania \u2014 zumindest gedanklich! Wir lernen unser Partnerland kennen, vergleichen den Alltag von Kindern in Tansania mit unserem und tauschen unsere Pausenspiele beim Video-Call aus. Seid gespannt!"
            }
          ]
        }
      }
    ]
  },

  // ===== TAG 2: Austausch mit Tansania =====
  {
    id: 2,
    name: "Tag 2",
    sub: "Austausch mit Tansania",
    emoji: "\u{1F30D}",
    color: "#00B4D8",
    iconImage: "/images/day-icons/tag2-icon.png",
    steps: [
      {
        id: "t2-1",
        title: "Tansania entdecken",
        icon: "\u{1F30D}",
        type: "multi-step",
        energyCost: 15,
        content: {
          subSteps: [
            {
              title: "Fragenwerkstatt",
              subType: "text",
              boardEnabled: true,
              taskId: "t2-1-fragen",
              text: "Sammelt gute Fragen für die Kinder in Tansania! Pro Gruppe 4 Fragen zu den Themen: Pause und Freizeit, Schule und Lernen, Mitbestimmung, Alltag. Regel: Fragen müssen offen und respektvoll sein!"
            },
            {
              title: "Landeskunde Tansania",
              subType: "landeskunde",
              text: "Jetzt lernen wir Tansania kennen!"
            },
            {
              title: "Quiz: Was haben wir verstanden?",
              subType: "kahoot",
              content: {
                url: "https://create.kahoot.it/share/landeskunde-tansania-quiz/3d428bfc-549a-4437-9078-80222625c28c",
                label: "Quiz starten!"
              }
            }
          ]
        }
      },
      {
        id: "t2-2",
        title: "Vorbereitung Austausch",
        icon: "\u{1F4CB}",
        type: "multi-step",
        energyCost: 10,
        content: {
          subSteps: [
            {
              title: "Pausenspiel und Rollen klären",
              subType: "text",
              text: "Wir bereiten uns auf den Video-Call vor! Rollen: Begrüßung/Moderation, Zeitwächter:in, Technik/Kamera, Frage-Kapitän:in. Ablauf an die Tafel schreiben!"
            },
            {
              title: "Poster-Probe und Top-Fragen",
              subType: "text",
              text: "Jede Gruppe übt ihre Poster-Präsentation (30\u201340 Sekunden). Dann wählen wir die Top-6 Fragen aus: 2 zu Pause, 2 zu Schule, 1 zu Mitbestimmung, 1 zu Alltag.",
              boardConfig: { referenceTaskId: "t2-1-fragen", buttonLabel: "\u{1F4CB} Fragen-Board öffnen" }
            }
          ]
        }
      },
      {
        id: "t2-3",
        title: "Video-Call mit Tansania",
        icon: "\u{1F4F9}",
        type: "meet",
        energyCost: 15,
        content: {
          url: "https://meet.google.com/abg-ffyn-myz",
          label: "Jetzt sprechen!",
          description: "Zeigt eure Poster, stellt das Pausenspiel vor und stellt eure Fragen!"
        }
      },
      {
        id: "t2-4",
        title: "Feedback: 3-2-1",
        icon: "\u{1F4AC}",
        type: "activity",
        energyCost: 10,
        content: {
          title: "3-2-1 Feedback",
          text: "Was haben wir wirklich gelernt? 3 Dinge, die ihr gelernt habt. 2 Gemeinsamkeiten zwischen Deutschland und Tansania. 1 Überraschung."
        }
      },
      {
        id: "t2-5",
        title: "Auswertung und Lernprodukt",
        icon: "\u{1F4DD}",
        type: "multi-step",
        energyCost: 15,
        content: {
          subSteps: [
            {
              title: "Faktenkarten sortieren",
              subType: "text",
              text: "Trennt eure Beobachtungen: Was haben wir gehört/gesehen? Was denken wir? Was wissen wir nicht? Pro Gruppe 8 Karten, je Bereich 1 Gemeinsamkeit + 1 Unterschied. Bereiche: Pause, Schule, Zuhause, Mitbestimmung."
            },
            {
              title: "Kinderrechte-Brückenposter DE\u2013TZ",
              subType: "text",
              text: "Jedes Team wählt aus den Karten: 1 Gemeinsamkeit, 1 Unterschied, 1 offene Frage + Kinderrecht-Tag. Alles auf ein großes Poster übertragen! 4 Teams: Pause / Schule / Zuhause / Mitbestimmung."
            }
          ]
        }
      },
      {
        id: "t2-6",
        title: "Ausblick und Reflexion",
        icon: "\u{1F4AD}",
        type: "activity",
        energyCost: 5,
        content: {
          title: "Was machen wir morgen?",
          text: "Morgen geht es weiter mit dem Game Design Lab und euren eigenen Projekten!"
        }
      }
    ]
  },

  // ===== TAG 3: Game Design und Projektstart =====
  {
    id: 3,
    name: "Tag 3",
    sub: "Game Design und Projektstart",
    emoji: "\u{1F3AE}",
    color: "#9B59B6",
    iconImage: "/images/day-icons/tag3-icon.png",
    steps: [
      {
        id: "t3-1",
        title: "Pausenspiel im Hof",
        icon: "\u26BD",
        type: "multi-step",
        energyCost: 10,
        content: {
          subSteps: [
            {
              title: "Pausenspiel spielen!",
              subType: "text",
              text: "Ab nach draußen! Wir spielen das Pausenspiel im Hof."
            },
            {
              title: "Feedbackrunde",
              subType: "text",
              text: "Wie war das Spiel? Was hat euch gefallen? Wollen wir etwas ändern? Neue Regel vorschlagen!"
            }
          ]
        }
      },
      {
        id: "t3-2",
        title: "Game Design Lab",
        icon: "\u{1F3AE}",
        type: "activity",
        energyCost: 15,
        content: {
          title: "Game Design Lab",
          text: "Heute designt ihr euer eigenes Spiel! Füllt das Arbeitsblatt aus und schreibt eure eigenen Prompts."
        }
      },
      {
        id: "t3-3",
        title: "Gruppeneinteilung",
        icon: "\u{1F465}",
        type: "activity",
        energyCost: 10,
        content: {
          title: "Gruppeneinteilung",
          text: "Jetzt teilen wir uns in zwei Gruppen auf:",
          layout: "group-cards",
          groups: [
            {
              name: "CoSpaces \u2014 Digitales Projekt",
              icon: "\u{1F4BB}",
              task: "Baut eine 3D-Welt am Computer!"
            },
            {
              name: "Poster \u2014 Kreatives Projekt",
              icon: "\u{1F3A8}",
              task: "Gestaltet ein buntes Poster!"
            }
          ],
          boardConfig: { taskId: "t3-3-gruppen", title: "Gruppen-Board", columns: ["Poster-Crew \u{1F3A8}", "CoSpaces-Team \u{1F30D}"], buttonLabel: "\u{1F4CB} Gruppen-Board öffnen" }
        }
      },
      {
        id: "t3-4",
        title: "Projektarbeit",
        icon: "\u{1F6E0}\uFE0F",
        type: "activity",
        energyCost: 15,
        content: {
          title: "Projektarbeit \u2014 Los geht\u2019s!",
          text: "Arbeitet in euren Gruppen an euren Projekten!"
        }
      }
    ]
  },

  // ===== TAG 4: Projektarbeit =====
  {
    id: 4,
    name: "Tag 4",
    sub: "Projektarbeit",
    emoji: "\u{1F6E0}\uFE0F",
    color: "#2ECC71",
    iconImage: "/images/day-icons/tag4-icon.png",
    dayIntro: {
      recap: {
        title: "Weiter geht\u2019s!",
        text: "Heute arbeitet ihr weiter an euren Projekten. Macht sie fertig für die Präsentation morgen!"
      },
      energizer: {
        title: "Energizer vor der Projektarbeit",
        text: "Bevor es losgeht, machen wir uns wach!",
        useRandom: true
      }
    },
    steps: [
      {
        id: "t4-1",
        title: "Projektarbeit fortsetzen",
        icon: "\u{1F4BB}",
        type: "activity",
        energyCost: 15,
        content: {
          title: "Projektarbeit",
          text: "Arbeitet weiter an euren Projekten! Macht sie fertig für die Präsentation morgen. CoSpaces-Gruppe: Projekt fertigstellen. Poster-Gruppe: Poster fertig gestalten. Übt eure Präsentation!"
        }
      }
    ]
  },

  // ===== TAG 5: Präsentationen und Abschluss =====
  {
    id: 5,
    name: "Tag 5",
    sub: "Präsentationen und Abschluss",
    emoji: "\u{1F389}",
    color: "#E74C3C",
    iconImage: "/images/day-icons/tag5-icon.png",
    steps: [
      {
        id: "t5-0",
        title: "Letzte Projektarbeit",
        icon: "\u{1F4DD}",
        type: "activity",
        energyCost: 10,
        content: {
          title: "Letzte Projektarbeit",
          text: "Nutzt die letzte Arbeitsphase, um eure Projekte fertigzustellen. Überprüft alles noch einmal und bereitet euch auf die Präsentation vor!"
        }
      },
      {
        id: "t5-1",
        title: "Spiele ausprobieren",
        icon: "\u{1F3B2}",
        type: "activity",
        energyCost: 10,
        content: {
          title: "Spiele ausprobieren!",
          text: "Wir spielen die Spiele aus Tansania und eure eigenen Spiele aus dem Game Design Lab!"
        }
      },
      {
        id: "t5-2",
        title: "Video-Call Nr. 2",
        icon: "\u{1F4F9}",
        type: "meet",
        energyCost: 15,
        content: {
          url: "https://meet.google.com/tss-csqz-jeg",
          label: "Jetzt sprechen!",
          description: "Zweiter Video-Call mit Tansania \u2014 Spiele zeigen und Ergebnisse teilen!"
        }
      },
      {
        id: "t5-3",
        title: "Präsentationen",
        icon: "\u{1F3A4}",
        type: "activity",
        energyCost: 15,
        content: {
          title: "Eure Ergebnisse!",
          text: "Jede Gruppe präsentiert ihr Projekt! CoSpaces-Gruppe zeigt ihr digitales Projekt. Poster-Gruppe präsentiert ihre Poster."
        }
      },
      {
        id: "t5-4",
        title: "Abschluss und Reflexion",
        icon: "\u{1F4AD}",
        type: "activity",
        energyCost: 10,
        content: {
          title: "Abschluss der Projektwoche!",
          text: "Was nehmt ihr mit aus dieser Woche? Was hat euch am besten gefallen?",
          boardConfig: { taskId: "t5-4-feedback", title: "3-2-1 Feedback", columns: ["3 Dinge die gut waren", "2 Dinge die ich gelernt habe", "1 Wunsch für die Zukunft"], buttonLabel: "\u{1F4CB} Feedback-Board öffnen" }
        }
      },
      {
        id: "t5-5",
        title: "Nachtest: Was habt ihr gelernt?",
        icon: "\u{1F4DD}",
        type: "einzelquiz",
        energyCost: 5,
        content: {
          quizType: "nachtest",
          description: "Beantwortet die gleichen Fragen noch einmal \u2014 mal sehen, wie viel ihr gelernt habt!"
        }
      }
    ]
  }
];
