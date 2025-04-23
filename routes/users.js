const express = require("express")
const router = express.Router()
const { check, validationResult } = require("express-validator")
const bcrypt = require("bcryptjs")
const auth = require("../middleware/auth")
const User = require("../models/User")

// @route   GET api/users/me
// @desc    Get current user
// @access  Private
router.get("/me", auth, async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select("-password")
    res.json(user)
  } catch (err) {
    console.error(err.message)
    res.status(500).send("Server error")
  }
})

// @route   PUT api/users/profile
// @desc    Update user profile
// @access  Private
router.put(
  "/profile",
  [
    auth,
    [
      check("name", "Name is required").not().isEmpty(),
      check("email", "Please include a valid email").isEmail(),
      check("country", "Country is required").not().isEmpty(),
    ],
  ],
  async (req, res) => {
    // Validate request
    const errors = validationResult(req)
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() })
    }

    const { name, email, country } = req.body

    try {
      // Check if email is already in use by another user
      const existingUser = await User.findOne({ email })
      if (existingUser && existingUser._id.toString() !== req.user.id) {
        return res.status(400).json({ message: "Email is already in use" })
      }

      // Update user
      const user = await User.findByIdAndUpdate(req.user.id, { name, email, country }, { new: true }).select(
        "-password",
      )

      res.json(user)
    } catch (err) {
      console.error(err.message)
      res.status(500).send("Server error")
    }
  },
)

// @route   PUT api/users/change-password
// @desc    Change user password
// @access  Private
router.put(
  "/change-password",
  [
    auth,
    [
      check("currentPassword", "Current password is required").exists(),
      check("newPassword", "New password must be at least 6 characters").isLength({ min: 6 }),
    ],
  ],
  async (req, res) => {
    // Validate request
    const errors = validationResult(req)
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() })
    }

    const { currentPassword, newPassword } = req.body

    try {
      // Get user
      const user = await User.findById(req.user.id)

      // Check current password
      const isMatch = await user.comparePassword(currentPassword)
      if (!isMatch) {
        return res.status(400).json({ message: "Current password is incorrect" })
      }

      // Update password
      user.password = newPassword
      await user.save()

      res.json({ message: "Password updated successfully" })
    } catch (err) {
      console.error(err.message)
      res.status(500).send("Server error")
    }
  },
)

module.exports = router
