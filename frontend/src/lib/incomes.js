import { Ticket, UserPlus, Rocket, Globe2, DoorOpen, Gift, Layers3, Crown, TrendingUp } from "lucide-react";

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
      { key: "port_daily_earnings", slug: "port-daily-earnings", label: "Daily Earnings", icon: TrendingUp, accent: "emerald",
        desc: "Daily earnings on your Entry Port (0.30%/day) and Unity Port (0.50%–1%/day) purchases." },
      { key: "port_partner_onboarding_rewards", slug: "port-partner-onboarding-rewards", label: "Partner Onboarding Rewards", icon: Gift, accent: "violet",
        desc: "5% instant reward when a partner you sponsor buys a Unity Port (Bond)." },
      { key: "port_level_income", slug: "port-level-income", label: "Level Income", icon: Layers3, accent: "rose",
        desc: "A share of your team's daily port earnings across 8 levels (25% down to 1%)." },
      { key: "port_rank_rewards", slug: "port-rank-rewards", label: "Rank & Rewards", icon: Crown, accent: "amber",
        desc: "One-time bonus each time you reach a new rank, M1 to M7." },
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
