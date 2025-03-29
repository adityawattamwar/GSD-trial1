import React, {
  createContext,
  useContext,
  useReducer,
  useEffect,
  useRef,
} from "react";
import axiosInstance from "../utils/axiosConfig";

// Create cart context
const CartContext = createContext();

// API connection status tracking
const API_RETRY_INTERVAL = 60000; // 1 minute

// Initial state
const initialState = {
  items: [],
  loading: false,
  error: null,
  totalItems: 0,
  totalPrice: 0,
  greenDelivery: true, // Default to eco-friendly delivery
  carbonOffset: false,
  carbonFootprint: 0,
};

// Action types
const actions = {
  CART_REQUEST: "CART_REQUEST",
  CART_SUCCESS: "CART_SUCCESS",
  CART_FAILURE: "CART_FAILURE",
  ADD_ITEM: "ADD_ITEM",
  REMOVE_ITEM: "REMOVE_ITEM",
  UPDATE_QUANTITY: "UPDATE_QUANTITY",
  TOGGLE_GREEN_DELIVERY: "TOGGLE_GREEN_DELIVERY",
  TOGGLE_CARBON_OFFSET: "TOGGLE_CARBON_OFFSET",
  CLEAR_CART: "CLEAR_CART",
};

// Reducer function - uses immutable updates (green practice: more efficient React rendering)
const cartReducer = (state, action) => {
  switch (action.type) {
    case actions.CART_REQUEST:
      return {
        ...state,
        loading: true,
        error: null,
      };

    case actions.CART_SUCCESS:
      return {
        ...state,
        loading: false,
        items: action.payload.items,
        totalItems: action.payload.totalItems,
        totalPrice: action.payload.totalPrice,
        carbonFootprint: action.payload.carbonFootprint || 0,
      };

    case actions.CART_FAILURE:
      return {
        ...state,
        loading: false,
        error: action.payload,
      };

    case actions.ADD_ITEM: {
      // Check if item already exists
      const existingItemIndex = state.items.findIndex(
        (item) => item.product._id === action.payload.product._id
      );

      let updatedItems;

      if (existingItemIndex >= 0) {
        // Update quantity if item exists
        updatedItems = [...state.items];
        updatedItems[existingItemIndex] = {
          ...updatedItems[existingItemIndex],
          quantity:
            updatedItems[existingItemIndex].quantity +
            (action.payload.quantity || 1),
        };
      } else {
        // Add new item
        updatedItems = [
          ...state.items,
          {
            product: action.payload.product,
            quantity: action.payload.quantity || 1,
          },
        ];
      }

      // Calculate new totals
      const totalItems = updatedItems.reduce(
        (total, item) => total + item.quantity,
        0
      );

      const totalPrice = updatedItems.reduce(
        (total, item) => total + item.product.price * item.quantity,
        0
      );

      // Calculate carbon footprint
      const carbonFootprint = updatedItems.reduce(
        (total, item) =>
          total + (item.product.carbonFootprint || 0) * item.quantity,
        0
      );

      return {
        ...state,
        items: updatedItems,
        totalItems,
        totalPrice,
        carbonFootprint,
      };
    }

    case actions.REMOVE_ITEM: {
      const updatedItems = state.items.filter(
        (item) => item.product._id !== action.payload
      );

      // Recalculate totals
      const totalItems = updatedItems.reduce(
        (total, item) => total + item.quantity,
        0
      );

      const totalPrice = updatedItems.reduce(
        (total, item) => total + item.product.price * item.quantity,
        0
      );

      const carbonFootprint = updatedItems.reduce(
        (total, item) =>
          total + (item.product.carbonFootprint || 0) * item.quantity,
        0
      );

      return {
        ...state,
        items: updatedItems,
        totalItems,
        totalPrice,
        carbonFootprint,
      };
    }

    case actions.UPDATE_QUANTITY: {
      const { productId, quantity } = action.payload;

      // Don't allow negative quantities
      if (quantity <= 0) {
        return state;
      }

      const updatedItems = state.items.map((item) =>
        item.product._id === productId ? { ...item, quantity } : item
      );

      // Recalculate totals
      const totalItems = updatedItems.reduce(
        (total, item) => total + item.quantity,
        0
      );

      const totalPrice = updatedItems.reduce(
        (total, item) => total + item.product.price * item.quantity,
        0
      );

      const carbonFootprint = updatedItems.reduce(
        (total, item) =>
          total + (item.product.carbonFootprint || 0) * item.quantity,
        0
      );

      return {
        ...state,
        items: updatedItems,
        totalItems,
        totalPrice,
        carbonFootprint,
      };
    }

    case actions.TOGGLE_GREEN_DELIVERY:
      return {
        ...state,
        greenDelivery: !state.greenDelivery,
        // Update carbon footprint based on delivery option
        carbonFootprint: state.greenDelivery
          ? state.carbonFootprint + 1.5 // Standard delivery adds 1.5kg
          : state.carbonFootprint - 1.5, // Green delivery saves 1.5kg
      };

    case actions.TOGGLE_CARBON_OFFSET:
      return {
        ...state,
        carbonOffset: !state.carbonOffset,
      };

    case actions.CLEAR_CART:
      return {
        ...initialState,
      };

    default:
      return state;
  }
};

