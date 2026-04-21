"use client";
import { useState } from "react";
import { Sparkles, Loader2, Image as ImageIcon } from "lucide-react";

export default function Home() {
  const [poetry, setPoetry] = useState("");
  const [scenes, setScenes] = useState<any[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);

  const generateImage = async (prompt: string, index: number) => {
    const apiKey = process.env.NEXT_PUBLIC_GEMINI_API_KEY;
    if (!apiKey) return;

    try {
      const resp = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-image:generateContent?key=${apiKey}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: [{ parts: [{ text: `Cinematic Urdu poetry visual: ${prompt}. 9:16 vertical, artistic, no text.` }] }],
          generationConfig: { responseModalities: ["IMAGE"] }
        }),
      });

      if (resp.ok) {
        const data = await resp.json();
        const img = data?.candidates?.[0]?.content?.parts?.find((p: any) => p.inlineData)?.inlineData?.data;
        if (img) {
          setScenes(prev => prev.map((s, i) => i === index ? { ...s, imageUrl: `data:image/png;base64,${img}`, isGenerating: false } : s));
        }
      }
    } catch (e) { console.error("Error", e); }
  };

  const handleStart = async () => {
    if (!poetry.trim()) return;
    setIsProcessing(true);
    const lines = poetry.split("\n").filter(l => l.trim() !== "");
    const newScenes = [];
    for (let i = 0; i < lines.length; i += 2) {
      newScenes.push({ verses: lines.slice(i, i + 2), isGenerating: true });
    }
    setScenes(newScenes);

    for (let i = 0; i < newScenes.length; i++) {
      await generateImage(newScenes[i].verses.join(", "), i);
      await new Promise(r => setTimeout(r, 4000)); 
    }
    setIsProcessing(false);
  };

  return (
    <div className="min-h-screen p-6 md:p-20 text-center">
      <h1 className="text-4xl font-bold text-yellow-500 mb-10 tracking-tighter">LAFZ STUDIO v2</h1>
      <textarea 
        className="w-full max-w-2xl h-48 bg-zinc-900 border-2 border-zinc-800 rounded-2xl p-6 text-xl mb-6 text-right outline-none focus:border-yellow-600 transition-all text-white"
        style={{ fontFamily: "'Noto Nastaliq Urdu', serif" }}
        placeholder="اپنی شاعری یہاں لکھیں۔۔۔"
        value={poetry}
        onChange={(e) => setPoetry(e.target.value)}
      />
      <button 
        onClick={handleStart} 
        disabled={isProcessing}
        className="w-full max-w-2xl bg-yellow-600 hover:bg-yellow-500 text-black h-14 rounded-xl font-bold flex items-center justify-center gap-2 transition-all disabled:opacity-50"
      >
        {isProcessing ? <Loader2 className="animate-spin" /> : <Sparkles />} Generate Cinematic Frames
      </button>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mt-16 max-w-6xl mx-auto">
        {scenes.map((s, i) => (
          <div key={i} className="aspect-[9/16] bg-zinc-900 rounded-2xl overflow-hidden border border-zinc-800 relative shadow-xl">
            {s.imageUrl ? (
              <>
                <img src={s.imageUrl} className="w-full h-full object-cover" />
                <div className="absolute inset-0 bg-black/40 flex items-center justify-center p-4 text-center">
                  <p className="text-white text-sm leading-relaxed" style={{ fontFamily: "'Noto Nastaliq Urdu', serif" }}>
                    {s.verses.map((v: string) => <span key={v} className="block">{v}</span>)}
                  </p>
                </div>
              </>
            ) : (
              <div className="h-full flex flex-col items-center justify-center text-zinc-700">
                {s.isGenerating ? <Loader2 className="animate-spin text-yellow-500" /> : <ImageIcon className="w-10 h-10 opacity-20" />}
                <span className="text-[10px] mt-2 font-mono uppercase tracking-widest">{s.isGenerating ? "Creating" : "Waiting"}</span>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
