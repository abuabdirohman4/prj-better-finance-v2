import { type NextRequest } from "next/server";
import { updateSession } from "@/lib/supabase/middleware";

export async function proxy(request: NextRequest) {
  return await updateSession(request);
}

export const config = {
  matcher: [
    /*
     * Match all request paths EXCEPT:
     * - _next/static, _next/image (Next.js internals)
     * - favicon.ico, manifest, icons, sw.js (static/PWA assets)
     */
    "/((?!_next/static|_next/image|favicon.ico|manifest.json|icons|sw.js|workbox-.*.js).*)",
  ],
};
