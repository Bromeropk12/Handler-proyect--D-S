"""
Schemas - Händler TrackSamples
Contiene todos los esquemas Pydantic para validación de datos
"""

from pydantic import BaseModel, EmailStr, Field, ConfigDict, field_validator
from typing import Optional, List
from datetime import datetime
import re
from decimal import Decimal

# ============ Esquemas de Usuario ============

class UserBase(BaseModel):
    username: str
    email: EmailStr
    full_name: str

class UserCreate(UserBase):
    password: str
    
    @field_validator('password')
    @classmethod
    def validate_password(cls, v: str) -> str:
        """Valida que la contraseña cumpla con requisitos de seguridad"""
        if len(v) < 8:
            raise ValueError('La contraseña debe tener al menos 8 caracteres')
        if not re.search(r'[A-Z]', v):
            raise ValueError('La contraseña debe tener al menos una mayúscula')
        if not re.search(r'[a-z]', v):
            raise ValueError('La contraseña debe tener al menos una minúscula')
        if not re.search(r'\d', v):
            raise ValueError('La contraseña debe tener al menos un número')
        if not re.search(r'[!@#$%^&*(),.?":{}|<>]', v):
            raise ValueError('La contraseña debe tener al menos un carácter especial')
        return v

class User(UserBase):
    id: int
    is_active: bool
    role: str
    created_at: datetime
    updated_at: Optional[datetime] = None

    model_config = ConfigDict(from_attributes=True)

# ============ Esquemas para Cambio de Contraseña ============

class PasswordChangeRequest(BaseModel):
    """Schema para solicitar cambio de contraseña"""
    current_password: str = Field(..., description="Contraseña actual del usuario")
    new_password: str = Field(..., description="Nueva contraseña")
    confirm_password: str = Field(..., description="Confirmación de la nueva contraseña")
    
    @field_validator('new_password')
    @classmethod
    def validate_new_password(cls, v: str) -> str:
        """Valida que la nueva contraseña cumpla con requisitos de seguridad"""
        if len(v) < 8:
            raise ValueError('La contraseña debe tener al menos 8 caracteres')
        if not re.search(r'[A-Z]', v):
            raise ValueError('La contraseña debe tener al menos una mayúscula')
        if not re.search(r'[a-z]', v):
            raise ValueError('La contraseña debe tener al menos una minúscula')
        if not re.search(r'\d', v):
            raise ValueError('La contraseña debe tener al menos un número')
        if not re.search(r'[!@#$%^&*(),.?":{}|<>]', v):
            raise ValueError('La contraseña debe tener al menos un carácter especial')
        return v
    
    @field_validator('confirm_password')
    @classmethod
    def validate_passwords_match(cls, v: str, info) -> str:
        """Valida que las contraseñas coincidan"""
        if 'new_password' in info.data and v != info.data['new_password']:
            raise ValueError('Las contraseñas no coinciden')
        return v

class PasswordChangeResponse(BaseModel):
    """Response para el cambio de contraseña"""
    success: bool
    message: str

# ============ Esquemas de Proveedor ============

class ProveedorBase(BaseModel):
    nombre: str = Field(..., min_length=1, max_length=200)
    nit: str = Field(..., min_length=1, max_length=50)
    direccion: Optional[str] = None
    telefono: Optional[str] = None
    email: Optional[str] = None
    contacto_nombre: Optional[str] = None
    contacto_telefono: Optional[str] = None
    contacto_email: Optional[str] = None
    observaciones: Optional[str] = None
    lineas_negocio: Optional[List[str]] = Field(default_factory=list, description="Líneas de negocio que atiende el proveedor")

class ProveedorCreate(ProveedorBase):
    """Schema para crear proveedor"""
    pass

class ProveedorUpdate(BaseModel):
    """Schema para actualizar proveedor"""
    nombre: Optional[str] = Field(None, min_length=1, max_length=200)
    nit: Optional[str] = Field(None, min_length=1, max_length=50)
    direccion: Optional[str] = None
    telefono: Optional[str] = None
    email: Optional[str] = None
    contacto_nombre: Optional[str] = None
    contacto_telefono: Optional[str] = None
    contacto_email: Optional[str] = None
    observaciones: Optional[str] = None
    activa: Optional[bool] = None
    lineas_negocio: Optional[List[str]] = None

class Proveedor(ProveedorBase):
    """Schema de respuesta de proveedor"""
    id: int
    activa: bool
    created_at: Optional[datetime] = None
    updated_at: Optional[datetime] = None
    
    model_config = ConfigDict(from_attributes=True)

# ============ Esquemas de Clase de Peligro (GHS) ============

