import React, { createContext, useContext, useReducer, useEffect } from 'react';
import { useAuth } from './AuthContext';
import toast from 'react-hot-toast';

const CartContext = createContext(null);

const cartReducer = (state, action) => {
  switch (action.type) {
    case 'ADD_ITEM': {
      const exists = state.items.find(i => i.cartKey === action.payload.cartKey);
      const items = exists
        ? state.items.map(i =>
            i.cartKey === action.payload.cartKey
              ? { ...i, qty: Math.min(i.qty + action.payload.qty, 10) }
              : i
          )
        : [...state.items, action.payload];
      return { ...state, items };
    }
    case 'REMOVE_ITEM':
      return { ...state, items: state.items.filter(i => i.cartKey !== action.payload) };
    case 'UPDATE_QTY':
      return {
        ...state,
        items: state.items.map(i =>
          i.cartKey === action.payload.cartKey
            ? { ...i, qty: Math.min(Math.max(1, action.payload.qty), 10) }
            : i
        ),
      };
    case 'CLEAR':
      return { ...state, items: [] };
    default:
      return state;
  }
};

export const CartProvider = ({ children }) => {
  const [state, dispatch] = useReducer(cartReducer, {
    items: JSON.parse(localStorage.getItem('sc_cart') || '[]'),
  });

  // Persist to localStorage
  useEffect(() => {
    localStorage.setItem('sc_cart', JSON.stringify(state.items));
  }, [state.items]);

  const addItem = (product, opts = {}) => {
    const { selectedSize, selectedFlavour, customMessage, qty = 1 } = opts;

    // Resolve server-side price
    let price = product.price;
    if (selectedSize && product.sizeOptions?.length) {
      const opt = product.sizeOptions.find(s => s.label === selectedSize);
      if (opt) price = opt.price;
    }

    const cartKey = `${product._id}-${selectedSize || 'default'}-${selectedFlavour || 'default'}`;

    dispatch({
      type: 'ADD_ITEM',
      payload: {
        _id: product._id,
        product: product._id,
        cartKey,
        name: product.name,
        image: product.images?.[0]?.url,
        price,
        qty,
        selectedSize,
        selectedFlavour,
        customMessage: customMessage?.slice(0, 80),
      },
    });
    toast.success(`${product.name} added to cart! 🛒`);
  };

  const removeItem  = (cartKey) => dispatch({ type: 'REMOVE_ITEM', payload: cartKey });
  const updateQty   = (cartKey, qty) => dispatch({ type: 'UPDATE_QTY', payload: { cartKey, qty } });
  const clearCart   = () => dispatch({ type: 'CLEAR' });

  const itemCount = state.items.reduce((s, i) => s + i.qty, 0);
  const subtotal  = state.items.reduce((s, i) => s + i.price * i.qty, 0);
  const delivery  = subtotal > 0 && subtotal >= 999 ? 0 : subtotal > 0 ? 60 : 0;
  const total     = subtotal + delivery;

  return (
    <CartContext.Provider value={{
      items: state.items, itemCount, subtotal, delivery, total,
      addItem, removeItem, updateQty, clearCart,
    }}>
      {children}
    </CartContext.Provider>
  );
};

export const useCart = () => useContext(CartContext);
