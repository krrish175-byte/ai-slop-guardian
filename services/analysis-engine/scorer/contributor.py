from datetime import datetime, timezone
from typing import List, Dict

class ContributorScorer:
    def calculate_trust_score(self, contributor_data: Dict) -> Dict:
        """
        Input data structure (expected from Node.js app):
        {
            "login": str,
            "created_at": str (ISO format),
            "public_repos": int,
            "followers": int,
            "total_commits": int,
            "previous_merged_prs": int,
            "is_first_time": bool
        }
        """
        score = 0
        signals = []
        
        # Account age
        created_at_str = contributor_data.get("created_at")
        if created_at_str:
            created_at = datetime.fromisoformat(created_at_str.replace("Z", "+00:00"))
            age_days = (datetime.now(timezone.utc) - created_at).days
            
            if age_days > 3 * 365:
                score += 20
                signals.append("Account is >3 years old (+20)")
            elif age_days < 30:
                score -= 30
                signals.append("Account created in last 30 days (-30)")
                
        # Commits
        total_commits = contributor_data.get("total_commits", 0)
        if total_commits > 100:
            score += 20
            signals.append("Reliable commit history >100 (+20)")
        elif total_commits > 10:
            score += 10
            signals.append("Some commit history (+10)")
            
        # Repos & Followers
        if contributor_data.get("public_repos", 0) > 5:
            score += 10
            signals.append("Active in public repos (+10)")
            
        if contributor_data.get("followers", 0) > 10:
            score += 10
            signals.append("Has followers (+10)")
            
        # Previous contributions to this repo
        prev_prs = contributor_data.get("previous_merged_prs", 0)
        if prev_prs > 0:
            bonus = min(20, prev_prs * 5)
            score += bonus
            signals.append(f"Previously merged {prev_prs} PRs (+{bonus})")
            
        # First time contributor flag
        if contributor_data.get("is_first_time", False):
            score -= 20
            signals.append("First-time contributor to this repo (-20)")
            
        final_score = max(0, min(100, score))
        
        return {
            "score": final_score,
            "signals": signals
        }
