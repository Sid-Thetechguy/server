const express = require("express")
const router = express.Router()
const { check, validationResult } = require("express-validator")
const auth = require("../middleware/auth")
const Task = require("../models/Task")
const Project = require("../models/Project")

// @route   GET api/tasks/:id
// @desc    Get task by ID
// @access  Private
router.get("/:id", auth, async (req, res) => {
  try {
    const task = await Task.findById(req.params.id)

    // Check if task exists
    if (!task) {
      return res.status(404).json({ message: "Task not found" })
    }

    // Get project to check ownership
    const project = await Project.findById(task.project)

    // Check if project exists
    if (!project) {
      return res.status(404).json({ message: "Project not found" })
    }

    // Check if user owns the project
    if (project.user.toString() !== req.user.id) {
      return res.status(401).json({ message: "User not authorized" })
    }

    res.json(task)
  } catch (err) {
    console.error(err.message)
    if (err.kind === "ObjectId") {
      return res.status(404).json({ message: "Task not found" })
    }
    res.status(500).send("Server error")
  }
})

// @route   PUT api/tasks/:id
// @desc    Update a task
// @access  Private
router.put("/:id", auth, async (req, res) => {
  try {
    let task = await Task.findById(req.params.id)

    // Check if task exists
    if (!task) {
      return res.status(404).json({ message: "Task not found" })
    }

    // Get project to check ownership
    const project = await Project.findById(task.project)

    // Check if project exists
    if (!project) {
      return res.status(404).json({ message: "Project not found" })
    }

    // Check if user owns the project
    if (project.user.toString() !== req.user.id) {
      return res.status(401).json({ message: "User not authorized" })
    }

    // Check if status is being updated to 'Completed'
    const wasCompleted = task.status === "Completed"
    const willBeCompleted = req.body.status === "Completed"

    // Update task
    const updateData = {}
    if (req.body.title) updateData.title = req.body.title
    if (req.body.description) updateData.description = req.body.description
    if (req.body.status) {
      updateData.status = req.body.status

      // Set completedAt date if task is being marked as completed
      if (willBeCompleted && !wasCompleted) {
        updateData.completedAt = Date.now()
      } else if (!willBeCompleted && wasCompleted) {
        updateData.completedAt = null
      }
    }

    task = await Task.findByIdAndUpdate(req.params.id, { $set: updateData }, { new: true })

    // Update project completed tasks count if status changed
    if (willBeCompleted !== wasCompleted) {
      if (willBeCompleted) {
        project.completedTasks += 1
      } else {
        project.completedTasks -= 1
      }
      await project.save()
    }

    res.json(task)
  } catch (err) {
    console.error(err.message)
    if (err.kind === "ObjectId") {
      return res.status(404).json({ message: "Task not found" })
    }
    res.status(500).send("Server error")
  }
})

// @route   DELETE api/tasks/:id
// @desc    Delete a task
// @access  Private
router.delete("/:id", auth, async (req, res) => {
  try {
    const task = await Task.findById(req.params.id)

    // Check if task exists
    if (!task) {
      return res.status(404).json({ message: "Task not found" })
    }

    // Get project to check ownership
    const project = await Project.findById(task.project)

    // Check if project exists
    if (!project) {
      return res.status(404).json({ message: "Project not found" })
    }

    // Check if user owns the project
    if (project.user.toString() !== req.user.id) {
      return res.status(401).json({ message: "User not authorized" })
    }

    // Delete the task
    await task.remove()

    // Update project task count and completed tasks count
    project.taskCount -= 1
    if (task.status === "Completed") {
      project.completedTasks -= 1
    }
    await project.save()

    res.json({ message: "Task removed" })
  } catch (err) {
    console.error(err.message)
    if (err.kind === "ObjectId") {
      return res.status(404).json({ message: "Task not found" })
    }
    res.status(500).send("Server error")
  }
})

module.exports = router
