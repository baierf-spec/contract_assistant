"use client";

import React, { useCallback, useMemo, useRef, useState } from "react";
import { ShieldCheck, FileText, Bot, Upload, MessageSquare } from "lucide-react";

type AnalysisResult = {
  summary: string[];
  risks: string[];
  detailed: string;
};

type ChatMessage = {
  role: "user" | "ai";
  content: string;
};

export default function Home(): React.ReactElement {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState<boolean>(false);
  const [analysisResult, setAnalysisResult] = useState<AnalysisResult | null>(null);
  const [contractText, setContractText] = useState<string>("");
  const [question, setQuestion] = useState<string>("");
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [uploadError, setUploadError] = useState<string>("");
  const [limitMessage, setLimitMessage] = useState<string>("");
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const isSupportedFile = useCallback((file: File): boolean => {
    const name = (file as any)?.name?.toString()?.toLowerCase?.() ?? "";
    const type = file.type || "";
    const isPdf = type.includes("pdf") || name.endsWith(".pdf");
    const isDocx = type.includes("officedocument.wordprocessingml.document") || name.endsWith(".docx");
    return isPdf || isDocx;
  }, []);

  const handleFileSelect = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
    const fileList = event.target.files;
    if (fileList && fileList.length > 0) {
      const file = fileList[0];
      if (!isSupportedFile(file)) {
        setUploadError("Unsupported file type. Please upload PDF or DOCX.");
        setSelectedFile(null);
      } else {
        setUploadError("");
        setSelectedFile(file);
      }
    }
  }, []);

  const handleDrop = useCallback((event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    const fileList = event.dataTransfer.files;
    if (fileList && fileList.length > 0) {
      const file = fileList[0];
      if (!isSupportedFile(file)) {
        setUploadError("Unsupported file type. Please upload PDF or DOCX.");
        setSelectedFile(null);
      } else {
        setUploadError("");
        setSelectedFile(file);
      }
    }
  }, []);

  const handleDragOver = useCallback((event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
  }, []);

  const isAnalyzeDisabled = useMemo(() => isAnalyzing || !selectedFile, [isAnalyzing, selectedFile]);

  const analyzeContract = useCallback(async (): Promise<void> => {
    if (!selectedFile) {
      return;
    }
    setIsAnalyzing(true);
    try {
      const form = new FormData();
      form.append("file", selectedFile);
      const response = await fetch("/api/analyze-contract", {
        method: "POST",
        body: form,
      });
      if (!response.ok) {
        if (response.status === 429) {
          const data = (await response.json()) as { error?: string; retryAfterSeconds?: number; retryAfterHuman?: string };
          const msg = data?.retryAfterHuman
            ? `Daily demo limit reached. Try again in ${data.retryAfterHuman}.`
            : "Daily demo limit reached. Please try again tomorrow.";
          setLimitMessage(msg);
          return;
        }
        throw new Error("Analysis failed");
      }
      const data = (await response.json()) as AnalysisResult & { text?: string };
      const extractedText = typeof data.text === "string" ? data.text : "";
      if (extractedText.trim().length > 0) {
        setAnalysisResult({
          summary: data.summary ?? [],
          risks: data.risks ?? [],
          detailed: data.detailed ?? "",
        });
        setContractText(extractedText);
      } else {
        // Fallback to OCR only if the file is a PDF (OCR pipeline is PDF-based)
        const name = (selectedFile as any)?.name?.toString()?.toLowerCase?.() ?? "";
        const type = selectedFile.type || "";
        const isPdf = type.includes("pdf") || name.endsWith(".pdf");
        if (isPdf) {
          setIsAnalyzing(false);
          await tryOcrAndAnalyze();
          return;
        }
        setAnalysisResult({
          summary: [],
          risks: [],
          detailed: "No extractable text was found. If this is a legacy document, please convert it to DOCX/PDF or ensure it contains text rather than embedded images.",
        });
      }
    } catch (error) {
      console.error(error);
      setAnalysisResult({ summary: [], risks: [], detailed: "" });
    } finally {
      setIsAnalyzing(false);
    }
  }, [selectedFile]);

  const tryOcrAndAnalyze = useCallback(async (): Promise<void> => {
    if (!selectedFile) return;
    setIsAnalyzing(true);
    try {
      const pdfjs = await import("pdfjs-dist/build/pdf.mjs");
      // Configure worker for pdf.js in the browser (use unpkg which serves ESM worker reliably)
      // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
      (pdfjs as any).GlobalWorkerOptions.workerSrc = `https://unpkg.com/pdfjs-dist@${
        // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
        (pdfjs as any).version
      }/build/pdf.worker.min.mjs`;
      const Tesseract = (await import("tesseract.js")).default;

      const arrayBuffer = await selectedFile.arrayBuffer();
      // eslint-disable-next-line @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-member-access
      const pdf = await (pdfjs as any).getDocument({ data: arrayBuffer }).promise;
      let combinedText = "";
      for (let i = 1; i <= Math.min(pdf.numPages, 3); i++) {
        const page = await pdf.getPage(i);
        const viewport = page.getViewport({ scale: 1.5 });
        const canvas = document.createElement("canvas");
        const context = canvas.getContext("2d");
        if (!context) continue;
        canvas.width = viewport.width;
        canvas.height = viewport.height;
        // @ts-expect-error pdf.js types vs DOM canvas
        await page.render({ canvasContext: context, viewport }).promise;
        const dataUrl = canvas.toDataURL("image/png");
        const { data } = await Tesseract.recognize(dataUrl, "eng+lit");
        combinedText += (data?.text ?? "") + "\n";
      }

      const response = await fetch("/api/analyze-contract", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ textOverride: combinedText }),
      });
      if (!response.ok) throw new Error("Analysis failed");
      const data = (await response.json()) as AnalysisResult & { text?: string };
      setAnalysisResult({
        summary: data.summary ?? [],
        risks: data.risks ?? [],
        detailed: data.detailed ?? "",
      });
      setContractText(combinedText);
    } catch (error) {
      console.error(error);
      setAnalysisResult({ summary: [], risks: [], detailed: "OCR failed. Try a clearer scan or a text PDF." });
    } finally {
      setIsAnalyzing(false);
    }
  }, [selectedFile]);

  const askQuestion = useCallback(async (): Promise<void> => {
    const trimmed = question.trim();
    if (trimmed.length === 0) {
      return;
    }
    const newMessages: ChatMessage[] = [...chatMessages, { role: "user", content: trimmed }];
    setChatMessages(newMessages);
    setQuestion("");
    try {
      const response = await fetch("/api/ask-contract", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ contractText, question: trimmed }),
      });
      if (!response.ok) {
        throw new Error("Ask failed");
      }
      const data = (await response.json()) as { answer?: string };
      const aiReply = (data.answer ?? "").trim();
      setChatMessages((prev) => [...prev, { role: "ai", content: aiReply }]);
    } catch (error) {
      console.error(error);
      setChatMessages((prev) => [...prev, { role: "ai", content: "Sorry, I couldn't answer right now." }]);
    }
  }, [contractText, question, chatMessages]);

  return (
    <div className="min-h-screen bg-background text-foreground font-sans">
      <main className="mx-auto px-4 py-10 space-y-12 max-w-6xl">
        <header className="relative overflow-hidden rounded-2xl border border-black/10 dark:border-white/15 bg-gradient-to-br from-white to-slate-50 dark:from-black dark:to-neutral-900 p-10 h-entry">
          <div className="max-w-3xl space-y-3">
            <h1 className="text-4xl md:text-5xl font-extrabold tracking-tight text-[color:var(--color-primary)] p-name">AI Contract Assistant – Understand Any Legal Document in Seconds</h1>
            <p className="text-base md:text-lg text-foreground/80 e-content">Upload your contract, get a clear summary, highlight risks, and ask questions in a friendly chat. Works with multilingual documents.</p>
            <div className="flex gap-3 pt-2">
              <a href="#analyze" className="inline-flex items-center gap-2 h-11 px-5 rounded-md text-white text-sm font-semibold" style={{background:"var(--color-primary)"}}><Upload size={18}/>Try Demo</a>
              <a href="#qa" className="inline-flex items-center gap-2 h-11 px-5 rounded-md text-sm font-semibold" style={{border:"1px solid rgba(0,0,0,0.1)", background:"var(--color-accent)", color:"#0a0a0a"}}><MessageSquare size={18}/>Ask About a Contract</a>
            </div>
          </div>
        </header>

        <section className="grid grid-cols-1 md:grid-cols-3 gap-4" aria-label="How it works">
          <div className="rounded-xl border border-black/10 dark:border-white/15 p-5 bg-white dark:bg-black/20">
            <div className="flex items-center gap-2 font-semibold"><FileText size={18}/> Upload your contract</div>
            <p className="text-sm text-foreground/70 mt-2">Drag & drop a PDF or DOCX and we’ll read it for you.</p>
          </div>
          <div className="rounded-xl border border-black/10 dark:border-white/15 p-5 bg-white dark:bg-black/20">
            <div className="flex items-center gap-2 font-semibold"><Bot size={18}/> Ask your questions</div>
            <p className="text-sm text-foreground/70 mt-2">Use plain language. We’ll answer based only on your document.</p>
          </div>
          <div className="rounded-xl border border-black/10 dark:border-white/15 p-5 bg-white dark:bg-black/20">
            <div className="flex items-center gap-2 font-semibold"><ShieldCheck size={18}/> Get clear explanations</div>
            <p className="text-sm text-foreground/70 mt-2">See a concise summary, risks, and a detailed breakdown sized to your document.</p>
          </div>
        </section>

        <section
          id="analyze"
          onDrop={handleDrop}
          onDragOver={handleDragOver}
          className="rounded-2xl border shadow-sm p-6"
          style={{ borderColor: "var(--color-primary)", background: "linear-gradient(180deg, rgba(11,59,122,0.05), transparent)" }}
        >
          <div className="flex flex-col items-center gap-4 text-center">
            <h2 className="font-semibold flex items-center gap-2 text-[color:var(--color-primary)]"><Upload size={18}/> Upload & Analyze a contract</h2>
            <div className="w-full">
              <div
                className="rounded-lg p-6 flex flex-col items-center justify-center gap-3 bg-background/40 border border-dashed"
                style={{ borderColor: "rgba(11,59,122,0.35)" }}
              >
                <p className="text-sm">Drag & drop your file here, or</p>
                <div className="flex items-center gap-3">
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="inline-flex items-center justify-center h-10 px-4 rounded-md text-white text-sm font-medium hover:opacity-90"
                    style={{ background: "var(--color-primary)" }}
                  >
                    Choose file
                  </button>
                  {selectedFile ? (
                    <span className="text-xs text-foreground/80">Selected: {selectedFile.name}</span>
                  ) : (
                    <span className="text-xs" style={{ color: "var(--color-accent)" }}>PDF or DOCX up to ~10MB</span>
                  )}
                </div>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".pdf,.docx"
                  className="hidden"
                  onChange={handleFileSelect}
                />
                {uploadError && (
                  <p className="text-xs mt-2" style={{ color: "#dc2626" }}>{uploadError}</p>
                )}
              </div>
            </div>
            {limitMessage && (
              <p className="text-xs" style={{ color: "#dc2626" }}>{limitMessage}</p>
            )}
            <button
              type="button"
              onClick={analyzeContract}
              disabled={isAnalyzeDisabled}
              className="inline-flex items-center justify-center h-11 px-6 rounded-md text-white text-sm font-semibold disabled:opacity-50"
              style={{ background: "var(--color-primary)" }}
            >
              {isAnalyzing ? "Analyzing..." : "Upload & Analyze"}
            </button>
          </div>
        </section>

        {analysisResult && (
          <section className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="rounded-lg border border-black/10 dark:border-white/15 p-4 bg-white dark:bg-black/20">
              <h2 className="font-semibold mb-2">Summary</h2>
              {analysisResult.summary.length > 0 ? (
                <ul className="list-disc pl-4 space-y-1 text-sm">
                  {analysisResult.summary.map((item, index) => (
                    <li key={`summary-${index}`}>{item}</li>
                  ))}
                </ul>
              ) : (
                <p className="text-sm text-foreground/60">No summary yet.</p>
              )}
            </div>

            <div className="rounded-lg border border-black/10 dark:border-white/15 p-4 bg-white dark:bg-black/20">
              <h2 className="font-semibold mb-2">Potential Risks</h2>
              {analysisResult.risks.length > 0 ? (
                <ul className="list-disc pl-4 space-y-1 text-sm text-red-600 dark:text-red-400">
                  {analysisResult.risks.map((risk, index) => (
                    <li key={`risk-${index}`}>{risk}</li>
                  ))}
                </ul>
              ) : (
                <p className="text-sm text-foreground/60">No risks identified.</p>
              )}
            </div>

            <div className="rounded-lg border border-black/10 dark:border-white/15 p-4 bg-white dark:bg-black/20">
              <h2 className="font-semibold mb-2">Detailed Explanation</h2>
              {analysisResult.detailed ? (
                <details className="text-sm">
                  <summary className="cursor-pointer select-none mb-2">Show details</summary>
                  <div className="whitespace-pre-wrap text-sm/6">{analysisResult.detailed}</div>
                </details>
              ) : (
                <p className="text-sm text-foreground/60">No details yet.</p>
              )}
            </div>
          </section>
        )}

        {analysisResult && (
          <section
            id="qa"
            className="space-y-4 rounded-2xl border shadow-sm p-6"
            style={{ borderColor: "var(--color-primary)", background: "linear-gradient(180deg, rgba(11,59,122,0.05), transparent)" }}
          >
            <h2 className="font-semibold flex items-center gap-2 text-[color:var(--color-primary)]">
              <MessageSquare size={18} /> Ask about this contract
            </h2>
            <div className="flex items-center gap-2">
              <input
                type="text"
                value={question}
                onChange={(e) => setQuestion(e.target.value)}
                placeholder="Type your question..."
                className="flex-1 h-11 rounded-md border px-3 text-sm bg-white dark:bg-black/20 focus:outline-none"
                style={{ borderColor: "rgba(0,0,0,0.1)", boxShadow: "0 0 0 3px transparent" }}
              />
              <button
                type="button"
                onClick={askQuestion}
                className="inline-flex items-center justify-center h-11 px-5 rounded-md text-sm font-semibold text-white"
                style={{ background: "var(--color-primary)" }}
              >
                Ask
              </button>
            </div>

            <div className="space-y-2">
              {chatMessages.map((message, index) => (
                <div
                  key={`msg-${index}`}
                  className={message.role === "user" ? "flex justify-end" : "flex justify-start"}
                >
                  <div
                    className={
                      message.role === "user"
                        ? "max-w-[80%] rounded-lg px-3 py-2 text-sm text-white"
                        : "max-w-[80%] rounded-lg border border-black/10 dark:border-white/15 bg-white dark:bg-black/20 px-3 py-2 text-sm"
                    }
                    style={message.role === "user" ? { background: "var(--color-primary)" } : undefined}
                  >
                    {message.content || <span className="opacity-60">(no answer yet)</span>}
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}

        <section className="grid grid-cols-1 md:grid-cols-2 gap-4" aria-label="Features">
          <div className="rounded-xl border border-black/10 dark:border-white/15 p-5 bg-white dark:bg-black/20">
            <h3 className="font-semibold mb-2">AI-powered explanations</h3>
            <p className="text-sm text-foreground/70">Clause-by-clause analysis with summaries and risks, in the same language as your document.</p>
          </div>
          <div className="rounded-xl border border-black/10 dark:border-white/15 p-5 bg-white dark:bg-black/20">
            <h3 className="font-semibold mb-2">Senior-friendly mode</h3>
            <p className="text-sm text-foreground/70">Simple words and large readable fonts to make legal text clear for everyone.</p>
          </div>
          <div className="rounded-xl border border-black/10 dark:border-white/15 p-5 bg-white dark:bg-black/20">
            <h3 className="font-semibold mb-2">Risk highlights</h3>
            <p className="text-sm text-foreground/70">We surface potential issues, obligations, and hidden fees for quick review.</p>
          </div>
          <div className="rounded-xl border border-black/10 dark:border-white/15 p-5 bg-white dark:bg-black/20">
            <h3 className="font-semibold mb-2">Multilingual support</h3>
            <p className="text-sm text-foreground/70">Analyze and ask in multiple languages, including Lithuanian.</p>
          </div>
        </section>

        <section className="space-y-3" aria-label="FAQ">
          <h2 className="text-xl font-bold">FAQ</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {[
              ["Is my contract data secure?", "Your files are processed for analysis and not shared. Use local or private deployments for additional control."],
              ["How accurate are AI explanations?", "Explanations are generated by advanced models and reviewed by you. Always consult a lawyer for legal advice."],
              ["Can seniors easily use this tool?", "Yes. The interface is simple with readable fonts and clear language."],
              ["Which contract types are supported?", "Most PDF and DOCX contracts, including service agreements, leases, and purchase terms."],
              ["Do I need to register?", "No registration is required for the demo. For saved history, sign-in will be available later."],
              ["Does it support multiple languages?", "Yes. The assistant answers in the same language as your document."],
              ["Can I ask follow-up questions?", "Absolutely—use the Q&A to clarify any clause."],
              ["Can it analyze scanned PDFs?", "Yes—OCR attempts to read scanned pages; quality may vary."],
              ["What are the limits?", "Large files or very long contracts may be truncated for performance."],
              ["Is this legal advice?", "No. This is an educational tool and not a substitute for professional legal advice."],
            ].map(([q, a], i) => (
              <div key={`faq-${i}`} className="rounded-xl border border-black/10 dark:border-white/15 p-5 bg-white dark:bg-black/20">
                <div className="font-semibold mb-1">{q}</div>
                <div className="text-sm text-foreground/70">{a}</div>
              </div>
            ))}
          </div>
        </section>

        <section aria-label="SEO" className="rounded-xl border border-black/10 dark:border-white/15 p-5 bg-white dark:bg-black/20">
          <h2 className="text-xl font-bold mb-2">About AI Contract Assistant</h2>
          <p className="text-sm text-foreground/80 leading-6">
            AI Contract Assistant is a legal document analysis tool that helps anyone understand contracts with AI. Instead of spending hours reading complex clauses, you can upload a document and receive a concise summary, highlighted risks, and a detailed explanation in clear language. This AI lawyer alternative is designed to be approachable for non‑lawyers while remaining useful for professionals who need a quick overview. It supports multilingual analysis, so global teams can keep using their native languages. With rapid processing and focused results, it reduces confusion and helps you make confident decisions.
          </p>
        </section>

        <footer className="pt-6 text-sm text-foreground/70 h-card">
          <div className="flex flex-wrap gap-4">
            <a href="#" className="hover:underline p-name u-url">AI Contract Assistant</a>
            <a href="#faq" className="hover:underline">FAQ</a>
            <a href="/privacy" className="hover:underline">Privacy Policy</a>
            <a href="/terms" className="hover:underline">Terms of Use</a>
            <a href="#" className="hover:underline">Contact</a>
          </div>
          <div className="mt-2">© {new Date().getFullYear()} <span className="p-org">AI Contract Assistant</span></div>
        </footer>
      </main>
    </div>
  );
}
