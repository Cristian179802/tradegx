import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

// Generate recurring economic events for the next 8 weeks
function getMonday(date: Date): Date {
  const d = new Date(date);
  const day = d.getDay();
  const diff = d.getDate() - day + (day === 0 ? -6 : 1);
  d.setDate(diff);
  d.setHours(0, 0, 0, 0);
  return d;
}

function addDays(date: Date, days: number): Date {
  const d = new Date(date);
  d.setDate(d.getDate() + days);
  return d;
}

function setTime(date: Date, hours: number, minutes = 0): Date {
  const d = new Date(date);
  d.setHours(hours, minutes, 0, 0);
  return d;
}

// Weekly recurring events template (dayOffset: 0=Mon, 1=Tue ... 4=Fri)
const WEEKLY_EVENTS = [
  // Monday
  { title: "Flash Manufacturing PMI (EUR)", country: "Zona Euro", currency: "EUR", impact: "HIGH", dayOffset: 0, hour: 9, minute: 0, description: "Indicele preliminar al activității în sectorul manufacturier." },
  { title: "Flash Services PMI (EUR)", country: "Zona Euro", currency: "EUR", impact: "HIGH", dayOffset: 0, hour: 9, minute: 0, description: "Indicele preliminar al activității în sectorul servicii." },

  // Tuesday
  { title: "CB Consumer Confidence (USD)", country: "SUA", currency: "USD", impact: "HIGH", dayOffset: 1, hour: 16, minute: 0, description: "Nivelul de încredere al consumatorilor americani, semnal pentru cheltuieli viitoare." },
  { title: "German ZEW Economic Sentiment", country: "Germania", currency: "EUR", impact: "MEDIUM", dayOffset: 1, hour: 11, minute: 0, description: "Sondaj privind sentimentul economic al investitorilor instituționali germani." },
  { title: "JOLTS Job Openings (USD)", country: "SUA", currency: "USD", impact: "MEDIUM", dayOffset: 1, hour: 16, minute: 0, description: "Numărul de locuri de muncă vacante în SUA." },

  // Wednesday
  { title: "ADP Non-Farm Employment Change (USD)", country: "SUA", currency: "USD", impact: "HIGH", dayOffset: 2, hour: 14, minute: 15, description: "Schimbarea numărului de angajați din sectorul privat, antecesor pentru NFP." },
  { title: "Crude Oil Inventories (USD)", country: "SUA", currency: "USD", impact: "MEDIUM", dayOffset: 2, hour: 16, minute: 30, description: "Variația stocurilor săptămânale de petrol brut EIA." },
  { title: "FOMC Meeting Minutes (USD)", country: "SUA", currency: "USD", impact: "HIGH", dayOffset: 2, hour: 20, minute: 0, description: "Minuta ședinței FOMC – detalii despre gândirea Fed privind ratele dobânzilor." },

  // Thursday
  { title: "ECB Monetary Policy Statement (EUR)", country: "Zona Euro", currency: "EUR", impact: "HIGH", dayOffset: 3, hour: 14, minute: 15, description: "Decizia BCE privind ratele dobânzilor și comunicatul de politică monetară." },
  { title: "US Initial Jobless Claims (USD)", country: "SUA", currency: "USD", impact: "MEDIUM", dayOffset: 3, hour: 14, minute: 30, description: "Numărul cererilor inițiale de ajutor de șomaj – indicator săptămânal al pieței muncii." },
  { title: "US GDP Growth Rate QoQ (USD)", country: "SUA", currency: "USD", impact: "HIGH", dayOffset: 3, hour: 14, minute: 30, description: "Rata de creștere a PIB-ului SUA față de trimestrul anterior (revizuire preliminară)." },

  // Friday
  { title: "Non-Farm Payrolls (USD)", country: "SUA", currency: "USD", impact: "HIGH", dayOffset: 4, hour: 14, minute: 30, description: "Cel mai important raport lunar al pieței muncii americane. Mișcă toate perechile USD." },
  { title: "US Unemployment Rate (USD)", country: "SUA", currency: "USD", impact: "HIGH", dayOffset: 4, hour: 14, minute: 30, description: "Rata șomajului în SUA, publicată simultan cu NFP." },
  { title: "US Core PCE Price Index (USD)", country: "SUA", currency: "USD", impact: "HIGH", dayOffset: 4, hour: 14, minute: 30, description: "Indicatorul preferat al Fed pentru inflație (excluzând alimente și energie)." },
  { title: "US Consumer Sentiment (USD)", country: "SUA", currency: "USD", impact: "MEDIUM", dayOffset: 4, hour: 16, minute: 0, description: "Indicele de sentiment al consumatorilor University of Michigan." },
  { title: "Baker Hughes US Oil Rig Count", country: "SUA", currency: "USD", impact: "LOW", dayOffset: 4, hour: 18, minute: 0, description: "Numărul de sonde petroliere active în SUA – indicator al activității din sectorul energetic." },
];

