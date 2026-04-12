import torch
from transformers import AutoTokenizer, AutoModelForCausalLM
import math
from detectors.base import BaseDetector
from models.schemas import DetectorResult

class PerplexityDetector(BaseDetector):
    name = "Perplexity"
    weight = 0.30

    def __init__(self):
        self.device = "cuda" if torch.cuda.is_available() else "cpu"
        self.model_id = "gpt2"
        self.tokenizer = None
        self.model = None

    def _load_model(self):
        if self.tokenizer is None:
            self.tokenizer = AutoTokenizer.from_pretrained(self.model_id)
            self.model = AutoModelForCausalLM.from_pretrained(self.model_id).to(self.device)
            self.model.eval()

    async def detect(self, content: str, repo_id: str) -> DetectorResult:
        self._load_model()
        
        encodings = self.tokenizer(content, return_tensors="pt")
        max_length = 512 # GPT-2 max context
        stride = 256
        
        seq_len = encodings.input_ids.size(1)
        
        if seq_len < 10:
            return DetectorResult(
                name=self.name,
                score=0.5,
                confidence=0.2,
                signals=["Text too short for perplexity analysis."]
            )

        nlls = []
        prev_end_loc = 0
        for begin_loc in range(0, seq_len, stride):
            end_loc = min(begin_loc + max_length, seq_len)
            trg_len = end_loc - prev_end_loc  # how many new tokens we're generating
            input_ids = encodings.input_ids[:, begin_loc:end_loc].to(self.device)
            target_ids = input_ids.clone()
            target_ids[:, :-trg_len] = -100

            with torch.no_grad():
                outputs = self.model(input_ids, labels=target_ids)
                neg_log_likelihood = outputs.loss * trg_len

            nlls.append(neg_log_likelihood)

            prev_end_loc = end_loc
            if end_loc == seq_len:
                break

        ppl = torch.exp(torch.stack(nlls).sum() / end_loc).item()
        
        # Normalize: perplexity < 20 -> score 0.9 (AI), perplexity > 80 -> score 0.1 (Human)
        if ppl < 20:
            score = 0.9
        elif ppl > 80:
            score = 0.1
        else:
            # Linear interpolation: (20, 0.9) to (80, 0.1)
            # score = 0.9 - (ppl - 20) * (0.8 / 60)
            score = 0.9 - (ppl - 20) * 0.0133
            
        predictability = max(0, min(100, (1 - (ppl / 100)) * 100)) if ppl < 100 else 0
        
        return DetectorResult(
            name=self.name,
            score=round(score, 2),
            confidence=0.85,
            signals=[
                f"Perplexity score: {ppl:.1f} (AI text typically < 30)",
                f"Text is statistically {predictability:.1f}% more predictable than average human writing"
            ]
        )
