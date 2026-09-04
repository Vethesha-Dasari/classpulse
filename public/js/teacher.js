const socket = io();


// ===============================
// CREATE SESSION
// ===============================

async function createSession() {

    const className =
        document.getElementById("className").value.trim();

    const topic =
        document.getElementById("topic").value.trim();

    if (!className || !topic) {
        alert("Please enter class name and topic.");
        return;
    }

    try {

        const response = await fetch(
            "/api/sessions",
            {
                method: "POST",

                headers: {
                    "Content-Type": "application/json"
                },

                body: JSON.stringify({
                    className,
                    topic
                })
            }
        );

        const data =
            await response.json();

        if (!data.success) {
            alert(data.message);
            return;
        }

        localStorage.setItem(
            "classpulseSessionCode",
            data.session.sessionCode
        );

        document.getElementById(
            "sessionInfo"
        ).innerHTML = `

            <div class="form-card">

                <h2>Session Created!</h2>

                <p>
                    Class:
                    <strong>
                        ${data.session.className}
                    </strong>
                </p>

                <p>
                    Topic:
                    <strong>
                        ${data.session.topic}
                    </strong>
                </p>

                <h3>Session Code</h3>

                <h2>
                    ${data.session.sessionCode}
                </h2>

                <h3>Scan to Join</h3>

                <img
                    src="${data.qrCode}"
                    alt="Session QR Code"
                    width="200"
                >

                <p>
                    Students can scan this QR code
                    to join the session.
                </p>

            </div>
        `;

        document.getElementById(
            "questionsSection"
        ).style.display = "block";
        
        document.getElementById(
        "endSessionButton"
        ).style.display = "block";

        loadQuestions(
            data.session.sessionCode
        );

    } catch (error) {

        console.error(
            "Error:",
            error
        );

        alert(
            "Could not connect to the server."
        );
    }
}


// ===============================
// LOAD QUESTIONS
// ===============================

async function loadQuestions(sessionCode) {

    try {

        const response = await fetch(
            `/api/questions/${sessionCode}`
        );

        const data =
            await response.json();

        if (!data.success) {

            console.error(
                "Could not load questions:",
                data.message
            );

            return;
        }

        displayQuestions(
            data.questions
        );

    } catch (error) {

        console.error(
            "Question loading error:",
            error
        );

    }
}


// ===============================
// DISPLAY QUESTIONS
// ===============================

function displayQuestions(questions) {

    const questionList =
        document.getElementById(
            "questionList"
        );

    const questionCount =
        document.getElementById(
            "questionCount"
        );


    questionCount.textContent =
        `${questions.length} question${questions.length === 1 ? "" : "s"}`;


    if (questions.length === 0) {

        questionList.innerHTML = `

            <p class="no-questions">
                No questions yet.
            </p>

        `;

        return;
    }


    // Group questions by groupId

    const groups = {};


    questions.forEach(question => {

        const groupId =
            question.groupId || "unassigned";

        if (!groups[groupId]) {

            groups[groupId] = [];

        }

        groups[groupId].push(question);

    });


    questionList.innerHTML =

        Object.keys(groups)

            .sort((a, b) => {

                if (a === "unassigned") {
                    return 1;
                }

                if (b === "unassigned") {
                    return -1;
                }

                return Number(a) - Number(b);

            })

            .map(groupId => {

                const groupQuestions =
                    groups[groupId];


                const firstQuestion =
                    groupQuestions[0];


                const answered =
                    firstQuestion.answer &&
                    firstQuestion.answer.trim() !== "";


                const resolved =
                    firstQuestion.resolved === true;


                return `

                    <div class="question-group">

                        <div class="group-header">

                            <strong>
                                GROUP ${groupId}
                            </strong>

                            <span>
                                ${groupQuestions.length}
                                question${groupQuestions.length === 1 ? "" : "s"}
                            </span>

                        </div>


                        <div class="group-questions">

                            ${groupQuestions
                                .map(question => {

                                    return `

                                        <div class="question-item">

                                            <div class="student-name">
                                                ${question.studentName}
                                            </div>

                                            <div class="question-text">
                                                ${question.questionText}
                                            </div>

                                        </div>

                                    `;

                                })
                                .join("")}

                        </div>


                        ${
                            answered

                            ?

                            `

                            <div class="group-answer">

                                <strong>
                                    Teacher Answer
                                </strong>

                                <p>
                                    ${firstQuestion.answer}
                                </p>


                                ${
                                    resolved

                                    ?

                                    `
                                    <span class="resolved-badge">
                                        Resolved ✓
                                    </span>
                                    `

                                    :

                                    `
                                    <button
                                        onclick="resolveGroup(${groupId})"
                                    >
                                        Resolve Group
                                    </button>
                                    `
                                }

                            </div>

                            `

                            :

                            `

                            <div class="group-actions">

                                <textarea
                                    id="answer-${groupId}"
                                    placeholder="Enter answer..."
                                    rows="3"
                                ></textarea>

                                <button
                                    onclick="answerGroup(${groupId})"
                                >
                                    Answer Group
                                </button>

                            </div>

                            `
                        }

                    </div>

                `;

            })

            .join("");
}


