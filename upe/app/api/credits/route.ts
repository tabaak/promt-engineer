import { auth } from "@/auth";
import { getCredits } from "@/lib/credits";

export async function GET() {
  const session = await auth();
  if (!session?.user?.email) {
    return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401 });
  }

  const credits = await getCredits(session.user.email);
  return new Response(JSON.stringify({ credits }), {
    headers: { "Content-Type": "application/json" }
  });
}
