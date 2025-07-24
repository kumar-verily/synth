from pydantic import BaseModel, Field 
from typing import List, Optional

# --- Original Agent Models (used for intermediate steps) ---

class PatientPersona(BaseModel):
    name: str = Field(..., description="The patient's full name.")
    motivation: str = Field(..., description="The patient's primary motivation for joining the program.")
    identified_barriers: List[str] = Field(..., description="Behavioral barriers identified by the analysis tool.")

class ClinicalProfile(BaseModel):
    baseline_a1c: float = Field(..., description="The patient's starting A1c value.")
    baseline_weight: float = Field(..., description="The patient's starting weight in pounds.")

class JourneyLogEntry(BaseModel):
    month: int
    event: str
    details: str

class SyntheticPatient(BaseModel):
    """The original, high-level output of the agent."""
    patient_id: str
    care_pathway: str
    clinical_profile: ClinicalProfile
    persona: PatientPersona
    journey_log: List[JourneyLogEntry]

class GenerationRequest(BaseModel):
    num_patients: int = Field(default=1, gt=0, le=50, description="Number of synthetic patients to generate.")


# --- NEW: Models for Cliniverse UI ---
# These models match the structure of the detailed patient view UI.

class Message(BaseModel):
    """A model for a single message in the patient's inbox."""
    from_party: str = Field(description="Who the message is from (e.g., 'Caregiver', 'Health Coach').", alias='from')
    subject: str = Field(description="The subject line of the message.")
    time: str = Field(description="A relative time string, e.g., 'Now', '3 hr ago'.")
    unread: bool = Field(description="Whether the message is unread.")
    content: str = Field(description="The body content of the message.")

class AdditionalDetails(BaseModel):
    participantId: str = Field(description="The patient's unique ID (UUID).")
    email: str = Field(description="A realistic, generated email address.")
    phoneNumber: str = Field(description="A realistic, generated 10-digit phone number.")
    address: str = Field(description="A realistic, generated mailing address.")
    clientAccount: str = Field(description="The client account, e.g., 'Verily Health'.")
    accountStatus: str = Field(description="The account status, e.g., 'Active'.")

class CarePlan(BaseModel):
    careLead: str = Field(description="Name of the primary care lead, e.g., 'L. Rodriguez'.")
    motivators: str = Field(description="A summary of the patient's motivations.")
    concerns: str = Field(description="A summary of the patient's primary health concerns.")
    devices: str = Field(description="Medical devices the patient uses, comma-separated (e.g., 'CGM, BGM, Insulin pump').")
    goals: str = Field(description="High-level health goals for the patient.")
    language: str = Field(description="Patient's preferred language, e.g., 'Spanish'.")
    lastUpdated: str = Field(description="A relative time string for the last update, e.g., '2d ago'.")

class A1CDataPoint(BaseModel):
    name: str = Field(description="The date of the reading, formatted as 'Mon YY', e.g., 'Jan 23'.")
    a1c: float = Field(description="The HbA1c value.")

class ToDoItem(BaseModel):
    id: int = Field(description="A unique integer ID for the to-do item.")
    text: str = Field(description="The description of the task for the care team.")
    priority: str = Field(description="Task priority ('P0', 'P1', 'P2').")
    completed: bool = Field(description="Whether the task is completed.")

class Note(BaseModel):
    subjective: str = Field(description="The subjective part of a SOAP note.")
    objective: str = Field(description="The objective part of a SOAP note.")
    assessment: str = Field(description="The assessment part of a SOAP note.")
    plan: str = Field(description="The plan part of a SOAP note.")
    updated: str = Field(description="A relative time string for when the note was updated.")

class CareTeamMember(BaseModel):
    name: str = Field(description="The full name of the care team member.")
    role: str = Field(description="The role of the care team member (e.g., 'Health coach', 'Registered dietitian').")

class CliniversePatient(BaseModel):
    """The final, detailed patient profile formatted for the Cliniverse UI."""
    id: str = Field(description="The patient's unique ID, must match additionalDetails.participantId.")
    name: str = Field(description="Patient's full name.")
    details: str = Field(description="A brief summary string including age, gender, and other key info.")
    additionalDetails: AdditionalDetails
    carePlan: CarePlan
    a1cData: List[A1CDataPoint]
    toDo: List[ToDoItem]
    notes: List[Note]
    careTeam: List[CareTeamMember]
    messages: List[Message]
    # Surveys can be added here if needed in the future.
