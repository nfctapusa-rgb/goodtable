"use client";
import { useEffect, useState } from "react";

const WORDS = ["get found on Google", "take direct bookings", "sell more online", "win back customers", "grow on autopilot"];

export function Rotator() {
  const [i, setI] = useState(0);
  useEffect(() => { const t = setInterval(() => setI(x => (x + 1) % WORDS.length), 2400); return () => clearInterval(t); }, []);
  return <span className="rot" key={i}>{WORDS[i]}</span>;
}
