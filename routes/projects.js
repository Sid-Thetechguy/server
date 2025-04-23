const express = require("express")
const router = express.Router()
const { check, validationResult } = require("express-validator")
const auth = require("../middleware/auth")
const Project = require("../models/Project")
const Task = require("../models/Task")

// @route   GET api/projects
// @desc    Get all projects for user
// @access  Private
router.get("/", auth, async (req, res) => {
  try {
    const projects = await Project.find({ user: req.user.id }).sort({ createdAt: -1 })
    res.json(projects)
  } catch (err) {
    console.error(err.message)
    res.status(500).send("Server error")
  }
})

// @route   POST api/projects
// @desc    Create a project
// @access  Private
router.post(
  "/",
  [
    auth,
    [
      check("title", "Title is required").not().isEmpty(),
      check("description", "Description is required").not().isEmpty(),
    ],
  ],
  async (req, res) => {
    // Validate request
    const errors = validationResult(req)
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() })
    }

    try {
      // Check if user already has 4 projects
      const projectCount = await Project.countDocuments({ user: req.user.id })
      if (projectCount >= 4) {
        return res.status(400).json({ message: "Maximum number of projects reached (4)" })
      }

      // Create new project
      const newProject = new Project({
        title: req.body.title,
        description: req.body.description,
        user: req.user.id,
      })

      const project = await newProject.save()
      res.json(project)
    } catch (err) {
      console.error(err.message)
      res.status(500).send("Server error")
    }
  },
)

// @route   GET api/projects/:id
// @desc    Get project by ID
// @access  Private
router.get("/:id", auth, async (req, res) => {
  try {
    const project = await Project.findById(req.params.id)

    // Check if project exists
    if (!project) {
      return res.status(404).json({ message: "Project not found" })
    }

    // Check if user owns the project
    if (project.user.toString() !== req.user.id) {
      return res.status(401).json({ message: "User not authorized" })
    }

    res.json(project)
  } catch (err) {
    console.error(err.message)
    if (err.kind === "ObjectId") {
      return res.status(404).json({ message: "Project not found" })
    }
    res.status(500).send("Server error")
  }
})

// @route   PUT api/projects/:id
// @desc    Update a project
// @access  Private
router.put(
  "/:id",
  [
    auth,
    [
      check("title", "Title is required").not().isEmpty(),
      check("description", "Description is required").not().isEmpty(),
    ],
  ],
  async (req, res) => {
    // Validate request
    const errors = validationResult(req)
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() })
    }

    try {
      let project = await Project.findById(req.params.id)

      // Check if project exists
      if (!project) {
        return res.status(404).json({ message: "Project not found" })
      }

      // Check if user owns the project
      if (project.user.toString() !== req.user.id) {
        return res.status(401).json({ message: "User not authorized" })
      }

      // Update project
      project = await Project.findByIdAndUpdate(
        req.params.id,
        { $set: { title: req.body.title, description: req.body.description } },
        { new: true },
      )

      res.json(project)
    } catch (err) {
      console.error(err.message)
      if (err.kind === "ObjectId") {
        return res.status(404).json({ message: "Project not found" })
      }
      res.status(500).send("Server error")
    }
  },
)

// @route   DELETE api/projects/:id
// @desc    Delete a project
// @access  Private
router.delete("/:id", auth, async (req, res) => {
  try {
    const project = await Project.findById(req.params.id)

    // Check if project exists
    if (!project) {
      return res.status(404).json({ message: "Project not found" })
    }

    // Check if user owns the project
    if (project.user.toString() !== req.user.id) {
      return res.status(401).json({ message: "User not authorized" })
    }

    // Delete all tasks associated with the project
    await Task.deleteMany({ project: req.params.id })

    // Delete the project
    await project.remove()

    res.json({ message: "Project removed" })
  } catch (err) {
    console.error(err.message)
    if (err.kind === "ObjectId") {
      return res.status(404).json({ message: "Project not found" })
    }
    res.status(500).send("Server error")
  }
})

// @route   GET api/projects/:id/tasks
// @desc    Get all tasks for a project
// @access  Private
router.get("/:id/tasks", auth, async (req, res) => {
  try {
    const project = await Project.findById(req.params.id)

    // Check if project exists
    if (!project) {
      return res.status(404).json({ message: "Project not found" })
    }

    // Check if user owns the project
    if (project.user.toString() !== req.user.id) {
      return res.status(401).json({ message: "User not authorized" })
    }

    // Get tasks
    const tasks = await Task.find({ project: req.params.id }).sort({ createdAt: -1 })
    res.json(tasks)
  } catch (err) {
    console.error(err.message)
    if (err.kind === "ObjectId") {
      return res.status(404).json({ message: "Project not found" })
    }
    res.status(500).send("Server error")
  }
})

// @route   POST api/projects/:id/tasks
// @desc    Create a task for a project
// @access  Private
router.post(
  "/:id/tasks",
  [
    auth,
    [
      check("title", "Title is required").not().isEmpty(),
      check("description", "Description is required").not().isEmpty(),
    ],
  ],
  async (req, res) => {
    // Validate request
    const errors = validationResult(req)
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() })
    }

    try {
      const project = await Project.findById(req.params.id)

      // Check if project exists
      if (!project) {
        return res.status(404).json({ message: "Project not found" })
      }

      // Check if user owns the project
      if (project.user.toString() !== req.user.id) {
        return res.status(401).json({ message: "User not authorized" })
      }

      // Create new task
      const newTask = new Task({
        title: req.body.title,
        description: req.body.description,
        project: req.params.id,
      })

      const task = await newTask.save()

      // Update project task count
      project.taskCount += 1
      await project.save()

      res.json(task)
    } catch (err) {
      console.error(err.message)
      if (err.kind === "ObjectId") {
        return res.status(404).json({ message: "Project not found" })
      }
      res.status(500).send("Server error")
    }
  },
)

module.exports = router
