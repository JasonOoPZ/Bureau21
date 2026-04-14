"use client";

import { useState } from "react";
import type { Course } from "@/lib/courses";

interface StudyState {
  course: string;
  points: number;
}

interface Props {
  courses: Course[];
  progress: StudyState[];
  motivation: number;
  studyCost: number;
}

export function StudyHallClient({ courses, progress, motivation, studyCost }: Props) {
  const [studyAmounts, setStudyAmounts] = useState<Record<string, number>>({});
  const [progressMap, setProgressMap] = useState<Record<string, number>>(
    Object.fromEntries(progress.map((p) => [p.course, p.points]))
  );
  const [mot, setMot] = useState(motivation);
  const [loading, setLoading] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  const handleStudy = async (courseSlug: string) => {
    const amount = studyAmounts[courseSlug] || 0;
    if (amount < 1) return;
    setLoading(courseSlug);
    setMessage(null);
    try {
      const res = await fetch("/api/game/university", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ course: courseSlug, amount }),
      });
      const data = await res.json();
      if (!res.ok) {
        setMessage(data.error || "Failed.");
        return;
      }
      setProgressMap((prev) => ({ ...prev, [courseSlug]: data.totalPoints }));
      setMot(data.motivationLeft);
      setMessage(data.message);
    } catch {
      setMessage("Network error.");
    } finally {
      setLoading(null);
    }
  };

  const handleStudyAll = async () => {
    setMessage(null);
    const entries = Object.entries(studyAmounts).filter(([, v]) => v > 0);
    if (entries.length === 0) return;
    const results: string[] = [];
    for (const [slug, amount] of entries) {
      setLoading(slug);
      try {
        const res = await fetch("/api/game/university", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ course: slug, amount }),
        });
        const data = await res.json();
        if (res.ok) {
          setProgressMap((prev) => ({ ...prev, [slug]: data.totalPoints }));
          setMot(data.motivationLeft);
          results.push(`${data.course}: +${data.pointsGained}`);
        } else {
          results.push(`${slug}: ${data.error}`);
          break;
        }
      } catch {
        results.push(`${slug}: Network error`);
        break;
      }
    }
    setLoading(null);
    setMessage(results.join(" · "));
  };

  return (
    <div className="space-y-3">
      <div className="rounded-md border border-slate-800 bg-[#0a0d11] p-4">
        <p className="text-[12px] leading-relaxed text-slate-400">
          Countless generations of scholars have rounded off their education at the Bureau 21 Institute.
          Those who did not succumb to complete and utter insanity went on to live productive, even enlightened, lives.
          The skills one can learn in these hallowed halls are vital to a successful stay aboard the station.
        </p>
        <p className="mt-3 text-[12px] leading-relaxed text-slate-400">
          <strong className="text-slate-300">So, what class(es) would you like to attend?</strong>{" "}
          Fill in the boxes to study more than one session at a time. You have{" "}
          <span className="font-bold text-amber-300">{mot}</span> motivation ({Math.floor(mot / studyCost)} studies available).
        </p>
        <p className="mt-2 text-[11px] text-slate-500">
          Each class costs {studyCost} motivation. Each study has a 70% chance to earn 1 point (max 1,000 per course).
        </p>
      </div>

      {message && (
        <div className="rounded-md border border-cyan-900/40 bg-cyan-950/20 px-4 py-2 text-[11px] text-cyan-300">
          {message}
        </div>
      )}

      {/* Course table */}
      <div className="overflow-x-auto rounded-md border border-slate-800 bg-[#0a0d11]">
        <table className="w-full text-[12px]">
          <thead>
            <tr className="border-b border-slate-800 text-left text-[10px] uppercase tracking-wider text-slate-500">
              <th className="px-3 py-2">Class</th>
              <th className="px-3 py-2 text-right">Current Points</th>
              <th className="px-3 py-2 text-right">Study More</th>
            </tr>
          </thead>
          <tbody>
            {courses.map((course) => {
              const pts = progressMap[course.slug] ?? 0;
              const isMax = pts >= course.maxPoints;
              const isLoading = loading === course.slug;
              return (
                <tr key={course.slug} className="border-b border-slate-800/50 hover:bg-slate-900/30">
                  <td className="px-3 py-1.5">
                    <span
                      className={`font-semibold ${isMax ? "text-emerald-400" : "text-cyan-400"}`}
                      title={course.description}
                    >
                      {course.name}
                    </span>
                  </td>
                  <td className="px-3 py-1.5 text-right font-mono text-slate-300">
                    {pts} / {course.maxPoints.toLocaleString()}
                  </td>
                  <td className="px-3 py-1.5 text-right">
                    {isMax ? (
                      <span className="text-[10px] text-emerald-500">MASTERED</span>
                    ) : (
                      <input
                        type="number"
                        min={0}
                        max={100}
                        value={studyAmounts[course.slug] ?? 0}
                        onChange={(e) =>
                          setStudyAmounts((prev) => ({
                            ...prev,
                            [course.slug]: Math.max(0, Math.min(100, parseInt(e.target.value) || 0)),
                          }))
                        }
                        disabled={isLoading}
                        className="w-14 rounded border border-slate-700 bg-slate-900 px-2 py-0.5 text-center text-[11px] text-slate-200 focus:border-cyan-600 focus:outline-none disabled:opacity-50"
                      />
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
          <tfoot>
            <tr>
              <td colSpan={2} />
              <td className="px-3 py-2 text-right">
                <button
                  onClick={handleStudyAll}
                  disabled={loading !== null}
                  className="rounded border border-cyan-800 bg-cyan-950/40 px-3 py-1 text-[10px] font-semibold uppercase tracking-wider text-cyan-300 transition hover:bg-cyan-900/40 disabled:opacity-50"
                >
                  Study
                </button>
              </td>
            </tr>
          </tfoot>
        </table>
      </div>

      <div className="rounded-md border border-slate-800 bg-[#0a0d11] p-4">
        <p className="text-[11px] font-bold text-slate-300">Quick Tip:</p>
        <p className="mt-1 text-[11px] text-slate-500">
          Each class costs {studyCost} motivation per session. Each study session has a random chance of earning a point.
          The more study points you accumulate in a subject, the more benefits you unlock across the station.
          For example, higher Hydroculture points improve your herb yields, while Probability Theory improves your Casino odds.
        </p>
      </div>
    </div>
  );
}
