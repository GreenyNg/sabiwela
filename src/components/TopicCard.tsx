"use client";
import { useState } from "react";
import Link from "next/link";
import { renameTopic, deleteTopic } from "@/app/(app)/library/actions";
import { STATE_META, stateForScore } from "@/lib/domain/states";

type Props = { id: string; name: string; level: number | null; nextText: string; indent: boolean };

export default function TopicCard({ id, name, level, nextText, indent }: Props) {
  const [open, setOpen] = useState(false);
  const meta = STATE_META[stateForScore(level)];
  const done = level !== null && level >= 60;
  return (
    <div className={`pw${indent ? " ind" : ""}`}>
      <div className="pcw">
        <Link href={`/session/${id}/study`} className={`pc${done ? " dn" : ""}`} style={{ ["--c" as string]: meta.color }}>
          <div className="ic" aria-hidden="true">{meta.icon}</div>
          <div style={{ paddingRight: 44 }}>
            <small>{nextText ? `${meta.label} · ${nextText}` : meta.label}</small>
            <b>{name}</b>
          </div>
          {done && <span className="ck" aria-hidden="true">✓</span>}
        </Link>
        <button type="button" className="edb btn ghost sm" onClick={() => setOpen(!open)} aria-expanded={open} aria-label={`Edit ${name}`}>⋯</button>
      </div>
      {open && (
        <div className="box">
          <form action={renameTopic}>
            <input type="hidden" name="id" value={id} />
            <label htmlFor={`rn-${id}`}>Topic name</label>
            <input id={`rn-${id}`} name="name" defaultValue={name} required maxLength={120} />
            <button className="btn sm" style={{ marginTop: 10 }}>Save</button>
          </form>
          <form action={deleteTopic} style={{ marginTop: 10 }}>
            <input type="hidden" name="id" value={id} />
            <button className="btn ghost sm">Delete topic</button>
          </form>
        </div>
      )}
    </div>
  );
}
