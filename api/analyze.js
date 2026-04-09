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
    const { answers } = req.body;

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
- hər bölmə 2-3 cümlə olsun (çox qısa yazma)
- ümumi sözlərdən qaç, konkret izah ver
- istifadəçinin nə etdiyini və nə etmədiyini göstər

STRUKTUR:

1. Güclü tərəflərin
→ sənin artıq yaxşı etdiyin sahələri izah et
→ “sənin bu sahədə artıq təcrübən var” kimi ifadələr istifadə et

2. Orta səviyyə
→ istifadə etdiyin amma stabil olmayan sahələri göstər
→ “bu sahədə müəyyən biliklərin var, amma…” kimi davam et

3. İnkişaf edə biləcəyin sahələr
→ istifadə etmədiyin və ya zəif olduğun sahələri izah et
→ konkret kateqoriyaları qeyd et

4. Növbəti addımlar (ƏN VACİB HİSSƏ)

→ mütləq bullet formatında yaz
→ hər maddə konkret və praktik olsun
→ ilk cümlədə istifadəçiyə “sən” ilə müraciət et
→ action maddələrində təkrar “sən” istifadə etmə
→ maddələri əmrlər və istiqamətlər formasında yaz
→ real istifadə nümunəsi əlavə et
→ bullet maddələr “feil ilə başlasın” (istifadə et, qur, tətbiq et, öyrən və s.)

Məsələn:
- sən ChatGPT istifadə edərək gündəlik işlərini avtomatlaşdırmağa başlaya bilərsən
- sən Zapier ilə 1 sadə workflow quraraq prosesi optimallaşdıra bilərsən

QAYDALAR:
- minimum 4-6 action maddəsi yaz
- fərqli kateqoriyaları əhatə et (yalnız bir sahə yox)
- ümumi yox, konkret alət + istifadə ssenarisi yaz

CAVAB FORMATI (yalnız JSON):

{
  "strength": "...",
  "mid": "...",
  "improve": "...",
  "actions": [
    "...",
    "...",
    "...",
    "...",
    "..."
  ]
}

Qəti qaydalar:
- bütün sahələri doldur
- boş qaytarma
- yalnız JSON qaytar
- əlavə heç bir mətn yazma
`;

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

    // 🔥 JSON CLEANING (ən vacib hissə)
    const cleaned = rawText
      ?.replace(/```json/g, "")
      ?.replace(/```/g, "")
      ?.trim();

    let parsed;

    try {
      parsed = JSON.parse(cleaned);
    } catch (e) {
      console.error("JSON parse error:", cleaned);

      // fallback cavab
      return res.status(200).json({
        strength: "AI istifadən müəyyən səviyyədə formalaşıb, lakin daha sistemli yanaşma mümkündür.",
        mid: "Bəzi alətlərdən istifadə edirsən, amma bu istifadə davamlı və strukturlu deyil.",
        improve: "Xüsusilə bəzi sahələrdə AI-dən istifadə imkanların hələ tam açılmayıb.",
        actions: [
          "Hər gün bir AI aləti ilə konkret tapşırıq icra et",
          "Automation alətlərindən kiçik workflow quraraq başla",
          "Data və analiz alətlərini real işində tətbiq etməyə çalış"
        ]
      });
    }

    return res.status(200).json(parsed);

  } catch (err) {
    console.error("Server error:", err);
    return res.status(500).json({ error: err.message });
  }
}
