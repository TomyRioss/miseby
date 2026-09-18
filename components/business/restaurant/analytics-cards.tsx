import { AnalyticsChecklist, type ChecklistItem } from "./analytics-checklist";
import { AnalyticsClicksChart, type ClickDatum } from "./analytics-clicks-chart";
import { AnalyticsHealth } from "./analytics-health";
import { AnalyticsNextStep } from "./analytics-next-step";
import { AnalyticsSectionsStatus, type SectionDatum } from "./analytics-sections-status";
import { AnalyticsTopDishes, type DishDatum } from "./analytics-top-dishes";

export type AnalyticsCardsProps = {
  categories: number;
  products: number;
  available: number;
  linkClicks: number;
  menuPublished: boolean;
  planName?: string;
  clickData: ClickDatum[];
  dishes: DishDatum[];
  sections: SectionDatum[];
  checklist: ChecklistItem[];
};

export function AnalyticsCards({
  categories,
  products,
  available,
  linkClicks,
  menuPublished,
  planName,
  clickData,
  dishes,
  sections,
  checklist,
}: AnalyticsCardsProps) {
  const steps = [
    {
      done: categories > 0,
      label: "1 sección mínima",
      detail: "para ordenar tu carta.",
      href: "/dashboard/categorias",
    },
    {
      done: available > 0,
      label: "1 plato visible",
      detail: "con foto y precio para vender.",
      href: "/dashboard/productos",
    },
    {
      done: menuPublished,
      label: "Carta publicada",
      detail: "para que la vean tus clientes.",
      href: "/dashboard/catalogo",
    },
  ];

  return (
    <div className="space-y-6">
      <div className="grid items-stretch gap-6 lg:grid-cols-5">
        <div className="min-w-0 lg:col-span-3">
          <AnalyticsHealth
            categories={categories}
            products={products}
            available={available}
            linkClicks={linkClicks}
            menuPublished={menuPublished}
            planName={planName}
          />
        </div>
        <div className="min-w-0 lg:col-span-2">
          <AnalyticsNextStep steps={steps} />
        </div>
      </div>

      <div className="grid items-start gap-6 lg:grid-cols-5">
        <div className="min-w-0 lg:col-span-3">
          <AnalyticsClicksChart data={clickData} />
        </div>
        <div className="min-w-0 lg:col-span-2">
          <AnalyticsChecklist items={checklist} />
        </div>
      </div>

      <div className="grid items-start gap-6 lg:grid-cols-2">
        <AnalyticsTopDishes dishes={dishes} totalVisible={available} />
        <AnalyticsSectionsStatus sections={sections} />
      </div>
    </div>
  );
}