// ===============================
// ANSWER GROUP
// ===============================

async function answerGroup(groupId) {

    const sessionCode =
        localStorage.getItem(
            "classpulseSessionCode"
        );


    const answerBox =
        document.getElementById(
            `answer-${groupId}`
        );


    if (!answerBox) {

        console.error(
            "Answer box not found for group:",
            groupId
        );

        return;
    }


    const answer =
        answerBox.value.trim();


    if (!answer) {

        alert(
            "Please enter an answer."
        );

        return;
    }


    try {

        const response =
            await fetch(
                `/api/questions/${sessionCode}/group/${groupId}/answer`,
                {
                    method: "PUT",

                    headers: {
                        "Content-Type":
                            "application/json"
                    },

                    body: JSON.stringify({
                        answer: answer
                    })
                }
            );


        const data =
            await response.json();


        if (!data.success) {

            alert(
                data.message
            );

            return;
        }


        // Reload the teacher questions

        loadQuestions(
            sessionCode
        );


    } catch (error) {

        console.error(
            "Answer error:",
            error
        );

        alert(
            "Could not save answer."
        );

    }
}


// ===============================
// RESOLVE GROUP
// ===============================

async function resolveGroup(groupId) {

    const sessionCode =
        localStorage.getItem(
            "classpulseSessionCode"
        );


    try {

        const response =
            await fetch(
                `/api/questions/${sessionCode}/group/${groupId}/resolve`,
                {
                    method: "PUT"
                }
            );


        const data =
            await response.json();


        if (!data.success) {

            alert(
                data.message
            );

            return;
        }


        loadQuestions(
            sessionCode
        );


    } catch (error) {

        console.error(
            "Resolve error:",
            error
        );

        alert(
            "Could not resolve group."
        );

    }
}


// ===============================
// END SESSION
// ===============================

async function endSession() {

    const sessionCode =
        localStorage.getItem(
            "classpulseSessionCode"
        );


    if (!sessionCode) {

        alert(
            "No active session found."
        );

        return;
    }


    const confirmEnd =
        confirm(
            "Are you sure you want to end this session?"
        );


    if (!confirmEnd) {
        return;
    }


    try {

        const response =
            await fetch(
                `/api/sessions/${sessionCode}/end`,
                {
                    method: "PUT"
                }
            );


        const data =
            await response.json();


        if (!data.success) {

            alert(
                data.message
            );

            return;
        }


        alert(
            "Session ended successfully."
        );


        document.getElementById(
            "endSessionButton"
        ).style.display = "none";


        document.getElementById(
            "questionsSection"
        ).innerHTML = `

            <div class="form-card">

                <h2>
                    Session Ended
                </h2>

                <p>
                    Students can no longer
                    submit new questions.
                </p>

            </div>

        `;


    } catch (error) {

        console.error(
            "End session error:",
            error
        );


        alert(
            "Could not end session."
        );

    }
}

// ===============================
// RESTORE SESSION AFTER REFRESH
// ===============================

window.addEventListener(
    "load",
    async () => {

        const sessionCode =
            localStorage.getItem(
                "classpulseSessionCode"
            );


        if (!sessionCode) {
            return;
        }


        try {

            const response =
                await fetch(
                    `/api/sessions/${sessionCode}`
                );


            const data =
                await response.json();


            if (!data.success) {
                return;
            }


            document.getElementById(
                "sessionInfo"
            ).innerHTML = `

                <div class="form-card">

                    <h2>
                        Session Created!
                    </h2>

                    <p>
                        Class:
                        <strong>
                            ${data.session.className}
                        </strong>
                    </p>

                    <p>
                        Topic:
                        <strong>
                            ${data.session.topic}
                        </strong>
                    </p>

                    <h3>
                        Session Code
                    </h3>

                    <h2>
                        ${data.session.sessionCode}
                    </h2>

                </div>

            `;


            document.getElementById(
                "questionsSection"
            ).style.display = "block";


            loadQuestions(
                sessionCode
            );


        } catch (error) {

            console.error(
                "Could not restore session:",
                error
            );

        }

    }
);


// ===============================
// REAL-TIME NEW QUESTION
// ===============================

socket.on(
    "newQuestion",
    (question) => {

        const sessionCode =
            localStorage.getItem(
                "classpulseSessionCode"
            );


        if (
            sessionCode &&
            question.sessionCode === sessionCode
        ) {

            loadQuestions(
                sessionCode
            );

        }

    }
);


// ===============================
// REAL-TIME ANSWER
// ===============================

socket.on(
    "groupAnswered",
    (data) => {

        const sessionCode =
            localStorage.getItem(
                "classpulseSessionCode"
            );


        if (
            sessionCode &&
            data.sessionCode === sessionCode
        ) {

            loadQuestions(
                sessionCode
            );

        }

    }
);


// ===============================
// REAL-TIME RESOLVE
// ===============================

socket.on(
    "groupResolved",
    (data) => {

        const sessionCode =
            localStorage.getItem(
                "classpulseSessionCode"
            );


        if (
            sessionCode &&
            data.sessionCode === sessionCode
        ) {

            loadQuestions(
                sessionCode
            );

        }

    }
);