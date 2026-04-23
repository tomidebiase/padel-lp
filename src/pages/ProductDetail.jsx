import { useContext, useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { CartContext } from '../context/CartContext';
import { getProductById } from '../firebase/products';

function ProductDetail() {
  const navigate = useNavigate();
  const { id } = useParams();
  const { addProductToCart } = useContext(CartContext);

  const [product, setProduct] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [quantity, setQuantity] = useState(1);
  const [message, setMessage] = useState('');

  useEffect(() => {
    const loadProduct = async () => {
      try {
        setIsLoading(true);
        const data = await getProductById(id);
        setProduct(data || null);
      } catch (error) {
        console.error('Error cargando producto:', error);
        setProduct(null);
      } finally {
        setIsLoading(false);
      }
    };

    loadProduct();
  }, [id]);

  const handleGoBack = () => {
    navigate(-1);
  };

  const handleDecrease = () => {
    setQuantity((prev) => (prev > 1 ? prev - 1 : 1));
  };

  const handleIncrease = () => {
    if (!product) return;
    setQuantity((prev) => (prev < product.stock ? prev + 1 : prev));
  };

  const handleAddToCart = () => {
    if (!product || product.stock <= 0) return;

    addProductToCart(product, quantity);
    setMessage('Producto agregado al carrito.');
  };

  if (isLoading) {
    return (
      <section>
        <div className="checkout-form-card">
          <p>Cargando producto...</p>
        </div>
      </section>
    );
  }

  if (!product) {
    return (
      <section>
        <div className="checkout-form-card">
          <h1>Producto no encontrado</h1>

          <div className="detail-actions">
            <button className="secondary-button" onClick={handleGoBack}>
              ← Volver
            </button>
          </div>
        </div>
      </section>
    );
  }

  return (
    <section className="product-detail-page">
      <div className="product-detail-card">
        <div className="product-detail-image-wrapper">
          <img
            src={product.image}
            alt={product.name}
            className="product-detail-image"
          />
        </div>

        <div className="product-detail-content">
          <p className="product-detail-brand">{product.brand}</p>
          <h1>{product.name}</h1>
          <p className="product-detail-price">
            ${Number(product.price).toLocaleString('es-AR')}
          </p>
          <p className="product-detail-description">{product.description}</p>

          <div className="product-detail-meta">
            <p>
              <strong>Categoría:</strong> {product.category}
            </p>
            <p>
              <strong>Stock:</strong> {product.stock}
            </p>
          </div>

          {message && <p className="checkout-message">{message}</p>}

          {product.stock > 0 ? (
            <div className="product-quantity-box">
              <span className="product-quantity-label">Cantidad</span>

              <div className="product-quantity-controls">
                <button
                  type="button"
                  className="secondary-button"
                  onClick={handleDecrease}
                >
                  -
                </button>

                <span className="product-quantity-value">{quantity}</span>

                <button
                  type="button"
                  className="secondary-button"
                  onClick={handleIncrease}
                >
                  +
                </button>
              </div>

              <button
                type="button"
                className="primary-button"
                onClick={handleAddToCart}
              >
                Agregar al carrito
              </button>
            </div>
          ) : (
            <div className="checkout-form-card">
              <p>Producto sin stock.</p>
            </div>
          )}

          <div className="detail-actions">
            <button className="secondary-button" onClick={handleGoBack}>
              ← Volver
            </button>
          </div>
        </div>
      </div>
    </section>
  );
}

export default ProductDetail;