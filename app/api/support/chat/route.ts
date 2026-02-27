import { NextRequest, NextResponse } from 'next/server'
import { checkRateLimit, getClientIP } from '@/lib/rate-limit'

const GEMINI_API_KEY = process.env.GEMINI_API_KEY
// Free tier için gemini-1.5-flash kullanıyoruz (daha hızlı ve ücretsiz)
const GEMINI_API_URL = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-3-flash-preview:generateContent'

/**
 * System prompt for the AI support assistant
 */
const SYSTEM_PROMPT = `Sen Disedo uygulamasının müşteri destek asistanısın. 
Türkçe konuşuyorsun ve kullanıcılara yardımcı oluyorsun.
Kısa, net ve yardımcı yanıtlar ver. 
Eğer bir sorunun çözümünü bilmiyorsan, kullanıcıyı destek ekibine yönlendir.
Kibar ve profesyonel bir dil kullan.`

export async function POST(request: NextRequest) {
  try {
    // Check if API key is configured
    if (!GEMINI_API_KEY) {
      console.error('GEMINI_API_KEY is not configured')
      return NextResponse.json(
        { error: 'API yapılandırması eksik. Lütfen daha sonra tekrar deneyin.' },
        { status: 500 }
      )
    }

    // Get client IP for rate limiting
    const clientIP = getClientIP(request)

    // Check rate limit
    const rateLimitResult = checkRateLimit(clientIP)
    if (!rateLimitResult.allowed) {
      return NextResponse.json(
        {
          error: rateLimitResult.error || 'Çok fazla istek gönderdiniz. Lütfen daha sonra tekrar deneyin.',
          resetAt: rateLimitResult.resetAt,
        },
        {
          status: 429,
          headers: {
            'X-RateLimit-Remaining': '0',
            'X-RateLimit-Reset': rateLimitResult.resetAt.toString(),
            'Retry-After': Math.ceil((rateLimitResult.resetAt - Date.now()) / 1000).toString(),
          },
        }
      )
    }

    // Parse request body
    let body
    try {
      body = await request.json()
    } catch (error) {
      return NextResponse.json(
        { error: 'Geçersiz istek formatı.' },
        { status: 400 }
      )
    }

    const { message, conversationHistory = [] } = body

    // Validate message
    if (!message || typeof message !== 'string') {
      return NextResponse.json(
        { error: 'Mesaj gereklidir.' },
        { status: 400 }
      )
    }

    // Validate message length (max 2000 characters)
    if (message.length > 2000) {
      return NextResponse.json(
        { error: 'Mesaj çok uzun. Maksimum 2000 karakter olmalıdır.' },
        { status: 400 }
      )
    }

    // Build conversation context
    const conversationContext = conversationHistory
      .slice(-10) // Only keep last 10 messages for context
      .map((msg: { role: string; content: string }) => ({
        role: msg.role === 'user' ? 'user' : 'model',
        parts: [{ text: msg.content }],
      }))

    // Add current message
    conversationContext.push({
      role: 'user',
      parts: [{ text: message }],
    })

    // Prepare Gemini API request
    const geminiRequest = {
      contents: [
        {
          role: 'user',
          parts: [
            {
              text: `${SYSTEM_PROMPT}\n\nKullanıcı: ${message}`,
            },
          ],
        },
      ],
      generationConfig: {
        temperature: 0.7,
        topK: 40,
        topP: 0.95,
        maxOutputTokens: 1024,
      },
    }

    // Call Gemini API
    const geminiResponse = await fetch(
      `${GEMINI_API_URL}?key=${GEMINI_API_KEY}`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(geminiRequest),
      }
    )

    if (!geminiResponse.ok) {
      const errorData = await geminiResponse.text()
      console.error('Gemini API error:', errorData)
      
      // Handle specific error cases
      if (geminiResponse.status === 429) {
        return NextResponse.json(
          { error: 'AI servisi şu anda yoğun. Lütfen birkaç saniye sonra tekrar deneyin.' },
          { status: 503 }
        )
      }

      if (geminiResponse.status === 401) {
        return NextResponse.json(
          { error: 'API yapılandırması hatalı.' },
          { status: 500 }
        )
      }

      return NextResponse.json(
        { error: 'AI yanıtı alınamadı. Lütfen daha sonra tekrar deneyin.' },
        { status: 500 }
      )
    }

    const geminiData = await geminiResponse.json()

    // Extract response text
    const responseText =
      geminiData.candidates?.[0]?.content?.parts?.[0]?.text ||
      'Üzgünüm, şu anda yanıt veremiyorum. Lütfen daha sonra tekrar deneyin.'

    // Return success response
    return NextResponse.json(
      {
        message: responseText,
        remaining: rateLimitResult.remaining,
        resetAt: rateLimitResult.resetAt,
      },
      {
        status: 200,
        headers: {
          'X-RateLimit-Remaining': rateLimitResult.remaining.toString(),
          'X-RateLimit-Reset': rateLimitResult.resetAt.toString(),
        },
      }
    )
  } catch (error) {
    console.error('Support chat API error:', error)
    return NextResponse.json(
      { error: 'Bir hata oluştu. Lütfen daha sonra tekrar deneyin.' },
      { status: 500 }
    )
  }
}

// Handle unsupported methods
export async function GET() {
  return NextResponse.json(
    { error: 'Method not allowed' },
    { status: 405 }
  )
}
