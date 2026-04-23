import { useEffect, useState } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import ProductCard from '../components/ProductCard';
import { getProducts, getProductsByCategory } from '../firebase/products';

function Products() {
  const [searchParams] = useSearchParams();
  const category = searchParams.get('category');

  const [products, setProducts] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const loadProducts = async () => {
      try {
        setIsLoading(true);

        const data = category
          ? await getProductsByCategory(category)
          : await getProducts();

        setProducts(data);
      } catch (error) {
        console.error('Error cargando productos:', error);
        setProducts([]);
      } finally {
        setIsLoading(false);
      }
    };

    loadProducts();
  }, [category]);

  return (
    <section>
      <h1>
        {category
          ? category === 'paletas'
            ? 'Paletas de pádel'
            : 'Pelotas de pádel'
          : 'Productos de pádel'}
      </h1>

      <p>Equipate para jugar mejor con nuestra selección de productos.</p>

      <div className="products-filters">
        <Link className="secondary-button" to="/productos">
          Todos
        </Link>
        <Link className="secondary-button" to="/productos?category=paletas">
          Paletas
        </Link>
        <Link className="secondary-button" to="/productos?category=pelotas">
          Pelotas
        </Link>
      </div>

      {isLoading ? (
        <div className="checkout-form-card">
          <p>Cargando productos...</p>
        </div>
      ) : products.length === 0 ? (
        <div className="checkout-form-card">
          <p>No hay productos para mostrar.</p>
        </div>
      ) : (
        <div className="products-grid">
          {products.map((product) => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>
      )}
    </section>
  );
}

export default Products;