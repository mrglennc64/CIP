import type { Service } from "@/lib/types";

export const services: Service[] = [
  {
    slug: "full-website-assessment",
    name: "Full Website Assessment",
    shortDescription:
      "Full review of structure, content, layout, and errors across mobile and desktop.",
    features: [
      "Content accuracy and clarity",
      "Navigation and structure review",
      "Mobile and desktop layout checks",
      "Broken links, metadata, missing fields",
      "Rewrite recommendations",
    ],
    category: "Audit",
    nameSv: "Fullständig webbplatsgranskning",
    shortDescriptionSv:
      "Genomgång av struktur, innehåll, layout och fel på både mobil och desktop.",
    featuresSv: [
      "Innehållskvalitet och tydlighet",
      "Granskning av navigation och struktur",
      "Layoutkontroller för mobil och desktop",
      "Trasiga länkar, metadata och saknade fält",
      "Rekommendationer för omskrivning",
    ],
  },
  {
    slug: "payment-ab-testing",
    name: "Payment Page A/B Testing",
    shortDescription:
      "Test headlines, CTAs, layout and trust elements on payment pages.",
    features: [
      "Headline and CTA variants",
      "Layout and trust elements",
      "Conversion tracking",
      "Winning version recommendation",
    ],
    category: "Conversion",
    nameSv: "A/B-testning av betalnings- och checkout-flöden",
    shortDescriptionSv:
      "Test av rubriker, CTA:er, layout och förtroendeelement i betalningsflöden.",
    featuresSv: [
      "Varianter av rubriker och CTA:er",
      "Layout- och förtroendeelement",
      "Konverteringsspårning",
      "Rekommendation av vinnande version",
    ],
  },
  {
    slug: "email-automation-review",
    name: "Email Automation Review",
    shortDescription:
      "Check triggers, sequences, copy clarity, and performance of email flows.",
    features: [
      "Trigger validation",
      "Sequence structure",
      "Copy clarity",
      "Rewrite suggestions",
    ],
    category: "Automation",
    nameSv: "Granskning av e-postautomatisering",
    shortDescriptionSv:
      "Kontroll av triggers, sekvenser, tydlighet och prestanda i e-postflöden.",
    featuresSv: [
      "Validering av triggers",
      "Struktur för sekvenser",
      "Texttydlighet",
      "Förslag på omskrivningar",
    ],
  },
  {
    slug: "weekly-social-content",
    name: "Weekly Social Media Content",
    shortDescription:
      "3–5 platform-ready posts per week with simple visuals.",
    features: [
      "3–5 posts per week",
      "Platform-ready text",
      "Simple visuals",
    ],
    category: "Content",
    nameSv: "Veckovis innehåll för sociala medier",
    shortDescriptionSv:
      "3–5 plattformsredo inlägg per vecka med enkla visuella element.",
    featuresSv: [
      "3–5 inlägg per vecka",
      "Plattformsredo text",
      "Enkla visuella komponenter",
    ],
  },
  {
    slug: "before-after-health-report",
    name: "Before/After Health Report",
    shortDescription:
      "Snapshot and comparison report showing measurable improvement after intervention.",
    features: [
      "Content snapshot",
      "Structure comparison",
      "Trust indicators",
      "Improvement summary",
    ],
    category: "Reporting",
    nameSv: "Före/Efter-rapport",
    shortDescriptionSv:
      "Översikt och jämförelse som visar mätbara förbättringar efter genomförda åtgärder.",
    featuresSv: [
      "Innehållssnapshot",
      "Strukturjämförelse",
      "Förtroendeindikatorer",
      "Sammanfattning av förbättringar",
    ],
  },
  {
    slug: "platform-monitoring",
    name: "Platform Monitoring",
    shortDescription:
      "Weekly scans for errors, content drift, and broken flows with action lists.",
    features: [
      "Weekly scans",
      "Error detection",
      "Change tracking",
      "Action list",
    ],
    category: "Monitoring",
    nameSv: "Plattformsmonitorering",
    shortDescriptionSv:
      "Veckovisa kontroller av fel, innehållsdrift och brutna flöden — med åtgärdslista.",
    featuresSv: [
      "Veckovisa skanningar",
      "Felidentifiering",
      "Spårning av förändringar",
      "Åtgärdslista",
    ],
  },
];
