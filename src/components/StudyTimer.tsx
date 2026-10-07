"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

const fmt = (s: number) => `${Math.floor(s / 60)}:${String(s % 60).padStart(2, "0")}`;

export default function StudyTimer({ topicId }: { topicId: string }) {
  const key = `sabiwela:study:${topicId}`;
  const router = useRouter();
  const [start, setStart] = useState<number | null>(null);
  const [now, setNow] = useState(0);

  useEffect(() => {
    let s = Number(localStorage.getItem(key));
    if (!s) {
      s = Date.now();
      localStorage.setItem(key, String(s));
    }
    setStart(s);
    setNow(Date.now());
    const t = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(t);
  }, [key]);

  const secs = start ? Math.max(0, Math.round((now - start) / 1000)) : 0;
  const done = () => {
    localStorage.removeItem(key);
    router.push(`/session/${topicId}/explain?s=${secs}`);
  };
  const cancel = () => {
    localStorage.removeItem(key);
    router.push("/library");
  };

  return (
    <>
      <div className="box">
        <div className="big" aria-live="off">{fmt(secs)}</div>
        <p className="mute">Study from your own notes. Come back here when you&apos;re done.</p>
      </div>
      <button className="btn block" onClick={done}>I&apos;m done studying</button>
      <button className="btn ghost block" style={{ marginTop: 10 }} onClick={cancel}>Cancel</button>
    </>
  );
}
