<template>
  <div class="app">
    <div class="header">
      <div class="header-content">
        <div>
          <h1 class="title">Mammogram Inference</h1>
          <p class="subtitle">AI destekli mammografi analiz sistemi</p>
        </div>
        <div class="user-info">
          <span>Hoş geldin, {{ currentUser?.name || currentUser?.email }}</span>
          <button @click="logout" class="logout-btn">Çıkış</button>
        </div>
      </div>
    </div>

    <div class="main-layout">
      <!-- SOL PANEL: Hasta geçmişi -->
      <div class="sidebar">
        <div class="history-title">Hasta Yönetimi</div>
        
        <!-- Hasta Ekleme Butonu -->
        <button @click="showAddPatientForm = !showAddPatientForm" class="add-patient-btn">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" class="add-icon">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4"/>
          </svg>
          Yeni Hasta Ekle
        </button>

        <!-- Hasta Ekleme Formu -->
        <div v-if="showAddPatientForm" class="add-patient-form">
          <form @submit.prevent="addNewPatient">
            <div class="form-field">
              <label>Hasta Adı:</label>
              <input
                v-model="newPatient.name"
                type="text"
                placeholder="Ad Soyad"
                required
                class="patient-input"
              />
            </div>
            <div class="form-field">
              <label>TC Kimlik:</label>
              <input
                v-model="newPatient.tc"
                type="text"
                placeholder="TC Kimlik Numarası"
                maxlength="11"
                required
                class="patient-input"
              />
            </div>
            <div class="form-actions">
              <button type="submit" :disabled="patientAddLoading" class="save-patient-btn">
                <span v-if="!patientAddLoading">Kaydet</span>
                <span v-else>
                  <div class="spinner-small"></div>
                  Kaydediliyor...
                </span>
              </button>
              <button type="button" @click="cancelAddPatient" class="cancel-btn">İptal</button>
            </div>
          </form>
        </div>
        
        <input
          v-model="searchQuery"
          type="text"
          placeholder="TC ile hasta ara..."
          class="search-bar"
          @input="searchPatients"
        />
        
        <!-- Hasta Seçimi -->
        <div v-if="searchedPatients.length > 0" class="patient-results">
          <div 
            v-for="patient in searchedPatients" 
            :key="patient.id"
            class="patient-item"
            @click="selectPatient(patient)"
            :class="{ active: selectedPatient?.id === patient.id }"
          >
            <div class="patient-name">{{ patient.name }}</div>
            <div class="patient-tc">{{ patient.tc }}</div>
          </div>
        </div>
        
        <div class="history-list">
          <div class="section-subtitle">Son Analizler</div>
          <transition-group name="history-slide" tag="div">
            <div
              v-for="(item, index) in filteredHistory"
              :key="item.id || item.patient_id + item.timestamp"
              class="history-item"
              @click="loadFromHistory(item)"
              :style="{ animationDelay: `${index * 0.1}s` }"
            >
              <div class="history-patient">{{ getPatientName(item.patient_id) }}</div>
              <div class="history-date">
                {{ formatDate(item.id) }}
              </div>
            </div>
          </transition-group>
        </div>
      </div>

      <!-- SAĞ PANEL: Form + Sonuçlar -->
      <div class="form-container">
        <form @submit.prevent="handleSubmit" class="form">
          <div class="form-group">
            <label for="patientId">Hasta:</label>
            <div class="selected-patient-display">
              <span v-if="selectedPatient">
                {{ selectedPatient.name }} ({{ selectedPatient.tc }})
              </span>
              <span v-else class="no-patient-selected">Sol panelden hasta seçin</span>
            </div>
          </div>

          <div class="form-group">
            <label for="imageUpload">Mammogram Görseli:</label>
            <div 
              class="file-upload-wrapper"
              :class="{ 'drag-over': isDragOver }"
              @dragover.prevent="handleDragOver"
              @dragleave.prevent="handleDragLeave"
              @drop.prevent="handleDrop"
            >
              <input
                type="file"
                id="imageUpload"
                @change="handleImageUpload"
                accept="image/*"
                required
                class="file-input"
              />
              <label for="imageUpload" class="file-label">
                <div class="upload-icon">
                  <svg v-if="!imageFile" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"/>
                  </svg>
                  <svg v-else viewBox="0 0 24 24" fill="none" stroke="currentColor">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"/>
                  </svg>
                </div>
                <div class="upload-text">
                  <span v-if="!imageFile" class="upload-main">Dosyayı buraya sürükleyin</span>
                  <span v-else class="upload-main">Dosya yüklendi</span>
                  <span v-if="!imageFile" class="upload-sub">veya tıklayarak seçin</span>
                  <span v-if="imageFile" class="file-name">{{ imageFile.name }}</span>
                </div>
              </label>
            </div>
          </div>

          <div class="form-group">
            <label for="modelSelect">Model:</label>
            <select v-model="selectedModel" id="modelSelect" class="select-field">
              <option value="mass">Mass</option>
              <option value="calc">Calcification</option>
            </select>
          </div>

          <button type="submit" class="submit-btn" :disabled="isLoading || !selectedPatient">
            <span v-if="!isLoading" class="btn-content">
              <svg class="btn-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"/>
              </svg>
              Analiz Et
            </span>
            <span v-else class="btn-loading">
              <div class="spinner"></div>
              Analiz Ediliyor...
            </span>
          </button>
        </form>

        <transition name="results-fade">
          <div v-if="inferenceResult" class="result-box">
            <div class="result-header">
              <div class="result-icon">📊</div>
              <h2>Analiz Sonucu</h2>
            </div>
            <div class="result-grid">
              <div class="result-item">
                <strong>Hasta:</strong> 
                <span>{{ selectedPatient?.name }}</span>
              </div>
              <div class="result-item">
                <strong>Model:</strong> 
                <span>{{ selectedModel }}</span>
              </div>
              <div class="result-item">
                <strong>Sonuç:</strong> 
                <span class="result-status" :class="inferenceResult.label?.toLowerCase()">
                  {{ inferenceResult.label || inferenceResult.result }}
                </span>
              </div>
              <div class="result-item">
                <strong>Olasılık:</strong> 
                <span class="probability">{{ parseResult(inferenceResult.result) }}</span>
              </div>
            </div>
          </div>
        </transition>

        <!-- Error Display -->
        <div v-if="error" class="error-box">
          ⚠️ {{ error }}
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from "vue";
import { useRouter } from 'vue-router'

