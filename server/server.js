
const express = require("express");
const http = require("http");
const { Server } = require("socket.io");
const cors = require("cors");
const mongoose = require("mongoose");
require("dotenv").config();

const Session = require("./models/session");
const Question = require("./models/question");
const QRCode = require("qrcode");

const {
    checkSimilarity,
    findGroup
} = require("./services/similarityservice");

const app = express();
const server = http.createServer(app);

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static("public"));

// Socket.IO
const io = new Server(server, {
    cors: {
        origin: "*"
    }
});

// MongoDB
mongoose.connect(process.env.MONGO_URI)
    .then(() => {
        console.log("MongoDB connected");
    })
    .catch((error) => {
        console.error("MongoDB connection error:", error);
    });


// ===============================
// GET SESSION
// ===============================

app.get("/api/sessions/:sessionCode", async (req, res) => {

    try {

        const sessionCode =
            req.params.sessionCode.toUpperCase();

        const session =
    await Session.findOne({
        sessionCode
    });

if (!session) {
    return res.status(404).json({
        success: false,
        message: "Session not found."
    });
}

if (!session.active) {
    return res.status(403).json({
        success: false,
        message: "This session has ended. You cannot submit questions."
    });
}

        res.json({
            success: true,
            session
        });

    } catch (error) {

        console.error(
            "Session lookup error:",
            error
        );

        res.status(500).json({
            success: false,
            message: "Could not find session."
        });

    }

});


// ===============================
// CREATE SESSION
// ===============================

app.post("/api/sessions", async (req, res) => {

    try {

        const {
            className,
            topic
        } = req.body;

        if (!className || !topic) {

            return res.status(400).json({
                success: false,
                message: "Class name and topic are required."
            });

        }

        const sessionCode =
            Math.random()
                .toString(36)
                .substring(2, 8)
                .toUpperCase();

        const session =
            new Session({
                sessionCode,
                className,
                topic
            });

        await session.save();
      const joinUrl =
    `${req.protocol}://${req.get("host")}/student.html?session=${sessionCode}`;

        const qrCode =
            await QRCode.toDataURL(joinUrl);

        res.json({
            success: true,
            session,
            qrCode
        });

    } catch (error) {

        console.error(
            "Session creation error:",
            error
        );

        res.status(500).json({
            success: false,
            message: "Could not create session."
        });

    }

});


// ===============================
// SUBMIT QUESTION
// ===============================

app.post("/api/questions", async (req, res) => {

    try {

        const {
            sessionCode,
            studentName,
            questionText
        } = req.body;

        console.log("Question received:", {
            sessionCode,
            studentName,
            questionText
        });

        if (!sessionCode ||
            !studentName ||
            !questionText) {

            return res.status(400).json({
                success: false,
                message: "All fields are required."
            });

        }

        const session =
            await Session.findOne({
                sessionCode:
                    sessionCode.toUpperCase()
            });



        if (!session) {

    return res.status(404).json({
        success: false,
        message: "Session not found."
    });

}

if (!session.active) {

    return res.status(403).json({
        success: false,
        message: "This session has ended. You cannot submit questions."
    });

}

        const existingQuestions =
    await Question.find({
        sessionCode:
            sessionCode.toUpperCase()
    });


let groupId =
    await findGroup(
        {
            questionText
        },
        existingQuestions
    );


if (groupId === null) {

    const groupIds =
        existingQuestions
            .map(q => q.groupId)
            .filter(id => id !== null);

    if (groupIds.length === 0) {

        groupId = 1;

    } else {

        groupId =
            Math.max(...groupIds) + 1;

    }

}


const question =
    new Question({

        sessionCode:
            sessionCode.toUpperCase(),

        studentName:
            studentName,

        questionText:
            questionText,

        groupId:
            groupId

    });


await question.save();

        console.log(
            "Question saved successfully:",
            question._id
        );
        io.emit(
       "newQuestion", question
           );
        res.json({

            success: true,

            message:
                "Question submitted successfully.",

            question

        });

    } catch (error) {

        console.error(
            "Question submission error:",
            error
        );

        res.status(500).json({

            success: false,

            message:
                "Could not submit question."

        });

    }

});

// ===============================
// GET QUESTIONS FOR A SESSION
// ===============================

app.get("/api/questions/:sessionCode", async (req, res) => {

    try {

        const sessionCode =
            req.params.sessionCode.toUpperCase();

        const questions =
            await Question.find({
                sessionCode
            }).sort({
                createdAt: 1
            });

        res.json({

            success: true,

            questions

        });

    } catch (error) {

        console.error(
            "Question retrieval error:",
            error
        );

        res.status(500).json({

            success: false,

            message:
                "Could not retrieve questions."

        });

    }

});

app.get(
    "/api/questions/:sessionCode/student/:studentName",
    async (req, res) => {

        try {

            const {
                sessionCode,
                studentName
            } = req.params;

            const questions =
                await Question.find({
                    sessionCode: sessionCode,
                    studentName: studentName
                })
                .sort({
                    createdAt: -1
                });

            res.json({
                success: true,
                questions: questions
            });

        } catch (error) {

            console.error(
                "Student questions error:",
                error
            );

            res.status(500).json({
                success: false,
                message: "Could not load questions."
            });

        }

    }
);

