import React, { useState, useRef } from 'react';
import { collectReportData } from '../utils/reportDataCollector';
import { DAYS } from '../data/days';

const API_BASE = window.location.origin.includes('localhost')
  ? 'http://localhost:8888/.netlify/functions'
  : `${window.location.origin}/.netlify/functions`;

/**
 * Fetch an image URL and return base64 data URI, or null on failure.
 */
async function fetchImageAsBase64(url) {
  try {
    const resp = await fetch(url);
    if (!resp.ok) return null;
    const blob = await resp.blob();
    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.onloadend = () => resolve(reader.result);
      reader.onerror = () => resolve(null);
      reader.readAsDataURL(blob);
    });
  } catch {
    return null;
  }
}

export default function WochenberichtGenerator({ className, project, teacherName, onClose }) {
  const [step, setStep] = useState(0); // 0=idle, 1=collecting, 2=analyzing, 3=generating, 4=done
  const [error, setError] = useState(null);
  const [pdfUrl, setPdfUrl] = useState(null);
  const [fileName, setFileName] = useState('');
  const abortRef = useRef(false);

  const steps = [
    { label: 'Daten werden gesammelt...', icon: '\u{1F4E6}' },
    { label: 'KI analysiert die Ergebnisse...', icon: '\u{1F916}' },
    { label: 'PDF wird generiert...', icon: '\u{1F4C4}' },
    { label: 'Fertig!', icon: '\u2705' },
  ];

  const handleGenerate = async () => {
    abortRef.current = false;
    setStep(1);
    setError(null);

    try {
      // Step 1: Collect data
      const reportData = await collectReportData({
        className,
        projectId: project?.id,
        project,
        teacherName,
      });
      if (abortRef.current) return;

      // Step 2: AI Analysis
      setStep(2);
      let analysis = '';
      try {
        const resp = await fetch(`${API_BASE}/generate-report-analysis`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(reportData),
        });
        if (resp.ok) {
          const result = await resp.json();
          analysis = result.analysis || '';
        }
      } catch {
        // AI analysis is optional — continue without it
        console.warn('AI analysis failed, continuing without it');
      }
      if (abortRef.current) return;

      // Step 3: Generate PDF
      setStep(3);

      // Pre-fetch board photos (max 20) and art images (max 12) as base64
      const allImageUrls = [
        ...(reportData.boards || []).flatMap(b => (b.photos || []).map(p => p.url)),
        ...(reportData.artCreations?.images || []).map(i => i.imageUrl),
      ].filter(Boolean);

      const imageCache = {};
      const fetchPromises = allImageUrls.slice(0, 30).map(async (url) => {
        const b64 = await fetchImageAsBase64(url);
        if (b64) imageCache[url] = b64;
      });
      await Promise.all(fetchPromises);
      if (abortRef.current) return;

      // Dynamic import jsPDF to keep bundle small
      const { jsPDF } = await import('jspdf');
      await import('jspdf-autotable');

      const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
      const W = 210, H = 297, M = 20; // A4 width, height, margin
      const CW = W - 2 * M; // content width

      // Helpers
      const addPage = () => doc.addPage();
      let y = M;

      const checkPageBreak = (needed) => {
        if (y + needed > H - M) { addPage(); y = M; }
      };

      const setFont = (style, size) => {
        doc.setFont('helvetica', style);
        doc.setFontSize(size);
      };

      const drawText = (text, x, yPos, opts = {}) => {
        const maxW = opts.maxWidth || CW;
        const lines = doc.splitTextToSize(text, maxW);
        doc.text(lines, x, yPos, opts);
        return lines.length * (doc.getLineHeight() / doc.internal.scaleFactor);
      };

      // ==================== PAGE 1: COVER ====================
      // Light background
      doc.setFillColor(255, 245, 235);
      doc.rect(0, 0, W, H, 'F');

      // Title
      setFont('bold', 32);
      doc.setTextColor(51, 51, 51);
      doc.text('WOCHENBERICHT', W / 2, 80, { align: 'center' });

      setFont('normal', 18);
      doc.setTextColor(102, 102, 102);
      doc.text('Projektwoche Kinderrechte', W / 2, 95, { align: 'center' });

      setFont('bold', 16);
      doc.setTextColor(255, 107, 53);
      doc.text('Mission Weltverbinder', W / 2, 108, { align: 'center' });

      // Meta info
      setFont('normal', 14);
      doc.setTextColor(80, 80, 80);
      const metaY = 135;
      doc.text(`Klasse: ${className || '-'}`, W / 2, metaY, { align: 'center' });
      if (reportData.dateRange?.start) {
        doc.text(`Zeitraum: ${reportData.dateRange.start}`, W / 2, metaY + 10, { align: 'center' });
      }
      doc.text(`Lehrkraft: ${teacherName || '-'}`, W / 2, metaY + 20, { align: 'center' });
      if (reportData.studentCount > 0) {
        doc.text(`${reportData.studentCount} Schueler:innen`, W / 2, metaY + 30, { align: 'center' });
      }

      setFont('normal', 10);
      doc.setTextColor(150, 150, 150);
      const genDate = new Date().toLocaleDateString('de-DE', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' });
      doc.text(`Erstellt am: ${genDate}`, W / 2, H - 30, { align: 'center' });

      // ==================== PAGE 2: SUMMARY ====================
      addPage();
      y = M;

      setFont('bold', 20);
      doc.setTextColor(51, 51, 51);
      doc.text('Zusammenfassung der Projektwoche', M, y);
      y += 12;

      // Stats box
      const gp = reportData.gameProgress;
      const totalBoards = (reportData.boards || []).reduce((s, b) => s + b.totalPosts, 0);
      const totalArt = (reportData.artCreations?.totals?.images || 0) + (reportData.artCreations?.totals?.videos || 0) + (reportData.artCreations?.totals?.music || 0);
      const totalQuizParticipants = (reportData.quizResults || []).reduce((s, q) => s + q.participantCount, 0);

      doc.setFillColor(248, 248, 248);
      doc.roundedRect(M, y, CW, 50, 3, 3, 'F');
      doc.setDrawColor(220, 220, 220);
      doc.roundedRect(M, y, CW, 50, 3, 3, 'S');

      setFont('bold', 11);
      doc.setTextColor(100, 100, 100);
      doc.text('Kennzahlen', M + 5, y + 7);

      setFont('normal', 10);
      doc.setTextColor(80, 80, 80);
      const statsLeft = M + 5;
      const statsRight = M + CW / 2 + 5;
      doc.text(`Projekttage: ${gp.completedDays.length}/5`, statsLeft, y + 16);
      doc.text(`Missionen: ${gp.totalMissionsCompleted}/${gp.totalMissionsPossible}`, statsLeft, y + 23);
      doc.text(`Quiz-Teilnahmen: ${totalQuizParticipants}`, statsLeft, y + 30);
      doc.text(`Board-Beitraege: ${totalBoards}`, statsRight, y + 16);
      doc.text(`KI-Kreationen: ${totalArt}`, statsRight, y + 23);
      if (reportData.studentCount > 0) {
        doc.text(`Schueler:innen: ${reportData.studentCount}`, statsRight, y + 30);
      }
      y += 58;

      // AI Summary
      if (analysis) {
        const summaryMatch = analysis.match(/## Zusammenfassung[\s\S]*?(?=\n## |$)/i);
        if (summaryMatch) {
          const summaryText = summaryMatch[0].replace(/^## .*\n*/i, '').replace(/\*\*/g, '').trim();
          setFont('normal', 10);
          doc.setTextColor(60, 60, 60);
          const h = drawText(summaryText, M, y, { maxWidth: CW });
          y += h + 6;
        }
      }

      // ==================== PAGES 3-4: DAILY REPORTS ====================
      addPage();
      y = M;

      setFont('bold', 20);
      doc.setTextColor(51, 51, 51);
      doc.text('Tagesberichte', M, y);
      y += 12;

      DAYS.forEach(day => {
        checkPageBreak(40);
        const report = reportData.dailyReports[day.id];

        // Day header bar
        const dayColor = hexToRgb(day.color);
        doc.setFillColor(dayColor.r, dayColor.g, dayColor.b);
        doc.roundedRect(M, y, CW, 8, 2, 2, 'F');
        setFont('bold', 10);
        doc.setTextColor(255, 255, 255);
        doc.text(`${day.name}: ${day.sub}`, M + 4, y + 5.5);

        const missions = gp.missionsPerDay[day.id];
        if (missions) {
          doc.text(`${missions.completed}/${missions.total} Missionen`, M + CW - 40, y + 5.5);
        }
        y += 12;

        if (report) {
          setFont('bold', 9);
          doc.setTextColor(80, 80, 80);
          doc.text('Was wurde umgesetzt:', M, y);
          y += 5;
          setFont('normal', 9);
          doc.setTextColor(60, 60, 60);
          const h1 = drawText(report.whatWasDone || '-', M + 2, y, { maxWidth: CW - 4 });
          y += h1 + 3;

          if (report.studentReaction) {
            checkPageBreak(15);
            setFont('bold', 9);
            doc.setTextColor(80, 80, 80);
            doc.text('Reaktion der Schueler:innen:', M, y);
            y += 5;
            setFont('normal', 9);
            doc.setTextColor(60, 60, 60);
            const h2 = drawText(report.studentReaction, M + 2, y, { maxWidth: CW - 4 });
            y += h2 + 3;
          }

          if (report.observations) {
            checkPageBreak(15);
            setFont('bold', 9);
            doc.setTextColor(80, 80, 80);
            doc.text('Beobachtungen:', M, y);
            y += 5;
            setFont('normal', 9);
            doc.setTextColor(60, 60, 60);
            const h3 = drawText(report.observations, M + 2, y, { maxWidth: CW - 4 });
            y += h3 + 3;
          }
        } else {
          setFont('italic', 9);
          doc.setTextColor(180, 180, 180);
          doc.text('Kein Tagesbericht eingereicht.', M + 2, y);
          y += 6;
        }

        // Separator
        doc.setDrawColor(230, 230, 230);
        doc.line(M, y, M + CW, y);
        y += 6;
      });

      // ==================== QUIZ RESULTS ====================
      if ((reportData.quizResults || []).length > 0 || reportData.einzelquizResults?.comparison) {
        addPage();
        y = M;

        setFont('bold', 20);
        doc.setTextColor(51, 51, 51);
        doc.text('Quiz-Ergebnisse', M, y);
        y += 12;

        // Live Quizzes
        (reportData.quizResults || []).forEach(quiz => {
          checkPageBreak(30);
          setFont('bold', 11);
          doc.setTextColor(51, 51, 51);
          doc.text(`${quiz.quizTitle} — ${quiz.date} — ${quiz.participantCount} Teilnehmer:innen`, M, y);
          y += 7;

          if (quiz.questions.length > 0) {
            const tableBody = quiz.questions.map((q, i) => [
              `${i + 1}`,
              q.question.slice(0, 50),
              `${q.correctPercent}%`,
            ]);

            doc.autoTable({
              startY: y,
              head: [['#', 'Frage', 'Richtig %']],
              body: tableBody,
              margin: { left: M, right: M },
              styles: { font: 'helvetica', fontSize: 8, cellPadding: 2 },
              headStyles: { fillColor: [41, 128, 185], textColor: 255, fontStyle: 'bold' },
              alternateRowStyles: { fillColor: [248, 248, 248] },
              columnStyles: { 0: { cellWidth: 8 }, 2: { cellWidth: 20, halign: 'center' } },
            });
            y = doc.lastAutoTable.finalY + 4;
          }

          setFont('normal', 9);
          doc.setTextColor(100, 100, 100);
          doc.text(`Klassen-Durchschnitt: ${quiz.overallAverage} Punkte`, M, y);
          y += 10;
        });

        // Vortest/Nachtest comparison
        if (reportData.einzelquizResults?.comparison) {
          checkPageBreak(40);
          setFont('bold', 14);
          doc.setTextColor(51, 51, 51);
          doc.text('Vortest vs. Nachtest Vergleich', M, y);
          y += 8;

          const comp = reportData.einzelquizResults.comparison;
          const compBody = comp.map((c, i) => {
            const arrow = c.delta > 0 ? '+' : '';
            return [`${i + 1}`, c.question.slice(0, 45), `${c.vortest}%`, `${c.nachtest}%`, `${arrow}${c.delta}%`];
          });

          doc.autoTable({
            startY: y,
            head: [['#', 'Frage', 'Vortest', 'Nachtest', 'Delta']],
            body: compBody,
            margin: { left: M, right: M },
            styles: { font: 'helvetica', fontSize: 8, cellPadding: 2 },
            headStyles: { fillColor: [39, 174, 96], textColor: 255, fontStyle: 'bold' },
            columnStyles: {
              0: { cellWidth: 8 },
              2: { cellWidth: 18, halign: 'center' },
              3: { cellWidth: 18, halign: 'center' },
              4: { cellWidth: 18, halign: 'center' },
            },
            didParseCell: (data) => {
              if (data.section === 'body' && data.column.index === 4) {
                const delta = comp[data.row.index]?.delta || 0;
                if (delta > 10) data.cell.styles.textColor = [39, 174, 96];
                else if (delta >= 0) data.cell.styles.textColor = [230, 126, 34];
                else data.cell.styles.textColor = [231, 76, 60];
              }
            },
          });
          y = doc.lastAutoTable.finalY + 6;

          // Summary line
          const avgVor = Math.round(comp.reduce((s, c) => s + c.vortest, 0) / comp.length);
          const avgNach = Math.round(comp.reduce((s, c) => s + c.nachtest, 0) / comp.length);
          const avgDelta = avgNach - avgVor;
          setFont('bold', 10);
          doc.setTextColor(39, 174, 96);
          doc.text(`Gesamt-Verbesserung: ${avgDelta >= 0 ? '+' : ''}${avgDelta}%  |  Vortest: ${avgVor}%  ->  Nachtest: ${avgNach}%`, M, y);
          y += 10;
        }
      }

      // ==================== BOARD CONTENT ====================
      if ((reportData.boards || []).length > 0) {
        addPage();
        y = M;

        setFont('bold', 20);
        doc.setTextColor(51, 51, 51);
        doc.text('Board-Inhalte & Beitraege', M, y);
        y += 12;

        reportData.boards.forEach(board => {
          checkPageBreak(20);
          setFont('bold', 11);
          doc.setTextColor(51, 51, 51);
          doc.text(`${board.boardName} — ${board.totalPosts} Beitraege`, M, y);
          y += 7;

          board.columns.forEach(col => {
            if (col.posts.length === 0) return;
            checkPageBreak(12);
            setFont('bold', 9);
            doc.setTextColor(80, 80, 80);
            doc.text(`${col.name}:`, M + 2, y);
            y += 5;

            col.posts.slice(0, 10).forEach(post => {
              checkPageBreak(8);
              setFont('normal', 8);
              doc.setTextColor(60, 60, 60);
              const text = `"${post.content.slice(0, 80)}" — ${post.author}`;
              const h = drawText(text, M + 6, y, { maxWidth: CW - 10 });
              y += h + 1;
            });
            if (col.posts.length > 10) {
              setFont('italic', 8);
              doc.setTextColor(150, 150, 150);
              doc.text(`und ${col.posts.length - 10} weitere...`, M + 6, y);
              y += 5;
            }
            y += 2;
          });

          // Board photos
          const photos = board.photos || [];
          if (photos.length > 0) {
            checkPageBreak(50);
            setFont('bold', 9);
            doc.setTextColor(80, 80, 80);
            doc.text(`Fotos (${photos.length}):`, M + 2, y);
            y += 5;

            const imgW = 75;
            const imgH = 55;
            let col = 0;
            for (const photo of photos.slice(0, 8)) {
              const b64 = imageCache[photo.url];
              if (!b64) continue;
              checkPageBreak(imgH + 10);
              const xPos = M + col * (imgW + 10);
              try {
                doc.addImage(b64, 'JPEG', xPos, y, imgW, imgH);
                setFont('normal', 7);
                doc.setTextColor(120, 120, 120);
                doc.text(photo.author || '', xPos, y + imgH + 4);
              } catch { /* skip broken image */ }
              col++;
              if (col >= 2) { col = 0; y += imgH + 10; }
            }
            if (col > 0) y += imgH + 10;
          }

          doc.setDrawColor(230, 230, 230);
          doc.line(M, y, M + CW, y);
          y += 6;
        });
      }

      // ==================== AI CREATIONS ====================
      const artTotals = reportData.artCreations?.totals || {};
      if ((artTotals.images || 0) + (artTotals.videos || 0) + (artTotals.music || 0) > 0) {
        addPage();
        y = M;

        setFont('bold', 20);
        doc.setTextColor(51, 51, 51);
        doc.text('KI-Kreationen aus dem Kunst-Studio', M, y);
        y += 10;

        setFont('normal', 10);
        doc.setTextColor(80, 80, 80);
        doc.text(`Gesamt: ${artTotals.images || 0} Bilder, ${artTotals.videos || 0} Videos, ${artTotals.music || 0} Musikstuecke`, M, y);
        y += 10;

        // AI Images
        const aiImages = reportData.artCreations?.images || [];
        if (aiImages.length > 0) {
          setFont('bold', 12);
          doc.setTextColor(51, 51, 51);
          doc.text('Bilder', M, y);
          y += 7;

          const imgW = 75;
          const imgH = 55;
          let col = 0;
          for (const img of aiImages.slice(0, 8)) {
            const b64 = imageCache[img.imageUrl];
            if (!b64) continue;
            checkPageBreak(imgH + 15);
            const xPos = M + col * (imgW + 10);
            try {
              doc.addImage(b64, 'JPEG', xPos, y, imgW, imgH);
              setFont('normal', 7);
              doc.setTextColor(120, 120, 120);
              doc.text(`${(img.prompt || '').slice(0, 40)} — ${img.author}`, xPos, y + imgH + 4, { maxWidth: imgW });
            } catch { /* skip */ }
            col++;
            if (col >= 2) { col = 0; y += imgH + 12; }
          }
          if (col > 0) y += imgH + 12;
        }

        // Videos list
        const vids = reportData.artCreations?.videos || [];
        if (vids.length > 0) {
          checkPageBreak(15);
          setFont('bold', 12);
          doc.setTextColor(51, 51, 51);
          doc.text('Videos', M, y);
          y += 7;
          vids.forEach(v => {
            checkPageBreak(6);
            setFont('normal', 9);
            doc.setTextColor(60, 60, 60);
            doc.text(`Video: "${(v.prompt || '').slice(0, 60)}" — Von: ${v.author}`, M + 4, y);
            y += 5;
          });
          y += 4;
        }

        // Music list
        const mus = reportData.artCreations?.music || [];
        if (mus.length > 0) {
          checkPageBreak(15);
          setFont('bold', 12);
          doc.setTextColor(51, 51, 51);
          doc.text('Musik', M, y);
          y += 7;
          mus.forEach(m => {
            checkPageBreak(6);
            setFont('normal', 9);
            doc.setTextColor(60, 60, 60);
            doc.text(`Musik: "${(m.prompt || '').slice(0, 50)}" (${m.genre || '-'}) — Von: ${m.author}`, M + 4, y);
            y += 5;
          });
        }
      }

      // ==================== AI ANALYSIS + FEB ====================
      if (analysis) {
        addPage();
        y = M;

        setFont('bold', 20);
        doc.setTextColor(51, 51, 51);
        doc.text('Analyse & Erkenntnisse', M, y);
        y += 12;

        // Parse markdown analysis sections and render
        const sections = analysis.split(/\n## /);
        sections.forEach(section => {
          const lines = section.trim().split('\n');
          if (lines.length === 0) return;

          // Section title
          const titleLine = lines[0].replace(/^#+\s*/, '');
          if (titleLine) {
            checkPageBreak(12);
            setFont('bold', 12);
            doc.setTextColor(51, 51, 51);
            doc.text(titleLine, M, y);
            y += 7;
          }

          // Section content
          const content = lines.slice(1).join('\n').replace(/\*\*/g, '').trim();
          if (content) {
            checkPageBreak(10);
            setFont('normal', 9);
            doc.setTextColor(60, 60, 60);
            const h = drawText(content, M, y, { maxWidth: CW });
            y += h + 6;
          }
        });
      }

      // ==================== LAST PAGE: FOOTER ====================
      addPage();
      y = H / 2 - 20;

      doc.setDrawColor(200, 200, 200);
      doc.line(M + 20, y, M + CW - 20, y);
      y += 10;

      setFont('normal', 10);
      doc.setTextColor(150, 150, 150);
      doc.text('Dieser Bericht wurde automatisch erstellt von', W / 2, y, { align: 'center' });
      y += 6;
      setFont('bold', 11);
      doc.setTextColor(100, 100, 100);
      doc.text('Mission Weltverbinder — Projektwoche Kinderrechte', W / 2, y, { align: 'center' });
      y += 6;
      setFont('normal', 10);
      doc.setTextColor(150, 150, 150);
      doc.text('Lebenshilfe in der Schule Berlin — Zukunftswerkstatt', W / 2, y, { align: 'center' });
      y += 12;
      doc.text(`Erstellt am: ${genDate}`, W / 2, y, { align: 'center' });

      // Generate blob and create download URL
      const pdfBlob = doc.output('blob');
      const url = URL.createObjectURL(pdfBlob);
      const fName = `Wochenbericht_Kinderrechte_${className || 'Klasse'}_${new Date().toISOString().slice(0, 10)}.pdf`;

      setPdfUrl(url);
      setFileName(fName);
      setStep(4);

      // Auto-download
      const a = document.createElement('a');
      a.href = url;
      a.download = fName;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);

    } catch (err) {
      console.error('Report generation error:', err);
      setError(err.message || 'Unbekannter Fehler');
      setStep(0);
    }
  };

  const handleDownload = () => {
    if (!pdfUrl) return;
    const a = document.createElement('a');
    a.href = pdfUrl;
    a.download = fileName;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  const handlePreview = () => {
    if (pdfUrl) window.open(pdfUrl, '_blank');
  };

  return (
    <div style={s.overlay}>
      <div style={s.modal}>
        <h2 style={s.title}>{'\u{1F4CA}'} Wochenbericht erstellen</h2>
        <p style={s.subtitle}>{className}{project?.name ? ` — ${project.name}` : ''}</p>

        {step === 0 && !error && (
          <div style={s.startSection}>
            <p style={s.desc}>
              Es wird ein professioneller PDF-Bericht generiert mit:
              Tagesberichten, Quiz-Ergebnissen, Board-Inhalten, KI-Kreationen und einer KI-Analyse.
            </p>
            <button onClick={handleGenerate} style={s.generateBtn}>
              {'\u{1F680}'} Bericht generieren
            </button>
          </div>
        )}

        {step > 0 && step < 4 && (
          <div style={s.progressSection}>
            {steps.map((st, i) => {
              const isActive = i + 1 === step;
              const isDone = i + 1 < step;
              return (
                <div key={i} style={s.progressRow}>
                  <span style={{
                    ...s.progressIcon,
                    color: isDone ? '#27AE60' : isActive ? '#2980B9' : '#CCC',
                  }}>
                    {isDone ? '\u2705' : isActive ? '\u23F3' : '\u25CB'}
                  </span>
                  <span style={{
                    ...s.progressLabel,
                    color: isDone ? '#27AE60' : isActive ? '#333' : '#BBB',
                    fontWeight: isActive ? 700 : 500,
                  }}>
                    {st.label}
                  </span>
                </div>
              );
            })}
            {step > 0 && step < 4 && (
              <div style={s.spinner} />
            )}
          </div>
        )}

        {step === 4 && (
          <div style={s.doneSection}>
            <div style={{ fontSize: 48 }}>{'\u2705'}</div>
            <p style={s.doneText}>Bericht wurde erstellt und heruntergeladen!</p>
            <div style={s.doneActions}>
              <button onClick={handleDownload} style={s.downloadBtn}>
                {'\u{1F4E5}'} Nochmal herunterladen
              </button>
              <button onClick={handlePreview} style={s.previewBtn}>
                {'\u{1F441}\uFE0F'} Vorschau
              </button>
            </div>
          </div>
        )}

        {error && (
          <div style={s.errorBox}>
            <p style={s.errorText}>Fehler: {error}</p>
            <button onClick={() => { setError(null); setStep(0); }} style={s.retryBtn}>
              Nochmal versuchen
            </button>
          </div>
        )}

        <button onClick={() => { abortRef.current = true; onClose(); }} style={s.closeBtn}>
          {step === 4 ? 'Schliessen' : 'Abbrechen'}
        </button>
      </div>
    </div>
  );
}

function hexToRgb(hex) {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  return result ? {
    r: parseInt(result[1], 16),
    g: parseInt(result[2], 16),
    b: parseInt(result[3], 16),
  } : { r: 100, g: 100, b: 100 };
}

const s = {
  overlay: {
    position: 'fixed',
    inset: 0,
    zIndex: 9900,
    background: 'rgba(0,0,0,0.5)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
  },
  modal: {
    background: '#fff',
    borderRadius: 24,
    padding: '32px 28px',
    maxWidth: 500,
    width: '100%',
    boxShadow: '0 20px 60px rgba(0,0,0,0.2)',
    textAlign: 'center',
  },
  title: {
    fontFamily: "'Lilita One', cursive",
    fontSize: 24,
    color: '#333',
    margin: '0 0 4px',
  },
  subtitle: {
    fontFamily: "'Fredoka', sans-serif",
    fontSize: 14,
    color: '#999',
    margin: '0 0 20px',
    fontWeight: 500,
  },
  startSection: {
    marginBottom: 16,
  },
  desc: {
    fontFamily: "'Fredoka', sans-serif",
    fontSize: 14,
    color: '#666',
    lineHeight: 1.5,
    margin: '0 0 16px',
    textAlign: 'left',
  },
  generateBtn: {
    width: '100%',
    padding: '14px 24px',
    border: 'none',
    borderRadius: 14,
    background: 'linear-gradient(135deg, #FF6B35 0%, #FF8F5E 100%)',
    color: '#fff',
    fontFamily: "'Lilita One', cursive",
    fontSize: 18,
    cursor: 'pointer',
    boxShadow: '0 4px 14px rgba(255, 107, 53, 0.3)',
  },
  progressSection: {
    display: 'flex',
    flexDirection: 'column',
    gap: 12,
    marginBottom: 16,
    textAlign: 'left',
  },
  progressRow: {
    display: 'flex',
    alignItems: 'center',
    gap: 10,
  },
  progressIcon: {
    fontSize: 18,
    width: 24,
    textAlign: 'center',
  },
  progressLabel: {
    fontFamily: "'Fredoka', sans-serif",
    fontSize: 15,
  },
  spinner: {
    width: 32,
    height: 32,
    border: '3px solid #E0D6CC',
    borderTopColor: '#FF6B35',
    borderRadius: '50%',
    animation: 'spin 1s linear infinite',
    margin: '8px auto 0',
  },
  doneSection: {
    marginBottom: 16,
  },
  doneText: {
    fontFamily: "'Fredoka', sans-serif",
    fontSize: 16,
    fontWeight: 600,
    color: '#27AE60',
    margin: '8px 0 16px',
  },
  doneActions: {
    display: 'flex',
    gap: 10,
    justifyContent: 'center',
  },
  downloadBtn: {
    padding: '10px 18px',
    border: 'none',
    borderRadius: 12,
    background: '#2980B9',
    color: '#fff',
    fontFamily: "'Fredoka', sans-serif",
    fontSize: 14,
    fontWeight: 600,
    cursor: 'pointer',
  },
  previewBtn: {
    padding: '10px 18px',
    border: '2px solid #E0D6CC',
    borderRadius: 12,
    background: '#fff',
    color: '#666',
    fontFamily: "'Fredoka', sans-serif",
    fontSize: 14,
    fontWeight: 600,
    cursor: 'pointer',
  },
  errorBox: {
    background: '#FFEBEE',
    borderRadius: 12,
    padding: '16px',
    marginBottom: 12,
  },
  errorText: {
    fontFamily: "'Fredoka', sans-serif",
    fontSize: 14,
    color: '#C62828',
    margin: '0 0 8px',
  },
  retryBtn: {
    padding: '8px 16px',
    border: 'none',
    borderRadius: 10,
    background: '#E74C3C',
    color: '#fff',
    fontFamily: "'Fredoka', sans-serif",
    fontSize: 13,
    fontWeight: 600,
    cursor: 'pointer',
  },
  closeBtn: {
    marginTop: 8,
    padding: '10px 24px',
    border: 'none',
    borderRadius: 12,
    background: 'rgba(0,0,0,0.06)',
    color: '#666',
    fontFamily: "'Fredoka', sans-serif",
    fontSize: 15,
    fontWeight: 600,
    cursor: 'pointer',
  },
};
