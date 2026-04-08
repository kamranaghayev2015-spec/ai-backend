export default async function handler(req, res) {

  // 🔥 CORS headers (HƏR REQUEST üçün)
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  // 🔥 OPTIONS (preflight) request
  if (req.method === "OPTIONS") {
    return res.status(200).end();
  }

  // 🔥 yalnız POST
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Only POST allowed" });
  }

  try {
    const { answers } = req.body;

    const prompt = `
BURAYA SƏNİN FULL PROMPTUN

YALNIZ JSON qaytar.
Heç bir əlavə mətn yazma.
`;

    const response = await fetch("https://api.openai.com/v1/responses", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": "Bearer " + process.env.OPENAI_API_KEY
      },
        body: JSON.stringify({
          model: "gpt-4.1-mini",
          messages: [
            {
              role: "user",
              content: prompt
            }
          ]
        })

    const data = await response.json();
    const text = data?.output?.[0]?.content?.[0]?.text;

    return res.status(200).json({ result: text });

  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
}
