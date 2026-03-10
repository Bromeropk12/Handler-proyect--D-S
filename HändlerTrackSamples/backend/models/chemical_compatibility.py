from sqlalchemy import Column, Integer, String, Text, DateTime
from database.database import Base

class ChemicalCompatibility(Base):
    __tablename__ = "chemical_compatibility"
    
    id = Column(Integer, primary_key=True, index=True)
    chemical_group = Column(String(100), nullable=False)
    compatible_with = Column(Text, nullable=False)  # JSON string with compatible groups
    incompatible_with = Column(Text, nullable=False)  # JSON string with incompatible groups
    notes = Column(Text, nullable=True)
    created_at = Column(DateTime, nullable=True)
    updated_at = Column(DateTime, nullable=True)
    
    def __repr__(self):
        return f"<ChemicalCompatibility(group='{self.chemical_group}')>"