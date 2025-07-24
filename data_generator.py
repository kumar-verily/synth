import os
import uuid
import json
import sqlite3
from typing import TypedDict, List, Dict, Any
from flask import Flask, jsonify, request
from flask_cors import CORS

from langchain_core.pydantic_v1 import BaseModel, Field
from langchain_google_vertexai import ChatVertexAI
from langgraph.graph import StateGraph, END

# --- Database Setup ---
DB_FILE = "cliniverse.db"

def init_db():
    """Initializes the SQLite database and creates the patients table if it doesn't exist."""
    con = sqlite3.connect(DB_FILE)
    cur = con.cursor()
    # Store the complex patient data as a JSON string in a TEXT field.
    cur.execute('''
        CREATE TABLE IF NOT EXISTS patients (
            id TEXT PRIMARY KEY,
            name TEXT NOT NULL,
            data TEXT NOT NULL
        )
    ''')
    con.commit()
    con.close()
    print(f"Database '{DB_FILE}' initialized.")

# --- Pydantic Models for Structured Output (same as before) ---
class AdditionalDetails(BaseModel):
    participantId: str = Field(description="Unique identifier for the participant, should be a UUID.", default_factory=lambda: str(uuid.uuid4()))
    email: str = Field(description="Patient's email address.")
    phoneNumber: str = Field(description="Patient's phone number.")
    address: str = Field(description="Patient's full mailing address.")
    clientAccount: str = Field(description="The client account associated with the patient.")
    accountStatus: str = Field(description="Account status, e.g., 'Active'.")
class CarePlan(BaseModel):
    careLead: str = Field(description="Name of the primary care lead.")
    motivators: str = Field(description="Patient's key motivations.")
    concerns: str = Field(description="Patient's primary health concerns.")
    devices: str = Field(description="Medical devices used, comma-separated.")
    goals: str = Field(description="High-level health goals.")
    language: str = Field(description="Patient's preferred language.")
    lastUpdated: str = Field(description="Relative time string, e.g., '2d ago'.")
class A1CDataPoint(BaseModel):
    name: str = Field(description="Date of reading, 'Mon YY'.")
    a1c: float = Field(description="The HbA1c value.")
class ToDoItem(BaseModel):
    id: int = Field(description="Unique integer ID.")
    text: str = Field(description="Task description.")
    priority: str = Field(description="Priority, e.g., 'P1'.")
    completed: bool = Field(description="Is the task completed.")
class Note(BaseModel):
    subjective: str = Field(description="Subjective part of SOAP note.")
    objective: str = Field(description="Objective part of SOAP note.")
    assessment: str = Field(description="Assessment part of SOAP note.")
    plan: str = Field(description="Plan part of SOAP note.")
    updated: str = Field(description="Relative time string for update.")
class CareTeamMember(BaseModel):
    name: str = Field(description="Full name.")
    role: str = Field(description="Role, e.g., 'Health coach'.")
class PatientProfile(BaseModel):
    id: str = Field(description="Patient's unique ID, matches additionalDetails.participantId.")
    name: str = Field(description="Patient's full name.")
    details: str = Field(description="Brief summary string.")
    additionalDetails: AdditionalDetails
    carePlan: CarePlan
    a1cData: List[A1CDataPoint]
    toDo: List[ToDoItem]
    notes: List[Note]
    careTeam: List[CareTeamMember]

# --- LangGraph Components ---
class GraphState(TypedDict):
    patient_persona: str
    patient_profile: Dict[str, Any]

def generate_patient_profile(state: GraphState):
    print("--- Node: Generating Patient Profile ---")
    persona = state['patient_persona']
    llm = ChatVertexAI(model_name="gemini-1.5-pro-001", temperature=0.7)
    structured_llm = llm.with_structured_output(PatientProfile)
    prompt = f"Generate a realistic patient profile for Cliniverse based on this persona: \"{persona}\". The profile must be detailed, medically plausible, and adhere to the schema. The patient's ID must match their participantId."
    profile = structured_llm.invoke(prompt)
    profile_dict = profile.dict()
    print(f"Generated profile for: {profile_dict.get('name')}")
    return {"patient_profile": profile_dict}

