import { StarRating } from './StarRating';

interface ProductCardProps {
  product: {
    name: string;
    price: number;
    image: string;
    rating: number;
  };
}

export function ProductCard({ product }: ProductCardProps) {
  return (
    <div className="border rounded-lg overflow-hidden">
      <img
        src={product.image}
        alt={product.name}
        className="w-full aspect-video object-cover"
      />
      <div className="p-4">
        <h3 className="font-medium text-gray-900">{product.name}</h3>
        <div className="mt-2 flex items-center gap-2">
          <StarRating rating={product.rating} />
          <span className="text-sm text-gray-500">({product.rating})</span>
        </div>
        <p className="mt-2 text-lg font-bold text-gray-900">
          ${product.price}
        </p>
        <button className="mt-4 w-full py-2 bg-black text-white rounded-lg">
          Add to Cart
        </button>
      </div>
    </div>
  );
}
