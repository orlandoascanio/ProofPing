export type ProofLink = {
  title: string;
  url: string;
  tags: string[];
  description: string;
};

export const defaultProofLinks: ProofLink[] = [
  {
    title: "Personal Website",
    url: "https://www.orlandoascanio.com",
    tags: ["software engineer", "AI engineer", "founder", "portfolio"],
    description:
      "Main personal site showing projects, positioning, services, and product work.",
  },
  {
    title: "AI Project Demo",
    url: "https://www.orlandoascanio.com/products",
    tags: ["ai agents", "automation", "nextjs", "openai", "operator tools"],
    description:
      "A collection of AI workflow, automation, and productized engineering demos.",
  },
  {
    title: "GitHub",
    url: "https://github.com/orlandoascanio",
    tags: ["code", "engineering", "projects", "implementation"],
    description: "Technical proof, public code samples, and shipped experiments.",
  },
];
