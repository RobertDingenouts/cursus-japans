"use client";

// Cursus Japans — losse statische versie, in dezelfde huisstijl als het clubplatform
// (judoclubmichigami.nl). Alle progressie blijft in de browser (localStorage).

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  ChevronLeft,
  ChevronRight,
  RotateCcw,
  Volume2,
  VolumeX,
  Star,
  Trophy,
  Lock,
  BookOpen,
} from "lucide-react";
import { japaneseCourseData, beltColors } from "@/data/terms";

const BASE_PATH = process.env.NEXT_PUBLIC_BASE_PATH ?? "";
const ORDER: (string | number)[] = ["algemeen", "wedstrijd", 0, 1, 2, 3, 4, 5];
const BELT_ORDER = [0, 1, 2, 3, 4, 5];

type Term = { uitspraak: string; nederlands: string; categorie: string; level: string | number };

const slug = (s: string) => s.toLowerCase().replace(/\s+/g, "-");
const getAudioPath = (term: string) => `${BASE_PATH}/audio/japanese/${slug(term)}.wav`;

function levelMeta(level: string | number) {
  const c = (beltColors as Record<string | number, { bg: string; text: string; border: string; label: string }>)[level];
  if (c) return { ...c, name: japaneseCourseData.levelNames[level] ?? String(level) };
  return { bg: "#fdf6f6", text: "#a90000", border: "#a90000", label: "", name: japaneseCourseData.levelNames[level] ?? String(level) };
}

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

// ---------------------------------------------------------------- audio

function useSounds() {
  const [enabled, setEnabled] = useState(true);
  const ctxRef = useRef<AudioContext | null>(null);
  const getCtx = useCallback(() => {
    if (!ctxRef.current) ctxRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
    return ctxRef.current;
  }, []);
  const playTone = useCallback(
    (freq: number, duration: number, type: OscillatorType = "sine", volume = 0.15) => {
      if (!enabled) return;
      try {
        const ctx = getCtx();
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = type;
        osc.frequency.setValueAtTime(freq, ctx.currentTime);
        gain.gain.setValueAtTime(volume, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + duration);
        osc.connect(gain).connect(ctx.destination);
        osc.start();
        osc.stop(ctx.currentTime + duration);
      } catch {}
    },
    [enabled, getCtx]
  );
  const sounds = useMemo(
    () => ({
      click: () => playTone(600, 0.06, "sine", 0.06),
      flip: () => playTone(800, 0.1, "sine", 0.08),
      correct: () => {
        playTone(523, 0.15, "sine", 0.12);
        setTimeout(() => playTone(659, 0.15, "sine", 0.12), 100);
        setTimeout(() => playTone(784, 0.2, "sine", 0.12), 200);
      },
      wrong: () => {
        playTone(220, 0.18, "square", 0.09);
        setTimeout(() => playTone(165, 0.32, "square", 0.09), 140);
      },
      pass: () => [523, 659, 784, 1047].forEach((n, i) => setTimeout(() => playTone(n, 0.3, "sine", 0.15), i * 150)),
      fail: () => playTone(196, 0.4, "triangle", 0.12),
      unlock: () => [392, 523, 659].forEach((n, i) => setTimeout(() => playTone(n, 0.25, "sine", 0.13), i * 120)),
    }),
    [playTone]
  );
  return { sounds, enabled, setEnabled };
}

function PlayButton({ term, size = "md" }: { term: string; size?: "sm" | "md" }) {
  const [playing, setPlaying] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const iconSize = size === "sm" ? "w-4 h-4" : "w-5 h-5";
  const btnPadding = size === "sm" ? "p-2" : "p-2.5";
  const play = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
    }
    const audio = new Audio(getAudioPath(term));
    audioRef.current = audio;
    setPlaying(true);
    audio.play().catch(() => {});
    audio.onended = () => setPlaying(false);
    audio.onerror = () => setPlaying(false);
  };
  return (
    <button
      onClick={play}
      className={`${btnPadding} rounded-lg bg-[#fdf6f6] hover:bg-[#fce4e4] border border-[#eeddd6] hover:border-[#a90000] transition-all flex items-center justify-center ${playing ? "text-[#a90000] scale-110" : "text-gray-400 hover:text-[#a90000]"}`}
      title="Uitspraak horen"
      aria-label={`uitspraak van ${term} horen`}
    >
      <Volume2 className={`${iconSize} ${playing ? "animate-pulse" : ""}`} />
    </button>
  );
}

