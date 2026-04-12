from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from db.database import get_db, SessionLocal
from db.models import Challenge
from pydantic import BaseModel
import os
import uuid
from datetime import datetime, timedelta
import anthropic
import json

router = APIRouter()
client = anthropic.Anthropic(api_key=os.getenv("ANTHROPIC_API_KEY"))

class ChallengeRequest(BaseModel):
    diff: str
    pr_title: str
    repo_id: str
    pr_number: int

class AnswerRequest(BaseModel):
    challenge_id: str
    answers: str

@router.post("/generate")
async def generate_challenge(request: ChallengeRequest):
    prompt = f"""Given this code diff for PR "{request.pr_title}", generate 3 specific technical questions that only the person who wrote this code could answer. 
    Questions should be about implementation decisions, edge cases handled, and why specific approaches were chosen. 
    Return ONLY a JSON object with a single key "questions" containing a list of 3 strings.
    
    Diff:
    {request.diff[:4000]}
    """
    
    try:
        response = client.messages.create(
            model="claude-sonnet-4-20250514",
            max_tokens=500,
            messages=[{"role": "user", "content": prompt}]
        )
        
        # Parse JSON from response
        res_text = response.content[0].text
        data = json.loads(res_text)
        questions = data.get("questions", [])
        
        challenge_id = str(uuid.uuid4())
        expires_at = datetime.utcnow() + timedelta(hours=48)
        
        db = SessionLocal()
        try:
            db_challenge = Challenge(
                challenge_id=challenge_id,
                repo_id=request.repo_id,
                pr_number=request.pr_number,
                questions=questions,
                expires_at=expires_at
            )
            db.add(db_challenge)
            db.commit()
        finally:
            db.close()
            
        return {
            "questions": questions,
            "challenge_id": challenge_id,
            "expires_at": expires_at.isoformat()
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/verify")
async def verify_challenge(request: AnswerRequest, db: Session = Depends(get_db)):
    challenge = db.query(Challenge).filter(Challenge.challenge_id == request.challenge_id).first()
    if not challenge:
        raise HTTPException(status_code=404, detail="Challenge not found")
    
    if challenge.status != "pending":
        return {"status": challenge.status, "message": "Challenge already processed"}

    # Use Claude to score the answers
    questions_str = "\n".join([f"{i+1}. {q}" for i, q in enumerate(challenge.questions)])
    prompt = f"""You are a senior code reviewer. A contributor provided these answers to a comprehension challenge designed to verify they wrote the code.
    
    Questions:
    {questions_str}
    
    Contributor Answers:
    {request.answers}
    
    Evaluate if these answers show genuine understanding of the implementation details of a code change. 
    Return ONLY a JSON object: {{"passed": boolean, "reason": "str"}}
    """
    
    try:
        response = client.messages.create(
            model="claude-sonnet-4-20250514",
            max_tokens=300,
            messages=[{"role": "user", "content": prompt}]
        )
        
        data = json.loads(response.content[0].text)
        passed = data.get("passed", False)
        
        challenge.status = "passed" if passed else "failed"
        db.commit()
        
        return {"passed": passed, "reason": data.get("reason", "")}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/find/{repo_id:path}/{pr_number}")
async def find_challenge(repo_id: str, pr_number: int, db: Session = Depends(get_db)):
    challenge = db.query(Challenge).filter(
        Challenge.repo_id == repo_id,
        Challenge.pr_number == pr_number,
        Challenge.status == "pending"
    ).order_by(Challenge.created_at.desc()).first()
    
    if not challenge:
        return {"challenge_id": None}
        
    return {"challenge_id": challenge.challenge_id}