class ClasePeligroBase(BaseModel):
    codigo: str = Field(..., min_length=1, max_length=10)
    nombre: str = Field(..., min_length=1, max_length=200)
    descripcion: Optional[str] = None
    simbolo: Optional[str] = None
    color: Optional[str] = None

class ClasePeligroCreate(ClasePeligroBase):
    """Schema para crear clase de peligro"""
    pass

class ClasePeligroUpdate(BaseModel):
    """Schema para actualizar clase de peligro"""
    nombre: Optional[str] = None
    descripcion: Optional[str] = None
    simbolo: Optional[str] = None
    color: Optional[str] = None
    activa: Optional[bool] = None

class ClasePeligro(ClasePeligroBase):
    """Schema de respuesta de clase de peligro"""
    id: int
    activa: bool
    created_at: datetime
    updated_at: Optional[datetime] = None
    
    model_config = ConfigDict(from_attributes=True)

# ============ Esquemas de Muestra ============

class SampleBase(BaseModel):
    nombre: str = Field(..., min_length=1, max_length=300)
    nombre_alternativo: Optional[str] = None
    cas_number: Optional[str] = None
    lote: Optional[str] = None
    proveedor_id: Optional[int] = None
    linea_negocio: str
    clase_peligro_id: Optional[int] = None
    cantidad_gramos: Decimal = Field(..., ge=0)
    dimension: str = "1x1"
    fecha_manufactura: Optional[datetime] = None
    fecha_vencimiento: Optional[datetime] = None
    qr_code: Optional[str] = None
    coa_path: Optional[str] = None
    hoja_seguridad_path: Optional[str] = None
    estado: str = "activa"
    sample_parent_id: Optional[int] = None
    anaquel_id: Optional[int] = None
    nivel: Optional[int] = None
    fila: Optional[int] = None
    posicion: Optional[int] = None
    observaciones: Optional[str] = None
    etiquetas: Optional[str] = None

class SampleCreate(SampleBase):
    """Schema para crear muestra"""
    pass

class SampleUpdate(BaseModel):
    """Schema para actualizar muestra"""
    nombre: Optional[str] = None
    nombre_alternativo: Optional[str] = None
    cas_number: Optional[str] = None
    lote: Optional[str] = None
    proveedor_id: Optional[int] = None
    linea_negocio: Optional[str] = None
    clase_peligro_id: Optional[int] = None
    cantidad_gramos: Optional[Decimal] = None
    dimension: Optional[str] = None
    fecha_manufactura: Optional[datetime] = None
    fecha_vencimiento: Optional[datetime] = None
    qr_code: Optional[str] = None
    coa_path: Optional[str] = None
    hoja_seguridad_path: Optional[str] = None
    estado: Optional[str] = None
    anaquel_id: Optional[int] = None
    nivel: Optional[int] = None
    fila: Optional[int] = None
    posicion: Optional[int] = None
    observaciones: Optional[str] = None
    etiquetas: Optional[str] = None

class Sample(SampleBase):
    """Schema de respuesta de muestra"""
    id: int
    fecha_ingreso: datetime
    created_at: datetime
    updated_at: Optional[datetime] = None
    created_by: Optional[int] = None
    updated_by: Optional[int] = None
    
    model_config = ConfigDict(from_attributes=True)

class SampleWithRelations(Sample):
    """Schema de muestra con relaciones cargadas"""
    proveedor: Optional[Proveedor] = None
    clase_peligro: Optional[ClasePeligro] = None

# ============ Esquemas de Línea de Negocio ============

class LineaBase(BaseModel):
    nombre: str = Field(..., min_length=1, max_length=100)
    descripcion: Optional[str] = None

class LineaCreate(LineaBase):
    """Schema para crear línea de negocio"""
    pass

class LineaUpdate(BaseModel):
    """Schema para actualizar línea de negocio"""
    nombre: Optional[str] = Field(None, min_length=1, max_length=100)
    descripcion: Optional[str] = None
    activa: Optional[bool] = None

class Linea(LineaBase):
    """Schema de respuesta de línea de negocio"""
    id: int
    activa: bool
    created_at: Optional[datetime] = None
    updated_at: Optional[datetime] = None
    
    model_config = ConfigDict(from_attributes=True)

# ============ Esquemas de Anaquel ============

class AnaquelBase(BaseModel):
    nombre: str = Field(..., min_length=1, max_length=100)
    descripcion: Optional[str] = None
    linea_id: int
    niveles: int = Field(default=10, ge=1, le=20)
    hileras_por_nivel: int = Field(default=13, ge=1, le=20)
    posiciones_por_hilera: int = Field(default=9, ge=1, le=20)
    proveedor_principal: Optional[str] = None

class AnaquelCreate(AnaquelBase):
    """Schema para crear anaquel"""
    pass

