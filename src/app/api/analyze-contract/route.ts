import { NextRequest } from "next/server";
import { cookies } from "next/headers";
import OpenAI from "openai";
import { extractTextFromFile } from "@/lib/extract";

export const runtime = "nodejs";
export const maxDuration = 60; // allow up to 60s for file parsing + model

function buildMockResponse(text: string) {
  const preview = text.trim().slice(0, 200);
  return {
    summary: [
      "This is a mock summary because OPENAI_API_KEY is not set.",
      preview.length > 0 ? `Preview: ${preview}...` : "No text extracted.",
      "Replace with real OpenAI output once configured.",
    ],
    risks: [
      "Mock risk: This is not legal advice.",
      "Mock risk: Configure OPENAI_API_KEY to get real analysis.",
    ],
    detailed: "Detailed explanation is mocked. Configure OPENAI_API_KEY to enable real responses.",
    text,
  } as const;
}

export async function POST(req: NextRequest): Promise<Response> {
  try {
    // Per-visitor daily limit using an httpOnly cookie
    const cookieStore = await cookies();
    const lastStr = cookieStore.get("demo_last_analysis_ts")?.value ?? "";
    const DAY_MS = 24 * 60 * 60 * 1000;
    const nowMs = Date.now();
    const lastMs = Number.isFinite(Number(lastStr)) ? Number(lastStr) : 0;
    if (lastMs > 0 && nowMs - lastMs < DAY_MS) {
      const retryMs = lastMs + DAY_MS - nowMs;
      const retrySeconds = Math.max(1, Math.ceil(retryMs / 1000));
      const hours = Math.floor(retrySeconds / 3600);
      const minutes = Math.floor((retrySeconds % 3600) / 60);
      const human = `${hours}h ${minutes}m`;
      return new Response(
        JSON.stringify({ error: "daily_limit", retryAfterSeconds: retrySeconds, retryAfterHuman: human }),
        {
          status: 429,
          headers: {
            "Content-Type": "application/json",
            "Retry-After": String(retrySeconds),
          },
        }
      );
    }
    let text = "";
    const contentType = req.headers.get("content-type") ?? "";
    if (contentType.includes("application/json")) {
      const body = (await req.json()) as { textOverride?: string };
      text = (body.textOverride ?? "").toString();
    } else {
      const formData = await req.formData();
      const file = formData.get("file");
      if (!(file instanceof File)) {
        return Response.json({ error: "Missing file" }, { status: 400 });
      }
      const fileName = (file as any).name?.toString()?.toLowerCase?.() ?? "";
      const fileType = file.type || "";
      if (fileType === "application/msword" || fileName.endsWith(".doc")) {
        return Response.json(
          {
            summary: [],
            risks: [],
            detailed: "Legacy .doc format is not supported. Please upload a DOCX or PDF.",
            text: "",
          },
          { status: 200 }
        );
      }
      const extracted = await extractTextFromFile(file);
      text = extracted.text;
    }
    if (!text || text.trim().length === 0) {
      // No extractable text (likely a scanned PDF). Return helpful message instead of calling the model.
      return Response.json(
        {
          summary: [],
          risks: [],
          detailed:
            "No extractable text was found in the uploaded file. If this is a scanned PDF/image, enable OCR or upload a text-based PDF/DOCX.",
          text: "",
        },
        { status: 200 }
      );
    }

    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) {
      // Mark usage for the day even in mock mode to preserve demo fairness
      cookieStore.set("demo_last_analysis_ts", String(nowMs), {
        httpOnly: true,
        sameSite: "lax",
        secure: true,
        path: "/",
        maxAge: 60 * 60 * 24,
      });
      return Response.json(buildMockResponse(text), { status: 200 });
    }

    const client = new OpenAI({ apiKey });
    const systemPrompt = [
      "You are a legal explainer AI.",
      "Detect the language of the provided contract text and respond in that same language (e.g., Lithuanian if the text is Lithuanian).",
      "Explain the text in simple terms and respond ONLY as compact JSON with keys 'summary' (array of short bullet strings capturing key points; length should fit the document), 'risks' (array of strings), and 'detailed' (markdown string).",
      "Do not include any extra commentary, code fences, or keys.",
    ].join("\n");

    const userContent = text.slice(0, 20000);

    const completion = await client.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userContent },
      ],
      temperature: 0.2,
      response_format: { type: "json_object" },
    });

    const content = completion.choices?.[0]?.message?.content ?? "";

    // Successful model call – set the daily lock cookie
    cookieStore.set("demo_last_analysis_ts", String(nowMs), {
      httpOnly: true,
      sameSite: "lax",
      secure: true,
      path: "/",
      maxAge: 60 * 60 * 24,
    });

    function tryParseJson(jsonLike: string): { summary?: string[]; risks?: string[]; detailed?: string } | null {
      const trimmed = jsonLike.trim();
      const fenced = /```json([\s\S]*?)```/i.exec(trimmed);
      const raw = fenced ? fenced[1] : trimmed;
      try {
        return JSON.parse(raw) as { summary?: string[]; risks?: string[]; detailed?: string };
      } catch {
        return null;
      }
    }

    const parsed = tryParseJson(content);
    if (parsed && Array.isArray(parsed.summary) && Array.isArray(parsed.risks) && typeof parsed.detailed === "string") {
      return Response.json({ summary: parsed.summary, risks: parsed.risks, detailed: parsed.detailed, text }, { status: 200 });
    }

    // Fallback: put everything in detailed if JSON parse failed
    return Response.json({ summary: [], risks: [], detailed: content, text }, { status: 200 });
  } catch (_error) {
    return Response.json({ error: "Failed to analyze" }, { status: 500 });
  }
}


