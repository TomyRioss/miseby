"use client";

import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2 } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Field, FieldError, FieldGroup } from "@/components/ui/field";
import { usernameSchema } from "@/lib/validations/miselink";
import type { useMiseLinkState } from "@/hooks/use-miselink-state";

type State = ReturnType<typeof useMiseLinkState>;

const titleBioSchema = z.object({
  username: usernameSchema,
  bio: z.string().trim().max(160, "Máximo 160 caracteres").optional().or(z.literal("")),
});
type TitleBioInput = z.infer<typeof titleBioSchema>;

export function ProfileTab({ state, onSaved }: { state: State; onSaved?: () => void }) {
  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<TitleBioInput>({
    resolver: zodResolver(titleBioSchema),
    defaultValues: {
      username: state.page.username ?? "",
      bio: state.page.bio ?? "",
    },
  });

  const username = watch("username") ?? "";
  const bio = watch("bio") ?? "";

  const onSubmit = async (values: TitleBioInput) => {
    const normalized = values.username.replace(/^@+/, "").trim().toLowerCase();
    try {
      if (normalized !== state.page.username) {
        const ok = await state.saveUsername(normalized);
        if (!ok) return;
      }
      const nextBio = values.bio?.trim() || "";
      if (nextBio !== (state.page.bio ?? "")) {
        const okBio = await state.saveProfile({ bio: nextBio || undefined });
        if (!okBio) return;
      }
      onSaved?.();
    } catch (e) {
      console.error("[profile-tab]", e);
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="w-full space-y-4">
      <FieldGroup>
        <Field data-invalid={Boolean(errors.username)}>
          <div className="rounded-xl bg-muted/60 px-3 pb-1.5 pt-2">
            <span className="block text-xs text-muted-foreground">Título</span>
            <Input
              id="username"
              className="h-8 border-0 bg-transparent px-0 shadow-none focus-visible:ring-0"
              placeholder="@tomy-demo"
              {...register("username")}
              onChange={(e) => setValue("username", e.target.value.replace(/^@+/, ""), { shouldValidate: true })}
            />
          </div>
          <span className="block text-right text-xs text-muted-foreground">
            {username.replace(/^@+/, "").length} / 30
          </span>
          {errors.username && <FieldError errors={[{ message: errors.username.message }]} />}
        </Field>

        <Field data-invalid={Boolean(errors.bio)}>
          <div className="rounded-xl border border-foreground/80 px-3 pb-1.5 pt-2">
            <span className="block text-xs text-muted-foreground">Biografía</span>
            <Textarea
              id="bio"
              rows={4}
              className="min-h-20 border-0 bg-transparent px-0 shadow-none focus-visible:ring-0"
              placeholder="Biografía"
              {...register("bio")}
            />
          </div>
          <span className="block text-right text-xs text-muted-foreground">{bio.length} / 160</span>
          {errors.bio && <FieldError errors={[{ message: errors.bio.message }]} />}
        </Field>
      </FieldGroup>

      <Button
        type="submit"
        disabled={isSubmitting}
        className="w-full gap-2 rounded-full bg-[#075296] py-6 text-base font-semibold text-white hover:bg-[#0E88E2]"
      >
        {isSubmitting ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
        Guardar
      </Button>
    </form>
  );
}
