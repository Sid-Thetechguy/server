const express = require("express")
const cors = require("cors")
const morgan = require("morgan")
const connectDB = require("./config/db")
const path = require("path")
require("dotenv").config()

// Connect to database
connectDB()

const app = express()

// Middleware
app.use(express.json())
app.use(cors())
app.use(morgan("dev"))

// Routes
app.use("/api/auth", require("./routes/auth"))
app.use("/api/users", require("./routes/users"))
app.use("/api/projects", require("./routes/projects"))
app.use("/api/tasks", require("./routes/tasks"))

// Serve static assets in production
if (process.env.NODE_ENV === "production") {
  // Set static folder
  app.use(express.static("client/build"))

  app.get("*", (req, res) => {
    res.sendFile(path.resolve(__dirname, "client", "build", "index.html"))
  })
}

const PORT = process.env.PORT || 5000

app.listen(PORT, () => console.log(`Server running on port ${PORT}`))
