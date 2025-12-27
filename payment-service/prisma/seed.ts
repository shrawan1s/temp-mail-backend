import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  const plans = [
    {
      key: 'free',
      name: 'Free',
      description: 'Perfect for casual use',
      priceMonthly: 0,
      priceAnnual: 0,
      features: [
        '1 temporary email at a time',
        '24-hour email retention',
        'Basic inbox features',
        'Standard domains only',
        'Community support',
        'With advertisements',
      ],
      isActive: true,
      isPopular: false,
      sortOrder: 0,
    },
    {
      key: 'pro',
      name: 'Pro',
      description: 'Best for individuals & developers',
      priceMonthly: 74900, // ₹749
      priceAnnual: 749900, // ₹7,499
      features: [
        'Unlimited temporary emails',
        'Up to 30-day retention',
        'Custom domain support',
        'Priority processing',
        'Advanced AI filtering',
        'Ad-free experience',
        'Priority support',
        'API access',
      ],
      isActive: true,
      isPopular: true,
      sortOrder: 1,
    },
    {
      key: 'business',
      name: 'Business',
      description: 'Ideal for teams & enterprises',
      priceMonthly: 249900, // ₹2,499
      priceAnnual: 2499900, // ₹24,999
      features: [
        'All Pro features',
        '30-day email retention',
        'Team seats & collaboration',
        'Analytics dashboard',
        'Dedicated support',
        'SLA & uptime guarantees',
      ],
      isActive: true,
      isPopular: false,
      sortOrder: 2,
    },
  ];

  for (const plan of plans) {
    await prisma.plan.upsert({
      where: { key: plan.key },
      update: plan,
      create: plan,
    });
    console.log(`Upserted plan: ${plan.name}`);
  }
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