// Answer all questions in a group
app.put(
    "/api/questions/:sessionCode/group/:groupId/answer",
    async (req, res) => {

        try {

            const { sessionCode, groupId } = req.params;
            const { answer } = req.body;

            if (!answer || !answer.trim()) {

                return res.status(400).json({
                    success: false,
                    message: "Answer cannot be empty."
                });

            }

            await Question.updateMany(
                {
                    sessionCode: sessionCode,
                    groupId: Number(groupId)
                },
                {
                    $set: {
                        answer: answer.trim(),
                        resolved: true
                    }
                }
            );

            const updatedQuestions =
                await Question.find({
                    sessionCode: sessionCode,
                    groupId: Number(groupId)
                });

            io.emit("groupAnswered", {
                sessionCode,
                groupId: Number(groupId),
                questions: updatedQuestions
            });

            res.json({
                success: true,
                message: "Group answered successfully."
            });

        } catch (error) {

            console.error(
                "Answer group error:",
                error
            );

            res.status(500).json({
                success: false,
                message: "Could not answer group."
            });

        }

    }
);


// Resolve a question group
app.put(
    "/api/questions/:sessionCode/group/:groupId/resolve",
    async (req, res) => {

        try {

            const { sessionCode, groupId } = req.params;

            await Question.updateMany(
                {
                    sessionCode: sessionCode,
                    groupId: Number(groupId)
                },
                {
                    $set: {
                        resolved: true
                    }
                }
            );

            io.emit("groupResolved", {
                sessionCode,
                groupId: Number(groupId)
            });

            res.json({
                success: true,
                message: "Group resolved successfully."
            });

        } catch (error) {

            console.error(
                "Resolve group error:",
                error
            );

            res.status(500).json({
                success: false,
                message: "Could not resolve group."
            });

        }

    }
);

// ===============================
// SOCKET.IO
// ===============================

io.on("connection", (socket) => {

    console.log(
        "User connected:",
        socket.id
    );

    socket.on("disconnect", () => {

        console.log(
            "User disconnected:",
            socket.id
        );

    });

});


// ===============================
// START SERVER
// ===============================

const PORT =
    process.env.PORT || 5000;

app.put(
    "/api/questions/:sessionCode/group/:groupId/answer",
    async (req, res) => {

        try {

            const {
                sessionCode,
                groupId
            } = req.params;

            const { answer } = req.body;

            if (!answer || !answer.trim()) {

                return res.status(400).json({
                    success: false,
                    message: "Answer cannot be empty."
                });

            }

            const questions =
                await Question.updateMany(
                    {
                        sessionCode: sessionCode,
                        groupId: Number(groupId)
                    },
                    {
                        $set: {
                            answer: answer.trim()
                        }
                    }
                );

            const updatedQuestions =
                await Question.find({
                    sessionCode: sessionCode,
                    groupId: Number(groupId)
                });

            io.emit("groupAnswered", {
                sessionCode: sessionCode,
                groupId: Number(groupId),
                questions: updatedQuestions
            });

            res.json({
                success: true,
                message: "Answer saved successfully.",
                modifiedCount: questions.modifiedCount
            });

        } catch (error) {

            console.error(
                "Answer group error:",
                error
            );

            res.status(500).json({
                success: false,
                message: "Could not save answer."
            });

        }

    }
);

app.put(
    "/api/questions/:sessionCode/group/:groupId/resolve",
    async (req, res) => {

        try {

            const {
                sessionCode,
                groupId
            } = req.params;

            await Question.updateMany(
                {
                    sessionCode: sessionCode,
                    groupId: Number(groupId)
                },
                {
                    $set: {
                        resolved: true
                    }
                }
            );

            io.emit("groupResolved", {
                sessionCode: sessionCode,
                groupId: Number(groupId)
            });

            res.json({
                success: true,
                message: "Group resolved successfully."
            });

        } catch (error) {

            console.error(
                "Resolve group error:",
                error
            );

            res.status(500).json({
                success: false,
                message: "Could not resolve group."
            });

        }

    }
);

app.get(
    "/api/questions/:sessionCode/student/:studentName",
    async (req, res) => {

        try {

            const {
                sessionCode,
                studentName
            } = req.params;

            const questions =
                await Question.find({
                    sessionCode: sessionCode,
                    studentName: studentName
                }).sort({
                    createdAt: -1
                });

            res.json({
                success: true,
                questions: questions
            });

        } catch (error) {

            console.error(
                "Student questions error:",
                error
            );

            res.status(500).json({
                success: false,
                message: "Could not load questions."
            });

        }
    }
);


// ===============================
// END SESSION
// ===============================

app.put(
    "/api/sessions/:sessionCode/end",
    async (req, res) => {

        try {

            const {
                sessionCode
            } = req.params;


            const session =
                await Session.findOneAndUpdate(
                    {
                        sessionCode: sessionCode
                    },
                    {
                        $set: {
                            active: false
                        }
                    },
                    {
                        new: true
                    }
                );


            if (!session) {

                return res.status(404).json({
                    success: false,
                    message: "Session not found."
                });

            }


            io.emit(
                "sessionEnded",
                {
                    sessionCode: sessionCode
                }
            );


            res.json({
                success: true,
                message: "Session ended successfully."
            });


        } catch (error) {

            console.error(
                "End session error:",
                error
            );


            res.status(500).json({
                success: false,
                message: "Could not end session."
            });

        }

    }
);
server.listen(PORT, "0.0.0.0", () => {

    console.log(
        `ClassPulse running on port ${PORT}`
    );

});