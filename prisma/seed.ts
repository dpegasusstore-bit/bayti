import { prisma } from '../db-store.js';

async function main() {
  console.log('[Seed] Starting database seed...');

  // 1. Seed System Configuration
  const systemConfig = await prisma.systemConfig.upsert({
    where: { id: 1 },
    update: {},
    create: {
      id: 1,
      monthlyPrice: 99,
      yearlyPrice: 599,
      vodafoneNumber: '01002345678',
      betaFeatures: false,
      maintenanceMode: false,
      forceUpdate: false,
      aiInsightsEngine: true,
      voiceInputPremium: false,
    },
  });
  console.log('[Seed] SystemConfig seeded successfully:', systemConfig);

  // 2. Seed Premium Plans
  const premiumPlans = [
    {
      name: 'Premium',
      monthlyPrice: 99,
      yearlyPrice: 599,
      features: [
        'تحليل مالي متقدم بالذكاء الاصطناعي (مفتوح)',
        'قراءة الفواتير وتصوير الإيصالات بالذكاء الاصطناعي',
        'الإدخال الصوتي الذكي للمعاملات المالية',
        'مزامنة فورية ودعم غير محدود لأفراد العائلة',
        'إشعارات وتنبيهات ذكية مخصصة للديون والأقساط',
      ],
    },
    {
      name: 'Standard',
      monthlyPrice: 0,
      yearlyPrice: 0,
      features: [
        'تسجيل يدوي للمصروفات والدخل',
        'تقارير ورسوم بيانية مبسطة',
        'إضافة تنبيهات يدوية',
        '20 عملية ذكاء اصطناعي شهرياً فقط',
      ],
    },
  ];

  for (const plan of premiumPlans) {
    await prisma.premiumPlan.upsert({
      where: { name: plan.name },
      update: {
        monthlyPrice: plan.monthlyPrice,
        yearlyPrice: plan.yearlyPrice,
        features: plan.features,
      },
      create: plan,
    });
  }
  console.log('[Seed] Premium plans seeded successfully.');

  // 3. Seed Currencies
  const currencies = [
    { code: 'EGP', name: 'جنيه مصري', symbol: 'ج.م', rate: 1.0 },
    { code: 'USD', name: 'دولار أمريكي', symbol: '$', rate: 49.5 },
    { code: 'SAR', name: 'ريال سعودي', symbol: 'ر.س', rate: 13.2 },
    { code: 'AED', name: 'درهم إماراتي', symbol: 'د.إ', rate: 13.5 },
  ];

  for (const curr of currencies) {
    await prisma.currency.upsert({
      where: { code: curr.code },
      update: {
        name: curr.name,
        symbol: curr.symbol,
        rate: curr.rate,
      },
      create: curr,
    });
  }
  console.log('[Seed] Currencies seeded successfully.');

  // 4. Seed Countries
  const countries = [
    { code: 'EG', name: 'مصر', currency: 'EGP' },
    { code: 'SA', name: 'المملكة العربية السعودية', currency: 'SAR' },
    { code: 'AE', name: 'الإمارات العربية المتحدة', currency: 'AED' },
    { code: 'US', name: 'الولايات المتحدة الأمريكية', currency: 'USD' },
  ];

  for (const country of countries) {
    await prisma.country.upsert({
      where: { code: country.code },
      update: {
        name: country.name,
        currency: country.currency,
      },
      create: country,
    });
  }
  console.log('[Seed] Countries seeded successfully.');

  console.log('[Seed] Database seeding completed successfully!');
}

main()
  .catch((e) => {
    console.error('[Seed] Error seeding database:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
