from sqlalchemy import Column, Integer, String, Float, Text, DateTime, Boolean
from sqlalchemy.sql import func
from database.database import Base

class Sample(Base):
    __tablename__ = "samples"
    
    id = Column(Integer, primary_key=True, index=True)
    reference_code = Column(String(100), unique=True, index=True, nullable=False)
    description = Column(Text, nullable=False)
    chemical_composition = Column(Text, nullable=True)
    supplier = Column(String(200), nullable=False)
    batch_number = Column(String(100), nullable=False)
    quantity = Column(Float, nullable=False, default=0)
    unit = Column(String(20), nullable=False, default="kg")
    coa_path = Column(String(500), nullable=True)
    business_line = Column(String(50), nullable=False)  # Cosmética, Industrial, Farma
    zone = Column(String(50), nullable=False)  # COS, IND, FAR (Línea de negocio)
    level = Column(String(50), nullable=False)  # A-G (Fila/Letra)
    position = Column(String(50), nullable=False)  # 1-7 (Columna/Número)
    status = Column(String(50), nullable=False, default="available")  # available, depleted, quarantine
    is_compatible = Column(Boolean, nullable=False, default=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())
    
    def __repr__(self):
        return f"<Sample(reference_code='{self.reference_code}', batch_number='{self.batch_number}'>"