import { redirect } from "next/navigation";
import { getServerClient } from "@/lib/supabase/server";
import { AdminHeader } from "@/components/admin/AdminHeader";

// This layout only wraps routes inside the (protected) group — i.e. the
// actual admin dashboard — NOT /admin/login, which lives as a sibling route
// outside this group precisely so it never redirects to itself.
export default async function ProtectedAdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = getServerClient();
  const {
    data: { session },
  } = await supabase.auth.getSession();

  if (!session) {
    redirect("/admin/login");
  }

  return (
    <div className="min-h-screen bg-cream">
      <AdminHeader />
      <div className="mx-auto max-w-6xl px-4 py-8">{children}</div>
    </div>
  );
}
