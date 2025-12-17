import { NextResponse } from 'next/server';

const PROMPT = `日商簿記3級の仕訳問題を15問生成してください。以下のJSON形式で出力してください。

要件:
- 各問題には4つの勘定科目選択肢（A, B, C, D）を含める
- 正解の仕訳（借方・貸方の記号と金額）を含める
- 解説文を含める
- 問題のidは1から15まで連番

難易度の配分:
- 基礎レベル（簡単）: 5問
- 標準レベル（中級）: 7問
- 応用レベル（難しい）: 3問

必ず含める問題タイプ:
- 減価償却に関する問題: 2問以上
- 経過勘定（前払費用、未払費用、前受収益、未収収益など）に関する問題: 2問以上
- 貸倒引当金に関する問題: 1問以上
- 固定資産の購入・売却に関する問題: 1問以上
- その他の基本的な取引: 残りの問題

注意事項:
- 実務で頻出する典型的なパターンを含めること
- 金額は実務的な範囲（1,000円～10,000,000円程度）とすること
- 解説は初学者でも理解できるよう、丁寧に説明すること

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

async function generateWithGemini(apiKey: string, controller: AbortController) {
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
                text: PROMPT,
              },
            ],
          },
        ],
        generationConfig: {
          temperature: 0.7,
          maxOutputTokens: 8000,
        },
      }),
      signal: controller.signal,
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
    throw new Error('No content generated from Gemini');
  }

  return generatedText;
}

async function generateWithGroq(apiKey: string, controller: AbortController) {
  const response = await fetch(
    'https://api.groq.com/openai/v1/chat/completions',
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: 'llama-3.3-70b-versatile',
        messages: [
          {
            role: 'system',
            content: '日本語で応答してください。JSON形式のみを返してください。',
          },
          {
            role: 'user',
            content: PROMPT,
          },
        ],
        temperature: 0.7,
        max_tokens: 8000,
      }),
      signal: controller.signal,
    }
  );

  if (!response.ok) {
    const errorData = await response.json();
    console.error('Groq API Error:', {
      status: response.status,
      statusText: response.statusText,
      error: errorData,
    });
    throw new Error(`Groq API request failed: ${response.status} - ${JSON.stringify(errorData)}`);
  }

  const data = await response.json();
  const generatedText = data.choices?.[0]?.message?.content;

  if (!generatedText) {
    throw new Error('No content generated from Groq');
  }

  return generatedText;
}

export async function POST() {
  const provider = process.env.AI_PROVIDER || 'gemini'; // Default to gemini
  const geminiKey = process.env.GEMINI_API_KEY;
  const groqKey = process.env.GROQ_API_KEY;

  // Validate API keys based on provider
  if (provider === 'gemini' && !geminiKey) {
    return NextResponse.json(
      { error: 'Gemini API key not configured' },
      { status: 500 }
    );
  }

  if (provider === 'groq' && !groqKey) {
    return NextResponse.json(
      { error: 'Groq API key not configured' },
      { status: 500 }
    );
  }

  try {
    // Create AbortController for timeout
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 60000); // 60 second timeout

    let generatedText: string;

    // Generate based on selected provider
    if (provider === 'groq') {
      console.log('Using Groq API...');
      generatedText = await generateWithGroq(groqKey!, controller);
    } else {
      console.log('Using Gemini API...');
      generatedText = await generateWithGemini(geminiKey!, controller);
    }

    clearTimeout(timeoutId);

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

    // Handle timeout errors
    if (error instanceof Error && error.name === 'AbortError') {
      return NextResponse.json(
        { error: 'Request timeout - please try again' },
        { status: 408 }
      );
    }

    return NextResponse.json(
      { error: 'Failed to generate problems' },
      { status: 500 }
    );
  }
}
