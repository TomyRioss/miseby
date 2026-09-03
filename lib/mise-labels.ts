export const BUSINESS_TYPE_LABELS: Record<string, string> = {
  restaurant: "Restaurante / Gastronomía",
  commerce: "Comercio / Tienda",
  services: "Servicios",
  other: "Otro",
};

export const ORG_STATUSES: Record<string, { label: string; color: string }> = {
  pending: { label: "Pendiente", color: "amber" },
  active: { label: "Activo", color: "green" },
  suspended: { label: "Suspendido", color: "red" },
  cancelled: { label: "Cancelado", color: "gray" },
};

export const MEMBERSHIP_STATUSES: Record<string, { label: string; color: string }> = {
  pending: { label: "Pendiente", color: "amber" },
  trial: { label: "Trial", color: "blue" },
  active: { label: "Activo", color: "green" },
  suspended: { label: "Suspendido", color: "red" },
  expired: { label: "Expirado", color: "gray" },
  cancelled: { label: "Cancelado", color: "gray" },
};

export const MEMBERSHIP_SOURCE_LABELS: Record<string, string> = {
  manual: "Manual",
  trial: "Trial",
  founder: "Founder",
  internal: "Interno",
  stripe: "Stripe",
};

export const INVITATION_STATUSES: Record<string, { label: string; color: string }> = {
  pending: { label: "Pendiente", color: "amber" },
  accepted: { label: "Aceptada", color: "green" },
  expired: { label: "Expirada", color: "gray" },
  cancelled: { label: "Cancelada", color: "red" },
};

export const PLAN_LABELS: Record<string, string> = {
  mise_link: "MISE LINK",
  mise: "MISE",
  mise_restaurant: "MISE RESTAURANT",
};

export function formatDate(date: Date | string | null | undefined) {
  if (!date) return "—";
  return new Date(date).toLocaleDateString("es-CO", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}
