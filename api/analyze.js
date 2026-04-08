export default async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

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
${JSON.stringify(fullAnswers)}

Analiz et:

- Güclü tərəflər (3-4)
- Orta (1-2)
- Zəif (0)

BÜTÜN kateqoriyaları nəzərə al
Seçilməyənləri zəif kimi qəbul et

Azərbaycan dilində yaz

Cavabı çox qısa və praktik yaz.

"Zəif tərəflər" hissəsində sadəcə ümumi demə, konkret kateqoriyanı və alətləri qeyd et.

"Nə etməlisən" hissəsində hər maddə üçün konkret iş nümunəsi ver.

Uzun izah yazma.

Alətləri tək-tək siyahı şəklində yazma.

Onların yerinə:
- ümumi pattern-i izah et
- istifadəçinin real davranışını təsvir et
- "sən bunu edirsən / etmirsən" kimi danış

Cavab human və consultant üslubunda olsun.

Tool adlarını yalnız lazım olduqda misal kimi çək.

"Zəif tərəflər" ifadəsini istifadə etmə.
Onun əvəzinə "İnkişaf edə biləcəyin sahələr" yaz.

Bütün AI kateqoriyalarını nəzərə al:
- AI Assistants
- Writing
- Presentations
- Image
- Video
- Automation
- Research
- Productivity
- Meetings
- Data
- Coding
- Email

Növbəti addımlarda çalış:
- fərqli kateqoriyalardan ən az 3-5 sahəni əhatə et
- yalnız bir sahəyə fokuslanma
- istifadə etmədiyi sahələri mütləq daxil et

İstifadəçinin ən zəif olduğu 3 fərqli sahədən konkret tövsiyə ver

Cavabı aşağıdakı JSON formatında qaytar:

{
  "strength": "...",
  "mid": "...",
  "improve": "...",
  "actions": ["...", "...", "..."]
}

Qayda:
- hər sahə tam cümlə olsun
- yarımçıq cümlə yazma
- actions array olsun (list kimi)

YALNIZ JSON qaytar.
Heç bir əlavə mətn yazma.

`;

    const response = await fetch("https://api.openai.com/v1/responses", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${process.env.OPENAI_API_KEY}`
      },
      body: JSON.stringify({
        model: "gpt-4.1-mini",
        input: prompt
      })
    });

    const data = await response.json();
    const text = data?.output?.[0]?.content?.[0]?.text;

    res.status(200).json({ result: text });

  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}
