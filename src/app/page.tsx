import prisma from "@/lib/prisma";
import MenuClient from "@/components/MenuClient";
import { unstable_noStore as noStore } from 'next/cache';

export const dynamic = "force-dynamic";

export default async function Home() {
  noStore();
  const categories = await prisma.category.findMany({
    include: {
      products: true,
    },
    orderBy: {
      createdAt: "asc"
    }
  });

  const settings = await prisma.settings.findUnique({ where: { id: "global" } });

  const settingsData = {
    isOpen: settings?.isOpen ?? true,
    openDays: settings?.openDays || "1,2,3,4,5,6,0",
    openTime: settings?.openTime || "14:30",
    closeTime: settings?.closeTime || "01:30"
  };

  return (
    <main className="min-h-screen pb-32 selection:bg-brand-red selection:text-white bg-[#050505] overflow-x-hidden">
      <MenuClient categories={categories} settings={settingsData} />
    </main>
  );
}
