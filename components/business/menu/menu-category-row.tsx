"use client";

import { ChevronDown, ChevronUp, Copy, Eye, EyeOff, FolderInput, GripVertical, MoreVertical, Pencil, Plus, ShoppingBag, Trash2 } from "lucide-react";
import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuPortal,
  DropdownMenuSeparator, DropdownMenuSub, DropdownMenuSubContent, DropdownMenuSubTrigger, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Separator } from "@/components/ui/separator";
import { formatPrice, productMinPrice, type RestaurantCategory, type RestaurantProduct } from "@/lib/restaurant-theme";

export function MenuCategoryRow({
  category, products, currency, collapsed, moveTargets,
  onToggleCollapse, onRename, onDelete, onAddProduct,
  onEditProduct, onToggleActive, onToggleTakeAway, onDuplicate, onMoveProduct, onDeleteProduct,
}: {
  category: RestaurantCategory;
  products: RestaurantProduct[];
  currency: string | null | undefined;
  collapsed: boolean;
  moveTargets: { id: string; name: string }[];
  onToggleCollapse: () => void;
  onRename: (name: string) => void;
  onDelete: () => void;
  onAddProduct: () => void;
  onEditProduct: (p: RestaurantProduct) => void;
  onToggleActive: (id: string, v: boolean) => void;
  onToggleTakeAway: (id: string, v: boolean) => void;
  onDuplicate: (id: string) => void;
  onMoveProduct: (id: string, catId: string) => void;
  onDeleteProduct: (id: string) => void;
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: category.id });
  const style = { transform: CSS.Transform.toString(transform), transition };

  return (
    <div ref={setNodeRef} style={style} className={`rounded-2xl border border-border bg-card p-4 transition-opacity sm:p-5 ${isDragging ? "opacity-50" : ""}`}>
      <div className="flex items-center gap-2">
        <button type="button" {...attributes} {...listeners} aria-label={`Reordenar ${category.name}`}
          className="shrink-0 cursor-grab touch-none rounded p-1 text-muted-foreground active:cursor-grabbing focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2">
          <GripVertical className="h-4 w-4" />
        </button>
        <div className="min-w-0 flex-1">
          <input
            defaultValue={category.name} key={category.id + category.name}
            onBlur={(e) => { if (e.target.value.trim() && e.target.value.trim() !== category.name) onRename(e.target.value); }}
            onKeyDown={(e) => { if (e.key === "Enter") e.currentTarget.blur(); }}
            aria-label="Nombre de categoría" maxLength={60}
            className="w-full truncate bg-transparent text-[15px] font-semibold outline-none focus:border-b focus:border-[#6D28D9]"
          />
          <p className="text-xs tabular-nums text-muted-foreground">{products.length} platos</p>
        </div>
        <button type="button" onClick={onAddProduct}
          className="cursor-pointer shrink-0 whitespace-nowrap rounded-full border border-[#0A2540] px-3 py-1.5 text-xs font-semibold text-[#0A2540] hover:bg-[#0A2540]/5 focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2">
          + Producto
        </button>
        <DropdownMenu>
          <DropdownMenuTrigger aria-label="Opciones de categoría" className="min-h-10 min-w-10 rounded-full p-1.5 text-muted-foreground outline-none hover:bg-muted focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2">
            <MoreVertical className="h-4 w-4" />
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={onDelete} className="text-destructive"><Trash2 className="h-4 w-4" /> Borrar categoría</DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
        <button type="button" onClick={onToggleCollapse} aria-label={collapsed ? "Expandir" : "Colapsar"}
          className="cursor-pointer flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-muted text-muted-foreground hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2">
          {collapsed ? <ChevronDown className="h-4 w-4" /> : <ChevronUp className="h-4 w-4" />}
        </button>
      </div>

      {!collapsed && (
        <>
          <ul className="mt-2 divide-y divide-border">
            {products.map((p) => {
              const multi = (p.variants?.length ?? 0) > 1;
              return (
                <li key={p.id} className="flex items-center gap-2 py-2.5">
                  <button type="button" onClick={() => onEditProduct(p)} aria-label={`Editar ${p.name}`}
                    className="cursor-pointer flex min-w-0 flex-1 items-center gap-3 text-left">
                    <span className="flex h-11 w-11 shrink-0 items-center justify-center overflow-hidden rounded-lg bg-muted text-sm font-bold text-muted-foreground">
                      {p.imageUrl ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={p.imageUrl} alt="" className="h-full w-full object-cover" />
                      ) : (
                        p.name.charAt(0).toUpperCase()
                      )}
                    </span>
                    <span className="min-w-0">
                      <span className={`block truncate text-sm font-medium ${p.available ? "" : "text-muted-foreground"}`}>{p.name}</span>
                      <span className="block truncate text-xs text-muted-foreground">
                        {!p.available ? "Pausado · " : ""}
                        {(p.modifierGroups?.length ?? 0) > 0 ? `+${p.modifierGroups!.length} grupos · ` : ""}
                        {(p.variants?.length ?? 0) > 0 ? `${p.variants!.length} variantes` : "Precio único"}
                      </span>
                    </span>
                  </button>
                  <Separator orientation="vertical" className="h-4" />
                  <p className="shrink-0 text-sm font-semibold tabular-nums">
                    {multi ? <span className="mr-1 text-[11px] font-normal text-muted-foreground">desde</span> : null}
                    {formatPrice(productMinPrice(p), currency ?? "COP")}
                  </p>
                  <button type="button" onClick={() => onToggleTakeAway(p.id, !(p.takeAway !== false))} disabled={false}
                    title={(p.takeAway !== false) ? "Llevar activado" : "Llevar desactivado"}
                    aria-label={`Llevar ${p.name}`}
                    className={`cursor-pointer disabled:cursor-not-allowed flex h-11 w-11 items-center justify-center rounded-lg ${(p.takeAway !== false) ? "text-[#0A2540]" : "text-muted-foreground/50"} focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2`}>
                    <ShoppingBag className="h-5 w-5" />
                  </button>
                  <button type="button" onClick={() => onToggleActive(p.id, !p.available)}
                    title={p.available ? "Pausar" : "Activar"} aria-label={`${p.available ? "Pausar" : "Activar"} ${p.name}`}
                    className={`cursor-pointer flex h-11 w-11 items-center justify-center rounded-lg ${p.available ? "text-[#0A2540]" : "text-muted-foreground/50"} focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2`}>
                    {p.available ? <Eye className="h-5 w-5" /> : <EyeOff className="h-5 w-5" />}
                  </button>
                  <DropdownMenu>
                    <DropdownMenuTrigger aria-label={`Más acciones ${p.name}`} className="min-h-10 min-w-10 rounded-full p-1 text-muted-foreground outline-none hover:bg-muted focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2">
                      <MoreVertical className="h-5 w-5" />
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem onClick={() => onEditProduct(p)}><Pencil className="h-4 w-4" /> Editar</DropdownMenuItem>
                      <DropdownMenuItem onClick={() => onDuplicate(p.id)}><Copy className="h-4 w-4" /> Duplicar</DropdownMenuItem>
                      {moveTargets.length > 0 && (
                        <DropdownMenuSub>
                          <DropdownMenuSubTrigger><FolderInput className="h-4 w-4" /> Mover a...</DropdownMenuSubTrigger>
                          <DropdownMenuPortal>
                            <DropdownMenuSubContent>
                              {moveTargets.map((t) => (
                                <DropdownMenuItem key={t.id} onClick={() => onMoveProduct(p.id, t.id)}>{t.name}</DropdownMenuItem>
                              ))}
                            </DropdownMenuSubContent>
                          </DropdownMenuPortal>
                        </DropdownMenuSub>
                      )}
                      <DropdownMenuSeparator />
                      <DropdownMenuItem onClick={() => onDeleteProduct(p.id)} className="text-destructive"><Trash2 className="h-4 w-4" /> Borrar</DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </li>
              );
            })}
          </ul>
          {products.length === 0 && (
            <button type="button" onClick={onAddProduct}
              className="cursor-pointer flex w-full items-center gap-1.5 py-2.5 text-sm font-medium text-[#6D28D9] hover:text-[#6D28D9]/80">
              <Plus className="h-4 w-4" /> Agregar producto
            </button>
          )}
        </>
      )}
    </div>
  );
}
