// tells the browser whether real ai is connected or the app is in demo mode.
import { aiProvider, demoAI, demoSpeech, sttProvider } from "@/lib/ai";

export const dynamic = "force-dynamic";

export function GET() {
  return Response.json({ demoAI, demoSpeech, aiProvider, sttProvider });
}
