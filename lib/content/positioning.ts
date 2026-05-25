export type CompetitorRow = {
  type: string;
  theyDo: string;
  weDo: string;
  typeSv?: string;
  theyDoSv?: string;
  weDoSv?: string;
};

export const competitorComparison: CompetitorRow[] = [
  {
    type: "CRO Agencies",
    theyDo: "A/B tests, audits",
    weDo: "Plus email, content, automation, and payment flows",
    typeSv: "CRO-byråer",
    theyDoSv: "A/B-tester, granskningar",
    weDoSv: "Plus e-post, innehåll, automation och flödesanalys",
  },
  {
    type: "SEO Audit Tools",
    theyDo: "Technical checks",
    weDo: "Plus human review, rewrite suggestions, UX, and flows",
    typeSv: "SEO-verktyg",
    theyDoSv: "Tekniska kontroller",
    weDoSv: "Plus manuell granskning, omskrivningsförslag, UX och struktur",
  },
  {
    type: "Funnel Agencies",
    theyDo: "Landing page optimization",
    weDo: "Plus weekly monitoring and Pam automation",
    typeSv: "Funnel-byråer",
    theyDoSv: "Optimering av landningssidor",
    weDoSv: "Plus veckomonitorering och automation",
  },
  {
    type: "Email Agencies",
    theyDo: "Email audits",
    weDo: "Combined email, site, payment, and content review",
    typeSv: "E-postbyråer",
    theyDoSv: "E-postgranskning",
    weDoSv: "Kombinerad granskning av e-post, webb, checkout och innehåll",
  },
  {
    type: "Social Tools",
    theyDo: "Scheduling",
    weDo: "Actual ready-to-post content, not just tools",
    typeSv: "Sociala verktyg",
    theyDoSv: "Schemaläggning",
    weDoSv: "Färdigt innehåll att publicera — inte bara verktyg",
  },
];
