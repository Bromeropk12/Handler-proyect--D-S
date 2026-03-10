from pydantic import BaseModel, EmailStr, Field, ConfigDict
from typing import Optional, List
from datetime import datetime

class UserBase(BaseModel):
    username: str
    email: EmailStr
    full_name: str

class UserCreate(UserBase):
    password: str

class User(UserBase):
    id: int
    is_active: bool
    role: str
    created_at: datetime
    updated_at: Optional[datetime] = None

    model_config = ConfigDict(from_attributes=True)

class SampleBase(BaseModel):
    reference_code: str
    description: str
    supplier: str
    batch_number: str
    chemical_composition: Optional[str] = None
    business_line: str
    quantity: float
    unit: str = "kg"
    coa_path: Optional[str] = None
    zone: str  # COS, IND, FAR
    level: str  # A-G (letra/fila)
    position: str  # 1-7 (número/columna)
    status: str = "available"
    is_compatible: bool = True

class SampleCreate(SampleBase):
    pass

class Sample(SampleBase):
    id: int
    created_at: datetime
    updated_at: Optional[datetime] = None

    model_config = ConfigDict(from_attributes=True)

class SampleUpdate(BaseModel):
    reference_code: Optional[str] = None
    description: Optional[str] = None
    supplier: Optional[str] = None
    batch_number: Optional[str] = None
    chemical_composition: Optional[str] = None
    business_line: Optional[str] = None
    quantity: Optional[float] = None
    unit: Optional[str] = None
    coa_path: Optional[str] = None
    zone: Optional[str] = None
    level: Optional[str] = None
    position: Optional[str] = None
    status: Optional[str] = None
    is_compatible: Optional[bool] = None

class MovementBase(BaseModel):
    sample_id: int
    movement_type: str
    quantity: float
    unit: str = "kg"
    source_location: Optional[str] = None
    destination_location: Optional[str] = None
    notes: Optional[str] = None
    user_id: int

class MovementCreate(MovementBase):
    pass

class Movement(MovementBase):
    id: int
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)

class ChemicalCompatibilityBase(BaseModel):
    chemical_group: str
    compatible_with: str
    incompatible_with: str
    notes: Optional[str] = None

class ChemicalCompatibilityCreate(ChemicalCompatibilityBase):
    pass

class ChemicalCompatibility(ChemicalCompatibilityBase):
    id: int
    created_at: Optional[datetime] = None
    updated_at: Optional[datetime] = None

    model_config = ConfigDict(from_attributes=True)

# ============ Esquemas para Etiquetas ============

class LabelGenerate(BaseModel):
    """Schema para solicitar generación de etiquetas"""
    quantity: int = Field(..., gt=0, le=100, description="Cantidad de etiquetas a generar")
    include_qr: bool = Field(default=True, description="Incluir código QR en la etiqueta")
    include_barcode: bool = Field(default=False, description="Incluir código de barras en la etiqueta")

class LabelData(BaseModel):
    """Schema para los datos de una etiqueta"""
    reference_code: str
    batch_number: str
    description: str
    supplier: str
    business_line: str
    location_code: str  # Formato: ZONA-ESTANTE-NIVEL-POSICION
    quantity: float
    unit: str
    qr_data: Optional[str] = None
    barcode_data: Optional[str] = None

class LabelGenerateResponse(BaseModel):
    """Response para la generación de etiquetas"""
    labels: List[LabelData]
    total_labels: int
    message: str