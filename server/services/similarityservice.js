const OLLAMA_URL = "http://localhost:11434/api/generate";


// Compare two questions
async function checkSimilarity(question1, question2) {

    const prompt = `
You are a semantic similarity classifier for a classroom question-answering system.

Your task is to determine whether two student questions should belong to the SAME question group.

The purpose of grouping is to help a teacher answer repeated or equivalent questions together.

Compare the meaning and information requested by the questions, not their exact wording.

RULES:

1. Return SAME if both questions are asking for essentially the same information, concept, fact, explanation, procedure, or result.

2. Different wording, grammar, sentence structure, or phrasing should not affect the decision if the intended question is the same.

3. Treat paraphrases and synonymous expressions as the same when they request the same information.

4. Return DIFFERENT if the questions require substantially different answers.

5. Do not group questions simply because they are about the same broad subject.

6. Do not group questions simply because they contain the same keywords.

7. A general concept and a specific sub-concept should be DIFFERENT when they require different information.

8. Questions asking about different properties, causes, advantages, disadvantages, applications, examples, procedures, comparisons, or results should be DIFFERENT unless they clearly request the same information.

9. Ignore superficial differences such as capitalization, punctuation, minor spelling mistakes, and phrases such as "What is", "Explain", "Describe", or "Can you explain".

10. Consider the complete meaning of both questions.

11. Imagine that you are the teacher answering both questions. If one answer would essentially answer the other question as well, return SAME. Otherwise return DIFFERENT.

Question 1:
${question1}

Question 2:
${question2}

Return ONLY:

SAME

or

DIFFERENT
`;

    try {

        const response = await fetch(
            OLLAMA_URL,
            {
                method: "POST",

                headers: {
                    "Content-Type": "application/json"
                },

                body: JSON.stringify({

                    model: "llama3.2",

                    prompt: prompt,

                    stream: false,

                    options: {
                        temperature: 0
                    }

                })
            }
        );

        const data = await response.json();

        const answer =
            data.response
                .trim()
                .toUpperCase();

        console.log(
            "Ollama comparison:",
            question1,
            "VS",
            question2,
            "=>",
            answer
        );

        return answer === "SAME";

    } catch (error) {

        console.error(
            "Ollama similarity error:",
            error
        );

        return false;
    }
}


// Find an existing question group
async function findGroup(
    newQuestion,
    existingQuestions
) {

    for (const question of existingQuestions) {

        if (question.groupId === null) {
            continue;
        }

        const similar =
            await checkSimilarity(
                newQuestion.questionText,
                question.questionText
            );

        if (similar) {

            return question.groupId;

        }

    }

    return null;
}


module.exports = {
    checkSimilarity,
    findGroup
};