import re
from detectors.base import BaseDetector
from models.schemas import DetectorResult

class PatternDetector(BaseDetector):
    name = "Pattern"
    weight = 0.15

    PHRASES = [
        r"\bI hope this (helps|finds you well|PR)\b",
        r"\bfeel free to\b",
        r"\blet me know if you (have|need)\b",
        r"\bI'd be happy to\b",
        r"\bCertainly[!,]?\b",
        r"\bAbsolutely[!,]?\b",
        r"\bGreat question\b",
        r"\bAs an AI\b",
        r"\bAs a language model\b",
        r"\bThis (commit|PR|change) (introduces|implements|adds|updates|refactors)\b",
        r"\bThis (function|method|class) (is responsible for|handles|manages)\b",
        r"\bEnsure[sd]? that\b",
        r"\bIn (summary|conclusion|order to)\b",
        r"\bIt's worth (noting|mentioning)\b",
        r"\bThis approach (ensures|provides|allows|enables)\b",
    ]

    CODE_PATTERNS = [
        r"#(?: This| The)? (?:function|method|class|code) .{0,50}",  # Over-commented
        r"#(?: TODO| FIXME| NOTE): .{0,100}",                       # Generic todos
        r"\"\"\"[\s\S]{500,}\"\"\"",                                 # Massive docstrings
    ]

    async def detect(self, content: str, repo_id: str, history: List[str] = []) -> DetectorResult:
        matched_phrases = []
        for pattern in self.PHRASES:
            if re.search(pattern, content, re.IGNORECASE):
                matched_phrases.append(pattern)
        
        matched_code = []
        for pattern in self.CODE_PATTERNS:
            if re.search(pattern, content):
                matched_code.append(pattern)
        
        total_matches = len(matched_phrases) + len(matched_code)
        # Score calculation: Normalize based on total patterns.
        # This is a heuristic: more than 4 matches is high probability.
        score = min(1.0, total_matches / 5.0)
        
        signals = [f"Matched AI phrase pattern: {p}" for p in matched_phrases]
        signals += [f"Matched AI code pattern: {p}" for p in matched_code]
        
        return DetectorResult(
            name=self.name,
            score=round(score, 2),
            confidence=0.8,
            signals=signals
        )
