"""
Tests for Movements API endpoints.
"""
import pytest
from fastapi import status


class TestMovementsAPI:
    """Test suite for Movements endpoints"""
    
    def test_create_entry_movement(self, client, sample_data):
        """Test creating an entry movement"""
        # Create a sample first
        create_response = client.post("/samples/", json=sample_data)
        sample_id = create_response.json()["id"]
        
        # Create entry movement
        movement_data = {
            "sample_id": sample_id,
            "movement_type": "entry",
            "quantity": 50.0,
            "unit": "kg",
            "notes": "Entrada de muestra",
            "user_id": 1
        }
        response = client.post("/movements/", json=movement_data)
        assert response.status_code == status.HTTP_200_OK
        data = response.json()
        assert data["movement_type"] == "entry"
        assert data["quantity"] == 50.0
        
        # Verify sample quantity increased
        sample_response = client.get(f"/samples/{sample_id}")
        assert sample_response.json()["quantity"] == 150.0  # 100 + 50
    
    def test_create_exit_movement(self, client, sample_data):
        """Test creating an exit movement"""
        # Create a sample first
        create_response = client.post("/samples/", json=sample_data)
        sample_id = create_response.json()["id"]
        
        # Create exit movement
        movement_data = {
            "sample_id": sample_id,
            "movement_type": "exit",
            "quantity": 30.0,
            "unit": "kg",
            "notes": "Salida de muestra",
            "user_id": 1
        }
        response = client.post("/movements/", json=movement_data)
        assert response.status_code == status.HTTP_200_OK
        data = response.json()
        assert data["movement_type"] == "exit"
        assert data["quantity"] == 30.0
        
        # Verify sample quantity decreased
        sample_response = client.get(f"/samples/{sample_id}")
        assert sample_response.json()["quantity"] == 70.0  # 100 - 30
    
    def test_create_exit_movement_insufficient_quantity(self, client, sample_data):
        """Test creating an exit movement with insufficient quantity"""
        # Create a sample first
        create_response = client.post("/samples/", json=sample_data)
        sample_id = create_response.json()["id"]
        
        # Try to exit more than available
        movement_data = {
            "sample_id": sample_id,
            "movement_type": "exit",
            "quantity": 200.0,  # More than available (100)
            "unit": "kg",
            "notes": "Salida de muestra",
            "user_id": 1
        }
        response = client.post("/movements/", json=movement_data)
        assert response.status_code == status.HTTP_400_BAD_REQUEST
    
    def test_create_movement_invalid_sample(self, client):
        """Test creating a movement for non-existent sample"""
        movement_data = {
            "sample_id": 99999,  # Non-existent
            "movement_type": "entry",
            "quantity": 50.0,
            "unit": "kg",
            "notes": "Entrada de muestra",
            "user_id": 1
        }
        response = client.post("/movements/", json=movement_data)
        assert response.status_code == status.HTTP_404_NOT_FOUND
    
    def test_get_sample_movements(self, client, sample_data):
        """Test getting movements for a sample"""
        # Create a sample first
        create_response = client.post("/samples/", json=sample_data)
        sample_id = create_response.json()["id"]
        
        # Create some movements
        movement_data = {
            "sample_id": sample_id,
            "movement_type": "entry",
            "quantity": 50.0,
            "unit": "kg",
            "notes": "Entrada de muestra",
            "user_id": 1
        }
        client.post("/movements/", json=movement_data)
        
        movement_data["movement_type"] = "exit"
        movement_data["quantity"] = 20.0
        client.post("/movements/", json=movement_data)
        
        # Get movements for sample
        response = client.get(f"/samples/{sample_id}/movements")
        assert response.status_code == status.HTTP_200_OK
        data = response.json()
        assert len(data) == 2
    
    def test_transfer_movement(self, client, sample_data):
        """Test creating a transfer movement"""
        # Create a sample first
        create_response = client.post("/samples/", json=sample_data)
        sample_id = create_response.json()["id"]
        
        # Create transfer movement
        movement_data = {
            "sample_id": sample_id,
            "movement_type": "transfer",
            "quantity": 50.0,
            "unit": "kg",
            "source_location": "COS-E1-N1-P01",
            "destination_location": "COS-E2-N1-P01",
            "notes": "Transferencia de muestra",
            "user_id": 1
        }
        response = client.post("/movements/", json=movement_data)
        assert response.status_code == status.HTTP_200_OK
        data = response.json()
        assert data["movement_type"] == "transfer"
        assert data["source_location"] == "COS-E1-N1-P01"
        assert data["destination_location"] == "COS-E2-N1-P01"
