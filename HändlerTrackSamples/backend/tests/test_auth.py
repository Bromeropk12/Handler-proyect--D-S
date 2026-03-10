"""
Tests for Authentication API endpoints.
"""
import pytest
from fastapi import status


class TestAuthAPI:
    """Test suite for Authentication endpoints"""
    
    def test_create_user(self, client, user_data):
        """Test creating a new user"""
        response = client.post("/users/", json=user_data)
        assert response.status_code == status.HTTP_200_OK
        data = response.json()
        assert data["username"] == user_data["username"]
        assert data["email"] == user_data["email"]
        assert data["full_name"] == user_data["full_name"]
        assert "id" in data
        assert "hashed_password" not in data  # Password should not be returned
    
    def test_create_user_duplicate_username(self, client, user_data):
        """Test creating user with duplicate username"""
        # Create first user
        client.post("/users/", json=user_data)
        
        # Try to create duplicate
        response = client.post("/users/", json=user_data)
        assert response.status_code == status.HTTP_400_BAD_REQUEST
    
    def test_login_success(self, client, user_data):
        """Test successful login"""
        # Create user first
        client.post("/users/", json=user_data)
        
        # Login
        login_data = {
            "username": user_data["username"],
            "password": user_data["password"]
        }
        response = client.post("/login/", data=login_data)
        assert response.status_code == status.HTTP_200_OK
        data = response.json()
        assert "access_token" in data
        assert data["token_type"] == "bearer"
    
    def test_login_wrong_password(self, client, user_data):
        """Test login with wrong password"""
        # Create user first
        client.post("/users/", json=user_data)
        
        # Login with wrong password
        login_data = {
            "username": user_data["username"],
            "password": "wrongpassword"
        }
        response = client.post("/login/", data=login_data)
        assert response.status_code == status.HTTP_401_UNAUTHORIZED
    
    def test_login_nonexistent_user(self, client):
        """Test login with non-existent user"""
        login_data = {
            "username": "nonexistent",
            "password": "somepassword"
        }
        response = client.post("/login/", data=login_data)
        assert response.status_code == status.HTTP_401_UNAUTHORIZED
    
    def test_get_current_user(self, client, user_data):
        """Test getting current user info"""
        # Create user first
        client.post("/users/", json=user_data)
        
        # Login
        login_data = {
            "username": user_data["username"],
            "password": user_data["password"]
        }
        login_response = client.post("/login/", data=login_data)
        token = login_response.json()["access_token"]
        
        # Get current user
        response = client.get(
            "/users/me",
            headers={"Authorization": f"Bearer {token}"}
        )
        assert response.status_code == status.HTTP_200_OK
        data = response.json()
        assert data["username"] == user_data["username"]
        assert data["email"] == user_data["email"]
    
    def test_get_current_user_unauthorized(self, client):
        """Test getting current user without token"""
        response = client.get("/users/me")
        assert response.status_code == status.HTTP_401_UNAUTHORIZED
    
    def test_get_current_user_invalid_token(self, client):
        """Test getting current user with invalid token"""
        response = client.get(
            "/users/me",
            headers={"Authorization": "Bearer invalid_token"}
        )
        assert response.status_code == status.HTTP_401_UNAUTHORIZED
