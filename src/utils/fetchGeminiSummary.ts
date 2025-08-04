export async function fetchGeminiSummary(prompt: string) {
  const res = await fetch("https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent?key=YOUR_API_KEY", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      contents: [{ parts: [{ text: prompt }] }]
    })
  });

  const data = await res.json();
  const text = data.candidates?.[0]?.content?.parts?.[0]?.text || "";

  // naive parsing
  return {
    summary: text.split("Performance:")[0]?.trim(),
    quality: /Response Quality: (.*)/.exec(text)?.[1]?.trim() ?? "Unknown",
    comprehension: /Comprehension: (.*)/.exec(text)?.[1]?.trim() ?? "Unknown",
    speed: /Speed: (.*)/.exec(text)?.[1]?.trim() ?? "Unknown"
  };
}
