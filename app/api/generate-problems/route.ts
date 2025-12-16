import { NextResponse } from 'next/server';

export async function POST() {
  const apiKey = process.env.GEMINI_API_KEY;

  if (!apiKey) {
    return NextResponse.json(
      { error: 'API key not configured' },
      { status: 500 }
    );
  }

  const prompt = `日商簿記3級の仕訳問題を15問生成してください。以下のJSON形式で出力してください。

要件:
- 各問題には4つの勘定科目選択肢（A, B, C, D）を含める
- 正解の仕訳（借方・貸方の記号と金額）を含める
- 解説文を含める
- 問題のidは1から15まで連番

出力形式（JSONのみを出力し、他のテキストは含めないでください）:
[
  {
    "id": 1,
    "question": "問題文",
    "accountOptions": [
      { "symbol": "A", "name": "勘定科目名1" },
      { "symbol": "B", "name": "勘定科目名2" },
      { "symbol": "C", "name": "勘定科目名3" },
      { "symbol": "D", "name": "勘定科目名4" }
    ],
    "correctAnswer": {
      "debitSymbol": "A",
      "debitAmount": 100000,
      "creditSymbol": "B",
      "creditAmount": 100000
    },
    "explanation": "解説文"
  }
]`;

  try {
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1/models/gemini-2.5-flash:generateContent?key=${apiKey}`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          contents: [
            {
              parts: [
                {
                  text: prompt,
                },
              ],
            },
          ],
          generationConfig: {
            temperature: 0.7,
            maxOutputTokens: 8000,
          },
        }),
      }
    );

    if (!response.ok) {
      const errorData = await response.json();
      console.error('Gemini API Error:', {
        status: response.status,
        statusText: response.statusText,
        error: errorData,
      });
      throw new Error(`Gemini API request failed: ${response.status} - ${JSON.stringify(errorData)}`);
    }

    const data = await response.json();
    const generatedText = data.candidates?.[0]?.content?.parts?.[0]?.text;

    if (!generatedText) {
      throw new Error('No content generated');
    }

    // Extract JSON from markdown code blocks if present
    let jsonText = generatedText;
    const jsonMatch = generatedText.match(/```json\s*([\s\S]*?)\s*```/);
    if (jsonMatch) {
      jsonText = jsonMatch[1];
    } else {
      // Try to find JSON array in the text
      const arrayMatch = generatedText.match(/\[\s*\{[\s\S]*\}\s*\]/);
      if (arrayMatch) {
        jsonText = arrayMatch[0];
      }
    }

    const problems = JSON.parse(jsonText.trim());

    // Validate the structure
    if (!Array.isArray(problems) || problems.length !== 15) {
      throw new Error('Invalid problems format');
    }

    return NextResponse.json({ problems });
  } catch (error) {
    console.error('Error generating problems:', error);
    return NextResponse.json(
      { error: 'Failed to generate problems' },
      { status: 500 }
    );
  }
}
