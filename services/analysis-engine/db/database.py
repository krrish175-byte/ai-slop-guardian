from sqlalchemy import create_engine, inspect, text
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker
import os

SQLALCHEMY_DATABASE_URL = "sqlite:///./data/guardian.db"
os.makedirs("./data", exist_ok=True)

engine = create_engine(
    SQLALCHEMY_DATABASE_URL, connect_args={"check_same_thread": False}
)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

Base = declarative_base()


def ensure_schema() -> None:
    with engine.begin() as connection:
        inspector = inspect(connection)

        table_names = inspector.get_table_names()
        if "analysis_results" not in table_names:
            return

        columns = inspector.get_columns("analysis_results")
        column_names = {col["name"] for col in columns}
        if "contributor_trust_score" not in column_names:
            sql = (
                "ALTER TABLE analysis_results "
                "ADD COLUMN contributor_trust_score INTEGER DEFAULT 0"
            )
            connection.execute(text(sql))


def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
