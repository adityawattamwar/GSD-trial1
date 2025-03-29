const express = require("express");
const router = express.Router();
const {
  getCart,
  addToCart,
  removeFromCart,
  checkout,
  updateGreenOptions,
} = require("../controllers/cartController");

/**
 * @route   GET /api/cart
 * @desc    Get shopping cart contents
 * @access  Public
 */
router.get("/", getCart);

/**
 * @route   POST /api/cart/add
 * @desc    Add product to cart
 * @access  Public
 */
router.post("/add", addToCart);

/**
 * @route   DELETE /api/cart/remove/:id
 * @desc    Remove product from cart
 * @access  Public
 */
router.delete("/remove/:id", removeFromCart);

/**
 * @route   POST /api/cart/checkout
 * @desc    Process checkout
 * @access  Public
 */
router.post("/checkout", checkout);

/**
 * @route   PATCH /api/cart/green-options
 * @desc    Update cart's green delivery options
 * @access  Public
 */
router.patch("/green-options", updateGreenOptions);

module.exports = router;
