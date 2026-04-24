export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const body =
      typeof req.body === "string"
        ? JSON.parse(req.body || "{}")
        : req.body || {};

    const query = String(body.query || "").trim();

    const systemPrompt = String(
      body.systemPrompt || "你是一位專業的職業安全衛生管理師。"
    ).trim();

    if (!process.env.GEMINI_API_KEY) {
      return res.status(500).json({
        error: "缺少 GEMINI_API_KEY，請到 Vercel Environment Variables 設定"
      });
    }

    if (!query) {
      return res.status(400).json({
        error: "缺少 query",
        receivedBody: body
      });
    }

    const prompt = `${systemPrompt}

請根據以下作業名稱產生安全衛生作業標準程序。

作業名稱：${query}

請只輸出純 JSON，不要 markdown，不要說明文字。

JSON 格式如下：
{
  "type": "作業種類",
  "method": "作業方法",
  "name": "作業名稱",
  "tools": "使用器具",
  "protective": "防護具",
  "steps": [
    {
      "step": "工作步驟",
      "desc": "工作方法",
      "danger": "不安全因素",
      "safety": "安全措施",
      "emergency": "事故處理"
    }
  ]
}`;

    const payload = {
      contents: [
        {
          role: "user",
          parts: [
            {
              text: prompt
            }
          ]
        }
      ],
      generationConfig: {
        temperature: 0.4,
        responseMimeType: "application/json"
      }
    };

    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${process.env.GEMINI_API_KEY}`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify(payload)
      }
    );

    const data = await response.json();

    if (!response.ok) {
      console.error("Gemini API Error:", JSON.stringify(data, null, 2));
      return res.status(response.status).json({
        error: data.error || data,
        sentPayload: payload
      });
    }

    return res.status(200).json(data);
  } catch (error) {
    console.error("Server Error:", error);
    return res.status(500).json({
      error: error.message
    });
  }
}
