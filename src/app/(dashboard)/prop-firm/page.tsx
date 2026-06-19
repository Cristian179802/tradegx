import type { Metadata } from "next";
import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { PropFirmClient } from "./prop-firm-client";

export const metadata: Metadata = { title: "Prop Firm Challenge" };

export default async function PropFirmPage() {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");
  return <PropFirmClient />;
}
