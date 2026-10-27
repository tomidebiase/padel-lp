
import { useEffect, useState } from 'react';
import {
  Link,
  useSearchParams,
} from 'react-router-dom';

import {
  getProducts,
  getProductsByCategory,
} from '../firebase/products';

import './Products.css';

const categories = [
  {
    label: 'Todos los productos',
    value: '',
    path: '/productos',
  },
  {
    label: 'Paletas',
    value: 'paletas',
    path: '/productos?category=paletas',
  },
  {
    label: 'Pelotas',
    value: 'pelotas',
    path: '/productos?category=pelotas',
  },
];

function formatPrice(price) {
  return Number(price || 0).toLocaleString('es-AR');
}

function Products() {
  const [searchParams] = useSearchParams();
  const category = searchParams.get('category') || '';

  const [products, setProducts] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);

  useEffect(() => {
    let cancelled = false;

    const loadProducts = async () => {
      setIsLoading(true);
      setHasError(false);

      try {
        const data = category
          ? await getProductsByCategory(category)
          : await getProducts();

        if (!cancelled) {
          setProducts(data);
        }
      } catch (error) {
        console.error('Error cargando productos:', error);

        if (!cancelled) {
          setProducts([]);
          setHasError(true);
        }
      } finally {
        if (!cancelled) {
          setIsLoading(false);
        }
      }
    };

    loadProducts();

    return () => {
      cancelled = true;
    };
  }, [category]);

  const featuredProduct = products.find(
    (product) => product.category === 'paletas'
  );

  return (
    <section className="pl-shop-page">
      {/* PORTADA */}
      <div className="pl-shop-hero">
        <div className="pl-shop-hero-copy">
          <span className="pl-shop-eyebrow">
            PADELLP / EQUIPAMIENTO
          </span>

          <h1>
            El juego mejora
            <br />
            cuando tenés
            <br />
            <span>el equipo ideal.</span>
          </h1>

          <p>
            Explorá una selección de paletas y pelotas
            para acompañarte en cada partido.
            Encontrá tu próximo favorito.
          </p>

          <a
            href="#catalogo"
            className="pl-shop-hero-button"
          >
            Explorar productos
            <span aria-hidden="true">↗</span>
          </a>
        </div>

        <div
          className="pl-shop-hero-visual"
          aria-hidden="true"
        >
          <div className="pl-shop-hero-orbit" />

          {/* Círculo de fondo para integrar la paleta */}
          <div
            style={{
              position: 'absolute',
              width: 'min(355px, 82%)',
              aspectRatio: '1 / 1',
              borderRadius: '50%',
              background:
                'radial-gradient(circle at 40% 35%, #f2f8ff, #a9ccff)',
              boxShadow:
                '0 0 85px rgba(95, 160, 255, 0.2)',
            }}
          />

          {featuredProduct && (
            <img
              src={featuredProduct.image}
              alt=""
              className="pl-shop-hero-product"
              style={{
                mixBlendMode: 'multiply',
                transform: 'rotate(-8deg)',
              }}
            />
          )}

          <span className="pl-shop-hero-watermark">
            PADEL
          </span>
        </div>

        <div className="pl-shop-hero-footer">
          <span>SPORTS EQUIPMENT</span>
          <span>LA PLATA · ARGENTINA</span>
        </div>
      </div>

      {/* CATÁLOGO */}
      <div className="pl-shop-catalog" id="catalogo">
        <div className="pl-shop-heading">
          <div>
            <span className="pl-shop-overline">
              EQUIPATE PARA JUGAR
            </span>

            <h2>Encontrá tu próximo favorito.</h2>

            <p>
              Paletas, pelotas y equipamiento
              para disfrutar de cada punto.
            </p>
          </div>

          <div className="pl-shop-heading-counter">
            <strong>
              {isLoading
                ? '—'
                : String(products.length).padStart(2, '0')}
            </strong>
            <span>PRODUCTOS</span>
          </div>
        </div>

        <div className="pl-shop-toolbar">
          <div
            className="pl-shop-filters"
            aria-label="Filtrar productos por categoría"
          >
            {categories.map((item) => (
              <Link
                key={item.label}
                to={item.path}
                className={
                  `pl-shop-filter ${
                    category === item.value ? 'active' : ''
                  }`
                }
                aria-current={
                  category === item.value
                    ? 'page'
                    : undefined
                }
              >
                {item.label}
              </Link>
            ))}
          </div>

          <span className="pl-shop-toolbar-label">
            CATÁLOGO DE DEMOSTRACIÓN
          </span>
        </div>

        {isLoading ? (
          <div className="pl-shop-state" role="status">
            Cargando productos...
          </div>
        ) : hasError ? (
          <div className="pl-shop-state" role="alert">
            No pudimos cargar los productos.
            Intentá actualizar la página.
          </div>
        ) : products.length === 0 ? (
          <div className="pl-shop-state">
            <h3>No hay productos en esta categoría.</h3>

            <Link to="/productos">
              Ver todos los productos →
            </Link>
          </div>
        ) : (
          <div className="pl-shop-grid">
            {products.map((product) => (
              <article
                key={product.id}
                className="pl-shop-card"
              >
                <Link
                  to={`/producto/${product.id}`}
                  className="pl-shop-card-image-area"
                  aria-label={`Ver ${product.name}`}
                >
                  <span className="pl-shop-card-category">
                    {product.category === 'paletas'
                      ? 'PALETAS'
                      : 'PELOTAS'}
                  </span>

                  <img
                    src={product.image}
                    alt={product.name}
                    loading="lazy"
                  />

                  <span
                    className="pl-shop-card-image-arrow"
                    aria-hidden="true"
                  >
                    ↗
                  </span>
                </Link>

                <div className="pl-shop-card-content">
                  <div className="pl-shop-card-brand">
                    {product.brand}
                  </div>

                  <h3>{product.name}</h3>

                  <div className="pl-shop-card-price-row">
                    <div>
                      <span className="pl-shop-card-price-label">
                        PRECIO DE REFERENCIA
                      </span>

                      <strong>
                        ${formatPrice(product.price)}
                      </strong>
                    </div>

                    <span className="pl-shop-card-demo">
                      DEMO
                    </span>
                  </div>

                  <Link
                    to={`/producto/${product.id}`}
                    className="pl-shop-card-button"
                  >
                    Ver producto
                    <span aria-hidden="true">→</span>
                  </Link>
                </div>
              </article>
            ))}
          </div>
        )}
      </div>

      {/* BANNER INFERIOR */}
      <div className="pl-shop-bottom">
        <div>
          <span className="pl-shop-bottom-eyebrow">
            PADELLP EXPERIENCE
          </span>

          <h2>Tu próximo partido empieza acá.</h2>

          <p>
            Descubrí clubes y canchas para disfrutar
            de tu deporte favorito.
          </p>
        </div>

        <Link
          to="/clubes"
          className="pl-shop-bottom-button"
        >
          Explorar clubes
          <span aria-hidden="true">↗</span>
        </Link>
      </div>

      <p className="pl-shop-disclaimer">
        Catálogo de demostración. Los precios y el stock
        son ilustrativos; no se realizan ventas ni pagos reales.
      </p>
    </section>
  );
}

export default Products;
