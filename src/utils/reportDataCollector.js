import { ref, get } from 'firebase/database';
import { db } from '../firebase';
import { DAYS } from '../data/days';

/**
 * Collect ALL report data from Firebase for a given class/project.
 * Returns a structured object ready for AI analysis + PDF generation.
 */
export async function collectReportData({ className, projectId, project, teacherName }) {
  if (!className) throw new Error('className required');

  // Fetch all data in parallel
  const [
    stateSnap, timingsSnap, dailyReportsSnap,
    quizResultsSnap, savedBoardsSnap,
    einzelquizzesSnap, einzelquizResultsSnap,
    artRoomsSnap,
  ] = await Promise.all([
    get(ref(db, `classes/${className}/state`)),
    get(ref(db, `classes/${className}/taskTimings`)),
    get(ref(db, `classes/${className}/dailyReports`)),
    get(ref(db, `quizResults/${className}`)),
    get(ref(db, 'savedBoards')),
    get(ref(db, 'einzelquizzes')),
    get(ref(db, 'einzelquizResults')),
    get(ref(db, 'artRooms')),
  ]);

  const gameState = stateSnap.val() || {};
  const taskTimings = timingsSnap.val() || {};
  const dailyReportsRaw = dailyReportsSnap.val() || {};
  const quizResultsRaw = quizResultsSnap.val() || {};
  const savedBoardsRaw = savedBoardsSnap.val() || {};
  const einzelquizzesRaw = einzelquizzesSnap.val() || {};
  const einzelquizResultsRaw = einzelquizResultsSnap.val() || {};
  const artRoomsRaw = artRoomsSnap.val() || {};

  // 1. DAILY REPORTS
  const dailyReports = {};
  for (let i = 1; i <= 5; i++) {
    dailyReports[i] = dailyReportsRaw[i] || null;
  }

  // 2. GAME PROGRESS
  const completedSteps = gameState.completedSteps || {};
  const completedDays = Array.isArray(gameState.completedDays) ? gameState.completedDays : [];
  const missionsPerDay = {};
  let totalCompleted = 0;
  let totalPossible = 0;
  DAYS.forEach(day => {
    const completed = day.steps.filter(s => completedSteps[s.id]).length;
    missionsPerDay[day.id] = { completed, total: day.steps.length };
    totalCompleted += completed;
    totalPossible += day.steps.length;
  });

  // 3. LIVE QUIZ RESULTS
  const quizResults = Object.entries(quizResultsRaw).map(([code, result]) => {
    const players = result.players || {};
    const playerList = Object.entries(players).map(([name, data]) => ({
      name,
      score: data.score || 0,
      answers: data.answers || [],
    }));
    playerList.sort((a, b) => b.score - a.score);

    const questions = result.questions || [];
    const answers = result.answers || {};
    const questionStats = questions.map((q, idx) => {
      const qAnswers = answers[idx] || {};
      const totalA = Object.keys(qAnswers).length;
      let correct = 0;
      if (totalA > 0) {
        Object.values(qAnswers).forEach(ans => {
          if ((q.type === 'mc' || q.type === 'tf') && ans.answer === q.correctIndex) correct++;
          else if (q.type === 'open') {
            const accepted = (q.acceptedAnswers || []).map(a => a.trim().toLowerCase());
            if (accepted.includes((ans.answer || '').trim().toLowerCase())) correct++;
          }
        });
      }
      return {
        question: q.text || `Frage ${idx + 1}`,
        correctPercent: totalA > 0 ? Math.round((correct / totalA) * 100) : 0,
      };
    });

    return {
      code,
      quizTitle: result.quizTitle || 'Quiz',
      date: result.savedAt ? new Date(result.savedAt).toLocaleDateString('de-DE') : '',
      participantCount: result.playerCount || playerList.length,
      questions: questionStats,
      participants: playerList.slice(0, 10), // top 10
      overallAverage: playerList.length > 0
        ? Math.round(playerList.reduce((s, p) => s + p.score, 0) / playerList.length)
        : 0,
    };
  });

  // 4. EINZELQUIZ (Vortest/Nachtest)
  const projectQuizzes = Object.entries(einzelquizzesRaw)
    .filter(([, q]) => q.projectId === projectId)
    .map(([key, q]) => ({ ...q, _key: key }));

  const vortestQuiz = projectQuizzes.find(q => q.quizType === 'vortest');
  const nachtestQuiz = projectQuizzes.find(q => q.quizType === 'nachtest');

  const getEinzelquizStats = (quiz) => {
    if (!quiz) return null;
    const results = einzelquizResultsRaw[quiz._key];
    if (!results) return { quiz, participants: [], questionAverages: [] };

    const participants = Object.entries(results).map(([name, data]) => {
      const answers = data.answers || {};
      let correct = 0;
      const total = quiz.questions?.length || 0;
      (quiz.questions || []).forEach((q, idx) => {
        const ans = answers[idx];
        if (ans === undefined || ans === null) return;
        if ((q.type === 'mc' || q.type === 'tf') && ans === q.correctIndex) correct++;
        else if (q.type === 'open') {
          const accepted = (q.acceptedAnswers || []).map(a => a.trim().toLowerCase());
          if (accepted.includes((typeof ans === 'string' ? ans : '').trim().toLowerCase())) correct++;
        }
      });
      return { name, correct, total, percent: total > 0 ? Math.round((correct / total) * 100) : 0 };
    });

    const questionAverages = (quiz.questions || []).map((q, idx) => {
      let correct = 0;
      let answered = 0;
      Object.values(results).forEach(data => {
        const ans = (data.answers || {})[idx];
        if (ans === undefined || ans === null) return;
        answered++;
        if ((q.type === 'mc' || q.type === 'tf') && ans === q.correctIndex) correct++;
      });
      return {
        question: q.text || `Frage ${idx + 1}`,
        correctPercent: answered > 0 ? Math.round((correct / answered) * 100) : 0,
      };
    });

    return { quiz, participants, questionAverages };
  };

  const vortestStats = getEinzelquizStats(vortestQuiz);
  const nachtestStats = getEinzelquizStats(nachtestQuiz);

  let comparison = null;
  if (vortestStats?.questionAverages?.length && nachtestStats?.questionAverages?.length) {
    comparison = vortestStats.questionAverages.map((vq, idx) => {
      const nq = nachtestStats.questionAverages[idx];
      return {
        question: vq.question,
        vortest: vq.correctPercent,
        nachtest: nq ? nq.correctPercent : 0,
        delta: nq ? nq.correctPercent - vq.correctPercent : 0,
      };
    });
  }

  // 5. BOARDS (filter by projectId)
  const boards = Object.entries(savedBoardsRaw)
    .filter(([, b]) => !projectId || b.projectId === projectId)
    .map(([key, board]) => {
      const columns = (board.columns || []).map(col => {
        const posts = col.posts ? Object.values(col.posts) : [];
        return {
          name: col.title || 'Spalte',
          posts: posts.map(p => ({
            content: p.text || '',
            author: p.author || '',
            photoUrl: p.imageUrl || null,
          })),
        };
      });
      const totalPosts = columns.reduce((s, c) => s + c.posts.length, 0);
      const allPhotos = columns.flatMap(c => c.posts.filter(p => p.photoUrl).map(p => ({
        url: p.photoUrl,
        author: p.author,
      })));
      return {
        boardName: board.title || 'Board',
        createdAt: board.createdAt || board.savedAt,
        columns,
        totalPosts,
        totalPhotos: allPhotos.length,
        photos: allPhotos.slice(0, 20), // cap at 20
      };
    });

  // 6. ART CREATIONS (filter by projectId)
  const artCreations = { images: [], videos: [], music: [] };
  Object.entries(artRoomsRaw).forEach(([code, room]) => {
    if (projectId && room.projectId !== projectId) return;

    if (room.images) {
      Object.values(room.images).forEach(img => {
        artCreations.images.push({
          imageUrl: img.imageUrl || img.url || '',
          prompt: img.prompt || '',
          author: img.artist || img.author || '',
          style: img.style || '',
          createdAt: img.createdAt || 0,
        });
      });
    }
    if (room.videos) {
      Object.values(room.videos).forEach(vid => {
        artCreations.videos.push({
          videoUrl: vid.videoUrl || vid.url || '',
          prompt: vid.prompt || '',
          author: vid.artist || vid.author || '',
          createdAt: vid.createdAt || 0,
        });
      });
    }
    if (room.music) {
      Object.values(room.music).forEach(mus => {
        artCreations.music.push({
          audioUrl: mus.audioUrl || mus.url || '',
          prompt: mus.prompt || '',
          author: mus.artist || mus.author || '',
          genre: mus.genre || '',
          createdAt: mus.createdAt || 0,
        });
      });
    }
  });
  // Sort by newest first, cap images at 12
  artCreations.images.sort((a, b) => b.createdAt - a.createdAt);
  artCreations.videos.sort((a, b) => b.createdAt - a.createdAt);
  artCreations.music.sort((a, b) => b.createdAt - a.createdAt);
  artCreations.images = artCreations.images.slice(0, 12);

  return {
    // META
    projectName: project?.name || 'Projektwoche Kinderrechte',
    className,
    studentCount: project?.studentCount || 0,
    dateRange: {
      start: project?.startDate || '',
      end: '',
    },
    teacherName: teacherName || 'Lehrkraft',
    generatedAt: new Date().toISOString(),

    dailyReports,

    quizResults,

    einzelquizResults: {
      vortest: vortestStats,
      nachtest: nachtestStats,
      comparison,
    },

    boards,

    artCreations: {
      ...artCreations,
      totals: {
        images: artCreations.images.length,
        videos: artCreations.videos.length,
        music: artCreations.music.length,
      },
    },

    gameProgress: {
      completedDays,
      missionsPerDay,
      totalMissionsCompleted: totalCompleted,
      totalMissionsPossible: totalPossible,
    },
  };
}
