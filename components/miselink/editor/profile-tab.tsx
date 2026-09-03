"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2 } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Field, FieldLabel, FieldError, FieldGroup } from "@/components/ui/field";
import { profileSchema, type ProfileInput } from "@/lib/validations/miselink";
import type { useMiseLinkState } from "@/hooks/use-miselink-state";

type State = ReturnType<typeof useMiseLinkState>;

export function ProfileTab({ state }: { state: State }) {
  const {
    register,
    handleSubmit,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<ProfileInput>({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      displayName: state.page.displayName ?? "",
      bio: state.page.bio ?? "",
      avatarUrl: state.page.avatarUrl ?? "",
    },
  });

  const bio = watch("bio") ?? "";

  const onSubmit = async (values: ProfileInput) => {
    await state.saveProfile({
      displayName: values.displayName?.trim() || undefined,
      bio: values.bio?.trim() || undefined,
      avatarUrl: values.avatarUrl?.trim() || undefined,
    });
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="max-w-md space-y-5">
      <FieldGroup>
        <Field data-invalid={Boolean(errors.displayName)}>
          <FieldLabel htmlFor="displayName">Nombre para mostrar</FieldLabel>
          <Input id="displayName" className="rounded-xl" {...register("displayName")} />
          {errors.displayName && <FieldError errors={[{ message: errors.displayName.message }]} />}
        </Field>

        <Field data-invalid={Boolean(errors.bio)}>
          <FieldLabel htmlFor="bio">Bio</FieldLabel>
          <Textarea id="bio" rows={3} className="rounded-xl" {...register("bio")} />
          <span className="text-xs text-muted-foreground">{bio.length}/200</span>
          {errors.bio && <FieldError errors={[{ message: errors.bio.message }]} />}
        </Field>

        <Field data-invalid={Boolean(errors.avatarUrl)}>
          <FieldLabel htmlFor="avatarUrl">URL de la foto de perfil</FieldLabel>
          <Input
            id="avatarUrl"
            inputMode="url"
            placeholder="https://..."
            className="rounded-xl"
            {...register("avatarUrl")}
          />
          {errors.avatarUrl && <FieldError errors={[{ message: errors.avatarUrl.message }]} />}
        </Field>
      </FieldGroup>

      <Button
        type="submit"
        disabled={isSubmitting}
        className="gap-2 rounded-xl bg-[#075296] text-white hover:bg-[#0E88E2]"
      >
        {isSubmitting ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
        Guardar
      </Button>
    </form>
  );
}
