const express = require("express")
const router = express.Router()
const { check, validationResult } = require("express-validator")
const jwt = require("jsonwebtoken")
const User = require("../models/User")

// @route   POST api/auth/register
// @desc    Register user
// @access  Public
router.post(
  "/register",
  [
    check("name", "Name is required").not().isEmpty(),
    check("email", "Please include a valid email").isEmail(),
    check("password", "Password must be at least 6 characters").isLength({ min: 6 }),
    check("country", "Country is required").not().isEmpty(),
  ],
  async (req, res) => {
    // Validate request
    const errors = validationResult(req)
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() })
    }

    const { name, email, password, country } = req.body

    try {
      // Check if user exists
      let user = await User.findOne({ email })

      if (user) {
        return res.status(400).json({ message: "User already exists" })
      }

      // Create new user
      user = new User({
        name,
        email,
        password,
        country,
      })

      await user.save()

      res.status(201).json({ message: "User registered successfully" })
    } catch (err) {
      console.error(err.message)
      res.status(500).send("Server error")
    }
  },
)

// @route   POST api/auth/login
// @desc    Authenticate user & get token
// @access  Public
router.post(
  "/login",
  [check("email", "Please include a valid email").isEmail(), check("password", "Password is required").exists()],
  async (req, res) => {
    // Validate request
    const errors = validationResult(req)
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() })
    }

    const { email, password } = req.body

    try {
      // Check if user exists
      const user = await User.findOne({ email })

      if (!user) {
        return res.status(400).json({ message: "Invalid credentials" })
      }

      // Check password
      const isMatch = await user.comparePassword(password)

      if (!isMatch) {
        return res.status(400).json({ message: "Invalid credentials" })
      }

      // Create and return JWT
      const payload = {
        id: user.id,
        name: user.name,
        email: user.email,
        country: user.country,
      }

      jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: "7d" }, (err, token) => {
        if (err) throw err
        res.json({ token })
      })
    } catch (err) {
      console.error(err.message)
      res.status(500).send("Server error")
    }
  },
)

module.exports = router
