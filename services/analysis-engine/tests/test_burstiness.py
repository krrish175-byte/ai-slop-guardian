import pytest

from detectors.burstiness import BurstinessDetector


HUMAN_TEXT = """
Improved CNN validation pipeline and reduced overfitting issues
by fixing train-validation leakage in preprocessing workflow.
"""

AI_TEXT = """
This feature dramatically improves scalability and significantly enhances
system optimization and overall maintainability across workflows.
This feature dramatically improves scalability and significantly enhances
system optimization and overall maintainability across workflows.
"""

REPETITIVE_TEXT = """
test test test test test test test
optimize optimize optimize optimize
"""

CODE_TEXT = """
def train_model():
    model.fit(X_train, y_train)

for epoch in range(10):
    print(epoch)
"""

MARKDOWN_TEXT = """
# PR Improvements

## Added
- Better logging
- Faster validation
- Fixed pipeline issue

Code example:
print("burstiness")
"""


@pytest.fixture
def detector():
    return BurstinessDetector()


@pytest.mark.asyncio
async def test_burstiness_handles_empty_input(detector):

    result = await detector.detect("", "test/repo")

    assert result is not None
    assert "score" in result
    assert isinstance(result["score"], (int, float))


@pytest.mark.asyncio
async def test_burstiness_handles_human_text(detector):

    result = await detector.detect(HUMAN_TEXT, "test/repo")

    assert result is not None
    assert "score" in result


@pytest.mark.asyncio
async def test_burstiness_detects_repetitive_text(detector):

    result = await detector.detect(REPETITIVE_TEXT, "test/repo")

    assert result is not None
    assert "score" in result
    assert result["score"] >= 0


@pytest.mark.asyncio
async def test_burstiness_handles_ai_generated_style_text(detector):

    result = await detector.detect(AI_TEXT, "test/repo")

    assert result is not None
    assert "score" in result


@pytest.mark.asyncio
async def test_burstiness_handles_code_snippets(detector):

    result = await detector.detect(CODE_TEXT, "test/repo")

    assert result is not None
    assert "score" in result


@pytest.mark.asyncio
async def test_burstiness_handles_markdown_content(detector):

    result = await detector.detect(MARKDOWN_TEXT, "test/repo")

    assert result is not None
    assert "score" in result


@pytest.mark.asyncio
async def test_burstiness_handles_large_input(detector):

    large_text = HUMAN_TEXT * 100

    result = await detector.detect(large_text, "test/repo")

    assert result is not None
    assert "score" in result