import { NextRequest } from "next/server";
import OpenAI from "openai";

export const runtime = "nodejs";
export const maxDuration = 60; // allow up to 60s for model response

export async function POST(req: NextRequest): Promise<Response> {
  try {
    const { contractText, question } = (await req.json()) as {
      contractText?: string;
      question?: string;
    };

    const text = (contractText ?? "").slice(0, 20000);
    const q = (question ?? "").trim();

    if (q.length === 0) {
      return Response.json({ answer: "" }, { status: 200 });
    }

    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) {
      return Response.json({ answer: "(mock) No API key set. This is a placeholder answer." }, { status: 200 });
    }

    const client = new OpenAI({ apiKey });
    const systemPrompt = [
      "You are an AI assistant specialized in contract analysis.",
      "Detect the language of the contract text and answer in that same language.",
      "Answer the user's question based ONLY on the contract text below.",
      "Use clear, simple, human language.",
    ].join("\n");

    const completion = await client.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: `Contract:\n${text}\n\nQuestion: ${q}` },
      ],
      temperature: 0.2,
    });

    const answer = completion.choices?.[0]?.message?.content ?? "";
    return Response.json({ answer }, { status: 200 });
  } catch (_error) {
    return Response.json({ error: "Failed to answer" }, { status: 500 });
  }
}


