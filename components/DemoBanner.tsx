"use client";
// shows a small notice when no api keys are set, so testers know the
// content is sample content.
import { useEffect, useState } from "react";

export default function DemoBanner() {
  const [demo, setDemo] = useState(false);
  useEffect(() => {
    fetch("/api/status")
      .then((r) => r.json())
      .then((s: { demoAI: boolean; demoSpeech: boolean }) => setDemo(s.demoAI || s.demoSpeech))
      .catch(() => {});
  }, []);
  if (!demo) return null;
  return (
    <div className="mb-4 rounded-2xl bg-blue-50 px-4 py-2.5 text-sm text-blue-800">
      Demo mode: AI keys aren't connected yet, so you'll see sample content.
    </div>
  );
}
