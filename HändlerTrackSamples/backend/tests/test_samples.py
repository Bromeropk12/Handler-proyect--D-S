"""
Tests for Samples API endpoints.
"""
import pytest
from fastapi import status


class TestSamplesAPI:
    """Test suite for Samples endpoints"""
    
    def test_create_sample(self, client, sample_data):
        """Test creating a new sample"""
        response = client.post("/samples/", json=sample_data)
        assert response.status_code == status.HTTP_200_OK
        data = response.json()
        assert data["reference_code"] == sample_data["reference_code"]
        assert data["supplier"] == sample_data["supplier"]
        assert data["batch_number"] == sample_data["batch_number"]
        assert "id" in data
    
    def test_create_sample_missing_required_field(self, client):
        """Test creating sample with missing required fields"""
        incomplete_data = {
            "reference_code": "REF-TEST-002",
            "description": "Descripción de prueba"
            # Missing required fields
        }
        response = client.post("/samples/", json=incomplete_data)
        assert response.status_code == status.HTTP_422_UNPROCESSABLE_CONTENT
    
    def test_get_samples(self, client, sample_data):
        """Test getting all samples"""
        # Create a sample first
        client.post("/samples/", json=sample_data)
        
        # Get all samples
        response = client.get("/samples/")
        assert response.status_code == status.HTTP_200_OK
        data = response.json()
        assert isinstance(data, list)
        assert len(data) > 0
    
    def test_get_sample_by_id(self, client, sample_data):
        """Test getting a sample by ID"""
        # Create a sample first
        create_response = client.post("/samples/", json=sample_data)
        sample_id = create_response.json()["id"]
        
        # Get the sample
        response = client.get(f"/samples/{sample_id}")
        assert response.status_code == status.HTTP_200_OK
        data = response.json()
        assert data["id"] == sample_id
        assert data["reference_code"] == sample_data["reference_code"]
    
    def test_get_sample_not_found(self, client):
        """Test getting a non-existent sample"""
        response = client.get("/samples/99999")
        assert response.status_code == status.HTTP_404_NOT_FOUND
    
    def test_update_sample(self, client, sample_data):
        """Test updating a sample"""
        # Create a sample first
        create_response = client.post("/samples/", json=sample_data)
        sample_id = create_response.json()["id"]
        
        # Update the sample
        update_data = {
            "quantity": 150.0,
            "status": "depleted"
        }
        response = client.put(f"/samples/{sample_id}", json=update_data)
        assert response.status_code == status.HTTP_200_OK
        data = response.json()
        assert data["quantity"] == 150.0
        assert data["status"] == "depleted"
    
    def test_delete_sample(self, client, sample_data):
        """Test deleting a sample"""
        # Create a sample first
        create_response = client.post("/samples/", json=sample_data)
        sample_id = create_response.json()["id"]
        
        # Delete the sample
        response = client.delete(f"/samples/{sample_id}")
        assert response.status_code == status.HTTP_200_OK
        
        # Verify it's deleted
        get_response = client.get(f"/samples/{sample_id}")
        assert get_response.status_code == status.HTTP_404_NOT_FOUND
    
    def test_search_samples(self, client, sample_data):
        """Test searching samples"""
        # Create a sample first
        client.post("/samples/", json=sample_data)
        
        # Search by reference
        response = client.get("/samples/?q=REF-TEST")
        assert response.status_code == status.HTTP_200_OK
        data = response.json()
        assert len(data) > 0
    
    def test_filter_by_business_line(self, client, sample_data):
        """Test filtering samples by business line"""
        # Create a sample first
        client.post("/samples/", json=sample_data)
        
        # Filter by business line
        response = client.get("/samples/?business_line=Cosmética")
        assert response.status_code == status.HTTP_200_OK
        data = response.json()
        assert all(s["business_line"] == "Cosmética" for s in data)
    
    def test_filter_by_status(self, client, sample_data):
        """Test filtering samples by status"""
        # Create a sample first
        client.post("/samples/", json=sample_data)
        
        # Filter by status
        response = client.get("/samples/?sample_status=available")
        assert response.status_code == status.HTTP_200_OK
        data = response.json()
        assert all(s["status"] == "available" for s in data)
    
    def test_generate_labels(self, client, sample_data):
        """Test generating labels for a sample"""
        # Create a sample first
        create_response = client.post("/samples/", json=sample_data)
        sample_id = create_response.json()["id"]
        
        # Generate labels
        label_request = {
            "quantity": 5,
            "include_qr": True,
            "include_barcode": False
        }
        response = client.post(f"/samples/{sample_id}/labels", json=label_request)
        assert response.status_code == status.HTTP_200_OK
        data = response.json()
        assert data["total_labels"] == 5
        assert len(data["labels"]) == 5
        assert data["labels"][0]["location_code"] == "COS-E1-N1-P01"
    
    def test_get_pdf_not_found(self, client, sample_data):
        """Test getting PDF when none exists"""
        # Create a sample without PDF
        create_response = client.post("/samples/", json=sample_data)
        sample_id = create_response.json()["id"]
        
        # Try to get PDF
        response = client.get(f"/samples/{sample_id}/pdf")
        assert response.status_code == status.HTTP_404_NOT_FOUND