const router = useRouter()

// Original state
const selectedModel = ref("mass");
const imageFile = ref(null);
const inferenceResult = ref(null);
const searchQuery = ref("");
const isLoading = ref(false);
const isDragOver = ref(false);

// New backend state
const currentUser = ref(null);
const selectedPatient = ref(null);
const searchedPatients = ref([]);
const predictionHistory = ref([]);
const error = ref('');


const showAddPatientForm = ref(false);
const newPatient = ref({ name: '', tc: '' });
const patientAddLoading = ref(false);

const API_BASE_URL = 'http://localhost:8000'

const getAuthHeaders = (includeContentType = true) => {
  const token = localStorage.getItem('access_token')
  const headers = {
    'Authorization': `Bearer ${token}`
  }
  
  if (includeContentType) {
    headers['Content-Type'] = 'application/json'
  }
  
  return headers
}

const filteredHistory = computed(() => {
  return predictionHistory.value.filter((item) =>
    getPatientName(item.patient_id).toLowerCase().includes(searchQuery.value.toLowerCase())
  );
});

const getCurrentUser = async () => {
  try {
    const response = await fetch(`${API_BASE_URL}/auth/me`, {
      headers: getAuthHeaders(false)
    })
    
    if (response.ok) {
      currentUser.value = await response.json()
    } else {
      throw new Error('User data fetch failed')
    }
  } catch (err) {
    console.error('Get user error:', err)
    logout()
  }
}

const logout = async () => {
  try {
    await fetch(`${API_BASE_URL}/auth/logout`, {
      method: 'POST',
      headers: getAuthHeaders(false)
    })
  } catch (err) {
    console.error('Logout error:', err)
  } finally {
    localStorage.removeItem('access_token')
    localStorage.removeItem('refresh_token')
    localStorage.removeItem('user_data')
    router.push('/login')
  }
}

