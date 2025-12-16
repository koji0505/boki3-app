import { NextResponse } from 'next/server';

export async function GET() {
  const apiKey = process.env.GEMINI_API_KEY;

  if (!apiKey) {
    return NextResponse.json({ error: 'API key not configured' }, { status: 500 });
  }

  const results: any = {
    apiKey: apiKey.substring(0, 10) + '...', // 最初の10文字のみ表示
    tests: {},
  };

  // Test 1: List available models
  try {
    const listResponse = await fetch(
      `https://generativelanguage.googleapis.com/v1/models?key=${apiKey}`
    );

    if (listResponse.ok) {
      const data = await listResponse.json();
      results.tests.listModels = {
        success: true,
        models: data.models?.map((m: any) => ({
          name: m.name,
          displayName: m.displayName,
          supportedMethods: m.supportedGenerationMethods,
        })),
      };
    } else {
      const errorData = await listResponse.json();
      results.tests.listModels = {
        success: false,
        status: listResponse.status,
        error: errorData,
      };
    }
  } catch (error: any) {
    results.tests.listModels = {
      success: false,
      error: error.message,
    };
  }

  // Test 2: Simple generation test with gemini-pro
  try {
    const testResponse = await fetch(
      `https://generativelanguage.googleapis.com/v1/models/gemini-pro:generateContent?key=${apiKey}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{
            parts: [{ text: 'こんにちは' }],
          }],
        }),
      }
    );

    if (testResponse.ok) {
      const data = await testResponse.json();
      results.tests.geminiPro = {
        success: true,
        response: data.candidates?.[0]?.content?.parts?.[0]?.text?.substring(0, 100),
      };
    } else {
      const errorData = await testResponse.json();
      results.tests.geminiPro = {
        success: false,
        status: testResponse.status,
        error: errorData,
      };
    }
  } catch (error: any) {
    results.tests.geminiPro = {
      success: false,
      error: error.message,
    };
  }

  // Test 3: Simple test with gemini-1.5-flash
  try {
    const testResponse = await fetch(
      `https://generativelanguage.googleapis.com/v1/models/gemini-1.5-flash:generateContent?key=${apiKey}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{
            parts: [{ text: 'こんにちは' }],
          }],
        }),
      }
    );

    if (testResponse.ok) {
      const data = await testResponse.json();
      results.tests.gemini15Flash = {
        success: true,
        response: data.candidates?.[0]?.content?.parts?.[0]?.text?.substring(0, 100),
      };
    } else {
      const errorData = await testResponse.json();
      results.tests.gemini15Flash = {
        success: false,
        status: testResponse.status,
        error: errorData,
      };
    }
  } catch (error: any) {
    results.tests.gemini15Flash = {
      success: false,
      error: error.message,
    };
  }

  return NextResponse.json(results, { status: 200 });
}
