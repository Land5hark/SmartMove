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
  name: "MoveAssist",
  description: "AI-Powered Moving Inventory App to simplify packing, inventory management, and unpacking.",
  url: "http://localhost:3000", // Replace with your actual domain
  ogImage: "http://localhost:3000/og.jpg", // Replace with your actual OG image URL
  links: {
    twitter: "https://twitter.com/yourhandle", // Replace with your Twitter handle
    github: "https://github.com/yourrepo/moveassist", // Replace with your GitHub repo
  },
};
