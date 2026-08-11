import { BottomNav } from "@/components/layouts/BottomNav";

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-slate-50 pb-10">
      <main className="mx-auto max-w-md">{children}</main>
      <BottomNav />
    </div>
  );
}
