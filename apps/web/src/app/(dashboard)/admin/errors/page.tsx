import type { Metadata } from "next";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { notFound, redirect } from "next/navigation";
import { getTranslations } from "next-intl/server";
import { ErrorsClient } from "./errors-client";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("errorMonitor");
  return { title: t("title") };
}

/**
 * Panoul de erori. Doar pentru ADMIN.
 *
 * `notFound()` în loc de un „acces interzis": o pagină de administrare n-are de
 * ce să-și confirme existența cuiva care n-are voie pe ea.
 */
export default async function AdminErrorsPage() {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");
  if (session.user.role !== "ADMIN") notFound();

  const erori = await prisma.errorLog.findMany({
    // Nerezolvate întâi, apoi cele mai recente. Un rând rezolvat care reapare se
    // redeschide singur, deci lista de sus e mereu ce cere atenție acum.
    orderBy: [{ resolvedAt: { sort: "asc", nulls: "first" } }, { lastSeen: "desc" }],
    take: 100,
    select: {
      id: true,
      label: true,
      message: true,
      stack: true,
      route: true,
      count: true,
      firstSeen: true,
      lastSeen: true,
      resolvedAt: true,
    },
  });

  return (
    <ErrorsClient
      erori={erori.map((e) => ({
        ...e,
        firstSeen: e.firstSeen.toISOString(),
        lastSeen: e.lastSeen.toISOString(),
        resolvedAt: e.resolvedAt?.toISOString() ?? null,
      }))}
    />
  );
}
