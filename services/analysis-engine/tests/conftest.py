import os
import sys

import pytest

sys.path.append(
    os.path.abspath(
        os.path.join(os.path.dirname(__file__), "..")
    )
)

from db.database import Base, engine
import db.models


@pytest.fixture(scope="session", autouse=True)
def setup_test_db():

    # Create tables using app's actual engine
    Base.metadata.create_all(bind=engine)

    yield

    # Cleanup
    Base.metadata.drop_all(bind=engine)