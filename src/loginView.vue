<template>
  <div class="login-container">
    <div class="login-box">
      <h2>Giriş Yap</h2>
      <form @submit.prevent="handleLogin">
        <label for="username">Kullanıcı Adı</label>
        <input
          type="email"
          id="username"
          v-model="username"
          placeholder="email@example.com"
          required
        />
        
        <label for="password">Şifre</label>
        <input
          type="password"
          id="password"
          v-model="password"
          placeholder="Şifrenizi girin"
          required
        />
        
        <button type="submit" :disabled="isLoading">
          <span v-if="!isLoading">Giriş Yap</span>
          <span v-else class="loading-content">
            <div class="spinner"></div>
            Giriş yapılıyor...
          </span>
        </button>
        
        <div v-if="error" class="error-message">
          {{ error }}
        </div>
        
        <p class="register-text">
          Hesabınız yok mu? <a href="#" @click.prevent="showRegister">Kayıt Ol</a>
        </p>
      </form>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import { useRouter } from 'vue-router'

const username = ref('')
const password = ref('')
const isLoading = ref(false)
const error = ref('')
const router = useRouter()

// Removed login-success emit as routing is now handled by router guards

async function handleLogin() {
  isLoading.value = true
  error.value = ''
  
  try {
    const params = new URLSearchParams()
    params.append('username', username.value)
    params.append('password', password.value)
    
    const response = await fetch('http://localhost:8000/auth/login', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: params.toString(),
    })
    
    if (!response.ok) {
      const errorData = await response.json()
      throw new Error(errorData.detail || 'Giriş başarısız')
    }
    
    const data = await response.json()

    localStorage.setItem('access_token', data.access_token)
    localStorage.setItem('refresh_token', data.refresh_token)

    await getCurrentUser()
    
    router.push('/dashboard')
    
  } catch (error) {
    console.error('Login error:', error)
    error.value = error.message
  } finally {
    isLoading.value = false
  }
}

async function getCurrentUser() {
  try {
    const token = localStorage.getItem('access_token')
    const response = await fetch('http://localhost:8000/auth/me', {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    })
    
    if (response.ok) {
      const userData = await response.json()
      localStorage.setItem('user_data', JSON.stringify(userData))
    }
  } catch (error) {
    console.error('Get user error:', error)
  }
}

function showRegister() {
  alert('Kayıt ol özelliği henüz mevcut değil')
}
</script>

<style scoped>
html, body {
  margin: 0;
  padding: 0;
  height: 100%;
  overflow-y: auto;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  font-family: 'Inter', 'SF Pro Display', -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', 'Helvetica Neue', Arial, sans-serif;
}

.login-container {
  min-height: 100vh;
  display: flex;
  justify-content: center;
  align-items: center;
  padding: 2rem;
  position: relative;
  overflow: hidden;
}

.login-container::before {
  content: '';
  position: absolute;
  top: -50%;
  left: -50%;
  width: 200%;
  height: 200%;
  background: radial-gradient(circle at 50% 50%, rgba(255, 255, 255, 0.1) 0%, transparent 50%);
  animation: float 20s ease-in-out infinite;
}

@keyframes float {
  0%, 100% { transform: translate(-50%, -50%) rotate(0deg); }
  50% { transform: translate(-50%, -50%) rotate(180deg); }
}

.login-box {
  background: rgba(255, 255, 255, 0.95);
  backdrop-filter: blur(20px);
  padding: 3rem 2.5rem;
  border-radius: 24px;
  width: 100%;
  max-width: 420px;
  box-shadow: 0 25px 50px rgba(0, 0, 0, 0.2), 0 0 0 1px rgba(255, 255, 255, 0.1);
  box-sizing: border-box;
  position: relative;
  z-index: 1;
  border: 1px solid rgba(255, 255, 255, 0.2);
}

.login-box h2 {
  color: #1e293b;
  margin-bottom: 2rem;
  text-align: center;
  font-size: 2rem;
  font-weight: 700;
  letter-spacing: -0.025em;
  background: linear-gradient(135deg, #10b981 0%, #059669 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
}

form label {
  color: #374151;
  font-size: 0.9rem;
  font-weight: 600;
  display: block;
  margin-bottom: 0.5rem;
  letter-spacing: 0.01em;
}

form input {
  width: 100%;
  padding: 1rem 1.25rem;
  margin-bottom: 1.5rem;
  border: 2px solid rgba(203, 213, 225, 0.5);
  border-radius: 16px;
  background: rgba(249, 250, 251, 0.8);
  backdrop-filter: blur(10px);
  color: #1e293b;
  font-size: 1rem;
  font-weight: 500;
  box-sizing: border-box;
  transition: all 0.3s ease;
  letter-spacing: 0.01em;
}

form input:focus {
  outline: none;
  border-color: #10b981;
  background: rgba(255, 255, 255, 0.95);
  transform: translateY(-1px);
  box-shadow: 0 6px 15px rgba(16, 185, 129, 0.12), 0 0 0 3px rgba(16, 185, 129, 0.1);
}

form button {
  width: 100%;
  padding: 1rem;
  background: linear-gradient(135deg, #10b981 0%, #059669 100%);
  color: #ffffff;
  font-weight: 700;
  font-size: 1.1rem;
  border: none;
  border-radius: 16px;
  cursor: pointer;
  transition: all 0.2s ease;
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 56px;
  box-shadow: 0 6px 15px rgba(16, 185, 129, 0.25);
  position: relative;
  overflow: hidden;
  letter-spacing: 0.025em;
}

form button:hover:not(:disabled) {
  transform: scale(1.02);
}

form button:disabled {
  opacity: 0.7;
  cursor: not-allowed;
}

.loading-content {
  display: flex;
  align-items: center;
  gap: 8px;
}

.spinner {
  width: 16px;
  height: 16px;
  border: 2px solid rgba(255, 255, 255, 0.3);
  border-top: 2px solid white;
  border-radius: 50%;
  animation: spin 1s linear infinite;
}

@keyframes spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}

.error-message {
  background: rgba(254, 226, 226, 0.9);
  backdrop-filter: blur(10px);
  color: #dc2626;
  padding: 1rem;
  border-radius: 12px;
  margin-bottom: 1.5rem;
  border: 1px solid rgba(254, 202, 202, 0.5);
  font-size: 0.9rem;
  font-weight: 500;
  text-align: center;
  box-shadow: 0 4px 12px rgba(220, 38, 38, 0.1);
}

.register-text {
  margin-top: 2rem;
  text-align: center;
  font-size: 0.9rem;
  font-weight: 500;
  color: #64748b;
  letter-spacing: 0.01em;
}

.register-text a {
  color: #10b981;
  text-decoration: none;
  font-weight: 600;
  transition: all 0.2s ease;
}

.register-text a:hover {
  color: #059669;
  text-decoration: underline;
}

.fade-enter-active, .fade-leave-active {
  transition: opacity 0.5s ease;
}

.fade-enter-from, .fade-leave-to {
  opacity: 0;
}
</style>