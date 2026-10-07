export function getPlanDashboardPath(planCode?: string | null) {
  if (planCode === "mise_link") return "/dashboard/miselink";
  if (planCode === "mise_restaurant") return "/dashboard/menu";
  return "/dashboard";
}
