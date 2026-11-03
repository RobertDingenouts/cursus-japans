"use client";

import { useEffect, useMemo, useState } from "react";
import { japaneseCourseData, beltColors } from "@/data/terms";

type Term = { uitspraak: string; nederlands: string; categorie: string; level: string | number };

const ORDER: (string | number)[] = ["algemeen", "wedstrijd", 0, 1, 2, 3, 4, 5];

const slug = (t: string) => t.toLowerCase().replace(/\s+/g, "-");

function levelMeta(level: string | number) {
  const c = (beltColors as Record<string | number, { bg: string; text: string; border: string; label: string }>)[level];
  if (c) return { ...c, name: japaneseCourseData.levelNames[level] ?? String(level) };
  return { bg: "#ede9fe", text: "#5b21b6", border: "#8b5cf6", label: "", name: japaneseCourseData.levelNames[level] ?? String(level) };
}

type Progress = Record<string, { best: number; passed: boolean }>;

export default function Course() {
  const allTerms = japaneseCourseData.terms as Term[];
  const [level, setLevel] = useState<string | number>("algemeen");
  const [mode, setMode] = useState<"cards" | "quiz" | "voortgang">("cards");
  const [idx, setIdx] = useState(0);
  const [flipped, setFlipped] = useState(false);
  const [learned, setLearned] = useState<Record<string, boolean>>({});
  const [progress, setProgress] = useState<Progress>({});
  const [naam, setNaam] = useState("");
  const [vandaag, setVandaag] = useState("");
  const [ready, setReady] = useState(false);

  // quiz state
  const [qIndex, setQIndex] = useState(0);
  const [score, setScore] = useState(0);
  const [answered, setAnswered] = useState<number | null>(null);
  const [quizDone, setQuizDone] = useState(false);

  const terms = useMemo(() => allTerms.filter((t) => t.level === level), [allTerms, level]);

  const quiz = useMemo(() => {
    const pool = [...terms].sort(() => Math.random() - 0.5);
    const qs = pool.slice(0, Math.min(8, pool.length));
    return qs.map((q) => {
      const distractors = allTerms
        .filter((t) => t.nederlands !== q.nederlands)
        .sort(() => Math.random() - 0.5)
        .slice(0, 3)
        .map((t) => t.nederlands);
      const options = [q.nederlands, ...distractors].sort(() => Math.random() - 0.5);
      return { q, options, answer: q.nederlands };
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [level, mode]);

  useEffect(() => {
    try {
      setLearned(JSON.parse(localStorage.getItem("cj.learned") ?? "{}"));
      setProgress(JSON.parse(localStorage.getItem("cj.progress") ?? "{}"));
      setNaam(localStorage.getItem("cj.naam") ?? "");
    } catch {}
    setVandaag(new Date().toLocaleDateString("nl-NL"));
    setReady(true);
  }, []);

  useEffect(() => {
    if (!ready) return;
    localStorage.setItem("cj.learned", JSON.stringify(learned));
    localStorage.setItem("cj.progress", JSON.stringify(progress));
    localStorage.setItem("cj.naam", naam);
  }, [learned, progress, naam, ready]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (mode !== "cards") return;
      if (e.code === "Space") { e.preventDefault(); setFlipped((f) => !f); }
      if (e.code === "ArrowRight") { setIdx((i) => Math.min(terms.length - 1, i + 1)); setFlipped(false); }
      if (e.code === "ArrowLeft") { setIdx((i) => Math.max(0, i - 1)); setFlipped(false); }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [mode, terms.length]);

  const meta = levelMeta(level);
  const key = String(level);
  const t = terms[idx];
  const audioFile = `${process.env.NEXT_PUBLIC_BASE_PATH ?? ""}/audio/japanese/${slug(t?.uitspraak ?? "")}.wav`;
  const learnedCount = terms.filter((x) => learned[slug(x.uitspraak)]).length;

  function pick(l: string | number) {
    setLevel(l);
    setIdx(0);
    setFlipped(false);
    setMode("cards");
    setQuizDone(false);
    setQIndex(0);
    setScore(0);
    setAnswered(null);
  }

  function play() {
    const a = new Audio(audioFile);
    a.play().catch(() => {});
  }

  function toggleLearned() {
    const s = slug(t.uitspraak);
    setLearned((p) => ({ ...p, [s]: !p[s] }));
  }

  function answer(i: number) {
    if (answered !== null) return;
    setAnswered(i);
    if (quiz[i].options[i] === quiz[i].answer) setScore((s) => s + 1);
    setTimeout(() => {
      if (qIndex + 1 >= quiz.length) {
        const best = Math.round(((score + (quiz[i].options[i] === quiz[i].answer ? 1 : 0)) / quiz.length) * 100);
        setProgress((p) => {
          const prev = p[key] ?? { best: 0, passed: false };
          return { ...p, [key]: { best: Math.max(prev.best, best), passed: prev.passed || best >= japaneseCourseData.passThreshold * 100 } };
        });
        setQuizDone(true);
      } else {
        setQIndex((q) => q + 1);
        setAnswered(null);
      }
    }, 900);
  }

  const pct = terms.length ? Math.round((learnedCount / terms.length) * 100) : 0;

  return (
    <main className="min-h-screen tatami">
      <div className="mx-auto max-w-3xl px-4 pb-24">
        <header className="pt-6 pb-4 text-center">
          <div className="text-5xl font-black tracking-tight">
            <span style={{ color: "#8b4513" }}>柔道</span> Cursus Japans
          </div>
          <p className="mt-2 text-sm text-gray-600">
            Judo-woorden leren zoals op de mat — met Japanse uitspraak, flashcards en quiz per band.
          </p>
        </header>

        {/* Level pills */}
        <div className="flex flex-wrap justify-center gap-2 pb-4">
          {ORDER.map((l) => {
            const m = levelMeta(l);
            const active = l === level;
            const st = progress[String(l)];
            return (
              <button
                key={String(l)}
                onClick={() => pick(l)}
                className="rounded-full border px-4 py-1.5 text-sm font-semibold transition"
                style={{
                  background: m.bg,
                  color: m.text,
                  borderColor: m.border,
                  outline: active ? `3px solid ${m.border}` : "none",
                  outlineOffset: 2,
                }}
              >
                {m.name}
                {st?.passed ? " ✓" : ""}
              </button>
            );
          })}
        </div>

        {/* Mode tabs */}
        <div className="mb-6 flex justify-center gap-1 text-sm">
          {(
            [
              ["cards", "Flashcards"],
              ["quiz", "Quiz"],
              ["voortgang", "Voortgang & certificaat"],
            ] as const
          ).map(([m, label]) => (
            <button
              key={m}
              onClick={() => setMode(m)}
              className={`rounded-t-lg border-b-2 px-4 py-2 font-medium ${mode === m ? "bg-white shadow-inner border-x border-t border-gray-300 border-b-transparent" : "border-b-transparent text-gray-500 hover:text-gray-800"}`}
            >
              {label}
            </button>
          ))}
        </div>

        {mode === "cards" && t && (
          <section>
            <div className="card3d mx-auto max-w-xl" onClick={() => setFlipped((f) => !f)}>
              <div className={`card-inner relative h-56 sm:h-64 cursor-pointer ${flipped ? "flipped" : ""}`}>
                <div
                  className="card-face absolute inset-0 flex flex-col items-center justify-center rounded-2xl border-2 bg-white shadow-lg"
                  style={{ borderColor: meta.border }}
                >
                  <div className="text-4xl font-extrabold tracking-wide">{t.uitspraak}</div>
                  <div className="mt-2 text-xs uppercase tracking-widest text-gray-400">{t.categorie}</div>
                  <div className="mt-6 text-xs text-gray-400">klik om te draaien · spatiebalk</div>
                </div>
                <div
                  className="card-face card-back absolute inset-0 flex flex-col items-center justify-center rounded-2xl border-2 text-white shadow-lg"
                  style={{ background: meta.text, borderColor: meta.border }}
                >
                  <div className="px-8 text-center text-2xl font-bold">{t.nederlands}</div>
                  <div className="mt-4 text-xs opacity-80">{t.uitspraak}</div>
                </div>
              </div>
            </div>

            <div className="mx-auto mt-5 flex max-w-xl items-center justify-between">
              <button
                onClick={toggleLearned}
                className="rounded-lg border px-4 py-2 text-sm font-medium"
                style={{
                  borderColor: learned[slug(t.uitspraak)] ? "#16a34a" : "#d1d5db",
                  color: learned[slug(t.uitspraak)] ? "#16a34a" : "#6b7280",
                }}
              >
                {learned[slug(t.uitspraak)] ? "✓ geleerd" : "markeer als geleerd"}
              </button>
              <button onClick={play} className="rounded-full bg-[#8b4513] px-6 py-3 font-bold text-white shadow hover:bg-[#6f3610]" aria-label="uitspraak beluisteren">
                🔊 uitspraak
              </button>
              <div className="flex gap-2">
                <button onClick={() => { setIdx((i) => Math.max(0, i - 1)); setFlipped(false); }} className="rounded-lg border border-gray-300 px-4 py-2" aria-label="vorige">←</button>
                <button onClick={() => { setIdx((i) => Math.min(terms.length - 1, i + 1)); setFlipped(false); }} className="rounded-lg border border-gray-300 px-4 py-2" aria-label="volgende">→</button>
              </div>
            </div>

            <div className="mx-auto mt-6 max-w-xl">
              <div className="h-2 rounded bg-gray-200">
                <div className="h-2 rounded transition-all" style={{ width: `${pct}%`, background: meta.border }} />
              </div>
              <div className="mt-1 flex justify-between text-xs text-gray-500">
                <span>kaart {idx + 1} / {terms.length}</span>
                <span>{learnedCount} geleerd ({pct}%)</span>
              </div>
            </div>
          </section>
        )}

        {mode === "quiz" && (
          <section className="mx-auto max-w-xl">
            {!quizDone ? (
              <>
                <div className="mb-3 text-sm text-gray-500">vraag {qIndex + 1} van {quiz.length} — 80% is geslaagd</div>
                <div className="rounded-2xl border-2 bg-white p-4 shadow" style={{ borderColor: meta.border }}>
                  <div className="text-center text-3xl font-extrabold">{quiz[qIndex]?.q.uitspraak}</div>
                  <button onClick={play} className="mx-auto mt-3 block rounded-full bg-[#8b4513] px-4 py-1.5 text-sm font-bold text-white">🔊</button>
                  <div className="mt-4 grid gap-2">
                    {quiz[qIndex]?.options.map((o, i) => {
                      const isAnswer = o === quiz[qIndex].answer;
                      const style = answered === null ? {} : isAnswer ? { background: "#dcfce7", borderColor: "#16a34a" } : answered === i ? { background: "#fee2e2", borderColor: "#dc2626" } : {};
                      return (
                        <button key={o} onClick={() => answer(i)} disabled={answered !== null} className="rounded-xl border border-gray-300 px-4 py-3 text-left text-sm hover:border-gray-500" style={style}>
                          {o}
                        </button>
                      );
                    })}
                  </div>
                </div>
              </>
            ) : (
              <div className="rounded-2xl border-2 bg-white p-8 text-center shadow" style={{ borderColor: meta.border }}>
                <div className="text-5xl font-black">{Math.round((score / quiz.length) * 100)}%</div>
                <p className="mt-2">
                  {score / quiz.length >= japaneseCourseData.passThreshold ? (
                    <span className="font-bold text-green-700">geslaagd voor {meta.name} ✓</span>
                  ) : (
                    <span className="text-gray-600">oefen nog even — nog een keer?</span>
                  )}
                </p>
                <button onClick={() => { setQuizDone(false); setQIndex(0); setScore(0); setAnswered(null); }} className="mt-4 rounded-lg border border-gray-300 px-4 py-2">opnieuw</button>
              </div>
            )}
          </section>
        )}

        {mode === "voortgang" && (
          <section className="mx-auto max-w-xl">
            <div className="grid gap-2">
              {ORDER.map((l) => {
                const m = levelMeta(l);
                const st = progress[String(l)];
                const n = allTerms.filter((x) => x.level === l).length;
                return (
                  <div key={String(l)} className="flex items-center justify-between rounded-xl border bg-white px-4 py-3" style={{ borderColor: m.border }}>
                    <div className="font-semibold" style={{ color: m.text }}>{m.name}</div>
                    <div className="w-40">
                      <div className="h-2 rounded bg-gray-200"><div className="h-2 rounded" style={{ width: `${st?.best ?? 0}%`, background: m.border }} /></div>
                      <div className="mt-1 text-right text-xs text-gray-500">{n} woorden · quiz {st?.best ?? 0}% {st?.passed ? "✓" : ""}</div>
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="mt-8 rounded-xl border border-gray-300 bg-white p-4">
              <label className="text-sm font-semibold">je naam op het certificaat</label>
              <input value={naam} onChange={(e) => setNaam(e.target.value)} placeholder="bijv. Daan van Dijk" className="mt-2 w-full rounded-lg border border-gray-300 px-3 py-2" />
            </div>

            <div id="cert-print" className="mt-6 rounded-xl bg-white p-8 text-center shadow" style={{ border: "4px double #8b4513" }}>
              <div className="text-xs uppercase tracking-[0.3em] text-gray-400">Certificaat</div>
              <div className="mt-1 text-3xl font-black">Cursus Japans</div>
              <div className="mt-6 text-sm text-gray-500">bevestig dat</div>
              <div className="mt-1 text-2xl font-extrabold text-[#8b4513]">{naam || "…"}</div>
              <div className="mt-3 text-sm text-gray-500">
                alle Japanse bandtermen beheerst tot en met{" "}
                <b>{levelMeta(level).name}</b> — behaald op {vandaag}
              </div>
              <div className="mt-6 text-4xl" style={{ color: "#8b4513" }}>柔道</div>
            </div>
            <button onClick={() => window.print()} className="mt-3 w-full rounded-lg bg-[#8b4513] px-4 py-3 font-bold text-white hover:bg-[#6f3610]">certificaat printen</button>
          </section>
        )}

        <footer className="mt-16 text-center text-xs text-gray-400">
          Alle audio is vooraf gegenereerd met een lokale tekst-naar-spraakpijplijn (Edge TTS) — geen cloud, geen tracking.
          Voortgang blijft lokaal in je browser.
        </footer>
      </div>
    </main>
  );
}