const searchPatients = async () => {
  if (searchQuery.value.length < 2) {
    searchedPatients.value = []
    return
  }

  try {
    // Search by both name and TC
    const response = await fetch(`${API_BASE_URL}/patients/search?query=${encodeURIComponent(searchQuery.value)}`, {
      headers: getAuthHeaders(false)
    })
    
    if (response.ok) {
      const patients = await response.json()
      searchedPatients.value = Array.isArray(patients) ? patients : [patients]
    } else if (response.status === 404) {
      searchedPatients.value = []
    }
  } catch (err) {
    console.error('Search patients error:', err)
    // Fallback to TC search if general search fails
    try {
      const tcResponse = await fetch(`${API_BASE_URL}/patients/by-tc/${searchQuery.value}`, {
        headers: getAuthHeaders(false)
      })
      
      if (tcResponse.ok) {
        const patient = await tcResponse.json()
        searchedPatients.value = [patient]
      } else {
        searchedPatients.value = []
      }
    } catch (tcErr) {
      console.error('TC search error:', tcErr)
      searchedPatients.value = []
    }
  }
}

const selectPatient = (patient) => {
  selectedPatient.value = patient
  searchQuery.value = patient.name + ' (' + patient.tc + ')'
  searchedPatients.value = []
  loadPatientAnalyses(patient.id)
}

const addNewPatient = async () => {
  if (!newPatient.value.name.trim() || !newPatient.value.tc.trim()) {
    error.value = 'Lütfen tüm alanları doldurun';
    return;
  }
  
  if (newPatient.value.tc.length !== 11 || !/^\d{11}$/.test(newPatient.value.tc)) {
    error.value = 'TC Kimlik numarası 11 haneli sayı olmalıdır';
    return;
  }
  
  // Check if patient already exists
  try {
    const existingResponse = await fetch(`${API_BASE_URL}/patients/by-tc/${newPatient.value.tc}`, {
      headers: getAuthHeaders(false)
    })
    
    if (existingResponse.ok) {
      error.value = 'Bu TC kimlik numarasına sahip hasta zaten mevcut';
      return;
    }
  } catch (err) {
    // If 404, patient doesn't exist, continue with creation
  }
  
  patientAddLoading.value = true;
  error.value = '';
  
  try {
    const requestBody = {
      name: newPatient.value.name.trim(),
      tc: newPatient.value.tc.trim(),
      user_id: currentUser.value.id
    };

    const response = await fetch(`${API_BASE_URL}/patients/`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(requestBody)
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.detail || 'Hasta eklenemedi');
    }

    const patient = await response.json();
    
    // Auto-select the newly created patient
    selectedPatient.value = patient;
    searchQuery.value = patient.name + ' (' + patient.tc + ')';
    
    // Reset form
    newPatient.value = { name: '', tc: '' };
    showAddPatientForm.value = false;
    
    // Clear search results
    searchedPatients.value = [];
    
    // Load patient analyses
    await loadPatientAnalyses(patient.id);
    
  } catch (err) {
    console.error('Add patient error:', err);
    error.value = err.message;
  } finally {
    patientAddLoading.value = false;
  }
}

const cancelAddPatient = () => {
  newPatient.value = { name: '', tc: '' };
  showAddPatientForm.value = false;
  error.value = '';
}

const loadPatientAnalyses = async (patientId) => {
  try {
    const response = await fetch(`${API_BASE_URL}/analysis/patient/${patientId}`, {
      headers: getAuthHeaders()
    })
    
    if (response.ok) {
      const analyses = await response.json()
      predictionHistory.value = analyses
    }
  } catch (err) {
    console.error('Load patient analyses error:', err)
  }
}

const loadAnalyses = async () => {
  try {
    const response = await fetch(`${API_BASE_URL}/analysis/my-analyses`, {
      headers: getAuthHeaders()
    })
    
    if (response.ok) {
      predictionHistory.value = await response.json()
    }
  } catch (err) {
    console.error('Load analyses error:', err)
  }
}

function handleImageUpload(event) {
  const file = event.target.files[0];
  if (file && file.type.startsWith('image/')) {
    imageFile.value = file;
    error.value = '';
  }
}

