import React, { createContext, useContext, useState, useCallback } from 'react';
import api from '../services/api';

const SamplesContext = createContext(null);

export const useSamples = () => {
  const context = useContext(SamplesContext);
  if (!context) {
    throw new Error('useSamples debe ser usado dentro de SamplesProvider');
  }
  return context;
};

export const SamplesProvider = ({ children }) => {
  const [samples, setSamples] = useState([]);
  const [selectedSample, setSelectedSample] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Cargar todas las muestras
  const fetchSamples = useCallback(async (filters = {}) => {
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams();
      if (filters.q) params.append('q', filters.q);
      if (filters.business_line) params.append('business_line', filters.business_line);
      if (filters.sample_status) params.append('sample_status', filters.sample_status);
      
      const response = await api.get(`/samples/?${params.toString()}`);
      setSamples(response.data);
      return response.data;
    } catch (err) {
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  // Obtener una muestra por ID
  const fetchSample = useCallback(async (id) => {
    setLoading(true);
    try {
      const response = await api.get(`/samples/${id}`);
      setSelectedSample(response.data);
      return response.data;
    } catch (err) {
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  // Crear nueva muestra
  const createSample = async (data) => {
    const response = await api.post('/samples/', data);
    setSamples(prev => [...prev, response.data]);
    return response.data;
  };

  // Actualizar muestra
  const updateSample = async (id, data) => {
    const response = await api.put(`/samples/${id}`, data);
    setSamples(prev => prev.map(s => s.id === id ? response.data : s));
    if (selectedSample?.id === id) {
      setSelectedSample(response.data);
    }
    return response.data;
  };

  // Eliminar muestra
  const deleteSample = async (id) => {
    await api.delete(`/samples/${id}`);
    setSamples(prev => prev.filter(s => s.id !== id));
    if (selectedSample?.id === id) {
      setSelectedSample(null);
    }
  };

  // Generar etiquetas
  const generateLabels = async (sampleId, options) => {
    const response = await api.post(`/samples/${sampleId}/labels`, options);
    return response.data;
  };

  // Obtener PDF
  const getPdfUrl = (sampleId) => {
    return `${process.env.REACT_APP_API_URL || 'http://localhost:8000'}/samples/${sampleId}/pdf`;
  };

  const value = {
    samples,
    selectedSample,
    loading,
    error,
    fetchSamples,
    fetchSample,
    createSample,
    updateSample,
    deleteSample,
    generateLabels,
    getPdfUrl,
    setSelectedSample
  };

  return (
    <SamplesContext.Provider value={value}>
      {children}
    </SamplesContext.Provider>
  );
};
