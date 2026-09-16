"use client";

import { useMemo, useRef, useState } from "react";
import {
  CheckCircle2, ChevronDown, CircleAlert, Copy, ExternalLink,
  FoldVertical, Plus, UnfoldVertical, ArrowRight,
} from "lucide-react";
import {
  DndContext, closestCenter, PointerSensor, TouchSensor,
  useSensor, useSensors, type DragEndEvent,
} from "@dnd-kit/core";
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

const TEMPLATES = [
  { name: "Entradas", desc: "Tapas, picadas" },
  { name: "Fuertes", desc: "Platos principales" },
  { name: "Postres", desc: "Dulces y más" },
  { name: "Bebidas", desc: "Líquidos y cócteles" },
];

const STEPS = [
  { num: 1, title: "Creá una sección", desc: "Ej: Entradas, Fuertes, Postres… Organizá tu carta en grupos." },
  { num: 2, title: "Agregá platos con precios", desc: "Dale nombre, precio y descripción a cada plato de la sección." },
  { num: 3, title: "Publicá tu carta", desc: "Cuando estén listos, publicala y compartila con tus clientes." },
];

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
  const [inputFocused, setInputFocused] = useState(false);
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

  function handleTemplateClick(name: string) {
    setNewCat(name);
    setTimeout(() => newCatRef.current?.focus(), 0);
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
    } finally { setSaving(false); }
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
    } finally { setPublishing(false); }
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

  const inputCls = `min-h-10 transition-all duration-200${inputFocused ? " border-[#6D28D9] ring-2 ring-[#6D28D9]/20" : ""}`;
  const btnPrimary = "min-h-10 shrink-0 bg-[#0A2540] text-white transition-all duration-200 hover:bg-[#0A2540]/90 hover:shadow-md active:scale-[0.98] focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2";
  const btnGhost = "transition-all duration-150 hover:bg-muted focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2";

  return (
    <MenuEditorLayout
      left={
        <div className="flex flex-col gap-4">
          {/* Stats bar */}
          <div className="flex flex-wrap items-center gap-x-5 gap-y-2 rounded-2xl border border-border bg-card px-5 py-4">
            <p className="text-sm"><strong className="tabular-nums">{products.length}</strong> <span className="text-muted-foreground">platos</span></p>
            <p className="text-sm"><strong className="tabular-nums text-emerald-600">{available.length}</strong> <span className="text-muted-foreground">visibles</span></p>
            <p className="text-sm"><strong className="tabular-nums">{cats.length}</strong> <span className="text-muted-foreground">secciones</span></p>
            {dirty && <Badge className="ml-auto animate-pulse bg-[#6D28D9] text-white">Cambios sin guardar</Badge>}
          </div>

          {/* Estado de tu carta */}
          <section className="rounded-2xl border border-border bg-card p-5 sm:p-6">
            <div className="flex items-center gap-2">
              <h2 className="text-base font-semibold tracking-tight">Estado de tu carta</h2>
              <Badge variant={published ? "default" : "secondary"} className={published ? "bg-emerald-600 text-white" : ""}>
                {published ? "En línea" : "Borrador"}
              </Badge>
            </div>
            <ul className="mt-3 space-y-1.5">
              {checks.map((c) => (
                <li key={c.label} className="flex items-center gap-2 text-[13px]">
                  {c.ok ? <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-600" /> : <CircleAlert className="h-4 w-4 shrink-0 text-amber-500" />}
                  <span className={c.ok ? "" : "text-muted-foreground"}>{c.label}</span>
                </li>
              ))}
            </ul>
            <div className="mt-4 flex flex-col gap-2 sm:flex-row">
              <Button onClick={togglePublish} disabled={publishing}
                className="min-h-10 flex-1 bg-[#0A2540] text-white transition-all duration-200 hover:bg-[#0A2540]/90 hover:shadow-md active:scale-[0.98]">
                {publishing ? "Cambiando..." : published ? "Pausar carta" : "Publicar carta"}
              </Button>
              <Button variant="outline" onClick={copyLink} className={`min-h-10 ${btnGhost}`}>
                <Copy className="h-4 w-4" /> Copiar enlace
              </Button>
              <Button variant="outline" asChild className={`min-h-10 ${btnGhost}`}>
                <a href={`/menu/${slug}`} target="_blank" rel="noreferrer" aria-label="Abrir menú en nueva pestaña"><ExternalLink className="h-4 w-4" /></a>
              </Button>
            </div>
          </section>

          {/* Secciones */}
          <section className="rounded-2xl border border-border bg-card p-5 sm:p-6">
            <div className="flex items-center justify-between gap-2">
              <h2 className="text-base font-semibold tracking-tight">Secciones</h2>
              <DropdownMenu>
                <DropdownMenuTrigger className="flex min-h-10 min-w-10 items-center gap-1 rounded-lg px-2 py-1.5 text-xs font-medium text-muted-foreground outline-none transition-colors duration-150 hover:bg-muted focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2">
                  Ordenar <ChevronDown className="h-3.5 w-3.5" />
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem onClick={() => setCollapsed(new Set())}><UnfoldVertical className="h-4 w-4" /> Abrir todas</DropdownMenuItem>
                  <DropdownMenuItem onClick={() => setCollapsed(new Set(cats.map((c) => c.id)))}><FoldVertical className="h-4 w-4" /> Cerrar todas</DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
            <div className="mt-3 flex gap-2">
              <Input ref={newCatRef} value={newCat} onChange={(e) => setNewCat(e.target.value)}
                placeholder="Ej: Postres, Bebidas, Especiales…" maxLength={60} disabled={cats.length >= 100}
                onFocus={() => setInputFocused(true)} onBlur={() => setInputFocused(false)}
                onKeyDown={(e) => { if (e.key === "Enter") addCategory(); }}
                aria-label="Nueva sección" className={inputCls} />
              <Button onClick={addCategory} disabled={!newCat.trim() || cats.length >= 100} className={btnPrimary} aria-label="Agregar sección">
                <Plus className="h-4 w-4" /><span className="hidden sm:inline">Agregar</span>
              </Button>
            </div>
            {/* Template chips */}
            <div className="mt-3 flex flex-wrap gap-2">
              {TEMPLATES.map((t) => (
                <button key={t.name} type="button" onClick={() => handleTemplateClick(t.name)}
                  className="group flex items-center gap-1.5 rounded-full border border-[#6D28D9]/20 bg-[#6D28D9]/5 px-3.5 py-1.5 text-xs font-medium text-[#6D28D9] transition-all duration-200 hover:border-[#6D28D9]/40 hover:bg-[#6D28D9]/10 hover:shadow-sm active:scale-[0.97] focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2">
                  <span className="hidden sm:inline">{t.name}<span className="ml-1 text-[11px] font-normal text-[#6D28D9]/60">· {t.desc}</span></span>
                  <span className="sm:hidden">+ {t.name}</span>
                  <ArrowRight className="h-3 w-3 opacity-0 transition-all duration-200 group-hover:translate-x-0.5 group-hover:opacity-100" />
                </button>
              ))}
            </div>
          </section>

          {/* Empty state / Category list */}
          {cats.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-[#6D28D9]/30 bg-card px-5 py-8 sm:px-8">
              <p className="text-center text-sm font-semibold text-[#0A2540]">Armá tu carta en 3 pasos</p>
              <div className="mt-5 flex flex-col gap-4">
                {STEPS.map((step) => (
                  <div key={step.num} className="flex items-start gap-3">
                    <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[#6D28D9] text-xs font-bold text-white shadow-md">{step.num}</div>
                    <div className="pt-0.5">
                      <p className="text-sm font-medium text-[#0A2540]">{step.title}</p>
                      <p className="mt-0.5 text-[13px] leading-relaxed text-muted-foreground">{step.desc}</p>
                    </div>
                  </div>
                ))}
              </div>
              <p className="mt-5 text-center text-xs text-muted-foreground">Empezá creando una sección arriba.</p>
            </div>
          ) : (
            <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
              <SortableContext items={cats.map((c) => c.id)} strategy={verticalListSortingStrategy}>
                <div className="flex flex-col gap-3">
                  {cats.map((c) => (
                    <MenuCategoryRow key={c.id} category={c} products={byCat(c.id)} currency={currency}
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

          {/* Sticky save */}
          <div className="sticky bottom-0 -mx-1 border-t border-border bg-background/95 px-1 py-3 backdrop-blur">
            <Button onClick={save} disabled={saving}
              className="min-h-11 w-full bg-[#0A2540] text-[15px] text-white transition-all duration-200 hover:bg-[#0A2540]/90 hover:shadow-md active:scale-[0.98] sm:w-auto sm:px-10">
              {saving ? "Guardando..." : dirty ? "Guardar menú" : "Menú al día"}
            </Button>
          </div>
        </div>
      }
      preview={<CartaPhonePreview slug={slug} appearance={appearance} categories={cats} products={products} currency={currency ?? null} hours={hours ?? ""} />}
    />
  );
}
