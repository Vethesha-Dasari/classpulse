const mongoose = require("mongoose");

const sessionSchema = new mongoose.Schema({

    className: {
        type: String,
        required: true
    },

    topic: {
        type: String,
        required: true
    },

    sessionCode: {
        type: String,
        required: true,
        unique: true
    },

    active: {
        type: Boolean,
        default: true
    },

    createdAt: {
        type: Date,
        default: Date.now
    }

});

module.exports =
    mongoose.model("Session", sessionSchema);