from fastapi import APIRouter, Depends
from pydantic import BaseModel, Field
from typing import List
import os
import uuid
from datetime import datetime, timedelta
from groq import Groq
from utils.limiter import limiter
from utils.security import verify_api_key

router = APIRouter()
client = Groq(api_key=os.getenv("GROQ_API_KEY", "placeholder"))


class ChallengeRequest(BaseModel):
    diff: str = Field(..., min_length=1)
    pr_title: str = Field(..., min_length=1)
    repo_id: str = Field(..., min_length=3)


class ChallengeResponse(BaseModel):
    questions: List[str]
    challenge_id: str
    expires_at: str


@router.post("/generate", response_model=ChallengeResponse, dependencies=[Depends(verify_api_key)])
@limiter.limit("3/minute")
async def generate_challenge(req: ChallengeRequest):

    prompt = (
        f"Given this code diff from a PR titled \"{req.pr_title}\", "
        "generate exactly 3 specific technical questions that only the person "
        "who actually wrote this code could answer confidently. Focus on "
        "implementation decisions, edge cases, and reasoning behind specific "
        "choices.\n\n"
        "Code diff:\n"
        f"{req.diff[:2000]}\n\n"
        "Return a JSON object with this exact format:\n"
        "{\"questions\": [\"question1\", \"question2\", \"question3\"]}\n\n"
        "Return ONLY the JSON, nothing else."
    )

    try:
        response = client.chat.completions.create(
            model="llama-3.3-70b-versatile",
            messages=[{"role": "user", "content": prompt}],
            max_tokens=500,
        )
        import json
        content = response.choices[0].message.content.strip()

        # Robust JSON extraction
        if "```json" in content:
            content = content.split("```json")[1].split("```")[0].strip()
        elif "```" in content:
            content = content.split("```")[1].split("```")[0].strip()

        data = json.loads(content)
        questions = data.get("questions", [])
    except Exception as e:
        print(f"Challenge Generation Error: {str(e)}")
        questions = [
            f"What specific problem does this PR solve in {req.repo_id}?",
            (
                "Why did you choose this implementation approach "
                "over alternatives?"
            ),
            "What edge cases or failure modes did you consider?",
        ]

    return ChallengeResponse(
        questions=questions,
        challenge_id=str(uuid.uuid4()),
        expires_at=(datetime.utcnow() + timedelta(hours=48)).isoformat()
    )


class VerifyChallengeRequest(BaseModel):
    diff: str = Field(..., min_length=1)
    questions: List[str] = Field(..., min_length=1)
    answers: str = Field(..., min_length=1)


class VerifyChallengeResponse(BaseModel):
    verification_score: float
    reasoning: str
    passed: bool


@router.post("/verify", response_model=VerifyChallengeResponse, dependencies=[Depends(verify_api_key)])
@limiter.limit("3/minute")
async def verify_challenge(req: VerifyChallengeRequest):
    prompt = (
        "You are an expert code auditor. Your task is to verify if a contributor "
        "actually wrote the code they submitted by analyzing their answers to "
        "specific technical questions about the code.\n\n"
        "Context:\n"
        "Code Diff:\n"
        f"{req.diff[:3000]}\n\n"
        "Questions asked to the contributor:\n"
        + "\n".join([f"{i+1}. {q}" for i, q in enumerate(req.questions)]) + "\n\n"
        "Contributor's Answers:\n"
        f"{req.answers}\n\n"
        "Evaluation Criteria:\n"
        "1. Accuracy: Do the answers correctly reflect the implementation in the diff?\n"
        "2. Specificity: Are the answers detailed enough to show first-hand knowledge, "
        "or are they vague/generic?\n"
        "3. Consistency: Do the answers align with the technical decisions visible in the code?\n"
        "4. Language: Be lenient with non-native English speakers; focus on technical depth over grammar.\n\n"
        "Return a JSON object with this exact format:\n"
        "{\"verification_score\": 0.0 to 1.0, \"reasoning\": \"Detailed analysis\", \"passed\": boolean}\n"
        "A score > 0.7 usually indicates a pass. Return ONLY the JSON."
    )

    try:
        response = client.chat.completions.create(
            model="llama-3.3-70b-versatile",
            messages=[{"role": "user", "content": prompt}],
            response_format={"type": "json_object"},
            max_tokens=1000,
        )
        import json
        content = response.choices[0].message.content.strip()
        data = json.loads(content)
        return VerifyChallengeResponse(
            verification_score=data.get("verification_score", 0.0),
            reasoning=data.get("reasoning", "No reasoning provided"),
            passed=data.get("passed", False)
        )
    except Exception as e:
        print(f"Verification Error: {str(e)}")
        return VerifyChallengeResponse(
            verification_score=0.0,
            reasoning=f"Internal error during verification: {str(e)}",
            passed=False
        )

