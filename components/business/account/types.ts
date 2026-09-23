/**
 * Contrato TOM-203 con el pool BE (branch fix/TOM-203-cuenta-billing-ajustes-back):
 * lib/actions/account.ts exportará updateProfileNameAction({ name }) y
 * updateEmailAction({ email, currentPassword }) con este resultado.
 */
export type AccountActionResult = {
  ok: boolean;
  error?: string;
  requireRelogin?: boolean;
};
