// student question + their own material in -> simple english answer out.
// mode "arabic" turns a previous answer into a short arabic explanation.
import { generate, demoAI, errorResponse } from "@/lib/ai";
import { ARABIC_SYSTEM, ASK_SYSTEM } from "@/lib/prompts";
import type { ChatMsg } from "@/lib/types";

export const maxDuration = 60;

export async function POST(req: Request) {
  try {
    const body = (await req.json()) as {
      mode?: "ask" | "arabic";
      question?: string;
      answer?: string;
      material: string;
      history?: ChatMsg[];
    };

    if (body.mode === "arabic") {
      if (demoAI)
        return Response.json({
          arabic: "التوازن (equilibrium) هو السعر الذي تتساوى عنده الكمية التي يريد الناس شراءها مع الكمية التي يعرضها البائعون.",
          demo: true,
        });
      const arabic = await generate(ARABIC_SYSTEM, `Explain this in Arabic:\n${body.answer}`, 600);
      return Response.json({ arabic });
    }

    if (!body.question?.trim()) return errorResponse(new Error("Type a question first"), 400);
    if (demoAI)
      return Response.json({
        answer:
          "Equilibrium is the price where the amount people want to buy is the same as the amount sellers offer. At this price, there is no shortage and no surplus.",
        demo: true,
      });

    const history = (body.history ?? [])
      .slice(-6)
      .map((m) => `${m.role === "user" ? "Student" : "You"}: ${m.content}`)
      .join("\n");
    const prompt = `MATERIAL:\n${body.material.slice(0, 100_000)}\n\nEARLIER CHAT:\n${history || "(none)"}\n\nSTUDENT QUESTION:\n${body.question}`;
    const answer = await generate(ASK_SYSTEM, prompt, 800);
    return Response.json({ answer: answer.trim() });
  } catch (e) {
    return errorResponse(e);
  }
}
