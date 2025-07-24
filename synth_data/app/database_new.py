import os
import json
from sqlalchemy import create_engine, text
from typing import List, Dict, Optional

# This line reads the database connection URL that Railway will provide as an environment variable.
DATABASE_URL = os.getenv("DATABASE_URL")
if not DATABASE_URL:
    # This fallback is for your local development if you set up a local Postgres instance.
    # For now, it will raise an error if the variable isn't set on Railway.
    raise ValueError("DATABASE_URL environment variable is not set.")

# Create a SQLAlchemy engine to manage the connection pool to the database.
engine = create_engine(DATABASE_URL)

def init_db():
    """Initializes the PostgreSQL database and creates the patients table."""
    with engine.connect() as con:
        # The 'data' column is of type JSONB, which is optimized for storing JSON in PostgreSQL.
        con.execute(text('''
            CREATE TABLE IF NOT EXISTS patients (
                id TEXT PRIMARY KEY,
                name TEXT NOT NULL,
                data JSONB NOT NULL
            )
        '''))
        con.commit()
    print("PostgreSQL database is ready.")

def add_patient_to_db(patient_data: Dict):
    """Adds or replaces a patient record in the database using an 'upsert' operation."""
    patient_json = json.dumps(patient_data)
    with engine.connect() as con:
        # This SQL command will INSERT a new record, or UPDATE it if a patient with the same ID already exists.
        con.execute(
            text("INSERT INTO patients (id, name, data) VALUES (:id, :name, :data) ON CONFLICT (id) DO UPDATE SET name = :name, data = :data"),
            {
                "id": patient_data['id'],
                "name": patient_data['name'],
                "data": patient_json
            }
        )
        con.commit()
    print(f"Saved patient {patient_data['name']} to DB.")

def update_patient_in_db(patient_id: str, patient_data: Dict):
    """Updates an existing patient record in the database."""
    patient_json = json.dumps(patient_data)
    with engine.connect() as con:
        con.execute(
            text("UPDATE patients SET name = :name, data = :data WHERE id = :id"),
            {
                "name": patient_data.get('name', 'Unknown'),
                "data": patient_json,
                "id": patient_id
            }
        )
        con.commit()
    print(f"Updated patient {patient_id} in DB.")

def get_all_patients_from_db() -> List[Dict]:
    """Retrieves a summary of all patients from the database."""
    with engine.connect() as con:
        result = con.execute(text("SELECT id, name FROM patients"))
        # The `_mapping` attribute converts the result row into a dictionary-like object.
        patients = [dict(row._mapping) for row in result]
    return patients

def get_patient_details_from_db(patient_id: str) -> Optional[Dict]:
    """Retrieves the full JSON data for a single patient."""
    with engine.connect() as con:
        result = con.execute(text("SELECT data FROM patients WHERE id = :id"), {"id": patient_id})
        row = result.fetchone()
        # The data is stored as JSONB, so it comes back as a dictionary directly.
        return row[0] if row else None
