import ProductCard, { ProductCardProps } from "./ProductCard";

interface ProductGridProps {
  title: string;
  products: ProductCardProps[];
  columns?: 2 | 3 | 4;
  showViewAll?: boolean;
  viewAllHref?: string;
}

export default function ProductGrid({
  title,
  products,
  columns = 4,
  showViewAll = false,
  viewAllHref = "/",
}: ProductGridProps) {
  const gridCols = {
    2: "grid-cols-2",
    3: "grid-cols-2 md:grid-cols-3",
    4: "grid-cols-2 md:grid-cols-3 lg:grid-cols-4",
  };

  return (
    <section className="py-10">
      <div className="max-w-7xl mx-auto px-4">
        {/* Section header */}
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold text-charcoal">{title}</h2>
          {showViewAll && (
            <a
              href={viewAllHref}
              className="text-sm font-medium text-teal hover:text-teal-dark transition-colors"
            >
              הצג הכל ←
            </a>
          )}
        </div>

        {/* Grid */}
        <div className={`grid ${gridCols[columns]} gap-4`}>
          {products.map((product) => (
            <ProductCard key={product.id} {...product} />
          ))}
        </div>
      </div>
    </section>
  );
}
