const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
require("dotenv").config();
const studentRoutes = require("./routes/studentRoutes");
const app = express();

// Middleware
app.use(cors());
app.use(express.json());
app.use("/api/students", studentRoutes);
// MongoDB Connection
mongoose
    .connect(process.env.MONGO_URI)
    .then(() => {
        console.log("MongoDB connected successfully");
    })
    .catch((error) => {
        console.log("MongoDB connection error:", error);
    });

// Test Route
app.get("/", (req, res) => {
    res.send("Student Management System API is running");
});

// Start Server
const PORT = process.env.PORT || 5001;

app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});