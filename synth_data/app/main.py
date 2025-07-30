from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from typing import List
import asyncio
import json
import re

from app.models import GenerationRequest, CliniversePatient, PopulationProfile, ChatRequest   # Import the necessary models
from app.agent import app_graph, AgentState, llm
from app.database import (
    init_db, 
    get_all_patients_from_db, 
    get_patient_details_from_db,
    update_patient_in_db,
    add_population_profile_to_db,
    get_all_population_profiles_from_db
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

@app.post("/generate-patients/", response_model=List[CliniversePatient])
async def generate_patients_endpoint(request: GenerationRequest):
    """Generates a specified number of synthetic patients based on a profile."""
    # Pass the profile into the agent invocation
    tasks = [app_graph.ainvoke({"profile": request.profile,
                                "profile_name": request.profile_name
                                }) for _ in range(request.num_patients)]
    generated_states: List[AgentState] = await asyncio.gather(*tasks)
    final_patients = [state['cliniverse_patient'] for state in generated_states if 'cliniverse_patient' in state]
    return final_patients


@app.get("/population-stats/{condition}")
async def get_population_stats(condition: str):
    """
    Gets population statistics for a given condition from OpenAI.
    """
    prompt = f"""
    Provide population statistics and common co-morbidities for "{condition}" in the US.
    Return a single, valid JSON object and nothing else.

    **Critical Requirement:** The JSON object MUST include all of the following keys, even if data is estimated:
    "genderDistribution", "ageDistribution", "raceEthnicityDistribution", "insuranceDistribution", "educationDistribution", "incomeDistribution", "geographicDistribution", "commonComorbidities"

    **JSON Structure:**
    - "genderDistribution": {{"male": %, "female": %}}
    - "ageDistribution": {{"0-17": %, "18-44": %, "45-64": %, "65+": %}}
    - "raceEthnicityDistribution": {{"White": %, "Black or African American": %, "Hispanic or Latino": %, "Asian": %, "Other": %}}
    - "insuranceDistribution": {{"Private": %, "Medicare": %, "Medicaid": %, "Uninsured": %}}
    - "educationDistribution": {{"Less than High School": %, "High School Graduate": %, "Some College": "Bachelor's or Higher": %}}
    - "incomeDistribution": {{"Below Poverty": %, "Low Income": %, "Middle Income": %, "High Income": %}}
    - "geographicDistribution": {{"Urban": %, "Suburban": %, "Rural": %}}
    - "commonComorbidities": ["Hypertension", "Hyperlipidemia", "Obesity", "Anxiety"]

    Ensure the percentages for each category sum to 100. Provide realistic, data-informed estimates.
    """
    
    response = llm.invoke(prompt)
    try:
        # FIX: Clean the string before parsing
        json_str = response.content
        
        # Use regex to find the JSON content between the markdown fences
        match = re.search(r'```json\s*(\{.*?\})\s*```', json_str, re.DOTALL)
        if match:
            json_str = match.group(1)
        
        # As a fallback, strip whitespace and backticks if regex fails
        json_str = json_str.strip().strip('`').strip()

        return json.loads(json_str)

    except json.JSONDecodeError:
        raise HTTPException(status_code=500, detail=f"Failed to parse JSON from LLM response {response.content}")


@app.post("/population-profiles/", status_code=201)
async def create_population_profile(profile: PopulationProfile):
    """Saves a new population profile to the database."""
    add_population_profile_to_db(profile.name, profile.data)
    return {"message": f"Profile '{profile.name}' saved successfully."}

@app.get("/population-profiles/", response_model=List[PopulationProfile])
async def list_population_profiles_endpoint():
    """Returns a list of all saved population profiles."""
    return get_all_population_profiles_from_db()

from langchain_openai import ChatOpenAI
llm = ChatOpenAI(model="gpt-4o", temperature=0.7)
@app.post("/chat")
async def chat_with_patient_data(request: ChatRequest):
    """Handles chat requests by loading a system prompt from a file."""
    try:
        # 1. Read the prompt template from the file
        with open('chat_prompt.txt', 'r') as f:
            prompt_template = f.read()

        print(f"Loaded prompt template: {prompt_template[:100]}...")  # Debugging line to check the template
        # 2. Format the template with the patient data from the request
        print(f"Patient data: {request.patient}")  # Debugging line to check the 
        patient_json_string = json.dumps(request.patient, indent=2)
        system_prompt = prompt_template.replace('{patient_data}', patient_json_string)

        # 3. Call the LLM with the formatted prompt
        messages = [
            ("system", system_prompt),
            ("user", request.user_prompt)
        ]
        response = llm.invoke(messages)

        return {"response": response.content}
        
    except FileNotFoundError:
        raise HTTPException(status_code=500, detail="chat_prompt.txt not found.")
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))