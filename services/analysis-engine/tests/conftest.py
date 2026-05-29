import os
import sys
from unittest.mock import patch

import pytest

import detectors.ensemble

# Add the parent directory to sys.path to ensure modules can be found
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

# Mock EnsembleDetector init at module level to prevent heavy models
# from loading during pytest collection


def mock_ensemble_init(self, *args, **kwargs):
    self.detectors = []


detectors.ensemble.EnsembleDetector.__init__ = mock_ensemble_init


@pytest.fixture(autouse=True)
def mock_ensemble():
    """Legacy fixture kept for compatibility but mock is now global."""
    yield


@pytest.fixture(autouse=True)
def mock_warmup():
    """Globally mock warmup in main to prevent analysis on import."""
    with patch("main.warmup", return_value=None):
        yield


@pytest.fixture(autouse=True)
def mock_db():
    """Globally mock the database to avoid connection issues."""
    with patch("db.database.get_db", return_value=None):
        yield
