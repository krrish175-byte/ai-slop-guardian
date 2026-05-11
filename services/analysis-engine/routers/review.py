from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
import os
from groq import Groq
import json

router = APIRouter()


def _get_client() -> Groq | None:
    api_key = os.getenv("GROQ_API_KEY")
    if not api_key:
        return None
    return Groq(api_key=api_key)


class ReviewRequest(BaseModel):
    diff: str
    pr_title: str
    pr_body: str
    repo_id: str
    slop_score: float


@router.post("/generate")
async def generate_review(request: ReviewRequest):
    client = _get_client()
    if client is None:
        raise HTTPException(
            status_code=503,
            detail="GROQ_API_KEY is not configured",
        )
    system_prompt = (
        "You are a senior code reviewer for an open source project."
    )
    user_prompt = (
        "Review this PR diff. Be specific about:\n"
        "1) What the code actually does,\n"
        "2) Potential bugs or edge cases,\n"
        "3) Code quality issues,\n"
        "4) Suggested improvements.\n"
        "Be concise, technical, and helpful.\n\n"
        f"PR Title: {request.pr_title}\n"
        f"PR Body: {request.pr_body}\n"
        f"Slop Score: {request.slop_score}\n\n"
        "Diff:\n"
        f"{request.diff[:6000]}\n\n"
        "Return ONLY a JSON object: {\"review\": \"str\", "
        "\"verdict\": \"approve|request_changes|comment\"}\n"
        "Ensure \"review\" is a detailed markdown string with at least 2 "
        "paragraphs of analysis."
    )

    try:
        response = client.chat.completions.create(
            model="llama-3.3-70b-versatile",
            messages=[
                {"role": "system", "content": system_prompt},
                {"role": "user", "content": user_prompt},
            ],
            response_format={"type": "json_object"},
            max_tokens=1000,
        )

        content = response.choices[0].message.content.strip()
        # Robust JSON extraction
        if "```json" in content:
            content = content.split("```json")[1].split("```")[0].strip()
        elif "```" in content:
            content = content.split("```")[1].split("```")[0].strip()

        data = json.loads(content, strict=False)
        return data
    except Exception as e:
        print(f"Review Generation Error: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))
