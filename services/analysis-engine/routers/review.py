from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
import os
import anthropic
import json

router = APIRouter()
client = anthropic.Anthropic(api_key=os.getenv("ANTHROPIC_API_KEY"))

class ReviewRequest(BaseModel):
    diff: str
    pr_title: str
    pr_body: str
    repo_id: str
    slop_score: float

@router.post("/generate")
async def generate_review(request: ReviewRequest):
    system_prompt = "You are a senior code reviewer for an open source project."
    user_prompt = f"""Review this PR diff. Be specific about: 
    1) What the code actually does, 
    2) Potential bugs or edge cases, 
    3) Code quality issues, 
    4) Suggested improvements. 
    Be concise, technical, and helpful. 
    
    PR Title: {request.pr_title}
    PR Body: {request.pr_body}
    Slop Score: {request.slop_score}
    
    Diff:
    {request.diff[:6000]}
    
    Return ONLY a JSON object: {{"review": "str", "verdict": "approve|request_changes|comment"}}
    """
    
    try:
        response = client.messages.create(
            model="claude-sonnet-4-20250514",
            max_tokens=1000,
            system=system_prompt,
            messages=[{"role": "user", "content": user_prompt}]
        )
        
        data = json.loads(response.content[0].text)
        return data
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
