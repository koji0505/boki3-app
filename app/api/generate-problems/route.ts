import { NextResponse } from 'next/server';
import { BOOKKEEPING_PROMPT } from '@/prompts/bookkeeping-prompt';

// プロンプトは prompts/bookkeeping-prompt.ts で編集できます
const PROMPT = BOOKKEEPING_PROMPT;

async function generateWithGemini(apiKey: string, controller: AbortController, errorContext?: string) {
  const promptWithContext = errorContext ? `${PROMPT}\n\n${errorContext}` : PROMPT;
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
                text: promptWithContext,
              },
            ],
          },
        ],
        generationConfig: {
          temperature: 0.7,
          maxOutputTokens: 12000,
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

async function generateWithGroq(apiKey: string, controller: AbortController, errorContext?: string) {
  const promptWithContext = errorContext ? `${PROMPT}\n\n${errorContext}` : PROMPT;
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
            content: promptWithContext,
          },
        ],
        temperature: 0.7,
        max_tokens: 12000,
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

async function generateWithClaude(apiKey: string, controller: AbortController, errorContext?: string) {
  const promptWithContext = errorContext ? `${PROMPT}\n\n${errorContext}` : PROMPT;
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
        max_tokens: 8192,
        messages: [
          {
            role: 'user',
            content: promptWithContext,
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
  // Get provider and maxRetries from request body
  let provider = 'groq';
  let maxRetries = 3;
  try {
    const body = await request.json();
    if (body.provider && (body.provider === 'groq' || body.provider === 'gemini' || body.provider === 'claude')) {
      provider = body.provider;
    }
    if (body.maxRetries && typeof body.maxRetries === 'number' && body.maxRetries >= 1 && body.maxRetries <= 10) {
      maxRetries = body.maxRetries;
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

  // Retry logic: configurable attempts
  let lastError: any = null;
  let lastValidationErrors: string[] = [];

  console.log(`問題生成開始 (最大${maxRetries}回試行)`);

  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    if (attempt > 1) {
      console.log(`リトライ ${attempt}/${maxRetries}...`);
    }

    try {
    // Create AbortController for timeout
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 60000); // 60 second timeout

    // Build error context from previous attempt
    let errorContext = '';
    if (attempt > 1 && lastValidationErrors.length > 0) {
      errorContext = `
【超重要警告】前回の生成で以下のエラーが発生しました。これらのミスを絶対に繰り返さないでください：

${lastValidationErrors.map(err => `- ${err}`).join('\n')}

特に注意：
1. 借方金額と貸方金額は必ず完全に一致させること
2. 計算ミスをしないこと
3. 全ての必須フィールドを必ず含めること
4. 金額の整合性を2回確認すること
`;
      console.log('前回のエラーをAIに通知:', lastValidationErrors);
    }

    let generatedText: string;

    // Generate based on selected provider
    if (provider === 'groq') {
      console.log('Using Groq API...');
      generatedText = await generateWithGroq(groqKey!, controller, errorContext);
    } else if (provider === 'claude') {
      console.log('Using Claude API...');
      generatedText = await generateWithClaude(claudeKey!, controller, errorContext);
    } else {
      console.log('Using Gemini API...');
      generatedText = await generateWithGemini(geminiKey!, controller, errorContext);
    }

    clearTimeout(timeoutId);

    // Log the raw generated text length for debugging
    console.log(`生成されたテキストの長さ: ${generatedText.length}文字`);

    // Extract JSON from markdown code blocks if present
    let jsonText = generatedText;
    const jsonMatch = generatedText.match(/```json\s*([\s\S]*?)\s*```/);
    if (jsonMatch) {
      console.log('JSONコードブロックを検出しました');
      jsonText = jsonMatch[1];
    } else {
      // Try to find JSON array in the text
      const arrayMatch = generatedText.match(/\[\s*\{[\s\S]*\}\s*\]/);
      if (arrayMatch) {
        console.log('JSON配列を検出しました');
        jsonText = arrayMatch[0];
      } else {
        console.log('JSONの抽出方法: そのまま使用');
      }
    }

    const problems = JSON.parse(jsonText.trim());

    // Log the first problem for debugging
    console.log('生成された最初の問題のサンプル:', JSON.stringify(problems[0], null, 2));

    // Validate the structure
    if (!Array.isArray(problems) || problems.length !== 15) {
      console.error('問題の数が不正です。生成された問題数:', problems.length);
      throw new Error('Invalid problems format');
    }

    // Validate each problem individually and track which are valid
    const validationErrors: string[] = [];
    const validProblems: any[] = [];
    const invalidIndexes: number[] = [];

    problems.forEach((problem, index) => {
      let isValid = true;
      const problemErrors: string[] = [];

      // Check required fields
      if (!problem.id || !problem.question || !problem.accountOptions || !problem.correctAnswer || !problem.explanation) {
        problemErrors.push(`問題${index + 1}: 必須フィールドが不足しています`);
        isValid = false;
      }

      // Check account options
      if (!Array.isArray(problem.accountOptions) || problem.accountOptions.length !== 4) {
        problemErrors.push(`問題${index + 1}: 勘定科目は4つ必要です`);
        isValid = false;
      }

      // Check amounts are reasonable (between 100 and 100,000,000)
      const { debitAmount, creditAmount } = problem.correctAnswer;
      if (typeof debitAmount !== 'number' || debitAmount < 100 || debitAmount > 100000000) {
        problemErrors.push(`問題${index + 1}: 借方金額 ${debitAmount} が不適切です`);
        isValid = false;
      }
      if (typeof creditAmount !== 'number' || creditAmount < 100 || creditAmount > 100000000) {
        problemErrors.push(`問題${index + 1}: 貸方金額 ${creditAmount} が不適切です`);
        isValid = false;
      }

      // Check that debit and credit amounts match (basic double-entry bookkeeping)
      if (debitAmount !== creditAmount) {
        problemErrors.push(`問題${index + 1}: 借方金額 (${debitAmount.toLocaleString()}円) と貸方金額 (${creditAmount.toLocaleString()}円) が一致していません`);
        isValid = false;
      }

      if (isValid) {
        validProblems.push(problem);
      } else {
        invalidIndexes.push(index + 1);
        validationErrors.push(...problemErrors);
      }
    });

    // If there are any errors, save them and retry
    if (validationErrors.length > 0) {
      console.error(`検証エラー (試行 ${attempt}/${maxRetries}):`, validationErrors);
      console.log(`有効な問題数: ${validProblems.length}/15`);
      lastValidationErrors = validationErrors;
      lastError = new Error(`Validation failed with ${validationErrors.length} errors`);

      // If this is not the last attempt, continue to retry
      if (attempt < maxRetries) {
        continue;
      }

      // Last attempt: if we have at least some valid problems, return them as partial success
      if (validProblems.length > 0) {
        console.log(`✓ 部分的成功: ${validProblems.length}問を取得 (15問中)`);
        return NextResponse.json({
          problems: validProblems,
          partial: true,
          totalRequested: 15,
          totalObtained: validProblems.length,
          invalidProblems: invalidIndexes,
          message: `${validProblems.length}問取得しました（15問中）`,
        });
      }

      // No valid problems at all, return error
      return NextResponse.json(
        {
          error: 'generated_validation_failed',
          message: `AIが生成した問題に不備がありました（${validationErrors.length}件のエラー、${maxRetries}回試行）。もう一度試すか、別のAIプロバイダーを選択してください。`,
          details: validationErrors,
          provider: provider,
          attempts: maxRetries
        },
        { status: 422 }
      );
    }

    // Success! Return the problems
    if (attempt > 1) {
      console.log(`✓ 成功 (${attempt}回目の試行で成功)`);
    }
    return NextResponse.json({ problems });

    } catch (error) {
      console.error(`エラー (試行 ${attempt}/${maxRetries}):`, error);
      lastError = error;

      // Handle timeout errors
      if (error instanceof Error && error.name === 'AbortError') {
        if (attempt < maxRetries) {
          continue;
        }
        return NextResponse.json(
          { error: 'Request timeout - please try again' },
          { status: 408 }
        );
      }

      // For other errors, if not last attempt, retry
      if (attempt < maxRetries) {
        continue;
      }

      // Last attempt failed
      return NextResponse.json(
        { error: 'Failed to generate problems', details: lastError?.message },
        { status: 500 }
      );
    }
  }

  // This should never be reached, but just in case
  return NextResponse.json(
    { error: 'Failed after all retries', details: lastError?.message },
    { status: 500 }
  );
}
