export default async function handler(req, res) {

  // ✅ CORS
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  if (req.method === "OPTIONS") {
    return res.status(200).end();
  }

  if (req.method !== "POST") {
    return res.status(405).json({ error: "Only POST allowed" });
  }

  try {

    const { answers, name, type, group } = req.body;

    if (!answers) {
      return res.status(400).json({ error: "answers is required" });
    }

    const prompt = `
İstifadəçi AI alətlərini qiymətləndirib:

0 = tanımır
1 = bilir
2 = az istifadə edib
3 = tez-tez
4 = aktiv istifadə edir

BÜTÜN alətlər:
${JSON.stringify(answers)}

Sənin vəzifən:
İstifadəçinin AI istifadə davranışını analiz etmək və ona inkişaf üçün praktik istiqamət verməkdir.

ÜSLUB:
- istifadəçiyə "sən" deyə müraciət et
- human və consultant tone istifadə et
- quru yox, izah edən və istiqamət verən cümlələr qur
- real davranışı təsvir et

YAZI QAYDALARI:
- hər bölmə 2-3 cümlə olsun
- ümumi sözlərdən qaç
- konkret izah ver

STRUKTUR:
1. Güclü tərəflərin
2. Orta səviyyə
3. İnkişaf edə biləcəyin sahələr
4. Növbəti addımlar

CAVAB FORMATI (yalnız JSON):

{
  "strength": "...",
  "mid": "...",
  "improve": "...",
  "actions": ["...", "..."]
}
`;

    // 🔥 OpenAI call
    const response = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": "Bearer " + process.env.OPENAI_API_KEY
      },
      body: JSON.stringify({
        model: "gpt-4.1-mini",
        temperature: 0.4,
        messages: [
          { role: "user", content: prompt }
        ]
      })
    });

    const data = await response.json();
    const rawText = data.choices?.[0]?.message?.content;

    // 🔥 JSON CLEANING
    const cleaned = rawText
      ?.replace(/```json/g, "")
      ?.replace(/```/g, "")
      ?.trim();

    let parsed;

    try {
      parsed = JSON.parse(cleaned);
    } catch (e) {
      console.error("JSON parse error:", cleaned);

      parsed = {
        strength: "AI istifadən müəyyən səviyyədə formalaşıb, lakin daha sistemli yanaşma mümkündür.",
        mid: "Bəzi alətlərdən istifadə edirsən, amma bu istifadə davamlı və strukturlu deyil.",
        improve: "Xüsusilə bəzi sahələrdə AI-dən istifadə imkanların hələ tam açılmayıb.",
        actions: [
          "Hər gün bir AI aləti ilə konkret tapşırıq icra et",
          "Automation alətlərindən kiçik workflow quraraq başla",
          "Data və analiz alətlərini real işində tətbiq etməyə çalış"
        ]
      };
    }

    // 🔥 GOOGLE SHEETS SAVE (SERVER SIDE)

    try {

      const payload = {
        name: name || "",
        type: type || "",
        group: group || "",
        answers: answers,
        analysis: parsed,
        score: calculateScore(answers),
        timestamp: new Date().toISOString()
      };

      await fetch(process.env.SHEETS_WEBHOOK_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify(payload)
      });

    } catch (e) {
      console.error("Sheets save failed:", e);
    }

    return res.status(200).json(parsed);

  } catch (err) {
    console.error("Server error:", err);
    return res.status(500).json({ error: err.message });
  }
}


// 🔥 SCORE FUNCTION
function calculateScore(answers){
  const values = Object.values(answers || {});
  if(!values.length) return 0;

  const sum = values.reduce((a,b)=>a + Number(b || 0), 0);
  const max = values.length * 4;

  return Math.round((sum / max) * 100);
}
