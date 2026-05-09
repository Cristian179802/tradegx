import Link from "next/link";
import { Home } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function DashboardNotFound() {
  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] gap-6 text-center px-4">
      <p className="text-7xl font-bold text-zinc-800">404</p>
      <div className="space-y-2">
        <h2 className="text-xl font-semibold text-zinc-100">Pagina nu a fost găsită</h2>
        <p className="text-sm text-zinc-500">Ruta pe care o cauți nu există.</p>
      </div>
      <Button asChild variant="outline" className="border-zinc-700 text-zinc-300 hover:text-zinc-100 hover:bg-zinc-800 gap-2">
        <Link href="/dashboard">
          <Home className="w-4 h-4" />
          Înapoi la Dashboard
        </Link>
      </Button>
    </div>
  );
}