class AnaquelUpdate(BaseModel):
    """Schema para actualizar anaquel"""
    nombre: Optional[str] = Field(None, min_length=1, max_length=100)
    descripcion: Optional[str] = None
    linea_id: Optional[int] = None
    niveles: Optional[int] = Field(None, ge=1, le=20)
    hileras_por_nivel: Optional[int] = Field(None, ge=1, le=20)
    posiciones_por_hilera: Optional[int] = Field(None, ge=1, le=20)
    proveedor_principal: Optional[str] = None
    activo: Optional[bool] = None
    en_mantenimiento: Optional[bool] = None

class Anaquel(AnaquelBase):
    """Schema de respuesta de anaquel"""
    id: int
    activo: bool
    en_mantenimiento: bool
    created_at: Optional[datetime] = None
    updated_at: Optional[datetime] = None
    
    model_config = ConfigDict(from_attributes=True)

class AnaquelWithRelations(Anaquel):
    """Schema de anaquel con relaciones"""
    linea: Optional[Linea] = None
    total_hileras: Optional[int] = None
    hileras_disponibles: Optional[int] = None

# ============ Esquemas de Hilera ============

class HileraBase(BaseModel):
    anaquel_id: int
    nivel: int = Field(..., ge=1, le=20)
    fila: int = Field(..., ge=1, le=20)
    posicion: int = Field(..., ge=1, le=20)
    capacidad_max: int = Field(default=9, ge=1, le=20)
    ancho_min: int = Field(default=1, ge=1, le=5)
    ancho_max: int = Field(default=2, ge=1, le=5)
    fondo_min: int = Field(default=1, ge=1, le=5)
    fondo_max: int = Field(default=2, ge=1, le=5)
    estado_fisico_sugerido: Optional[str] = None
    estado: str = "disponible"

class HileraCreate(HileraBase):
    """Schema para crear hilera"""
    pass

class HileraUpdate(BaseModel):
    """Schema para actualizar hilera"""
    capacidad_max: Optional[int] = Field(None, ge=1, le=20)
    ancho_min: Optional[int] = Field(None, ge=1, le=5)
    ancho_max: Optional[int] = Field(None, ge=1, le=5)
    fondo_min: Optional[int] = Field(None, ge=1, le=5)
    fondo_max: Optional[int] = Field(None, ge=1, le=5)
    estado_fisico_sugerido: Optional[str] = None
    estado: Optional[str] = None
    muestra_id: Optional[int] = None

class Hilera(HileraBase):
    """Schema de respuesta de hilera"""
    id: int
    posiciones_usadas: int
    muestra_id: Optional[int] = None
    created_at: Optional[datetime] = None
    updated_at: Optional[datetime] = None
    
    model_config = ConfigDict(from_attributes=True)

class HileraWithRelations(Hilera):
    """Schema de hilera con relaciones"""
    anaquel: Optional[Anaquel] = None
    muestra: Optional[Sample] = None

# ============ Schemas para listas paginadas ============

class PaginatedResponse(BaseModel):
    """Schema genérico para respuestas paginadas"""
    items: List
    total: int
    page: int
    page_size: int
    total_pages: int

# ============ Esquemas de AnaquelProveedor (RNF-2) ============

class AnaquelProveedorBase(BaseModel):
    """Schema base para relación anaquel-proveedor"""
    anaquel_id: int
    proveedor_id: int
    capacidad_max_gramos: Optional[int] = None
    es_principal: bool = False
    
    model_config = ConfigDict(from_attributes=True)

class AnaquelProveedorCreate(AnaquelProveedorBase):
    """Schema para crear relación anaquel-proveedor"""
    pass

class AnaquelProveedorUpdate(BaseModel):
    """Schema para actualizar relación anaquel-proveedor"""
    capacidad_max_gramos: Optional[int] = None
    es_principal: Optional[bool] = None
    activo: Optional[bool] = None

class AnaquelProveedorResponse(AnaquelProveedorBase):
    """Schema de respuesta de relación anaquel-proveedor"""
    id: int
    activo: bool
    created_at: Optional[datetime] = None
    updated_at: Optional[datetime] = None
    
    model_config = ConfigDict(from_attributes=True)

class AnaquelProveedorWithRelations(AnaquelProveedorResponse):
    """Schema de relación anaquel-proveedor con datos relacionados"""
    anaquel: Optional[Anaquel] = None
    proveedor: Optional[Proveedor] = None

# ============ Schema para Asignar Múltiples Proveedores ============

class AsignarProveedoresRequest(BaseModel):
    """Schema para asignar múltiples proveedores a un anaquel"""
    anaquel_id: int = Field(..., description="ID del anaquel")
    proveedor_ids: List[int] = Field(..., description="Lista de IDs de proveedores")
