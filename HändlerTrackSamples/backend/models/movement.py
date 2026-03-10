from sqlalchemy import Column, Integer, String, Float, Text, DateTime, Boolean
from sqlalchemy.sql import func
from database.database import Base

class Movement(Base):
    __tablename__ = "movements"
    
    id = Column(Integer, primary_key=True, index=True)
    sample_id = Column(Integer, nullable=False)
    movement_type = Column(String(50), nullable=False)  # 'entry', 'exit', 'transfer'
    quantity = Column(Float, nullable=False)
    unit = Column(String(20), nullable=False, default="kg")
    source_location = Column(String(200), nullable=True)
    destination_location = Column(String(200), nullable=True)
    notes = Column(Text, nullable=True)
    user_id = Column(Integer, nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    
    def __repr__(self):
        return f"<Movement(sample_id='{self.sample_id}', type='{self.movement_type}')>"