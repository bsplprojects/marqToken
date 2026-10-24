import { Ticket, UserPlus, Rocket, Globe2, DoorOpen, Gift, Layers3, Crown } from "lucide-react";

export const INCOME_GROUPS = [
  {
    key: "techpass", label: "Merq TechPass", icon: Ticket,
    items: [
      { key: "tp_partner_onboarding", slug: "techpass-partner-onboarding", label: "Partner Onboarding", icon: UserPlus, accent: "amber",
        desc: "Earned when partners you onboard join Merq TechPass." },
      { key: "tp_momentum_booster", slug: "techpass-momentum-booster", label: "Momentum Booster", icon: Rocket, accent: "emerald",
        desc: "A boost earned as your TechPass network builds momentum." },
      { key: "tp_global_momentum", slug: "techpass-global-momentum", label: "Global Momentum", icon: Globe2, accent: "cyan",
        desc: "A share of momentum across the global TechPass community." },
    ],
  },
  {
    key: "port", label: "Merq Entry & Unity Port", icon: DoorOpen,
    items: [
      { key: "port_partner_onboarding_rewards", slug: "port-partner-onboarding-rewards", label: "Partner Onboarding Rewards", icon: Gift, accent: "violet",
        desc: "Rewards for partners you onboard into Merq Entry Port and Unity Port." },
      { key: "port_level_income", slug: "port-level-income", label: "Level Income", icon: Layers3, accent: "rose",
        desc: "Income earned from activity across the levels of your team." },
      { key: "port_rank_rewards", slug: "port-rank-rewards", label: "Rank & Rewards", icon: Crown, accent: "amber",
        desc: "Rewards unlocked as you reach new ranks." },
    ],
  },
];

export const findStream = (slug) => {
  for (const g of INCOME_GROUPS) {
    const item = g.items.find((i) => i.slug === slug);
    if (item) return { group: g, item };
  }
  return null;
};
