export type Service = {
  slug: string;
  name: string;
  shortDescription: string;
  features: string[];
  category?: string;
  nameSv?: string;
  shortDescriptionSv?: string;
  featuresSv?: string[];
};

export type PricingTier = {
  slug: string;
  name: string;
  price: string;
  billingCycle: string;
  features: string[];
  ctaHref: string;
  ctaLabel: string;
  highlighted?: boolean;
  nameSv?: string;
  priceSv?: string;
  billingCycleSv?: string;
  featuresSv?: string[];
  ctaLabelSv?: string;
};

export type WeeklyReport = {
  slug: string;
  title: string;
  week: string;
  summary: string;
  pdfUrl: string;
  date: string;
  titleSv?: string;
  weekSv?: string;
  summarySv?: string;
  pdfUrlSv?: string;
};

export type PamPlanItem = {
  cadence: string;
  description: string;
};