function handleDragOver(event) {
  event.preventDefault();
  isDragOver.value = true;
}

function handleDragLeave(event) {
  event.preventDefault();
  isDragOver.value = false;
}

function handleDrop(event) {
  event.preventDefault();
  isDragOver.value = false;
  
  const files = event.dataTransfer.files;
  if (files.length > 0) {
    const file = files[0];
    if (file.type.startsWith('image/')) {
      imageFile.value = file;
      const input = document.getElementById('imageUpload');
      const dt = new DataTransfer();
      dt.items.add(file);
      input.files = dt.files;
      error.value = '';
    }
  }
}

async function handleSubmit() {
  if (!imageFile.value || !selectedPatient.value) return;
  
  isLoading.value = true;
  error.value = '';
  
  try {
    const formData = new FormData();
    formData.append('patient_id', selectedPatient.value.id);
    formData.append('image', imageFile.value);

    const response = await fetch(`${API_BASE_URL}/analysis/predict`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('access_token')}`
      },
      body: formData
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.detail || 'Analiz başarısız');
    }

    const result = await response.json();
    inferenceResult.value = result;

    predictionHistory.value.unshift({
      id: result.id,
      patient_id: selectedPatient.value.id,
      timestamp: Date.now(),
      label: result.label,
      result: result.result
    });
    
    // Clear file
    imageFile.value = null;
    document.getElementById('imageUpload').value = '';
    
  } catch (err) {
    console.error('Analysis error:', err);
    error.value = err.message;
  } finally {
    isLoading.value = false;
  }
}

function loadFromHistory(item) {
  if (item.patient_id && selectedPatient.value?.id !== item.patient_id) {
    // load patient info if different
    loadPatientById(item.patient_id);
  }
  
  inferenceResult.value = {
    label: item.label,
    result: item.result
  };
}

const loadPatientById = async (patientId) => {
  try {
    const response = await fetch(`${API_BASE_URL}/patients/${patientId}`, {
      headers: getAuthHeaders()
    });
    
    if (response.ok) {
      selectedPatient.value = await response.json();
    }
  } catch (err) {
    console.error('Load patient error:', err);
  }
}

const getPatientName = (patientId) => {
  if (selectedPatient.value?.id === patientId) {
    return selectedPatient.value.name;
  }
  return `Hasta ${patientId}`;
}

const formatDate = (id) => {
  return new Date().toLocaleString("tr-TR");
}

const parseResult = (result) => {
  try {
    const parsed = JSON.parse(result);
    return parsed.confidence || parsed.probability || "N/A";
  } catch {
    return result || "N/A";
  }
}

onMounted(async () => {
  // Router guard already checked authentication, safe to proceed
  await getCurrentUser()
  await loadAnalyses()
})
</script>

<style>
.app {
  font-family: 'Inter', 'SF Pro Display', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
  padding: 2rem;
  max-width: 1200px;
  margin: auto;
}

.header-content {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 2rem;
}

.header {
  text-align: left;
}

.title {
  font-size: 2.2rem;
  color: #374151;
  text-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
  margin: 0;
}

.subtitle {
  color: #6b7280;
  margin-top: 0.2rem;
}

.user-info {
  display: flex;
  align-items: center;
  gap: 1rem;
  color: #374151;
  font-weight: 700;
}

.logout-btn {
  padding: 0.5rem 1rem;
  background: #ef4444;
  color: white;
  border: none;
  border-radius: 8px;
  cursor: pointer;
  font-size: 0.9rem;
  font-weight: 600;
}

.logout-btn:hover {
  background: #dc2626;
}

.main-layout {
  display: grid;
  grid-template-columns: 320px 1fr;
  gap: 2rem;
  align-items: start;
}

.sidebar {
  border: 1px solid #e5e7eb;
  padding: 1.5rem;
  border-radius: 16px;
  background: linear-gradient(135deg, #f9fafb 0%, #f3f4f6 100%);
  box-shadow: 0 10px 25px rgba(0, 0, 0, 0.08), 0 4px 10px rgba(0, 0, 0, 0.05);
  height: fit-content;
  backdrop-filter: blur(10px);
  display: flex;
  flex-direction: column;
  min-height: 500px;
  width: 100%;
  max-width: 320px;
  box-sizing: border-box;
  overflow: hidden;
}

.sidebar:hover {
  transform: translateY(-1px);
  box-shadow: 0 15px 30px rgba(0, 0, 0, 0.1), 0 6px 12px rgba(0, 0, 0, 0.06);
}

.history-title {
  font-weight: bold;
  font-size: 1.2rem;
  margin-bottom: 1.2rem;
  color: #374151;
  background: linear-gradient(135deg, #10b981, #059669);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
  flex-shrink: 0;
}

.add-patient-btn {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  width: 100%;
  padding: 0.75rem;
  background: linear-gradient(135deg, #10b981, #059669);
  color: white;
  border: none;
  border-radius: 8px;
  cursor: pointer;
  font-weight: 600;
  font-size: 0.9rem;
  margin-bottom: 1rem;
  transition: all 0.2s ease;
}

.add-patient-btn:hover {
  background: linear-gradient(135deg, #059669, #047857);
  transform: translateY(-1px);
  box-shadow: 0 4px 12px rgba(16, 185, 129, 0.3);
}

.add-icon {
  width: 16px;
  height: 16px;
}

.add-patient-form {
  background: white;
  border: 1px solid #e5e7eb;
  border-radius: 12px;
  padding: 1rem;
  margin-bottom: 1rem;
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.05);
}

.form-field {
  margin-bottom: 0.75rem;
}

.form-field label {
  display: block;
  font-size: 0.85rem;
  font-weight: 600;
  color: #374151;
  margin-bottom: 0.25rem;
}

.patient-input {
  width: 100%;
  padding: 0.5rem;
  border: 1px solid #d1d5db;
  border-radius: 6px;
  font-size: 0.9rem;
  box-sizing: border-box;
  transition: border-color 0.2s;
}

.patient-input:focus {
  outline: none;
  border-color: #10b981;
  box-shadow: 0 0 0 2px rgba(16, 185, 129, 0.1);
}

.form-actions {
  display: flex;
  gap: 0.5rem;
}

.save-patient-btn {
  flex: 1;
  padding: 0.5rem;
  background: #10b981;
  color: white;
  border: none;
  border-radius: 6px;
  cursor: pointer;
  font-weight: 600;
  font-size: 0.85rem;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.25rem;
  min-height: 32px;
}

.save-patient-btn:hover:not(:disabled) {
  background: #059669;
}

.save-patient-btn:disabled {
  opacity: 0.7;
  cursor: not-allowed;
}

.cancel-btn {
  flex: 1;
  padding: 0.5rem;
  background: #6b7280;
  color: white;
  border: none;
  border-radius: 6px;
  cursor: pointer;
  font-weight: 600;
  font-size: 0.85rem;
}

.cancel-btn:hover {
  background: #555a64;
}

.spinner-small {
  width: 14px;
  height: 14px;
  border: 2px solid rgba(255, 255, 255, 0.3);
  border-top: 2px solid white;
  border-radius: 50%;
  animation: spin 1s linear infinite;
}

.section-subtitle {
  font-weight: 600;
  font-size: 1rem;
  margin-bottom: 0.75rem;
  color: #374151;
  border-bottom: 1px solid #e5e7eb;
  padding-bottom: 0.5rem;
}

.search-bar {
  padding: 0.875rem 1rem;
  border-radius: 12px;
  border: 2px solid transparent;
  background: linear-gradient(white, white) padding-box,
              linear-gradient(135deg, #10b981, #059669) border-box;
  width: 100%;
  max-width: 100%;
  box-sizing: border-box;
  margin-bottom: 1.2rem;
  transition: all 0.2s ease;
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.05);
  font-size: 0.95rem;
  flex-shrink: 0;
}

.search-bar:focus {
  outline: none;
  transform: translateY(-1px);
  box-shadow: 0 8px 20px rgba(16, 185, 129, 0.15);
}

.patient-results {
  margin-bottom: 1rem;
}

.patient-item {
  background: linear-gradient(135deg, #ffffff 0%, #f8fafc 100%);
  border: 1px solid #e2e8f0;
  padding: 0.75rem;
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.2s ease;
  margin-bottom: 0.5rem;
}

.patient-item:hover, .patient-item.active {
  border-color: #10b981;
  background: #ecfdf5;
}

.patient-name {
  font-weight: 600;
  color: #1f2937;
  font-size: 0.9rem;
}

.patient-tc {
  font-size: 0.8rem;
  color: #6b7280;
}

.selected-patient-display {
  padding: 0.875rem;
  background: #f9fafb;
  border: 1px solid #e5e7eb;
  border-radius: 12px;
  font-weight: 500;
}

.no-patient-selected {
  color: #6b7280;
  font-style: italic;
}

.history-list {
  display: flex;
  flex-direction: column;
  gap: 0.875rem;
  flex: 1;
  overflow-y: auto;
  padding-right: 0.5rem;
  max-height: 350px;
}

.history-list::-webkit-scrollbar {
  width: 6px;
}

.history-list::-webkit-scrollbar-track {
  background: #f1f5f9;
  border-radius: 3px;
}

.history-list::-webkit-scrollbar-thumb {
  background: linear-gradient(135deg, #10b981, #059669);
  border-radius: 3px;
}

.history-list::-webkit-scrollbar-thumb:hover {
  background: linear-gradient(135deg, #059669, #047857);
}

.history-item {
  background: linear-gradient(135deg, #ffffff 0%, #f8fafc 100%);
  border: 1px solid #e2e8f0;
  padding: 1rem 1.25rem;
  border-radius: 12px;
  transition: all 0.2s ease;
  cursor: pointer;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.05);
  position: relative;
  overflow: hidden;
  flex-shrink: 0;
  min-height: 70px;
  display: flex;
  flex-direction: column;
  justify-content: center;
}

.history-item::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: linear-gradient(135deg, rgba(16, 185, 129, 0.1), rgba(5, 150, 105, 0.1));
  opacity: 0;
  transition: opacity 0.3s ease;
}

.history-item:hover {
  transform: translateX(2px) translateY(-1px);
  box-shadow: 0 6px 20px rgba(0, 0, 0, 0.12);
  border-color: #10b981;
}

.history-item:hover::before {
  opacity: 1;
}

.history-patient, .history-date {
  position: relative;
  z-index: 1;
}

.history-patient {
  font-weight: 600;
  color: #1f2937;
}

.history-date {
  font-size: 0.85rem;
  color: #6b7280;
}

.history-slide-enter-active {
  transition: all 0.3s ease;
}

.history-slide-leave-active {
  transition: all 0.2s ease;
}

.history-slide-enter-from {
  opacity: 0;
  transform: translateX(-30px);
}

.history-slide-leave-to {
  opacity: 0;
  transform: translateX(30px);
}

.form-container {
  border: 1px solid #e5e7eb;
  padding: 2rem;
  border-radius: 20px;
  background: linear-gradient(135deg, #ffffff 0%, #f8fafc 100%);
  box-shadow: 0 20px 40px rgba(0, 0, 0, 0.1), 0 8px 16px rgba(0, 0, 0, 0.06);
  backdrop-filter: blur(10px);
  position: relative;
  overflow: hidden;
}

.form-container::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  height: 4px;
  background: linear-gradient(90deg, #10b981, #059669, #047857);
}

.form {
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
}

.form-group {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.form-group label {
  font-weight: 600;
  color: #374151;
  font-size: 0.95rem;
}

.input-field,
.select-field {
  padding: 0.875rem;
  border-radius: 12px;
  border: 2px solid transparent;
  background: linear-gradient(white, white) padding-box,
              linear-gradient(135deg, #e5e7eb, #d1d5db) border-box;
  transition: all 0.3s ease;
  font-size: 0.95rem;
}

.input-field:focus,
.select-field:focus {
  outline: none;
  background: linear-gradient(white, white) padding-box,
              linear-gradient(135deg, #10b981, #059669) border-box;
  transform: translateY(-1px);
  box-shadow: 0 8px 20px rgba(16, 185, 129, 0.15);
}

.file-upload-wrapper {
  position: relative;
  transition: all 0.2s ease;
}

.file-upload-wrapper.drag-over {
  transform: scale(1.01);
}

.file-input {
  position: absolute;
  opacity: 0;
  width: 0;
  height: 0;
}

.file-label {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 2rem 1rem;
  border-radius: 16px;
  border: 3px dashed #d1d5db;
  background: linear-gradient(135deg, #f9fafb 0%, #f3f4f6 100%);
  text-align: center;
  cursor: pointer;
  transition: all 0.2s ease;
  font-weight: 500;
  color: #6b7280;
  min-height: 120px;
  position: relative;
  overflow: hidden;
}

.file-label::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: linear-gradient(135deg, rgba(79, 70, 229, 0.05), rgba(124, 58, 237, 0.05));
  opacity: 0;
  transition: opacity 0.3s ease;
}

.file-label:hover,
.drag-over .file-label {
  border-color: #10b981;
  background: linear-gradient(135deg, #ecfdf5 0%, #d1fae5 100%);
  color: #10b981;
  transform: translateY(-1px);
  box-shadow: 0 6px 20px rgba(16, 185, 129, 0.12);
}

.file-label:hover::before,
.drag-over .file-label::before {
  opacity: 1;
}

.upload-icon {
  width: 48px;
  height: 48px;
  margin-bottom: 1rem;
  transition: all 0.3s ease;
  position: relative;
  z-index: 1;
}

.upload-icon svg {
  width: 100%;
  height: 100%;
  transition: all 0.3s ease;
}

.file-label:hover .upload-icon,
.drag-over .upload-icon {
  transform: scale(1.1);
  color: #10b981;
}

.upload-text {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.5rem;
  position: relative;
  z-index: 1;
}

.upload-main {
  font-size: 1.1rem;
  font-weight: 600;
  color: inherit;
  transition: color 0.3s ease;
}

.upload-sub {
  font-size: 0.9rem;
  opacity: 0.8;
  color: inherit;
}

.file-name {
  margin-top: 0.5rem;
  font-size: 0.9rem;
  color: #059669;
  font-weight: 600;
  background: rgba(16, 185, 129, 0.1);
  padding: 0.25rem 0.75rem;
  border-radius: 20px;
  border: 1px solid rgba(16, 185, 129, 0.2);
  max-width: 100%;
  word-break: break-all;
  text-align: center;
}

.drag-over .file-label {
  animation: dragPulse 1s ease-in-out infinite alternate;
}

@keyframes dragPulse {
  from {
    border-color: #10b981;
    box-shadow: 0 6px 20px rgba(16, 185, 129, 0.12);
  }
  to {
    border-color: #059669;
    box-shadow: 0 8px 25px rgba(5, 150, 105, 0.18);
  }
}

.submit-btn {
 padding: 0.75rem 1.5rem;
 background: linear-gradient(135deg, #10b981 0%, #059669 50%, #047857 100%);
 background-size: 200% 200%;
 color: white;
 border: none;
 border-radius: 12px;
 cursor: pointer;
 font-weight: 600;
 font-size: 1rem;
 transition: all 0.2s ease;
 box-shadow: 0 6px 15px rgba(16, 185, 129, 0.25);
 position: relative;
 overflow: hidden;
}

.submit-btn::before {
 content: '';
 position: absolute;
 top: 0;
 left: -100%;
 width: 100%;
 height: 100%;
 background: linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.2), transparent);
 transition: left 0.6s;
}

.submit-btn:hover {
 background-position: 100% 0;
 transform: translateY(-1px);
 box-shadow: 0 8px 22px rgba(16, 185, 129, 0.3);
}

.submit-btn:hover::before {
 left: 100%;
}

.submit-btn:active {
 transform: translateY(0);
 box-shadow: 0 6px 15px rgba(16, 185, 129, 0.25);
}

.submit-btn:disabled {
 opacity: 0.8;
 cursor: not-allowed;
 transform: none;
}

.btn-content,
.btn-loading {
 display: flex;
 align-items: center;
 justify-content: center;
 gap: 0.5rem;
}

.btn-icon {
 width: 16px;
 height: 16px;
 transition: transform 0.2s ease;
}

.submit-btn:hover .btn-icon {
 transform: scale(1.05);
}

</style>