export default async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });

  try {
    const { query, systemPrompt } = req.body;

    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${process.env.GEMINI_API_KEY}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          // 將系統指令與使用者問題合併，這是最不容易出錯的寫法
          contents: [
            {
              role: "user",
              parts: [{ text: `${systemPrompt}\n\n現在請幫我產出以下作業的安全標準程序：${query}` }]
            }
          ],
          generationConfig: {
            // 如果你希望 AI 直接回傳 JSON 字串，才開啟這行
            // responseMimeType: "application/json", 
            temperature: 0.7,
          },
        }),
      }
    );

    const data = await response.json();
    
    // 如果 Google 回傳錯誤，直接把錯誤細節傳給前端方便除錯
    if (data.error) {
      return res.status(400).json({ error: data.error.message });
    }

    res.status(200).json(data);

  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}
