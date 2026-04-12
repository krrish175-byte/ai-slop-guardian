from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
import os
from groq import Groq
import json

router = APIRouter()
client = Groq(api_key=os.getenv("GROQ_API_KEY"))

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
        response = client.chat.completions.create(
            model="llama-3.3-70b-versatile",
            messages=[
                {"role": "system", "content": system_prompt},
                {"role": "user", "content": user_prompt}
            ],
            max_tokens=1000,
        )
        
        data = json.loads(response.choices[0].message.content)
        return data
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
