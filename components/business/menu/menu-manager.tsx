"use client";

import { useMemo, useRef, useState } from "react";
import { CheckCircle2, ChevronDown, CircleAlert, Copy, ExternalLink, FoldVertical, Plus, UnfoldVertical } from "lucide-react";
import { DndContext, closestCenter, PointerSensor, TouchSensor, useSensor, useSensors, type DragEndEvent } from "@dnd-kit/core";
import { SortableContext, verticalListSortingStrategy, arrayMove } from "@dnd-kit/sortable";
import { toast } from "sonner";
import { saveMenuAction, setMenuPublishedAction } from "@/lib/actions/restaurant";
import { newId, type RestaurantAppearance, type RestaurantCategory, type RestaurantProduct } from "@/lib/restaurant-theme";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { MenuEditorLayout } from "../restaurant/menu-editor-layout";
import { CartaPhonePreview } from "../restaurant/carta-phone-preview";
import { MenuCategoryRow } from "./menu-category-row";
import { ProductSheet, type SheetState } from "./product-sheet";

export function MenuManager({
  initialCategories, initialProducts, appearance, currency, slug, hours, menuPublished,
}: {
  initialCategories: RestaurantCategory[];
  initialProducts: RestaurantProduct[];
  appearance: RestaurantAppearance;
  currency?: string | null;
  slug: string;
  hours?: string;
  menuPublished: boolean;
}) {
  const [cats, setCats] = useState<RestaurantCategory[]>([...initialCategories].sort((a, b) => a.order - b.order));
  const [products, setProducts] = useState<RestaurantProduct[]>(initialProducts);
  const [collapsed, setCollapsed] = useState<Set<string>>(new Set());
  const [newCat, setNewCat] = useState("");
  const [sheet, setSheet] = useState<SheetState>(null);
  const [saving, setSaving] = useState(false);
  const [dirty, setDirty] = useState(false);
  const [published, setPublished] = useState(menuPublished);
  const [publishing, setPublishing] = useState(false);
  const newCatRef = useRef<HTMLInputElement>(null);
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(TouchSensor, { activationConstraint: { delay: 150, tolerance: 5 } }),
  );

  const available = useMemo(() => products.filter((p) => p.available), [products]);
  const ready = cats.length > 0 && available.length > 0 && available.some((p) => (p.variants?.[0]?.price ?? p.price) > 0);
  const byCat = (id: string) => products.filter((p) => p.categoryId === id).sort((a, b) => a.name.localeCompare(b.name));

  function touchCats(next: RestaurantCategory[]) { setCats(next); setDirty(true); }
  function touchProducts(next: RestaurantProduct[]) { setProducts(next); setDirty(true); }

  function addCategory() {
    const n = newCat.trim();
    if (!n) return toast.error("Escribí un nombre: ej. Postres.");
    if (cats.some((c) => c.name.toLowerCase() === n.toLowerCase())) return toast.error("Esa sección ya existe.");
    if (cats.length >= 100) return toast.error("Máximo 100 secciones.");
    touchCats([...cats, { id: newId("cat"), name: n, order: cats.length }]);
    setNewCat("");
  }

  function handleDragEnd(e: DragEndEvent) {
    const { active, over } = e;
    if (!over || active.id === over.id) return;
    const from = cats.findIndex((c) => c.id === active.id);
    const to = cats.findIndex((c) => c.id === over.id);
    if (from < 0 || to < 0) return;
    touchCats(arrayMove(cats, from, to).map((c, idx) => ({ ...c, order: idx })));
  }

  function saveSheetProduct(p: RestaurantProduct) {
    touchProducts(products.some((x) => x.id === p.id) ? products.map((x) => (x.id === p.id ? p : x)) : [...products, p]);
    setSheet(null);
    toast.success("Plato listo. Guardá el menú para publicar.");
  }

  async function save() {
    if (cats.length === 0) return toast.error("Creá al menos una sección.");
    setSaving(true);
    try {
      const res = await saveMenuAction({ categories: cats, products });
      if (!res.ok) throw new Error(res.error);
      setDirty(false);
      toast.success(`Menú al día: ${available.length} platos visibles.`);
    } catch (e) {
      console.error("[menu]", e);
      toast.error(e instanceof Error ? e.message : "No se pudo guardar. Probá de nuevo.");
    } finally {
      setSaving(false);
    }
  }

  async function togglePublish() {
    if (!published && !ready) return toast.error("Completá secciones, platos y precios antes de publicar.");
    setPublishing(true);
    try {
      const res = await setMenuPublishedAction(!published);
      if (!res.ok) throw new Error(res.error);
      setPublished(!published);
      toast.success(!published ? "Tu carta ya está en línea." : "Carta en pausa.");
    } catch (e) {
      console.error("[menu publish]", e);
      toast.error(e instanceof Error ? e.message : "No se pudo cambiar. Probá de nuevo.");
    } finally {
      setPublishing(false);
    }
  }

  function copyLink() {
    const url = `${window.location.origin}/menu/${slug}`;
    navigator.clipboard.writeText(url).then(() => toast.success("Enlace copiado."), () => toast.error("No se pudo copiar."));
  }

  const checks = [
    { ok: cats.length > 0, label: cats.length > 0 ? `${cats.length} secciones` : "Creá 1 sección" },
    { ok: available.length > 0, label: available.length > 0 ? `${available.length} platos visibles` : "Activá 1 plato" },
    { ok: available.some((p) => (p.variants?.[0]?.price ?? p.price) > 0), label: "Precios cargados" },
  ];

  return (
    <MenuEditorLayout
      left={
        <div className="flex flex-col gap-4">
          <div className="flex flex-wrap items-center gap-x-5 gap-y-2 rounded-2xl border border-border bg-card px-5 py-4">
            <p className="text-sm"><strong className="tabular-nums">{products.length}</strong> <span className="text-muted-foreground">platos</span></p>
            <p className="text-sm"><strong className="tabular-nums text-emerald-600">{available.length}</strong> <span className="text-muted-foreground">visibles</span></p>
            <p className="text-sm"><strong className="tabular-nums">{cats.length}</strong> <span className="text-muted-foreground">secciones</span></p>
            {dirty && <Badge className="ml-auto bg-[#6D28D9]">Cambios sin guardar</Badge>}
          </div>

          <section className="rounded-2xl border border-border bg-card p-5 sm:p-6">
            <div className="flex items-center gap-2">
              <h2 className="text-base font-semibold tracking-tight">Estado de tu carta</h2>
              <Badge variant={published ? "default" : "secondary"} className={published ? "bg-emerald-600" : ""}>{published ? "En línea" : "Borrador"}</Badge>
            </div>
            <ul className="mt-3 space-y-1.5">
              {checks.map((c) => (
                <li key={c.label} className="flex items-center gap-2 text-[13px]">
                  {c.ok ? <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-600" /> : <CircleAlert className="h-4 w-4 shrink-0 text-amber-500" />}
                  <span className={c.ok ? "" : "text-muted-foreground"}>{c.label}</span>
                </li>
              ))}
            </ul>
            <div className="mt-3 flex flex-col gap-2 sm:flex-row">
              <Button onClick={togglePublish} disabled={publishing} className="min-h-10 flex-1 bg-[#0A2540] hover:bg-[#0A2540]/90">
                {publishing ? "Cambiando..." : published ? "Pausar carta" : "Publicar carta"}
              </Button>
              <Button variant="outline" onClick={copyLink} className="min-h-10"><Copy className="h-4 w-4" /> Copiar enlace</Button>
              <Button variant="outline" asChild className="min-h-10"><a href={`/menu/${slug}`} target="_blank" rel="noreferrer"><ExternalLink className="h-4 w-4" /></a></Button>
            </div>
          </section>

          <section className="rounded-2xl border border-border bg-card p-5 sm:p-6">
            <div className="flex items-center justify-between gap-2">
              <h2 className="text-base font-semibold tracking-tight">Secciones</h2>
              <DropdownMenu>
                <DropdownMenuTrigger className="flex items-center gap-1 rounded-lg px-2 py-1.5 text-xs font-medium text-muted-foreground outline-none hover:bg-muted">
                  Ordenar <ChevronDown className="h-3.5 w-3.5" />
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem onClick={() => setCollapsed(new Set())}><UnfoldVertical className="h-4 w-4" /> Abrir todas</DropdownMenuItem>
                  <DropdownMenuItem onClick={() => setCollapsed(new Set(cats.map((c) => c.id)))}><FoldVertical className="h-4 w-4" /> Cerrar todas</DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
            <div className="mt-3 flex gap-2">
              <Input ref={newCatRef} value={newCat} onChange={(e) => setNewCat(e.target.value)} placeholder="Ej: Postres..." maxLength={60}
                onKeyDown={(e) => { if (e.key === "Enter") addCategory(); }} aria-label="Nueva sección" className="min-h-10" />
              <Button onClick={addCategory} className="min-h-10 shrink-0 bg-[#0A2540] hover:bg-[#0A2540]/90"><Plus className="h-4 w-4" /><span className="hidden sm:inline">Agregar</span></Button>
            </div>
            <div className="mt-2.5 flex flex-wrap gap-1.5">
              {["Entradas", "Fuertes", "Postres", "Bebidas"].map((s) => (
                <button key={s} type="button" onClick={() => setNewCat(s)} className="rounded-full border border-border px-3 py-1 text-xs text-muted-foreground hover:bg-muted hover:text-foreground">+ {s}</button>
              ))}
            </div>
          </section>

          {cats.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-border bg-card px-4 py-10 text-center">
              <p className="text-sm font-semibold">Empezá con “Entradas”</p>
              <p className="mx-auto mt-1 max-w-65 text-[13px] text-muted-foreground">Sin secciones no hay carta. Creá la primera arriba.</p>
            </div>
          ) : (
            <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
              <SortableContext items={cats.map((c) => c.id)} strategy={verticalListSortingStrategy}>
                <div className="flex flex-col gap-3">
                  {cats.map((c) => (
                    <MenuCategoryRow
                      key={c.id} category={c} products={byCat(c.id)} currency={currency}
                      collapsed={collapsed.has(c.id)}
                      moveTargets={cats.filter((x) => x.id !== c.id).map((x) => ({ id: x.id, name: x.name }))}
                      onToggleCollapse={() => setCollapsed((p) => { const n = new Set(p); if (n.has(c.id)) n.delete(c.id); else n.add(c.id); return n; })}
                      onRename={(name) => touchCats(cats.map((x) => (x.id === c.id ? { ...x, name: name.trim() } : x)))}
                      onDelete={() => {
                        if (byCat(c.id).length > 0) return toast.error("Mové o borrá sus platos primero.");
                        touchCats(cats.filter((x) => x.id !== c.id).map((x, idx) => ({ ...x, order: idx })));
                      }}
                      onAddProduct={() => setSheet({ mode: "create", categoryId: c.id })}
                      onEditProduct={(p) => setSheet({ mode: "edit", product: p, categoryId: p.categoryId })}
                      onToggleActive={(id, v) => touchProducts(products.map((p) => (p.id === id ? { ...p, available: v } : p)))}
                      onToggleTakeAway={(id, v) => touchProducts(products.map((p) => (p.id === id ? { ...p, takeAway: v } : p)))}
                      onDuplicate={(id) => {
                        const src = products.find((p) => p.id === id);
                        if (!src) return;
                        if (products.length >= 500) return toast.error("Máximo 500 platos.");
                        touchProducts([...products, {
                          ...src, id: newId("prd"), name: `${src.name} (copia)`,
                          variants: src.variants?.map((v) => ({ ...v, id: newId("var") })),
                          modifierGroups: src.modifierGroups?.map((g) => ({ ...g, id: newId("grp"), modifiers: g.modifiers.map((m) => ({ ...m, id: newId("mod") })) })),
                        }]);
                      }}
                      onMoveProduct={(id, catId) => touchProducts(products.map((p) => (p.id === id ? { ...p, categoryId: catId } : p)))}
                      onDeleteProduct={(id) => touchProducts(products.filter((p) => p.id !== id))}
                    />
                  ))}
                </div>
              </SortableContext>
            </DndContext>
          )}

          <div className="sticky bottom-0 -mx-1 border-t border-border bg-background/95 px-1 py-3 backdrop-blur">
            <Button onClick={save} disabled={saving} className="min-h-11 w-full bg-[#0A2540] text-[15px] hover:bg-[#0A2540]/90 sm:w-auto sm:px-10">
              {saving ? "Guardando..." : dirty ? "Guardar menú" : "Menú al día"}
            </Button>
          </div>
        </div>
      }
      preview={<CartaPhonePreview slug={slug} appearance={appearance} categories={cats} products={products} currency={currency ?? null} hours={hours ?? ""} />}
    />
  );
}
