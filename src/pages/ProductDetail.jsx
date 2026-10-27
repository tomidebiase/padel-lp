
import {
  useContext,
  useEffect,
  useState,
} from 'react';

import {
  Link,
  useParams,
} from 'react-router-dom';

import { CartContext } from '../context/CartContext';
import { getProductById } from '../firebase/products';

import './Products.css';

function formatPrice(price) {
  return Number(price || 0).toLocaleString('es-AR');
}

function ProductDetail() {
  const { id } = useParams();

  const { addProductToCart } = useContext(CartContext);

  const [product, setProduct] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [quantity, setQuantity] = useState(1);
  const [message, setMessage] = useState('');

  useEffect(() => {
    let cancelled = false;

    const loadProduct = async () => {
      setIsLoading(true);

      try {
        const data = await getProductById(id);

        if (!cancelled) {
          setProduct(data || null);
          setQuantity(1);
          setMessage('');
        }
      } catch (error) {
        console.error('Error cargando producto:', error);

        if (!cancelled) {
          setProduct(null);
        }
      } finally {
        if (!cancelled) {
          setIsLoading(false);
        }
      }
    };

    loadProduct();

    return () => {
      cancelled = true;
    };
  }, [id]);

  const handleDecrease = () => {
    setQuantity((previous) =>
      Math.max(1, previous - 1)
    );
  };

  const handleIncrease = () => {
    if (!product) return;

    setQuantity((previous) =>
      Math.min(Number(product.stock || 0), previous + 1)
    );
  };

  const handleAddToCart = () => {
    if (!product || product.stock <= 0) return;

    addProductToCart(product, quantity);

    setMessage(
      `${quantity} ${
        quantity === 1 ? 'producto agregado' : 'productos agregados'
      } al carrito de demostración.`
    );
  };

  if (isLoading) {
    return (
      <section className="pl-product-detail-page">
        <div className="pl-product-detail-state">
          Cargando producto...
        </div>
      </section>
    );
  }

  if (!product) {
    return (
      <section className="pl-product-detail-page">
        <div className="pl-product-detail-state">
          <h1>Producto no encontrado</h1>

          <p>
            No pudimos encontrar el producto que buscás.
          </p>

          <Link
            to="/productos"
            className="pl-product-detail-primary"
          >
            Volver a productos →
          </Link>
        </div>
      </section>
    );
  }

  const stock = Number(product.stock || 0);
  const hasStock = stock > 0;

  return (
    <section className="pl-product-detail-page">
      <div className="pl-product-breadcrumb">
        <Link to="/productos">Productos</Link>

        <span>/</span>

        <Link
          to={`/productos?category=${product.category}`}
        >
          {product.category === 'paletas'
            ? 'Paletas'
            : 'Pelotas'}
        </Link>

        <span>/</span>
        <span>{product.name}</span>
      </div>

      <div className="pl-product-detail-layout">
        {/* IMAGEN */}
        <div className="pl-product-detail-gallery">
          <div className="pl-product-detail-photo">
            <span className="pl-product-photo-badge">
              PRODUCTO DEMO
            </span>

            <img
              src={product.image}
              alt={product.name}
            />
          </div>

          <div className="pl-product-gallery-footer">
            <span>
              PADELLP / SPORTS EQUIPMENT
            </span>

            <span>
              {product.brand.toUpperCase()}
            </span>
          </div>
        </div>

        {/* INFORMACIÓN */}
        <div className="pl-product-detail-information">
          <span className="pl-product-detail-overline">
            {product.category === 'paletas'
              ? 'EQUIPAMIENTO / PALETAS'
              : 'EQUIPAMIENTO / PELOTAS'}
          </span>

          <p className="pl-product-detail-brand">
            {product.brand}
          </p>

          <h1>{product.name}</h1>

          <p className="pl-product-detail-description">
            {product.description}
          </p>

          <div className="pl-product-detail-price">
            <span>PRECIO DE REFERENCIA</span>

            <strong>
              ${formatPrice(product.price)}
            </strong>
          </div>

          <div className="pl-product-detail-features">
            <div>
              <span>CATEGORÍA</span>

              <strong>
                {product.category === 'paletas'
                  ? 'Paletas'
                  : 'Pelotas'}
              </strong>
            </div>

            <div>
              <span>STOCK DEMO</span>

              <strong>
                {hasStock
                  ? `${stock} unidades`
                  : 'Sin stock'}
              </strong>
            </div>
          </div>

          <div className="pl-product-detail-demo-notice">
            <span
              className="pl-product-detail-demo-icon"
              aria-hidden="true"
            >
              i
            </span>

            <p>
              Estás viendo un producto de demostración.
              Podés agregarlo al carrito para explorar
              la experiencia, pero las compras y pagos
              reales todavía no están habilitados.
            </p>
          </div>

          {message && (
            <div
              className="pl-product-detail-success"
              role="status"
            >
              <strong>{message}</strong>

              <Link to="/carrito">
                Ir al carrito →
              </Link>
            </div>
          )}

          {hasStock ? (
            <div className="pl-product-detail-buy">
              <span className="pl-product-quantity-label">
                CANTIDAD
              </span>

              <div className="pl-product-detail-buy-row">
                <div className="pl-product-quantity-control">
                  <button
                    type="button"
                    onClick={handleDecrease}
                    disabled={quantity <= 1}
                    aria-label="Disminuir cantidad"
                  >
                    −
                  </button>

                  <span>{quantity}</span>

                  <button
                    type="button"
                    onClick={handleIncrease}
                    disabled={quantity >= stock}
                    aria-label="Aumentar cantidad"
                  >
                    +
                  </button>
                </div>

                <button
                  type="button"
                  className="pl-product-add-button"
                  onClick={handleAddToCart}
                >
                  Agregar al carrito
                  <span aria-hidden="true">↗</span>
                </button>
              </div>
            </div>
          ) : (
            <div className="pl-product-detail-no-stock">
              Producto sin stock en la demostración.
            </div>
          )}

          <Link
            to="/productos"
            className="pl-product-back-link"
          >
            ← Seguir explorando productos
          </Link>
        </div>
      </div>

      {/* MÁS OPCIONES */}
      <div className="pl-product-detail-bottom">
        <div>
          <span>SEGUÍ EXPLORANDO</span>

          <h2>El próximo punto es tuyo.</h2>

          <p>
            Conocé los clubes y las canchas
            que forman parte de PadelLP.
          </p>
        </div>

        <Link to="/clubes">
          Explorar clubes ↗
        </Link>
      </div>
    </section>
  );
}

export default ProductDetail;