def save_to_sqlite(state: GraphState):
    print("--- Node: Saving to SQLite ---")
    profile = state['patient_profile']
    if not profile or 'id' not in profile:
        print("No profile or ID found. Cannot save.")
        return {}
    
    patient_id = profile['id']
    patient_name = profile['name']
    # Convert the entire profile to a JSON string for storage
    patient_data_json = json.dumps(profile)
    
    try:
        con = sqlite3.connect(DB_FILE)
        cur = con.cursor()
        # Use INSERT OR REPLACE to handle both new and existing patients
        cur.execute("INSERT OR REPLACE INTO patients (id, name, data) VALUES (?, ?, ?)", 
                    (patient_id, patient_name, patient_data_json))
        con.commit()
        con.close()
        print(f"Successfully saved patient '{patient_name}' to SQLite.")
    except Exception as e:
        print(f"Error saving to SQLite: {e}")
    return {}

# --- Build the Graph ---
workflow = StateGraph(GraphState)
workflow.add_node("generate_patient_profile", generate_patient_profile)
workflow.add_node("save_to_sqlite", save_to_sqlite)
workflow.set_entry_point("generate_patient_profile")
workflow.add_edge("generate_patient_profile", "save_to_sqlite")
workflow.add_edge("save_to_sqlite", END)
app_graph = workflow.compile()

# --- Flask API Server ---
api = Flask(__name__)
CORS(api) # Allow requests from our React app

@api.route('/api/patients', methods=['GET'])
def get_all_patients():
    """Endpoint to get a list of all patients."""
    con = sqlite3.connect(DB_FILE)
    con.row_factory = sqlite3.Row
    cur = con.cursor()
    cur.execute("SELECT id, name FROM patients")
    patients = [dict(row) for row in cur.fetchall()]
    con.close()
    return jsonify(patients)

@api.route('/api/patients/<patient_id>', methods=['GET'])
def get_patient(patient_id):
    """Endpoint to get full data for a single patient."""
    con = sqlite3.connect(DB_FILE)
    cur = con.cursor()
    cur.execute("SELECT data FROM patients WHERE id = ?", (patient_id,))
    row = cur.fetchone()
    con.close()
    if row:
        # The data is stored as a JSON string, so we parse it before sending
        return json.loads(row[0])
    return jsonify({"error": "Patient not found"}), 404

@api.route('/api/patients/<patient_id>', methods=['PUT'])
def update_patient(patient_id):
    """Endpoint to save updated patient data from the UI."""
    updated_data = request.json
    patient_name = updated_data.get('name', 'Unknown')
    data_json = json.dumps(updated_data)

    con = sqlite3.connect(DB_FILE)
    cur = con.cursor()
    cur.execute("UPDATE patients SET name = ?, data = ? WHERE id = ?", (patient_name, data_json, patient_id))
    con.commit()
    con.close()
    return jsonify({"success": True, "message": f"Patient {patient_name} updated."})


@api.route('/api/generate', methods=['POST'])
def generate_new_patient():
    """Endpoint to trigger the LangGraph agent."""
    data = request.json
    persona = data.get('persona')
    if not persona:
        return jsonify({"error": "Persona is required"}), 400
    
    print(f"\n--- Received request to generate patient with persona: {persona} ---")
    inputs = {"patient_persona": persona}
    # Run the graph synchronously for the API request
    app_graph.invoke(inputs)
    return jsonify({"success": True, "message": "Patient generation process started."})

# --- Main Execution ---
if __name__ == "__main__":
    init_db()
    print("Starting Flask API server for Cliniverse...")
    print("API endpoints available at http://127.0.0.1:5001")
    # Run the Flask app. Use a different port than the React app.
    api.run(port=5001, debug=True)
