"use client";

import { useMemo, useRef, useState } from "react";
import {
  ChevronDown,
  FoldVertical, List, Plus, UnfoldVertical, ArrowRight, ImagePlus,
} from "lucide-react";
import {
  DndContext, closestCenter, PointerSensor, TouchSensor,
  useSensor, useSensors, type DragEndEvent,
} from "@dnd-kit/core";
import { SortableContext, verticalListSortingStrategy, arrayMove } from "@dnd-kit/sortable";
import { toast } from "sonner";
import { saveAppearanceAction, saveMenuAction } from "@/lib/actions/restaurant";
import { newId, type RestaurantAppearance, type RestaurantCategory, type RestaurantProduct, type WeekSchedule } from "@/lib/restaurant-theme";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { MenuEditorLayout } from "../restaurant/menu-editor-layout";
import { CartaPhonePreview } from "../restaurant/carta-phone-preview";
import { MenuCategoryRow } from "./menu-category-row";
import { ProductSheet, type SheetState } from "./product-sheet";
import type { MenuCopy } from "./menu-copy";
import { MENU_COPY_RESTAURANT } from "./menu-copy";

export function MenuManager({
  initialCategories, initialProducts, appearance, currency, slug, hours, schedule,
  copy = MENU_COPY_RESTAURANT,
}: {
  initialCategories: RestaurantCategory[];
  initialProducts: RestaurantProduct[];
  appearance: RestaurantAppearance;
  currency?: string | null;
  slug: string;
  hours?: string;
  menuPublished: boolean;
  schedule?: WeekSchedule;
  copy?: MenuCopy;
}) {
  const [cats, setCats] = useState<RestaurantCategory[]>([...initialCategories].sort((a, b) => a.order - b.order));
  const [products, setProducts] = useState<RestaurantProduct[]>(initialProducts);
  const [collapsed, setCollapsed] = useState<Set<string>>(new Set());
  const [newCat, setNewCat] = useState("");
  const [sheet, setSheet] = useState<SheetState>(null);
  const [saving, setSaving] = useState(false);
  const [dirty, setDirty] = useState(false);
  const [inputFocused, setInputFocused] = useState(false);
  const [restName, setRestName] = useState(appearance.restaurantName ?? "");
  const [savedName, setSavedName] = useState(appearance.restaurantName ?? "");
  const [savingName, setSavingName] = useState(false);
  const [activeTab, setActiveTab] = useState<string | null>(null);
  const newCatRef = useRef<HTMLInputElement>(null);
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(TouchSensor, { activationConstraint: { delay: 150, tolerance: 5 } }),
  );

  const available = useMemo(() => products.filter((p) => p.available), [products]);
  const byCat = (id: string) => products.filter((p) => p.categoryId === id).sort((a, b) => a.name.localeCompare(b.name));
  const activeCatId = activeTab ?? cats[0]?.id ?? null;
  function scrollToCat(id: string) {
    setActiveTab(id);
    document.getElementById(`menu-cat-${id}`)?.scrollIntoView({ behavior: "smooth", block: "start" });
  }
  function focusNewCat() {
    document.getElementById("menu-secciones")?.scrollIntoView({ behavior: "smooth", block: "start" });
    setTimeout(() => newCatRef.current?.focus(), 300);
  }

  function touchCats(next: RestaurantCategory[]) { setCats(next); setDirty(true); }
  function touchProducts(next: RestaurantProduct[]) { setProducts(next); setDirty(true); }

  function addCategory() {
    const n = newCat.trim();
    if (!n) return toast.error(`Escribí un nombre: ej. ${copy.sectionExample}.`);
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
    toast.success(`${copy.itemCap} listo. Guardá el ${copy.menuNoun} para publicar.`);
  }

  async function save() {
    if (cats.length === 0) return toast.error("Creá al menos una sección.");
    setSaving(true);
    try {
      const res = await saveMenuAction({ categories: cats, products });
      if (!res.ok) throw new Error(res.error);
      setDirty(false);
      toast.success(`${copy.menuNounCap} al día: ${available.length} ${copy.itemPlural} visibles.`);
    } catch (e) {
      console.error("[menu]", e);
      toast.error(e instanceof Error ? e.message : "No se pudo guardar. Probá de nuevo.");
    } finally { setSaving(false); }
  }

  async function commitName() {
    const next = restName.trim().slice(0, 120);
    if (!next || next === savedName) { setRestName(savedName); return; }
    setSavingName(true);
    try {
      const res = await saveAppearanceAction({ ...appearance, restaurantName: next });
      if (!res.ok) throw new Error(res.error);
      setSavedName(next);
      setRestName(next);
      toast.success("Nombre actualizado.");
    } catch (e) {
      console.error("[menu nombre]", e);
      setRestName(savedName);
      toast.error(e instanceof Error ? e.message : "No se pudo guardar. Probá de nuevo.");
    } finally { setSavingName(false); }
  }

  const inputCls = `min-h-10 transition-all duration-200${inputFocused ? " border-[#6D28D9] ring-2 ring-[#6D28D9]/20" : ""}`;
  const btnPrimary = "min-h-10 shrink-0 bg-[#0A2540] text-white transition-all duration-200 hover:bg-[#0A2540]/90 hover:shadow-md active:scale-[0.98] focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2";

  return (
    <MenuEditorLayout
      left={
        <div className="flex flex-col gap-4">
          {/* Banner del local: portada + logo abajo-izquierda + nombre (sin fondo de tarjeta) */}
          <section aria-label="Vista del local">
            <div
              className="relative z-0 flex h-28 items-center justify-center rounded-lg sm:h-32"
              style={{ background: appearance.primary }}
              aria-hidden="true"
            >
              <ImagePlus className="h-7 w-7 text-white/40" />
            </div>
            <div className="flex items-end gap-3 px-5">
              {/* Logo superpuesto al banner al 50%: logo h-24 (96px) con -mt-12 (-48px), por encima del banner */}
              <div className="relative z-10 -mt-12 shrink-0 overflow-hidden rounded-md bg-muted shadow-lg ring-4 ring-card">
                {appearance.logoUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={appearance.logoUrl} alt="" className="h-24 w-24 object-cover" />
                ) : (
                  <span
                    className="flex h-24 w-24 items-center justify-center text-3xl font-extrabold text-white"
                    style={{ background: appearance.secondary }}
                    aria-hidden="true"
                  >
                    {(restName || "M").charAt(0).toUpperCase()}
                  </span>
                )}
              </div>
              <div className="min-w-0 flex-1 pb-1 pt-2">
                <p className="text-[11px] font-medium uppercase tracking-[0.14em] text-muted-foreground">{copy.businessWord}</p>
                <input
                  value={restName}
                  onChange={(e) => setRestName(e.target.value.slice(0, 120))}
                  onBlur={commitName}
                  onKeyDown={(e) => e.key === "Enter" && e.currentTarget.blur()}
                  placeholder={copy.businessFallback}
                  aria-label="Nombre del restaurante"
                  disabled={savingName}
                  className="w-full truncate border-b border-border bg-transparent pb-0.5 text-base font-bold tracking-tight outline-none transition-colors placeholder:font-normal placeholder:text-muted-foreground focus:border-primary"
                />
              </div>
            </div>
            {/* Tabs de categorías: debajo del banner, cada tab salta a su sección */}
            {cats.length > 0 && (
              <div className="mt-3 flex items-center gap-1 overflow-x-auto border-t border-border px-3 py-2">
                <span className="mr-1 inline-flex shrink-0 items-center gap-1.5 rounded-lg bg-[#0A2540] px-3 py-2 text-xs font-semibold text-white">
                  <List className="h-3.5 w-3.5" /> Categorías
                </span>
                {cats.map((c) => {
                  const active = c.id === activeCatId;
                  return (
                    <button
                      key={c.id}
                      type="button"
                      onClick={() => scrollToCat(c.id)}
                      aria-current={active ? "true" : undefined}
                      className={`shrink-0 cursor-pointer whitespace-nowrap border-b-2 px-3 py-2 text-[13px] font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring ${
                        active
                          ? "border-[#0A2540] font-semibold text-[#0A2540]"
                          : "border-transparent text-muted-foreground hover:text-foreground"
                      }`}
                    >
                      {c.name}
                    </button>
                  );
                })}
                <button
                  type="button"
                  onClick={focusNewCat}
                  className="shrink-0 cursor-pointer whitespace-nowrap px-3 py-2 text-[13px] font-medium text-[#6D28D9] hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                >
                  + Añadir categoría
                </button>
              </div>
            )}
          </section>

          {/* Secciones */}
          <section id="menu-secciones" className="scroll-mt-24 rounded-2xl border border-border bg-card p-5 sm:p-6">
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
                placeholder={copy.sectionPlaceholder} maxLength={60} disabled={cats.length >= 100}
                onFocus={() => setInputFocused(true)} onBlur={() => setInputFocused(false)}
                onKeyDown={(e) => { if (e.key === "Enter") addCategory(); }}
                aria-label="Nueva sección" className={inputCls} />
              <Button onClick={addCategory} disabled={!newCat.trim() || cats.length >= 100} className={btnPrimary} aria-label="Agregar sección">
                <Plus className="h-4 w-4" /><span className="hidden sm:inline">Agregar</span>
              </Button>
            </div>
            {/* Template chips */}
            <div className="mt-3 flex flex-wrap gap-2">
              {copy.templates.map((t) => (
                <button key={t.name} type="button" onClick={() => handleTemplateClick(t.name)}
                  className="cursor-pointer group flex items-center gap-1.5 rounded-full border border-border bg-muted/60 px-3 py-1 text-[11px] font-normal text-muted-foreground transition-all duration-200 hover:border-muted-foreground/30 hover:bg-muted hover:text-foreground hover:shadow-sm active:scale-[0.97] focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2">
                  <span className="hidden sm:inline">{t.name}<span className="ml-1 text-[10px] font-normal text-muted-foreground/70">· {t.desc}</span></span>
                  <span className="sm:hidden">+ {t.name}</span>
                  <ArrowRight className="h-2.5 w-2.5 opacity-0 transition-all duration-200 group-hover:translate-x-0.5 group-hover:opacity-100" />
                </button>
              ))}
            </div>
          </section>

          {/* Category list (sin empty-state de onboarding: la carta arranca con seed) */}
          {cats.length > 0 && (
            <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
              <SortableContext items={cats.map((c) => c.id)} strategy={verticalListSortingStrategy}>
                <div className="flex flex-col gap-3">
                  {cats.map((c) => (
                    <div key={c.id} id={`menu-cat-${c.id}`} className="scroll-mt-24">
                    <MenuCategoryRow category={c} products={byCat(c.id)} currency={currency}
                      itemPlural={copy.itemPlural}
                      takeAwayWord={copy.takeAwayWord}
                      collapsed={collapsed.has(c.id)}
                      moveTargets={cats.filter((x) => x.id !== c.id).map((x) => ({ id: x.id, name: x.name }))}
                      onToggleCollapse={() => setCollapsed((p) => { const n = new Set(p); if (n.has(c.id)) n.delete(c.id); else n.add(c.id); return n; })}
                      onRename={(name) => touchCats(cats.map((x) => (x.id === c.id ? { ...x, name: name.trim() } : x)))}
                      onDelete={() => {
                        if (byCat(c.id).length > 0) return toast.error(`Mové o borrá sus ${copy.itemPlural} primero.`);
                        touchCats(cats.filter((x) => x.id !== c.id).map((x, idx) => ({ ...x, order: idx })));
                      }}
                      onAddProduct={() => setSheet({ mode: "create", categoryId: c.id })}
                      onEditProduct={(p) => setSheet({ mode: "edit", product: p, categoryId: p.categoryId })}
                      onToggleActive={(id, v) => touchProducts(products.map((p) => (p.id === id ? { ...p, available: v } : p)))}
                      onToggleTakeAway={(id, v) => touchProducts(products.map((p) => (p.id === id ? { ...p, takeAway: v } : p)))}
                      onDuplicate={(id) => {
                        const src = products.find((p) => p.id === id);
                        if (!src) return;
                        if (products.length >= 500) return toast.error(`Máximo 500 ${copy.itemPlural}.`);
                        touchProducts([...products, {
                          ...src, id: newId("prd"), name: `${src.name} (copia)`,
                          variants: src.variants?.map((v) => ({ ...v, id: newId("var") })),
                          modifierGroups: src.modifierGroups?.map((g) => ({ ...g, id: newId("grp"), modifiers: g.modifiers.map((m) => ({ ...m, id: newId("mod") })) })),
                        }]);
                      }}
                      onMoveProduct={(id, catId) => touchProducts(products.map((p) => (p.id === id ? { ...p, categoryId: catId } : p)))}
                      onDeleteProduct={(id) => touchProducts(products.filter((p) => p.id !== id))}
                    />
                    </div>
                  ))}
                </div>
              </SortableContext>
            </DndContext>
          )}

          {/* Barra guardar estática al final del flujo (no flotante) */}
          {cats.length > 0 && (
            <div className="rounded-xl border border-border bg-card p-3 sm:p-4">
              <Button onClick={save} disabled={saving}
                className="min-h-11 w-full bg-[#0A2540] text-[15px] text-white transition-all duration-200 hover:bg-[#0A2540]/90 hover:shadow-md active:scale-[0.98] sm:w-auto sm:px-10">
                {saving ? "Guardando..." : dirty ? `Guardar ${copy.menuNoun}` : `${copy.menuNounCap} al día`}
              </Button>
            </div>
          )}
          <ProductSheet
            state={sheet}
            categories={cats}
            copy={copy}
            onClose={() => setSheet(null)}
            onSave={saveSheetProduct}
          />
        </div>
      }
      preview={<CartaPhonePreview slug={slug} appearance={appearance} categories={cats} products={products} currency={currency ?? null} hours={hours ?? ""} restaurantName={restName || appearance.restaurantName} schedule={schedule} linkBase={copy.linkBase} menuNounCap={copy.menuNounCap} variant={copy.linkBase === "catalogo" ? "catalog" : "restaurant"} />}
    />
  );
}
