export const siteConfig = {
  name: "Playbook",
  url: "https://playbook.bitwhys.co",
  description: "Nerding out about advanced metrics.",
  baseLinks: {
    reports: "/reports",
    transactions: "/transactions",
    settings: {
      audit: "/settings/audit",
      users: "/settings/users",
      billing: "/settings/billing",
    },
    login: "/login",
    onboarding: "/onboarding/products",
  },
}

export type siteConfig = typeof siteConfig
