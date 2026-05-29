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
