import asyncio
from typing import List
from detectors.base import BaseDetector
from detectors.perplexity import PerplexityDetector
from detectors.burstiness import BurstinessDetector
from detectors.pattern import PatternDetector
from detectors.embedding import EmbeddingDetector
from detectors.dna import DNADetector
from models.schemas import DetectorResult, AnalyzeResponse

class EnsembleDetector:
    def __init__(self):
        self.detectors: List[BaseDetector] = [
            PerplexityDetector(),
            BurstinessDetector(),
            PatternDetector(),
            EmbeddingDetector(),
            DNADetector()
        ]

    async def analyze(self, content: str, repo_id: str) -> AnalyzeResponse:
        # Run all detectors concurrently
        tasks = [d.detect(content, repo_id) for d in self.detectors]
        results: List[DetectorResult] = await asyncio.gather(*tasks)
        
        weighted_score = 0.0
        total_weight = 0.0
        
        for i, res in enumerate(results):
            weight = self.detectors[i].weight
            weighted_score += res.score * weight
            total_weight += weight
        
        final_score = weighted_score / total_weight if total_weight > 0 else 0.5
        
        # Determine label
        if final_score >= 0.85:
            label = "ai-slop:high"
        elif final_score >= 0.60:
            label = "ai-slop:medium"
        elif final_score >= 0.40:
            label = "ai-slop:low"
        else:
            label = "human"
            
        # Model fingerprinting
        fingerprint = "unknown"
        pattern_res = next((r for r in results if r.name == "Pattern"), None)
        if pattern_res and pattern_res.score > 0.6:
            fingerprint = "gpt-pattern"
            
        confidence = sum(r.confidence for r in results) / len(results)
        
        summary = f"Content shows {final_score*100:.0f}% AI probability based on perplexity, style patterns, and deviation from repo baseline."
        
        return AnalyzeResponse(
            overall_score=round(final_score, 2),
            label=label,
            confidence=round(confidence, 2),
            detectors=results,
            contributor_trust_score=0, # Will be filled by router
            summary=summary,
            model_fingerprint=fingerprint
        )
