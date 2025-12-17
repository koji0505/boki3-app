import { NextResponse } from 'next/server';

const PROMPT = `日商簿記3級の仕訳問題を15問生成してください。以下のJSON形式で出力してください。

要件:
- 各問題には4つの勘定科目選択肢（A, B, C, D）を含める
- 正解の仕訳（借方・貸方の記号と金額）を含める
- 解説文を含める
- 問題のidは1から15まで連番
- 15問は全て異なる取引タイプにすること（同じような問題を複数出題しない）
- 各問題は異なる勘定科目の組み合わせを使用すること
- 例: 「現金→当座預金」という取引は1問のみにすること

難易度の配分:
- 標準レベル: 12問
- 応用レベル（複雑・長文）: 3問

必ず含める問題タイプ:
- 減価償却に関する問題: 2問以上
- 経過勘定（前払費用、未払費用、前受収益、未収収益など）に関する問題: 2問以上
- 貸倒引当金に関する問題: 1問以上
- 固定資産の購入・売却に関する問題: 1問以上
- その他の基本的な取引: 残りの問題

重要な注意事項:
- 問題文は曖昧さを排除し、具体的に記述すること
- 問題文は複雑で長文にすること（複数の条件や状況を含める）
- 応用問題は特に長文で、複数のステップや条件を含めること
- 支払方法は必ず明記すること（現金、普通預金、当座預金など）
- 「支払った」だけでなく「現金で支払った」「普通預金から支払った」のように具体的に記述すること
- 日付は具体的に記載すること（例：×1年4月1日、×1年12月31日）
- 問題文の時点で内容が明らかな場合は、途中処理を省略し、最初から適切な勘定科目で処理すること
- 取引時の仕訳と決算整理仕訳を織り交ぜて出題すること
- 決算整理仕訳の場合は、必ず問題文に「決算整理として」「決算日において」などと明記すること
- 前払・未払・見越がある場合は、その理由が問題文から判断できるように具体的に記述すること
- 勘定科目は日商簿記3級で使用するものに限定すること（2級・1級の勘定科目は使用しない）
- 実務で頻出する典型的なパターンを含めること
- 金額は実務的な範囲（1,000円～10,000,000円程度）とすること
- 解説は初学者でも理解できるよう、丁寧に説明すること
- 誤解を生まない表現を心がけること

仕訳の基本ルール（絶対に守ること）:
- 資産の増加は借方、減少は貸方
- 負債の増加は貸方、減少は借方
- 純資産（資本）の増加は貸方、減少は借方
- 収益の増加は貸方、減少は借方
- 費用の増加は借方、減少は貸方
- 借方・貸方を絶対に逆にしないこと

取引時と決算時の処理区分（重要）:
- 取引時（期中）は、原則として収益または費用の勘定科目で処理すること
- 前払費用・未払費用・未収収益・前受収益は、決算整理で計上すること
- 取引時に「前払費用」「未払費用」「未収収益」「前受収益」で処理しないこと
- 例: 保険料を支払った → 取引時は (借)保険料 / (貸)現金、決算時に (借)前払費用 / (貸)保険料

決算整理の正しい処理:
- 見越し（未収収益・未払費用）は、発生主義に基づき必ず収益・費用の増減として処理すること
- 未収収益の計上: (借)未収収益 / (貸)収益
- 未払費用の計上: (借)費用 / (貸)未払費用
- 前払費用の計上: (借)前払費用 / (貸)費用
- 前受収益の計上: (借)収益 / (貸)前受収益
- 貸倒引当金の計上: (借)貸倒引当金繰入 / (貸)貸倒引当金
- 減価償却の計上: (借)減価償却費 / (貸)減価償却累計額
- 減価償却は必ず定額法を使用すること（定率法や生産高比例法は使用しない）

商品売買の処理方法:
- 商品売買は必ず三分法で処理すること
- 仕入時: (借)仕入 / (貸)現金等
- 売上時: (借)現金等 / (貸)売上
- 決算時: 繰越商品を使用して売上原価を計算
- 分記法や総記法は使用しないこと

勘定科目の表記ルール:
- ガス代、水道代、電気代 → 「水道光熱費」に統一
- 家具 → 「備品」に統一
- 減価償却累計額は固定資産ごとに明記:
  - 機械の場合: 機械減価償却累計額
  - 建物の場合: 建物減価償却累計額
  - 備品の場合: 備品減価償却累計額
  - 車両運搬具の場合: 車両運搬具減価償却累計額

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

async function generateWithClaude(apiKey: string, controller: AbortController) {
  const response = await fetch(
    'https://api.anthropic.com/v1/messages',
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: 'claude-3-5-haiku-20241022',
        max_tokens: 8000,
        messages: [
          {
            role: 'user',
            content: PROMPT,
          },
        ],
      }),
      signal: controller.signal,
    }
  );

  if (!response.ok) {
    const errorData = await response.json();
    console.error('Claude API Error:', {
      status: response.status,
      statusText: response.statusText,
      error: errorData,
    });
    throw new Error(`Claude API request failed: ${response.status} - ${JSON.stringify(errorData)}`);
  }

  const data = await response.json();
  const generatedText = data.content?.[0]?.text;

  if (!generatedText) {
    throw new Error('No content generated from Claude');
  }

  return generatedText;
}

export async function POST(request: Request) {
  // Get provider from request body, fallback to env variable, then default to groq
  let provider = 'groq';
  try {
    const body = await request.json();
    if (body.provider && (body.provider === 'groq' || body.provider === 'gemini' || body.provider === 'claude')) {
      provider = body.provider;
    }
  } catch {
    // If parsing fails, use env variable or default
    provider = process.env.AI_PROVIDER || 'groq';
  }

  const geminiKey = process.env.GEMINI_API_KEY;
  const groqKey = process.env.GROQ_API_KEY;
  const claudeKey = process.env.CLAUDE_API_KEY;

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

  if (provider === 'claude' && !claudeKey) {
    return NextResponse.json(
      { error: 'Claude API key not configured' },
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
    } else if (provider === 'claude') {
      console.log('Using Claude API...');
      generatedText = await generateWithClaude(claudeKey!, controller);
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
