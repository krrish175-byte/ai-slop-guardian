from fastapi import APIRouter, HTTPException
import os
import json
import numpy as np
import faiss
from sentence_transformers import SentenceTransformer
from groq import Groq
from models.schemas import (
    IssueEvaluateRequest,
    IssueEvaluateResponse,
    ProposalEvaluateRequest,
    ProposalEvaluateResponse
)
from indexer.vector_store import VectorStore


router = APIRouter()
store = VectorStore()
_encoder = None


def _get_groq_client() -> Groq | None:
    api_key = os.getenv("GROQ_API_KEY")
    if not api_key:
        return None
    return Groq(api_key=api_key)


def _get_encoder() -> SentenceTransformer:
    global _encoder
    if _encoder is None:
        _encoder = SentenceTransformer("all-MiniLM-L6-v2")
    return _encoder


@router.post("/evaluate", response_model=IssueEvaluateResponse)
async def evaluate_issue(request: IssueEvaluateRequest):
    client = _get_groq_client()
    if not client:
        raise HTTPException(
            status_code=503,
            detail="GROQ_API_KEY is not configured"
        )

    # 1. Search vector store for codebase context
    codebase_context = ""
    relevant_files = []
    try:
        encoder = _get_encoder()
        query_text = f"{request.title}\n\n{request.body}"
        query_embedding = encoder.encode([query_text])
        query_vector = np.array(query_embedding).astype("float32")
        faiss.normalize_L2(query_vector)

        chunks, distances = store.search(request.repo_id, query_vector, k=4)
        if chunks:
            codebase_context = "\n\n--- RELEVANT CODEBASE FILES ---\n"
            for chunk in chunks:
                path = chunk.get("path", "Unknown file")
                content = chunk.get("content", "")
                if path not in relevant_files:
                    relevant_files.append(path)
                codebase_context += (
                    f"\nFile: {path}\n```\n{content[:1200]}\n```\n"
                )
    except Exception as search_err:
        # Fallback if vector store is not indexed yet
        print(f"Vector search failed or index does not exist: {search_err}")
        codebase_context = "\n\n(No indexed codebase context available.)"

    # 2. Perform LLM analysis on Issue
    system_prompt = (
        "You are an AI Co-Maintainer for an elite open-source repository.\n"
        "Your job is to evaluate newly submitted issues, determine their "
        "validity, relevancy to the codebase, and guide GSSoC "
        "contributors.\n\n"
        "RELEVANCY RULE:\n"
        "Check if this issue targets actual modules or logical improvements "
        "in the codebase. If it is a duplicate, low-effort template spam "
        "(pure AI slop with no technical depth), or out of scope, "
        "classify it as 'invalid'.\n\n"
        "Return ONLY a JSON object matching this schema exactly:\n"
        "{\n"
        "  \"verdict\": \"valid\" | \"clarify\" | \"invalid\" | "
        "\"duplicate\",\n"
        "  \"difficulty\": \"level:beginner\" | \"level:intermediate\" | "
        "\"level:advanced\" | \"level:critical\",\n"
        "  \"labels\": [\"typescript\", \"frontend\", \"backend\", "
        "\"nlp\", etc.],\n"
        "  \"feedback\": \"detailed markdown comments...\",\n"
        "  \"relevant_files\": [\"path1\", \"path2\"]\n"
        "}"
    )

    user_prompt = (
        f"Issue Title: {request.title}\n"
        f"Issue Body: {request.body}\n"
        f"Repository ID: {request.repo_id}\n"
        f"Retrieved Codebase Context: {codebase_context}\n\n"
        "Analyze this issue. Be constructive and specific. If valid, "
        "suggest difficulty and domain labels, and mention which specific "
        "files the contributor needs to look at in your markdown feedback."
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
        data = json.loads(content, strict=False)

        # Merge structural relevant files found by LLM and FAISS
        files_union = list(
            set(data.get("relevant_files", []) + relevant_files)
        )

        return IssueEvaluateResponse(
            verdict=data.get("verdict", "clarify"),
            difficulty=data.get("difficulty", "level:beginner"),
            labels=data.get("labels", []),
            feedback=data.get(
                "feedback",
                "Thank you for the issue! A maintainer will review it."
            ),
            relevant_files=files_union[:4]
        )
    except Exception as e:
        print(f"Issue Evaluation Error: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/proposal/evaluate", response_model=ProposalEvaluateResponse)
async def evaluate_proposal(request: ProposalEvaluateRequest):
    client = _get_groq_client()
    if not client:
        raise HTTPException(
            status_code=503,
            detail="GROQ_API_KEY is not configured"
        )

    system_prompt = (
        "You are an AI Co-Maintainer for an elite open-source repository.\n"
        "Your task is to review and grade technical proposals submitted by "
        "contributors claiming open issues under GSSoC.\n\n"
        "GRADING CRITERIA (Score 1 to 10):\n"
        "1. Technical Understanding: Does the candidate understand the "
        "issue description and files?\n"
        "2. Action Plan: Do they outline a specific, solid implementation "
        "path? Or is it generic 'I will solve this' template spam?\n"
        "3. File correctness: Do they refer to the right codebase files?\n\n"
        "SCORING RULE:\n"
        "- Score >= 8: Highly technical, specific, understands codebase, "
        "lists the correct implementation strategy.\n"
        "- Score < 8: Generic, copy-paste, lacks specific file details, "
        "or is uninformative.\n\n"
        "Return ONLY a JSON object matching this schema exactly:\n"
        "{\n"
        "  \"score\": int,\n"
        "  \"verdict\": \"assign\" | \"clarify\",\n"
        "  \"feedback\": \"detailed markdown feedback comment...\"\n"
        "}"
    )

    user_prompt = (
        f"Issue Title: {request.issue_title}\n"
        f"Issue Body: {request.issue_body}\n"
        f"Candidate Username: {request.candidate_login}\n"
        f"Candidate Proposal Comment: {request.proposal_text}\n\n"
        "Evaluate this candidate's claim. If the score is >= 8, set verdict "
        "to 'assign'. Otherwise, set to 'clarify' and gently ask them "
        "to answer specific technical questions to clarify their plan."
    )

    try:
        response = client.chat.completions.create(
            model="llama-3.3-70b-versatile",
            messages=[
                {"role": "system", "content": system_prompt},
                {"role": "user", "content": user_prompt},
            ],
            response_format={"type": "json_object"},
            max_tokens=800,
        )

        content = response.choices[0].message.content.strip()
        data = json.loads(content, strict=False)

        return ProposalEvaluateResponse(
            score=data.get("score", 5),
            verdict=data.get("verdict", "clarify"),
            feedback=data.get(
                "feedback",
                "Please provide more technical details regarding your plan."
            )
        )
    except Exception as e:
        print(f"Proposal Evaluation Error: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))
