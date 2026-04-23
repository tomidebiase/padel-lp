import { Link } from 'react-router-dom';

function ProductCard({ product }) {
  return (
    <article className="product-card">
      <div className="product-card-image-wrapper">
        <img
          src={product.image}
          alt={product.name}
          className="product-card-image"
        />
      </div>

      <div className="product-card-content">
        <p className="product-card-brand">{product.brand}</p>
        <h3>{product.name}</h3>
        <p className="product-card-price">
          ${Number(product.price).toLocaleString('es-AR')}
        </p>

        <Link className="card-link" to={`/producto/${product.id}`}>
          Ver detalle
        </Link>
      </div>
    </article>
  );
}

export default ProductCard;