"use client";
import { useEffect, useState } from "react";

export default function ProgressSteps({ steps }: { steps: string[] }) {
  const [i, setI] = useState(0);
  useEffect(() => {
    const t = setInterval(() => setI((n) => n + 1), 2800);
    return () => clearInterval(t);
  }, []);
  const k = Math.min(i, steps.length - 1);
  return (
    <div aria-live="polite">
      <div className="prog"><span className="spin" /><span>{steps[k]}</span></div>
      <div className="pbar"><i style={{ width: `${Math.min(92, ((k + 1) / steps.length) * 92)}%` }} /></div>
    </div>
  );
}