// ---------------------------------------------------------------- confetti

function Confetti({ active }: { active: boolean }) {
  if (!active) return null;
  const particles = Array.from({ length: 50 }, (_, i) => {
    const color = ["#a90000", "#FFD700", "#FF6B35", "#4CAF50", "#2196F3", "#9C27B0"][Math.floor(Math.random() * 6)];
    const size = 6 + Math.random() * 8;
    return (
      <div
        key={i}
        className="absolute pointer-events-none"
        style={{
          left: `${Math.random() * 100}%`,
          top: "-10px",
          width: `${size}px`,
          height: `${size}px`,
          backgroundColor: color,
          borderRadius: Math.random() > 0.5 ? "50%" : "2px",
          animation: `confettiFall ${2 + Math.random() * 2}s ease-in ${Math.random() * 2}s forwards`,
        }}
      />
    );
  });
  return (
    <div className="fixed inset-0 pointer-events-none z-[9999] overflow-hidden">
      <style>{`@keyframes confettiFall { 0% { transform: translateY(0) rotate(0deg); opacity: 1; } 100% { transform: translateY(100vh) rotate(720deg); opacity: 0; } }`}</style>
      {particles}
    </div>
  );
}

// ---------------------------------------------------------------- flashcard

function Flashcard({ term, onFlip }: { term: Term; onFlip: () => void }) {
  const [flipped, setFlipped] = useState(false);
  useEffect(() => setFlipped(false), [term.uitspraak]);
  return (
    <div className="cursor-pointer select-none" onClick={() => { setFlipped(!flipped); onFlip(); }}>
      <div
        className={`relative w-full h-[280px] sm:h-[320px] transition-transform duration-500 ${flipped ? "[transform:rotateY(180deg)]" : ""}`}
        style={{ transformStyle: "preserve-3d" }}
      >
        <div
          className="absolute inset-0 bg-white rounded-lg shadow-lg border-2 border-[#e9e0cf] flex flex-col items-center justify-center p-4 sm:p-6"
          style={{ backfaceVisibility: "hidden" }}
        >
          <span className="inline-block px-3 py-1 bg-[#a90000] text-white text-xs font-bold rounded-lg mb-4">{term.categorie}</span>
          <div className="flex items-center gap-3">
            <h3 className="text-3xl sm:text-4xl md:text-5xl font-bold text-[#a90000] text-center break-words">{term.uitspraak}</h3>
            <PlayButton term={term.uitspraak} />
          </div>
          <p className="text-gray-400 text-xs mt-4">klik om te draaien · of spatiebalk</p>
        </div>
        <div
          className="absolute inset-0 bg-[#fdf6f6] rounded-lg shadow-lg border-2 border-[#a90000] flex flex-col items-center justify-center p-4 sm:p-6"
          style={{ backfaceVisibility: "hidden", transform: "rotateY(180deg)" }}
        >
          <span className="inline-block px-3 py-1 bg-[#a90000] text-white text-xs font-bold rounded-lg mb-3">{term.categorie}</span>
          <p className="text-xl sm:text-2xl md:text-3xl font-bold text-gray-800 text-center break-words w-full">{term.nederlands}</p>
          <div className="flex items-center gap-2 mt-3">
            <span className="text-sm text-[#a90000] font-semibold">{term.uitspraak}</span>
            <PlayButton term={term.uitspraak} size="sm" />
          </div>
          <p className="text-gray-400 text-xs mt-4">klik om terug te gaan</p>
        </div>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------- quiz

type QuizProps = {
  levelId: string | number;
  terms: Term[];
  sounds: ReturnType<typeof useSounds>["sounds"];
  onPass: (score: number, total: number) => void;
  onExit: () => void;
  onNextLevel?: () => void;
};

function QuizMode({ levelId, terms, sounds, onPass, onExit, onNextLevel }: QuizProps) {
  const allTerms = japaneseCourseData.terms as Term[];
  const [questions, setQuestions] = useState<Term[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [score, setScore] = useState(0);
  const [selected, setSelected] = useState<string | null>(null);
  const [showFeedback, setShowFeedback] = useState(false);
  const [finished, setFinished] = useState(false);
  const [wasWrong, setWasWrong] = useState(false);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const wrongPool = useMemo(() => Array.from(new Set(allTerms.map((x) => x.nederlands))), [allTerms]);

  function startQuiz() {
    setQuestions(shuffle(terms).slice(0, Math.min(15, terms.length)));
    setCurrentIndex(0);
    setScore(0);
    setSelected(null);
    setShowFeedback(false);
    setFinished(false);
    setWasWrong(false);
  }

  useEffect(() => {
    startQuiz();
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [levelId]);

  const optionsByQuestion = useMemo(
    () =>
      questions.map((q) => {
        const wrong = shuffle(wrongPool.filter((n) => n !== q.nederlands)).slice(0, 3);
        return shuffle([q.nederlands, ...wrong]);
      }),
    [questions, wrongPool]
  );

  function handleAnswer(option: string) {
    if (showFeedback || !questions.length) return;
    const q = questions[currentIndex];
    const isCorrect = option === q.nederlands;
    setSelected(option);
    setShowFeedback(true);
    setWasWrong(!isCorrect);
    if (isCorrect) {
      setScore((s) => s + 1);
      sounds.correct();
    } else {
      sounds.wrong();
      try {
        navigator.vibrate?.([60, 40, 90]);
      } catch {}
    }
    timerRef.current = setTimeout(() => {
      if (currentIndex + 1 >= questions.length) {
        const finalScore = score + (isCorrect ? 1 : 0);
        setFinished(true);
        if (finalScore / questions.length >= 0.8) {
          sounds.pass();
          onPass(finalScore, questions.length);
        } else sounds.fail();
      } else {
        setCurrentIndex((i) => i + 1);
        setSelected(null);
        setShowFeedback(false);
        setWasWrong(false);
      }
    }, isCorrect ? 1100 : 2200);
  }

  if (!questions.length) return null;

  if (finished) {
    const percentage = Math.round((score / questions.length) * 100);
    const passed = percentage >= 80;
    return (
      <div className="bg-white rounded-lg shadow-sm border border-[#e9e0cf] p-6 sm:p-8 text-center">
        <div className={`w-16 h-16 sm:w-20 sm:h-20 rounded-lg mx-auto mb-4 flex items-center justify-center ${passed ? "bg-gradient-to-br from-yellow-400 to-yellow-600" : "bg-gray-200"}`}>
          {passed ? <Trophy className="w-8 h-8 sm:w-10 sm:h-10 text-white" /> : <RotateCcw className="w-8 h-8 sm:w-10 sm:h-10 text-gray-400" />}
        </div>
        <h3 className={`text-xl sm:text-2xl font-bold mb-1 ${passed ? "text-[#198754]" : "text-[#dc3545]"}`}>{passed ? "🎉 Gefeliciteerd!" : "Blijf oefenen!"}</h3>
        <p className="text-4xl sm:text-5xl font-bold text-[#8c0000] my-3">
          {score} / {questions.length}
        </p>
        <p className="text-gray-500 mb-2">
          {percentage}% goed — {passed ? "(≥80% geslaagd!)" : "(min. 80% nodig)"}
        </p>
        <div className="flex flex-col sm:flex-row justify-center gap-2 sm:gap-3 mt-5">
          {passed && onNextLevel && (
            <button onClick={onNextLevel} className="bg-gradient-to-r from-[#a90000] to-[#8c0000] hover:from-[#8c0000] hover:to-[#700000] text-white px-6 py-2.5 rounded-lg font-semibold text-sm transition-all shadow-md hover:shadow-lg">
              Volgende band →
            </button>
          )}
          <button onClick={startQuiz} className="bg-white border-2 border-gray-200 hover:border-[#a90000] text-gray-600 hover:text-[#a90000] px-6 py-2.5 rounded-lg font-semibold text-sm transition-colors">
            Opnieuw proberen
          </button>
          <button onClick={onExit} className="bg-white border-2 border-[#a90000] text-[#a90000] hover:bg-[#fdf6f6] px-6 py-2.5 rounded-lg font-semibold text-sm transition-colors">
            ← Terug naar modules
          </button>
        </div>
      </div>
    );
  }

  const question = questions[currentIndex];
  const options = optionsByQuestion[currentIndex] ?? [];
  const progress = ((currentIndex + 1) / questions.length) * 100;

  return (
    <div className={`bg-white rounded-lg shadow-sm border border-[#e9e0cf] p-4 sm:p-6 ${wasWrong ? "quiz-shake" : ""}`}>
      <div className="w-full h-3 bg-gray-100 rounded-lg mb-4 overflow-hidden">
        <div className="h-full bg-gradient-to-r from-[#a90000] to-[#8c0000] rounded-lg transition-all duration-500" style={{ width: `${progress}%` }} />
      </div>
      <div className="flex items-center justify-between mb-2">
        <p className="text-xs text-gray-400">Vraag {currentIndex + 1} van {questions.length}</p>
        <p className="text-xs font-bold text-[#a90000]">Score: {score}</p>
      </div>
      <div className="flex items-center justify-center gap-3 mb-1">
        <h3 className="text-2xl sm:text-3xl font-bold text-[#8c0000] text-center break-words">{question.uitspraak}</h3>
        <PlayButton term={question.uitspraak} size="sm" />
      </div>
      <p className="text-center text-sm text-gray-500 mb-4">Wat betekent dit?</p>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 sm:gap-3">
        {options.map((option, idx) => {
          let btnClass = "bg-white border-[#e9e0cf] text-gray-700 hover:border-[#a90000] hover:text-[#a90000] hover:shadow-sm cursor-pointer active:scale-[0.98]";
          let mark = "";
          if (showFeedback) {
            if (option === question.nederlands) {
              btnClass = "quiz-pop bg-[#198754] border-[#198754] text-white shadow-lg shadow-green-200";
              mark = "✓";
            } else if (option === selected) {
              btnClass = "quiz-wrong bg-[#dc3545] border-[#dc3545] text-white shadow-lg shadow-red-200";
              mark = "✗";
            } else btnClass = "bg-gray-50 border-[#e9e0cf] text-gray-300 opacity-60";
          }
          return (
            <button key={`${currentIndex}-${idx}`} onClick={() => handleAnswer(option)} disabled={showFeedback} className={`p-3 sm:p-4 rounded-lg border-2 font-semibold text-sm sm:text-base transition-all flex items-center justify-center gap-2 ${btnClass}`}>
              {mark && <span>{mark}</span>}
              {option}
            </button>
          );
        })}
      </div>
      {showFeedback && (
        <p className={`mt-3 sm:mt-4 text-center font-bold text-sm sm:text-base ${selected === question.nederlands ? "text-[#198754]" : "quiz-pop text-[#dc3545]"}`}>
          {selected === question.nederlands ? "✓ Correct!" : `✗ Jammer — juist antwoord: ${question.nederlands}`}
        </p>
      )}
    </div>
  );
}

// ---------------------------------------------------------------- hoofd

type Progress = { passedLevels: Record<string, boolean>; best: Record<string, number> };
const PROGRESS_KEY = "cj2.p…ress";

export default function Course() {
  const allTerms = useMemo(() => japaneseCourseData.terms as Term[], []);
  const [levelId, setLevelId] = useState<string | number | null>(null);
  const [mode, setMode] = useState<"learn" | "quiz">("learn");
  const [cardIndex, setCardIndex] = useState(0);
  const [progress, setProgress] = useState<Progress>({ passedLevels: {}, best: {} });
  const [confetti, setConfetti] = useState(false);
  const [naam, setNaam] = useState("");
  const { sounds, enabled: soundOn, setEnabled: setSoundOn } = useSounds();

  useEffect(() => {
    try {
      const p = JSON.parse(localStorage.getItem(PROGRESS_KEY) ?? "{}");
      setProgress({ passedLevels: p.passedLevels ?? {}, best: p.best ?? {} });
      setNaam(localStorage.getItem("cj2.naam") ?? "");
    } catch {}
  }, []);

  useEffect(() => {
    localStorage.setItem(PROGRESS_KEY, JSON.stringify(progress));
  }, [progress]);
  useEffect(() => {
    if (naam) localStorage.setItem("cj2.naam", naam);
  }, [naam]);

  const level = levelId === null ? null : allTerms.filter((x) => x.level === levelId);
  const meta = levelId === null ? null : levelMeta(levelId);
  const currentTerm = level && level.length ? level[Math.min(cardIndex, level.length - 1)] : null;

  function isUnlocked(id: string | number): boolean {
    if (typeof id === "string" || id === 0) return true;
    return !!progress.passedLevels[String(BELT_ORDER[BELT_ORDER.indexOf(id) - 1])];
  }

  function openLevel(id: string | number) {
    if (!isUnlocked(id)) return;
    sounds.click();
    setLevelId(id);
    setCardIndex(0);
    setMode("learn");
  }

  function handlePass(score: number, total: number) {
    if (levelId === null) return;
    const key = String(levelId);
    setProgress((p) => {
      const wasPassed = p.passedLevels[key];
      const next = {
        passedLevels: { ...p.passedLevels, [key]: true },
        best: { ...p.best, [key]: Math.max(p.best[key] ?? 0, Math.round((score / total) * 100)) },
      };
      if (!wasPassed && typeof levelId === "number") sounds.unlock();
      return next;
    });
    setConfetti(true);
    setTimeout(() => setConfetti(false), 4000);
  }

  function navCard(dir: "prev" | "next") {
    if (!level) return;
    sounds.click();
    setCardIndex((i) => (dir === "next" ? Math.min(i + 1, level.length - 1) : Math.max(i - 1, 0)));
  }

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (levelId === null || mode !== "learn") return;
      if (e.key === "ArrowRight") navCard("next");
      if (e.key === "ArrowLeft") navCard("prev");
      if (e.code === "Space") {
        e.preventDefault();
        const card = document.querySelector(".cursor-pointer");
        (card as HTMLElement | null)?.click();
      }
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [levelId, mode, cardIndex, level?.length]);

  const passedBelts = BELT_ORDER.filter((b) => progress.passedLevels[String(b)]).length;

  return (
    <main className="min-h-screen bg-[#f5f5f0]">
      <div className="mx-auto max-w-3xl px-3 sm:px-4 py-4 sm:py-8 space-y-4 sm:space-y-8">
        <Confetti active={confetti} />

        {/* header */}
        <div className="bg-gradient-to-r from-[#a90000] to-[#8c0000] rounded-lg p-4 sm:p-5 md:p-6 text-white shadow-lg relative overflow-hidden">
          <svg viewBox="0 0 100 80" className="absolute top-0 right-0 w-20 sm:w-32 h-20 sm:h-32 text-white opacity-[0.06]" fill="currentColor">
            <rect x="5" y="8" width="90" height="6" rx="2" />
            <rect x="12" y="18" width="76" height="4" rx="1" />
            <rect x="20" y="18" width="6" height="58" rx="1" />
            <rect x="74" y="18" width="6" height="58" rx="1" />
          </svg>
          <div className="flex items-start justify-between">
            <div>
              <h1 className="text-lg sm:text-2xl font-bold truncate">Cursus Japans</h1>
              <p className="text-white/80 mt-1 text-xs sm:text-sm">Examentrainer voor de Japanse judo-terminologie — met echte uitspraak</p>
            </div>
            <button onClick={() => setSoundOn(!soundOn)} className={`p-2 rounded-lg transition-colors ${soundOn ? "text-white bg-white/20" : "text-white/40"}`} title={soundOn ? "Geluid uit" : "Geluid aan"}>
              {soundOn ? <Volume2 className="w-5 h-5" /> : <VolumeX className="w-5 h-5" />}
            </button>
          </div>
          <div className="w-10 sm:w-16 h-0.5 sm:h-1 bg-white/30 rounded-lg mt-2 sm:mt-3" />
        </div>

        {levelId === null ? (
          <>
            {/* voortgang */}
            <div className="bg-white rounded-lg shadow-sm border border-[#e9e0cf] p-4 sm:p-5">
              <div className="flex items-center justify-between mb-2">
                <h3 className="font-bold text-gray-800 text-sm">Jouw voortgang</h3>
                <span className="text-xs font-bold text-[#a90000]">{passedBelts}/6 banden geslaagd</span>
              </div>
              <div className="w-full h-3 bg-gray-100 rounded-lg overflow-hidden">
                <div className="h-full bg-gradient-to-r from-[#a90000] to-yellow-500 rounded-lg transition-all duration-1000" style={{ width: `${(passedBelts / 6) * 100}%` }} />
              </div>
            </div>

            {/* modulegrid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {ORDER.map((id) => {
                const m = levelMeta(id);
                const count = allTerms.filter((x) => x.level === id).length;
                const unlocked = isUnlocked(id);
                const passed = progress.passedLevels[String(id)];
                return (
                  <button
                    key={String(id)}
                    onClick={() => openLevel(id)}
                    disabled={!unlocked}
                    className={`text-left bg-white rounded-lg border shadow-sm p-4 transition-all ${unlocked ? "border-[#e9e0cf] hover:shadow-md hover:border-[#a90000] cursor-pointer" : "border-[#eee] opacity-50 cursor-not-allowed"}`}
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-11 h-11 rounded-lg flex items-center justify-center text-lg font-bold shadow shrink-0" style={{ backgroundColor: m.bg, color: m.text }}>
                        {typeof id === "number" ? id + 1 : <BookOpen className="w-5 h-5" style={{ color: m.text }} />}
                      </div>
                      <div className="min-w-0">
                        <div className="font-bold text-gray-800 truncate">{m.name}</div>
                        <div className="text-xs text-gray-400">{count} termen</div>
                      </div>
                      <div className="ml-auto shrink-0">
                        {passed ? <Star className="w-5 h-5 text-yellow-500 fill-yellow-400" /> : !unlocked ? <Lock className="w-4 h-4 text-gray-300" /> : <ChevronRight className="w-4 h-4 text-gray-300" />}
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>

            <p className="text-center text-xs text-gray-400">
              Elke band wordt pas ontgrendeld als je de vorige band hebt gehaald — precies zoals in de club.
            </p>
          </>
        ) : (
          <>
            {/* level header */}
            <div className="bg-gradient-to-r from-[#a90000] to-[#8c0000] rounded-lg p-4 sm:p-5 text-white shadow-lg">
              <div className="flex items-center gap-3">
                <button onClick={() => { sounds.click(); setLevelId(null); }} className="p-1.5 rounded-lg hover:bg-white/15" aria-label="terug naar modules">
                  <ChevronLeft className="w-5 h-5" />
                </button>
                <div className="w-11 h-11 rounded-lg flex items-center justify-center text-lg font-bold shadow shrink-0" style={{ backgroundColor: meta!.bg }}>
                  {typeof levelId === "number" ? levelId + 1 : "📚"}
                </div>
                <div className="min-w-0">
                  <h2 className="text-base sm:text-lg font-bold truncate">{meta!.name}</h2>
                  <p className="text-white/70 text-xs">{level!.length} termen</p>
                </div>
                {progress.passedLevels[String(levelId)] && (
                  <div className="ml-auto flex items-center gap-1 bg-green-500/20 px-3 py-1 rounded-lg shrink-0">
                    <Star className="w-4 h-4 text-yellow-300" />
                    <span className="text-xs font-bold text-green-200">Geslaagd!</span>
                  </div>
                )}
              </div>
            </div>

            {/* mode selector */}
            <div className="flex bg-[#eae7dd] rounded-lg p-1">
              <button onClick={() => { setMode("learn"); sounds.click(); }} className={`flex-1 py-2.5 rounded-lg font-bold text-sm uppercase transition-all ${mode === "learn" ? "bg-[#a90000] text-white shadow-md" : "text-gray-500 hover:text-gray-700"}`}>
                📖 Leren
              </button>
              <button onClick={() => { setMode("quiz"); sounds.click(); }} className={`flex-1 py-2.5 rounded-lg font-bold text-sm uppercase transition-all ${mode === "quiz" ? "bg-[#a90000] text-white shadow-md" : "text-gray-500 hover:text-gray-700"}`}>
                🎯 Examen
              </button>
            </div>

            {mode === "learn" && currentTerm && (
              <div className="space-y-4">
                <Flashcard key={cardIndex} term={currentTerm} onFlip={sounds.flip} />
                <div className="flex items-center justify-center gap-3 sm:gap-4">
                  <button onClick={() => navCard("prev")} disabled={cardIndex === 0} className="p-2.5 rounded-lg bg-white border border-[#e9e0cf] hover:bg-[#fdf6f6] transition-colors disabled:opacity-30 disabled:cursor-not-allowed shadow-sm" aria-label="vorige kaart">
                    <ChevronLeft className="w-5 h-5 text-[#a90000]" />
                  </button>
                  <div className="flex items-center gap-2 px-3 py-1.5 bg-white rounded-lg shadow-sm border border-[#e9e0cf]">
                    <span className="text-sm font-bold text-[#a90000]">{cardIndex + 1}</span>
                    <div className="w-16 h-2 bg-gray-100 rounded-lg overflow-hidden">
                      <div className="h-full bg-[#a90000] rounded-lg transition-all" style={{ width: `${((cardIndex + 1) / level!.length) * 100}%` }} />
                    </div>
                    <span className="text-xs text-gray-400">/ {level!.length}</span>
                  </div>
                  <button onClick={() => navCard("next")} disabled={cardIndex >= level!.length - 1} className="p-2.5 rounded-lg bg-white border border-[#e9e0cf] hover:bg-[#fdf6f6] transition-colors disabled:opacity-30 disabled:cursor-not-allowed shadow-sm" aria-label="volgende kaart">
                    <ChevronRight className="w-5 h-5 text-[#a90000]" />
                  </button>
                </div>
                <p className="text-center text-xs text-gray-400">← → pijltjes op toetsenbord om te navigeren · spatiebalk draait de kaart</p>
              </div>
            )}

            {mode === "quiz" && (
              <QuizMode
                levelId={levelId}
                terms={level!}
                sounds={sounds}
                onPass={handlePass}
                onExit={() => setLevelId(null)}
                onNextLevel={
                  typeof levelId === "number" && BELT_ORDER.indexOf(levelId) < BELT_ORDER.length - 1
                    ? () => {
                        setLevelId(BELT_ORDER[BELT_ORDER.indexOf(levelId) + 1]);
                        setCardIndex(0);
                        setMode("learn");
                      }
                    : undefined
                }
              />
            )}

            {progress.passedLevels[String(levelId)] && (
              <>
                <div id="cert-print" className="bg-white rounded-lg p-6 sm:p-8 text-center shadow-sm" style={{ border: "4px double #a90000" }}>
                  <div className="text-xs uppercase tracking-[0.3em] text-gray-400">Certificaat</div>
                  <div className="mt-1 text-2xl sm:text-3xl font-black text-[#8c0000]">Cursus Japans</div>
                  <div className="mt-5 text-sm text-gray-500">bevestigt dat</div>
                  <div className="mt-1 text-xl sm:text-2xl font-extrabold text-[#a90000]">{naam || "…"}</div>
                  <div className="mt-2 text-xs sm:text-sm text-gray-500">
                    de module <b>{meta!.name}</b> met ≥80% heeft behaald
                    {progress.best[String(levelId)] ? ` (beste score: ${progress.best[String(levelId)]}%)` : ""}
                  </div>
                  <div className="mt-4 text-3xl text-[#a90000]">柔道</div>
                </div>
                <div className="flex gap-2">
                  <input value={naam} onChange={(e) => setNaam(e.target.value)} placeholder="je naam voor het certificaat" className="flex-1 rounded-lg border border-[#e9e0cf] bg-white px-3 py-2 text-sm" />
                  <button onClick={() => window.print()} className="rounded-lg bg-[#a90000] hover:bg-[#8c0000] px-4 py-2 text-sm font-bold text-white transition-colors">
                    Print certificaat
                  </button>
                </div>
              </>
            )}
          </>
        )}

        <footer className="pt-2 pb-4 text-center text-xs text-gray-400">
          Alle Japanse uitspraken zijn vooraf lokaal gegenereerd met een eigen tekst-naar-spraakpijplijn — geen cloud, geen tracking.
          <br />
          Oorspronkelijk gebouwd voor <a className="text-[#a90000] hover:underline" href="https://judoclubmichigami.nl">judoclubmichigami.nl</a>; deze losse versie draait volledig in je browser.
        </footer>
      </div>
    </main>
  );
}
