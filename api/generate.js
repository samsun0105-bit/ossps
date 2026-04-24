export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const body = typeof req.body === "string" ? JSON.parse(req.body) : req.body;

    const query = body.query || "";
    const systemPrompt = body.systemPrompt || "你是一位專業的職業安全衛生管理師。";

    if (!query) {
      return res.status(400).json({ error: "缺少 query", receivedBody: body });
    }

    const prompt = `${systemPrompt}

請根據以下作業名稱產生安全衛生作業標準程序。
作業名稱：${query}

請只輸出純 JSON，不要 markdown，不要說明文字。
JSON 格式：
{
  "type": "",
  "method": "",
  "name": "",
  "tools": "",
  "protective": "",
  "steps": [
    {
      "step": "",
      "desc": "",
      "danger": "",
      "safety": "",
      "emergency": ""
    }
  ]
}`;

    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${process.env.GEMINI_API_KEY}`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          contents: [
            {
              parts: [
                {
                  text: prompt
                }
              ]
            }
          ]
        })
      }
    );

    const data = await response.json();

    if (!response.ok) {
      console.error("Gemini API Error:", JSON.stringify(data, null, 2));
      return res.status(response.status).json(data);
    }

    return res.status(200).json(data);
  } catch (error) {
    console.error("Server Error:", error);
    return res.status(500).json({ error: error.message });
  }
}
