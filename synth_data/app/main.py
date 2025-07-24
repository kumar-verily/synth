from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from typing import List
import asyncio
import json

from app.models import GenerationRequest, CliniversePatient
from app.agent import app_graph, AgentState
from app.database import (
    init_db, 
    get_all_patients_from_db, 
    get_patient_details_from_db,
    update_patient_in_db # Import the new function
)

app = FastAPI(
    title="Cliniverse Patient Data Generator",
    description="API to generate and manage detailed, UI-ready synthetic patient data.",
    version="2.1.0"
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"], allow_credentials=True, allow_methods=["*"], allow_headers=["*"],
)
# allowed_origins = [
#     "https://3000-kumar-w.cluster-6uv4xm4q3bh5uv7a4kg6x63de6.cloudworkstations.dev",
#     "*" 
# ]

# app.add_middleware(
#     CORSMiddleware,
#     allow_origins=allowed_origins,
#     allow_credentials=True,
#     allow_methods=["*"],
#     allow_headers=["*"],
# )

@app.on_event("startup")
def on_startup():
    init_db()

@app.post("/generate-patients/", response_model=List[CliniversePatient])
async def generate_patients_endpoint(request: GenerationRequest):
    """Generates a specified number of synthetic patients."""
    tasks = [app_graph.ainvoke({}) for _ in range(request.num_patients)]
    generated_states: List[AgentState] = await asyncio.gather(*tasks)
    final_patients = [state['cliniverse_patient'] for state in generated_states if 'cliniverse_patient' in state]
    return final_patients

@app.get("/patients/", response_model=List[dict])
async def list_patients_endpoint():
    """Returns a summary list of all patients."""
    return get_all_patients_from_db()

@app.get("/patients/{patient_id}", response_model=CliniversePatient)
async def get_patient_endpoint(patient_id: str):
    """Returns the full details for a single patient."""
    patient = get_patient_details_from_db(patient_id)
    if patient:
        return patient
    raise HTTPException(status_code=404, detail="Patient not found")

@app.put("/patients/{patient_id}", status_code=204)
async def update_patient_endpoint(patient_id: str, patient_data: CliniversePatient):
    """Updates an existing patient's data in the database."""
    try:
        # update_patient_in_db(patient_id, patient_data.model_dump())
        patient_json_str = patient_data.model_dump_json(by_alias=True)
        patient_dict = json.loads(patient_json_str)
        update_patient_in_db(patient_id, patient_dict)
        return
    except Exception as e:
        print(f"Error updating patient: {e}")
        raise HTTPException(status_code=500, detail="Failed to update patient data.")

