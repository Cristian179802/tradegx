import { PrismaClient } from "@prisma/client";
const prisma = new PrismaClient();

const backtests = await prisma.backtest.findMany({
  orderBy: { createdAt: "desc" },
  take: 5,
  select: { id: true, status: true, errorMessage: true, symbol: true, timeframe: true },
});

console.log(JSON.stringify(backtests, null, 2));
await prisma.$disconnect();
