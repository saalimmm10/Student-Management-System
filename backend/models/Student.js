const mongoose = require("mongoose");

const studentSchema = new mongoose.Schema(
    {
        studentId: {
            type: String,
            required: true,
            unique: true
        },

        name: {
            type: String,
            required: true
        },

        email: {
            type: String,
            required: true
        },

        mobile: {
            type: String,
            required: true
        },

        branch: {
            type: String,
            required: true
        },

        semester: {
            type: Number,
            required: true
        },

        cgpa: {
            type: Number,
            required: true
        }
    },
    {
        timestamps: true
    }
);

module.exports = mongoose.model("Student", studentSchema);