const mongoose = require("mongoose");

const questionSchema = new mongoose.Schema({

    sessionCode: {
        type: String,
        required: true
    },

    studentName: {
        type: String,
        required: true
    },

    questionText: {
        type: String,
        required: true
    },

    groupId: {
        type: Number,
        default: null
    },

    answer: {
        type: String,
        default: ""
    },

    resolved: {
        type: Boolean,
        default: false
    },

    createdAt: {
        type: Date,
        default: Date.now
    }

});

module.exports =
    mongoose.model("Question", questionSchema);