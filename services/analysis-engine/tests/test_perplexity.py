import pytest

from detectors.perplexity import PerplexityDetector


HUMAN_TEXT = """
Refactored the preprocessing pipeline to avoid data leakage during validation.
Added proper train/test split handling and updated model evaluation metrics.
"""

AI_TEXT = """
This implementation significantly enhances the functionality of the system
while improving scalability, maintainability, optimization, and overall efficiency.
This implementation significantly enhances the functionality of the system
while improving scalability, maintainability, optimization, and overall efficiency.
"""

REPETITIVE_TEXT = """
optimize optimize optimize optimize optimize optimize
improve improve improve improve improve improve
"""

CODE_HEAVY_TEXT = """
def preprocess_data(df):
    df = df.dropna()
    return df

for i in range(10):
    print(i)
"""

MARKDOWN_TEXT = """
# Feature Update

## Improvements
- Added validation checks
- Improved logging
- Fixed preprocessing bug

Code example:
print("hello")
""" """
"""