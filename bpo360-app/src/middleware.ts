import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import { isRoleAllowedForPath, sanitizeAppPath } from "@/lib/auth/navigation";

const PUBLIC_PATHS = [
  "/login",
  "/auth/callback",
  "/auth/error",
  "/auth/confirm",
  "/auth/forgot-password",
  "/auth/sign-up",
];

function isPublicPath(pathname: string): boolean {
  return PUBLIC_PATHS.some((p) => pathname === p || pathname.startsWith(`${p}/`));
}

export async function middleware(request: NextRequest) {
  const response = NextResponse.next({ request });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) =>
            response.cookies.set(name, value, options)
          );
        },
      },
    }
  );

  const {
    data: { session },
  } = await supabase.auth.getSession();

  if (isPublicPath(request.nextUrl.pathname)) {
    return response;
  }

  if (!session) {
    const loginUrl = new URL("/login", request.url);
    loginUrl.searchParams.set(
      "next",
      sanitizeAppPath(
        `${request.nextUrl.pathname}${request.nextUrl.search}${request.nextUrl.hash}`
      )
    );
    return NextResponse.redirect(loginUrl);
  }

  const { data: profile } = await supabase
    .from("usuarios")
    .select("role")
    .eq("id", session.user.id)
    .maybeSingle();

  if (
    profile?.role === "cliente_final" &&
    request.nextUrl.pathname !== "/portal" &&
    !request.nextUrl.pathname.startsWith("/portal/")
  ) {
    return NextResponse.redirect(new URL("/portal", request.url));
  }

  if (!isRoleAllowedForPath(request.nextUrl.pathname, profile?.role)) {
    return NextResponse.redirect(new URL("/", request.url));
  }

  return response;
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
