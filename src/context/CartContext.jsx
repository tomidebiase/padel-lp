
import { createContext, useEffect, useMemo, useState } from 'react';

export const CartContext = createContext();

function CartProvider({ children }) {
  const [cart, setCart] = useState(() => {
    const savedCart = localStorage.getItem('cart');
    return savedCart ? JSON.parse(savedCart) : [];
  });

  const [confirmedReservations, setConfirmedReservations] = useState(() => {
    const savedReservations = localStorage.getItem('confirmedReservations');
    return savedReservations ? JSON.parse(savedReservations) : [];
  });

  useEffect(() => {
    localStorage.setItem('cart', JSON.stringify(cart));
  }, [cart]);

  useEffect(() => {
    localStorage.setItem(
      'confirmedReservations',
      JSON.stringify(confirmedReservations)
    );
  }, [confirmedReservations]);

  const isSlotInCart = (clubId, courtId, date, schedule) => {
    return cart.some(
      (item) =>
        item.type === 'reservation' &&
        String(item.clubId) === String(clubId) &&
        item.courtId === courtId &&
        item.date === date &&
        item.schedule === schedule
    );
  };

  const isSlotConfirmed = (clubId, courtId, schedule, date) => {
    return confirmedReservations.some(
      (item) =>
        String(item.clubId) === String(clubId) &&
        item.courtId === courtId &&
        item.schedule === schedule &&
        item.date === date
    );
  };

  const addReservationToCart = (reservation) => {
    setCart((prev) => {
      const exists = prev.some(
        (item) =>
          item.type === 'reservation' &&
          String(item.clubId) === String(reservation.clubId) &&
          item.courtId === reservation.courtId &&
          item.schedule === reservation.schedule &&
          item.date === reservation.date
      );

      if (exists) return prev;

      return [
        ...prev,
        {
          ...reservation,
          type: 'reservation',
        },
      ];
    });
  };

  const addProductToCart = (product, quantity = 1) => {
    const safeQuantity = Number(quantity) > 0
      ? Number(quantity)
      : 1;

    setCart((prev) => {
      const existingProduct = prev.find(
        (item) =>
          item.type === 'product' &&
          item.id === product.id
      );

      if (existingProduct) {
        return prev.map((item) =>
          item.type === 'product' &&
          item.id === product.id
            ? {
                ...item,
                quantity: Math.min(
                  item.quantity + safeQuantity,
                  product.stock || item.quantity + safeQuantity
                ),
              }
            : item
        );
      }

      return [
        ...prev,
        {
          id: product.id,
          type: 'product',
          name: product.name,
          brand: product.brand,
          category: product.category,
          price: Number(product.price),
          stock: Number(product.stock || 0),
          image: product.image,
          quantity: safeQuantity,
        },
      ];
    });
  };

  const removeReservationFromCart = (reservationId) => {
    setCart((prev) =>
      prev.filter(
        (item) =>
          !(
            item.type === 'reservation' &&
            item.reservationId === reservationId
          )
      )
    );
  };

  const removeProductFromCart = (productId) => {
    setCart((prev) =>
      prev.filter(
        (item) =>
          !(
            item.type === 'product' &&
            item.id === productId
          )
      )
    );
  };

  const updateProductQuantity = (productId, quantity) => {
    const safeQuantity = Number(quantity);

    if (safeQuantity <= 0) {
      removeProductFromCart(productId);
      return;
    }

    setCart((prev) =>
      prev.map((item) =>
        item.type === 'product' &&
        item.id === productId
          ? {
              ...item,
              quantity: Math.min(
                safeQuantity,
                item.stock || safeQuantity
              ),
            }
          : item
      )
    );
  };

  const clearCart = () => {
    setCart([]);
  };

  const clearCartByClub = (clubId) => {
    setCart((prev) =>
      prev.filter(
        (item) =>
          !(
            item.type === 'reservation' &&
            String(item.clubId) === String(clubId)
          )
      )
    );
  };

  const getTotalPriceByClub = (clubId) => {
    return cart
      .filter(
        (item) =>
          item.type === 'reservation' &&
          String(item.clubId) === String(clubId)
      )
      .reduce(
        (acc, item) => acc + Number(item.price || 0),
        0
      );
  };

  const getProductsTotal = () => {
    return cart
      .filter(
        (item) => item.type === 'product'
      )
      .reduce(
        (acc, item) =>
          acc +
          Number(item.price || 0) *
          Number(item.quantity || 1),
        0
      );
  };

  const cartCount = useMemo(() => {
    return cart.reduce((acc, item) => {
      if (item.type === 'product') {
        return acc + Number(item.quantity || 1);
      }

      return acc + 1;
    }, 0);
  }, [cart]);

  const value = {
    cart,
    cartCount,
    confirmedReservations,

    isSlotInCart,
    isSlotConfirmed,

    addReservationToCart,
    addProductToCart,

    removeReservationFromCart,
    removeProductFromCart,
    updateProductQuantity,

    clearCart,
    clearCartByClub,

    getTotalPriceByClub,
    getProductsTotal,

    setConfirmedReservations,
  };

  return (
    <CartContext.Provider value={value}>
      {children}
    </CartContext.Provider>
  );
}

export default CartProvider;
