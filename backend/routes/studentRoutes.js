const express = require("express");
const Student = require("../models/Student");

const router = express.Router();

// Add a new student
router.post("/", async (req, res) => {
    try {
        const student = new Student(req.body);
        const savedStudent = await student.save();

        res.status(201).json(savedStudent);
    } catch (error) {
        res.status(500).json({
            message: "Error adding student",
            error: error.message
        });
    }
});

// Get all students
router.get("/", async (req, res) => {
    try {
        const students = await Student.find();

        res.status(200).json(students);
    } catch (error) {
        res.status(500).json({
            message: "Error fetching students",
            error: error.message
        });
    }
});

// Get student by ID
router.get("/:id", async (req, res) => {
    try {
        const student = await Student.findOne({
            studentId: req.params.id
        });

        if (!student) {
            return res.status(404).json({
                message: "Student not found"
            });
        }

        res.status(200).json(student);
    } catch (error) {
        res.status(500).json({
            message: "Error fetching student",
            error: error.message
        });
    }
});

// Update student
router.put("/:id", async (req, res) => {
    try {
        const updatedStudent = await Student.findOneAndUpdate(
            { studentId: req.params.id },
            req.body,
            { new: true, runValidators: true }
        );

        if (!updatedStudent) {
            return res.status(404).json({
                message: "Student not found"
            });
        }

        res.status(200).json(updatedStudent);
    } catch (error) {
        res.status(500).json({
            message: "Error updating student",
            error: error.message
        });
    }
});

// Delete student
router.delete("/:id", async (req, res) => {
    try {
        const deletedStudent = await Student.findOneAndDelete({
            studentId: req.params.id
        });

        if (!deletedStudent) {
            return res.status(404).json({
                message: "Student not found"
            });
        }

        res.status(200).json({
            message: "Student deleted successfully"
        });
    } catch (error) {
        res.status(500).json({
            message: "Error deleting student",
            error: error.message
        });
    }
});

module.exports = router;