// Monthly events (approximate — always placed on first/second/third week)
const MONTHLY_EVENTS = [
  { title: "BOE Interest Rate Decision (GBP)", country: "Marea Britanie", currency: "GBP", impact: "HIGH", weekInMonth: 1, dayOffset: 3, hour: 13, minute: 0, description: "Decizia Băncii Angliei privind rata dobânzii de referință." },
  { title: "US CPI MoM (USD)", country: "SUA", currency: "USD", impact: "HIGH", weekInMonth: 1, dayOffset: 2, hour: 14, minute: 30, description: "Indicele prețurilor de consum lunar – principalul indicator de inflație al SUA." },
  { title: "US Core CPI MoM (USD)", country: "SUA", currency: "USD", impact: "HIGH", weekInMonth: 1, dayOffset: 2, hour: 14, minute: 30, description: "CPI de bază excluzând alimente și energie." },
  { title: "Eurozone CPI YoY Flash (EUR)", country: "Zona Euro", currency: "EUR", impact: "HIGH", weekInMonth: 0, dayOffset: 2, hour: 11, minute: 0, description: "Estimarea preliminară a inflației anuale în zona euro." },
  { title: "US Retail Sales MoM (USD)", country: "SUA", currency: "USD", impact: "HIGH", weekInMonth: 1, dayOffset: 2, hour: 14, minute: 30, description: "Variația lunară a vânzărilor cu amănuntul în SUA." },
  { title: "UK CPI YoY (GBP)", country: "Marea Britanie", currency: "GBP", impact: "HIGH", weekInMonth: 1, dayOffset: 2, hour: 9, minute: 0, description: "Inflația anuală în Marea Britanie." },
  { title: "US PPI MoM (USD)", country: "SUA", currency: "USD", impact: "MEDIUM", weekInMonth: 1, dayOffset: 3, hour: 14, minute: 30, description: "Indicele prețurilor producătorilor – indicator anticipativ pentru inflația CPI." },
  { title: "US ISM Manufacturing PMI (USD)", country: "SUA", currency: "USD", impact: "HIGH", weekInMonth: 0, dayOffset: 0, hour: 16, minute: 0, description: "PMI-ul manufacturier ISM – nivel peste 50 indică expansiune." },
  { title: "US ISM Services PMI (USD)", country: "SUA", currency: "USD", impact: "HIGH", weekInMonth: 0, dayOffset: 2, hour: 16, minute: 0, description: "PMI-ul servicii ISM – sectorul servicii reprezintă ~80% din economia SUA." },
  { title: "FOMC Interest Rate Decision (USD)", country: "SUA", currency: "USD", impact: "HIGH", weekInMonth: 2, dayOffset: 2, hour: 20, minute: 0, description: "Cea mai importantă decizie de politică monetară – Fed funds rate." },
  { title: "Fed Chair Press Conference (USD)", country: "SUA", currency: "USD", impact: "HIGH", weekInMonth: 2, dayOffset: 2, hour: 20, minute: 30, description: "Conferința de presă a președintelui Fed după decizia de rată." },
  { title: "German IFO Business Climate (EUR)", country: "Germania", currency: "EUR", impact: "MEDIUM", weekInMonth: 3, dayOffset: 0, hour: 10, minute: 0, description: "Cel mai important indicator al climatului de afaceri din Germania." },
];

async function main() {
  console.log("🌱 Seeding economic calendar...");

  // Delete existing events
  await prisma.economicEvent.deleteMany({});

  const events = [];
  const now = new Date();
  const monday = getMonday(now);

  // Generate for 8 weeks ahead + 1 week back
  for (let week = -1; week < 8; week++) {
    const weekStart = addDays(monday, week * 7);

    // Weekly events
    for (const template of WEEKLY_EVENTS) {
      const eventDate = addDays(weekStart, template.dayOffset);
      events.push({
        title: template.title,
        country: template.country,
        currency: template.currency,
        impact: template.impact as "HIGH" | "MEDIUM" | "LOW",
        eventTime: setTime(eventDate, template.hour, template.minute),
        forecast: null,
        previous: null,
        actual: null,
        description: template.description,
      });
    }

    // Monthly events — only add in first occurrence within the range
    const weekOfMonth = Math.floor((weekStart.getDate() - 1) / 7);
    for (const template of MONTHLY_EVENTS) {
      if (weekOfMonth === template.weekInMonth) {
        const eventDate = addDays(weekStart, template.dayOffset);
        events.push({
          title: template.title,
          country: template.country,
          currency: template.currency,
          impact: template.impact as "HIGH" | "MEDIUM" | "LOW",
          eventTime: setTime(eventDate, template.hour, template.minute),
          forecast: null,
          previous: null,
          actual: null,
          description: template.description,
        });
      }
    }
  }

  await prisma.economicEvent.createMany({ data: events });
  console.log(`✅ Created ${events.length} economic events`);
}

main()
  .catch((e) => { console.error(e); process.exit(1); })
  .finally(() => prisma.$disconnect());
