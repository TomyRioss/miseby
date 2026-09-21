"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Users } from "lucide-react";
import { toast } from "sonner";
import { StatusBadge } from "@/components/ui/status-badge";
import { Button } from "@/components/ui/button";
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from "@/components/ui/table";
import { ConfirmButton } from "@/components/control/confirm-button";
import { formatDate } from "@/lib/mise-labels";
import { setUserStatusAction, deleteUserAction } from "@/lib/actions/users";
import type { UserProfile } from "@prisma/client";

const ROLE_LABELS: Record<string, string> = {
  platform_owner: "Platform Owner",
  business_owner: "Admin negocio",
  business_member: "Miembro",
};
const STATUS_COLORS: Record<string, string> = { active: "green", pending: "amber", suspended: "red" };

export function UsersTable({ users }: { users: UserProfile[] }) {
  const router = useRouter();
  const [busyId, setBusyId] = useState<string | null>(null);

  const setStatus = async (id: string, status: "active" | "suspended") => {
    setBusyId(id);
    try {
      const result = await setUserStatusAction(id, { status });
      if (!result.ok) toast.error(result.error);
      else {
        toast.success(status === "active" ? "Usuario reactivado" : "Usuario suspendido");
        router.refresh();
      }
    } catch (err) {
      console.error(err);
      toast.error("Error al cambiar estado del usuario");
    } finally {
      setBusyId(null);
    }
  };

  const remove = async (id: string) => {
    setBusyId(id);
    try {
      const result = await deleteUserAction(id);
      if (!result.ok) toast.error(result.error);
      else {
        toast.success("Usuario eliminado");
        router.refresh();
      }
    } catch (err) {
      console.error(err);
      toast.error("Error al eliminar usuario");
    } finally {
      setBusyId(null);
    }
  };

  if (users.length === 0) {
    return (
      <div className="flex flex-col items-center gap-3 py-16 text-muted-foreground">
        <Users className="h-10 w-10 opacity-30" />
        <p className="text-sm">Sin usuarios registrados</p>
      </div>
    );
  }

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Nombre</TableHead>
          <TableHead>Email</TableHead>
          <TableHead>Rol</TableHead>
          <TableHead>Estado</TableHead>
          <TableHead>Registrado</TableHead>
          <TableHead className="text-right">Acciones</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {users.map((u) => (
          <TableRow key={u.id}>
            <TableCell className="font-medium">{u.name || "-"}</TableCell>
            <TableCell className="text-muted-foreground">{u.email}</TableCell>
            <TableCell className="text-muted-foreground">{ROLE_LABELS[u.role] || u.role}</TableCell>
            <TableCell>
              <StatusBadge label={u.status} color={STATUS_COLORS[u.status] || "gray"} />
            </TableCell>
            <TableCell className="text-muted-foreground">{formatDate(u.createdAt)}</TableCell>
            <TableCell>
              <div className="flex justify-end gap-2">
                {u.status === "suspended" ? (
                  <ConfirmButton
                    title="¿Reactivar usuario?"
                    description={u.email}
                    onConfirm={() => setStatus(u.id, "active")}
                  >
                    <Button
                      variant="outline"
                      size="sm"
                      disabled={busyId === u.id}
                      className="border-green-300 bg-green-50 text-green-700 hover:bg-green-100"
                    >
                      Reactivar
                    </Button>
                  </ConfirmButton>
                ) : (
                  <ConfirmButton
                    title="¿Suspender usuario?"
                    description={u.email}
                    onConfirm={() => setStatus(u.id, "suspended")}
                  >
                    <Button
                      variant="outline"
                      size="sm"
                      disabled={busyId === u.id}
                      className="border-red-200 bg-red-50 text-red-700 hover:bg-red-100"
                    >
                      Suspender
                    </Button>
                  </ConfirmButton>
                )}
                <ConfirmButton
                  title="¿Eliminar usuario?"
                  description="Esta acción no se puede deshacer."
                  onConfirm={() => remove(u.id)}
                >
                  <Button variant="outline" size="sm" disabled={busyId === u.id}>
                    Eliminar
                  </Button>
                </ConfirmButton>
              </div>
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}
