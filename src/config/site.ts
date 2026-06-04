
export type SiteConfig = {
  name: string;
  description: string;
  url: string;
  ogImage: string;
  links: {
    twitter: string;
    github: string;
  };
};

export const siteConfig: SiteConfig = {
  name: "SmartMove",
  description: "SmartMove is a comprehensive moving management application designed to simplify the moving process by providing tools for inventory management, packing organization, and move coordination.",
  url: process.env.NEXT_PUBLIC_APP_URL || "http://localhost:9002",
  ogImage: `${process.env.NEXT_PUBLIC_APP_URL || "http://localhost:9002"}/og.jpg`,
  links: {
    twitter: "https://twitter.com/yourhandle", // Replace with your Twitter handle
    github: "https://github.com/yourrepo/moveassist", // Replace with your GitHub repo
  },
};
