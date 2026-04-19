import pytest
from unittest.mock import patch, MagicMock
import sys
import os

# Add the parent directory to sys.path to ensure modules can be found
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

@pytest.fixture(autouse=True)
def mock_ensemble():
    """Globally mock EnsembleDetector to avoid loading heavy models."""
    # We patch __init__ to prevent it from instantiating any real detectors that might load models
    with patch("detectors.ensemble.EnsembleDetector.__init__", return_value=None):
        yield

@pytest.fixture(autouse=True)
def mock_warmup():
    """Globally mock the warmup function in main to prevent it from trying to analyze anything."""
    with patch("main.warmup", return_value=None):
        yield

@pytest.fixture(autouse=True)
def mock_db():
    """Globally mock the database to avoid connection issues."""
    with patch("db.database.get_db", return_value=None):
        yield
