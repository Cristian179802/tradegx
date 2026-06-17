import type { Metadata } from "next";
import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { ToolsClient } from "./tools-client";

export const metadata: Metadata = { title: "Unelte Pro" };

export default async function ToolsPage() {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");

  return <ToolsClient />;
}
