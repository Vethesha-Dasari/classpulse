const socket = io();


// ===============================
// CHECK QR SESSION CODE
// ===============================

const urlParams =
    new URLSearchParams(window.location.search);

const qrSessionCode =
    urlParams.get("session");

if (qrSessionCode) {

    document.getElementById(
        "sessionCode"
    ).value = qrSessionCode;

}


// ===============================
// JOIN SESSION
// ===============================

async function joinSession() {

    const studentName =
        document.getElementById(
            "studentName"
        ).value.trim();

    const sessionCode =
        document.getElementById(
            "sessionCode"
        ).value.trim();


    if (!studentName) {

        alert("Please enter your name.");

        return;
    }


    if (!sessionCode) {

        alert("Please enter the session code.");

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

            alert("Session not found.");

            return;
        }

        


        // Save student information

        localStorage.setItem(
            "classpulseStudentName",
            studentName
        );

        localStorage.setItem(
            "classpulseStudentSessionCode",
            sessionCode
        );


        document.getElementById(
            "sessionInfo"
        ).innerHTML = `

            <div class="form-card">

                <h2>Session Joined!</h2>

                <p>
                    Welcome,
                    <strong>${studentName}</strong>
                </p>

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

            </div>

        `;


        document.getElementById(
            "questionSection"
        ).style.display = "block";


        // Load previously submitted questions

        loadMyQuestions();


    } catch (error) {

        console.error(error);

        alert(
            "Could not connect to the server."
        );

    }
}


// ===============================
// SUBMIT QUESTION
// ===============================

async function submitQuestion() {

    const studentName =
        document.getElementById(
            "studentName"
        ).value.trim();


    const sessionCode =
        document.getElementById(
            "sessionCode"
        ).value.trim();


    const questionText =
        document.getElementById(
            "questionText"
        ).value.trim();


    if (!questionText) {

        alert(
            "Please enter your question."
        );

        return;
    }


    try {

        const response =
            await fetch(
                "/api/questions",
                {
                    method: "POST",

                    headers: {
                        "Content-Type":
                            "application/json"
                    },

                    body: JSON.stringify({
                        sessionCode,
                        studentName,
                        questionText
                    })
                }
            );


        const data =
            await response.json();


        if (data.success) {

            document.getElementById(
                "questionMessage"
            ).innerHTML = `

                <p>
                    Question submitted successfully! ✅
                </p>

            `;


            document.getElementById(
                "questionText"
            ).value = "";


            loadMyQuestions();


        } else {

            alert(data.message);

        }


    } catch (error) {

        console.error(error);

        alert(
            "Could not connect to the server."
        );

    }
}


// ===============================
// LOAD MY QUESTIONS
// ===============================

async function loadMyQuestions() {

    const studentName =
        localStorage.getItem(
            "classpulseStudentName"
        );


    const sessionCode =
        localStorage.getItem(
            "classpulseStudentSessionCode"
        );


    if (!studentName || !sessionCode) {
        return;
    }


    try {

        const response =
            await fetch(
                `/api/questions/${sessionCode}/student/${encodeURIComponent(studentName)}`
            );


        const data =
            await response.json();


        if (!data.success) {
            return;
        }


        displayMyQuestions(
            data.questions
        );


    } catch (error) {

        console.error(
            "Could not load student questions:",
            error
        );

    }
}


// ===============================
// DISPLAY MY QUESTIONS
// ===============================

function displayMyQuestions(questions) {

    const container =
        document.getElementById(
            "myQuestions"
        );


    if (!questions.length) {

        container.innerHTML = `
            <p>No questions submitted yet.</p>
        `;

        return;
    }


    container.innerHTML =
        questions.map(question => {

            let statusText =
                "Waiting for teacher answer...";


            if (
                question.answer &&
                question.answer.trim() !== ""
            ) {

                statusText = `

                    <div class="student-answer">

                        <strong>
                            Teacher Answer:
                        </strong>

                        <p>
                            ${question.answer}
                        </p>

                    </div>

                `;


                if (question.resolved) {

                    statusText += `

                        <p class="resolved-badge">
                            Resolved ✓
                        </p>

                    `;

                }

            }


            return `

                <div class="question-item">

                    <div class="question-text">
                        ${question.questionText}
                    </div>

                    <div class="question-status">
                        ${statusText}
                    </div>

                </div>

            `;

        }).join("");
}


// ===============================
// REAL-TIME ANSWER
// ===============================

socket.on(
    "groupAnswered",
    () => {

        loadMyQuestions();

    }
);


// ===============================
// REAL-TIME RESOLVE
// ===============================

socket.on(
    "groupResolved",
    () => {

        loadMyQuestions();

    }
);

socket.on(
    "groupAnswered",
    () => {

        loadMyQuestions();

    }
);


socket.on(
    "groupResolved",
    () => {

        loadMyQuestions();

    }
);