// Provider component
export const CartProvider = ({ children }) => {
  const [state, dispatch] = useReducer(cartReducer, initialState);

  // Track backend availability
  const backendAvailable = useRef(true);
  const lastBackendCheck = useRef(0);

  // Check if we should attempt an API call based on backend status
  const shouldAttemptApiCall = () => {
    const now = Date.now();

    // If we know backend is available, proceed
    if (backendAvailable.current) return true;

    // If backend was unavailable, only retry after interval
    if (now - lastBackendCheck.current < API_RETRY_INTERVAL) {
      return false;
    }

    // Time to retry
    lastBackendCheck.current = now;
    return true;
  };

  // Load cart from localStorage on initial render (green practice: reduce API calls)
  useEffect(() => {
    const loadCartFromStorage = () => {
      try {
        const storedCart = localStorage.getItem("greenCart");

        if (storedCart) {
          const parsedCart = JSON.parse(storedCart);
          dispatch({
            type: actions.CART_SUCCESS,
            payload: parsedCart,
          });
        }
      } catch (error) {
        console.error("Error loading cart from localStorage:", error);
      }
    };

    // Load from localStorage first for instant UI
    loadCartFromStorage();

    // Try to fetch cart from API, but don't block UI
    const syncWithBackend = async () => {
      // Only attempt if we think backend might be available
      if (shouldAttemptApiCall() && navigator.onLine) {
        try {
          await fetchCart("guest-user", false);
          backendAvailable.current = true;
        } catch (error) {
          console.log("Backend unavailable, using local storage cart");
          backendAvailable.current = false;
        }
      }
    };

    // Attempt to sync with backend without blocking UI
    syncWithBackend();
  }, []);

  // Save cart to localStorage when it changes
  useEffect(() => {
    const saveCartToStorage = () => {
      try {
        localStorage.setItem(
          "greenCart",
          JSON.stringify({
            items: state.items,
            totalItems: state.totalItems,
            totalPrice: state.totalPrice,
            carbonFootprint: state.carbonFootprint,
          })
        );
      } catch (error) {
        console.error("Error saving cart to localStorage:", error);
      }
    };

    // Only save if cart has been initialized (not during initial load)
    if (state !== initialState) {
      saveCartToStorage();
    }
  }, [state.items]);

  // Cart actions
  const fetchCart = async (userId = "guest-user", showLoading = true) => {
    // Only show loading state if requested (avoid flickering for background syncs)
    if (showLoading) {
      dispatch({ type: actions.CART_REQUEST });
    }

    // Skip API call if we know backend is unavailable
    if (!shouldAttemptApiCall()) {
      return Promise.reject(new Error("Backend temporarily unavailable"));
    }

    try {
      const response = await axiosInstance.get(`/api/cart?userId=${userId}`);

      if (response.data.success) {
        dispatch({
          type: actions.CART_SUCCESS,
          payload: {
            items: response.data.data.cart.items,
            totalItems: response.data.data.totalItems,
            totalPrice: response.data.data.totalPrice,
            carbonFootprint: response.data.data.greenMetrics.carbonFootprint,
          },
        });

        // Update backend status
        backendAvailable.current = true;
        return response.data;
      }
    } catch (error) {
      console.log("Error fetching cart:", error.message);

      // Mark backend as unavailable if there's a connection error
      if (
        error.isOffline ||
        error.message.includes("Network Error") ||
        error.code === "ECONNABORTED"
      ) {
        backendAvailable.current = false;
        lastBackendCheck.current = Date.now();
      }

      if (showLoading) {
        dispatch({
          type: actions.CART_FAILURE,
          payload: error.response?.data?.message || "Error fetching cart",
        });
      }

      // If API fails, try to use local cart
      const storedCart = localStorage.getItem("greenCart");
      if (storedCart) {
        dispatch({
          type: actions.CART_SUCCESS,
          payload: JSON.parse(storedCart),
        });
      }

      throw error;
    }
  };

  const addToCart = async (product, quantity = 1, userId = "guest-user") => {
    // Optimistic update for better user experience
    dispatch({
      type: actions.ADD_ITEM,
      payload: { product, quantity },
    });

    // Skip API call if we know backend is unavailable
    if (!backendAvailable.current || !navigator.onLine) {
      return;
    }

    try {
      // Only make API call if backend is available and we're online
      if (shouldAttemptApiCall() && navigator.onLine) {
        await axiosInstance.post("/api/cart/add", {
          productId: product._id,
          quantity,
          userId,
        });

        // Update backend status on success
        backendAvailable.current = true;
      }
    } catch (error) {
      console.error("Error adding item to cart:", error.message);

      // Mark backend as unavailable if there's a connection error
      if (
        error.isOffline ||
        error.message.includes("Network Error") ||
        error.code === "ECONNABORTED"
      ) {
        backendAvailable.current = false;
        lastBackendCheck.current = Date.now();
      }

      // Continue with local cart even if API fails
    }
  };

  const removeFromCart = async (productId, userId = "guest-user") => {
    // Optimistic update
    dispatch({
      type: actions.REMOVE_ITEM,
      payload: productId,
    });

    // Skip API call if we know backend is unavailable
    if (!backendAvailable.current || !navigator.onLine) {
      return;
    }

    try {
      // Only make API call if backend is available and we're online
      if (shouldAttemptApiCall() && navigator.onLine) {
        await axiosInstance.delete(
          `/api/cart/remove/${productId}?userId=${userId}`
        );

        // Update backend status on success
        backendAvailable.current = true;
      }
    } catch (error) {
      console.error("Error removing item from cart:", error.message);

      // Mark backend as unavailable if there's a connection error
      if (
        error.isOffline ||
        error.message.includes("Network Error") ||
        error.code === "ECONNABORTED"
      ) {
        backendAvailable.current = false;
        lastBackendCheck.current = Date.now();
      }

      // Continue with local cart even if API fails
    }
  };

  const updateQuantity = async (productId, quantity, userId = "guest-user") => {
    // Optimistic update
    dispatch({
      type: actions.UPDATE_QUANTITY,
      payload: { productId, quantity },
    });

    try {
      // API call would go here in a real application
      // We're using optimistic updates to reduce API calls (green practice)
    } catch (error) {
      console.error("Error updating quantity:", error);
    }
  };

  const toggleGreenDelivery = async (userId = "guest-user") => {
    // Optimistic update
    dispatch({ type: actions.TOGGLE_GREEN_DELIVERY });

    // Skip API call if we know backend is unavailable
    if (!backendAvailable.current || !navigator.onLine) {
      return;
    }

    try {
      // Only make API call if backend is available and we're online
      if (shouldAttemptApiCall() && navigator.onLine) {
        await axiosInstance.patch("/api/cart/green-options", {
          userId,
          greenDelivery: !state.greenDelivery,
        });

        // Update backend status on success
        backendAvailable.current = true;
      }
    } catch (error) {
      console.error("Error updating green delivery option:", error.message);

      // Mark backend as unavailable if there's a connection error
      if (
        error.isOffline ||
        error.message.includes("Network Error") ||
        error.code === "ECONNABORTED"
      ) {
        backendAvailable.current = false;
        lastBackendCheck.current = Date.now();
      }
    }
  };

  const toggleCarbonOffset = async (userId = "guest-user") => {
    // Optimistic update
    dispatch({ type: actions.TOGGLE_CARBON_OFFSET });

    // Skip API call if we know backend is unavailable
    if (!backendAvailable.current || !navigator.onLine) {
      return;
    }

    try {
      // Only make API call if backend is available and we're online
      if (shouldAttemptApiCall() && navigator.onLine) {
        await axiosInstance.patch("/api/cart/green-options", {
          userId,
          carbonOffset: !state.carbonOffset,
        });

        // Update backend status on success
        backendAvailable.current = true;
      }
    } catch (error) {
      console.error("Error updating carbon offset option:", error.message);

      // Mark backend as unavailable if there's a connection error
      if (
        error.isOffline ||
        error.message.includes("Network Error") ||
        error.code === "ECONNABORTED"
      ) {
        backendAvailable.current = false;
        lastBackendCheck.current = Date.now();
      }
    }
  };

  const checkout = async (userId = "guest-user") => {
    dispatch({ type: actions.CART_REQUEST });

    // Verify backend is available before attempting checkout
    if (!backendAvailable.current) {
      dispatch({
        type: actions.CART_FAILURE,
        payload:
          "Cannot checkout while offline. Please try again when connected.",
      });
      throw new Error("Backend unavailable for checkout");
    }

    try {
      const response = await axiosInstance.post("/api/cart/checkout", {
        userId,
        greenDelivery: state.greenDelivery,
        carbonOffset: state.carbonOffset,
      });

      if (response.data.success) {
        dispatch({ type: actions.CLEAR_CART });
        localStorage.removeItem("greenCart");

        // Update backend status on success
        backendAvailable.current = true;

        return response.data;
      }
    } catch (error) {
      // Mark backend as unavailable if there's a connection error
      if (
        error.isOffline ||
        error.message.includes("Network Error") ||
        error.code === "ECONNABORTED"
      ) {
        backendAvailable.current = false;
        lastBackendCheck.current = Date.now();
      }

      dispatch({
        type: actions.CART_FAILURE,
        payload: error.response?.data?.message || "Error during checkout",
      });
      throw error;
    }
  };

  return (
    <CartContext.Provider
      value={{
        ...state,
        fetchCart,
        addToCart,
        removeFromCart,
        updateQuantity,
        toggleGreenDelivery,
        toggleCarbonOffset,
        checkout,
      }}
    >
      {children}
    </CartContext.Provider>
  );
};

// Custom hook for accessing cart context
export const useCart = () => {
  const context = useContext(CartContext);

  if (!context) {
    throw new Error("useCart must be used within a CartProvider");
  }

  return context;
};
