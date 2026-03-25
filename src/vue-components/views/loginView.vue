<template>
  <div class="login-page">
    <div class="login-card">
      <div class="login-logo">
        <img src="app/img/logo.svg" height="60" alt="Smart Lang" />
        <h1>Smart Lang</h1>
        <p class="login-subtitle">AAC Communicator</p>
      </div>

      <div class="login-tabs">
        <button
          class="login-tab-btn"
          :class="{ active: mode === 'login' }"
          @click="mode = 'login'"
        >
          Sign In
        </button>
        <button
          class="login-tab-btn"
          :class="{ active: mode === 'signup' }"
          @click="mode = 'signup'"
        >
          Sign Up
        </button>
      </div>

      <div class="login-section">
        <p class="login-role-prompt">
          {{ mode === 'login' ? 'Sign in as:' : 'Sign up as:' }}
        </p>

        <button
          class="google-btn caregiver-btn"
          @click="handleAuth('caregiver')"
          :disabled="loading"
        >
          <span class="google-icon" aria-hidden="true">
            <svg width="18" height="18" viewBox="0 0 18 18">
              <path fill="#4285F4" d="M17.64 9.2c0-.637-.057-1.251-.164-1.84H9v3.481h4.844c-.209 1.125-.843 2.078-1.796 2.717v2.258h2.908c1.702-1.567 2.684-3.875 2.684-6.615z"/>
              <path fill="#34A853" d="M9 18c2.43 0 4.467-.806 5.956-2.184l-2.908-2.258c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332C2.438 15.983 5.482 18 9 18z"/>
              <path fill="#FBBC05" d="M3.964 10.707c-.18-.54-.282-1.117-.282-1.707s.102-1.167.282-1.707V4.961H.957C.347 6.175 0 7.548 0 9s.348 2.826.957 4.039l3.007-2.332z"/>
              <path fill="#EA4335" d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0 5.482 0 2.438 2.017.957 4.961L3.964 7.293C4.672 5.166 6.656 3.58 9 3.58z"/>
            </svg>
          </span>
          <span>{{ mode === 'login' ? 'Sign in' : 'Sign up' }} as Caregiver</span>
        </button>

        <button
          class="google-btn student-btn"
          @click="handleAuth('student')"
          :disabled="loading"
        >
          <span class="google-icon" aria-hidden="true">
            <svg width="18" height="18" viewBox="0 0 18 18">
              <path fill="#4285F4" d="M17.64 9.2c0-.637-.057-1.251-.164-1.84H9v3.481h4.844c-.209 1.125-.843 2.078-1.796 2.717v2.258h2.908c1.702-1.567 2.684-3.875 2.684-6.615z"/>
              <path fill="#34A853" d="M9 18c2.43 0 4.467-.806 5.956-2.184l-2.908-2.258c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332C2.438 15.983 5.482 18 9 18z"/>
              <path fill="#FBBC05" d="M3.964 10.707c-.18-.54-.282-1.117-.282-1.707s.102-1.167.282-1.707V4.961H.957C.347 6.175 0 7.548 0 9s.348 2.826.957 4.039l3.007-2.332z"/>
              <path fill="#EA4335" d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0 5.482 0 2.438 2.017.957 4.961L3.964 7.293C4.672 5.166 6.656 3.58 9 3.58z"/>
            </svg>
          </span>
          <span>{{ mode === 'login' ? 'Sign in' : 'Sign up' }} as Student</span>
        </button>

        <div v-if="loading" class="login-loading">
          <i class="fas fa-spinner fa-spin"></i> Connecting...
        </div>
      </div>

      <p class="login-note">
        Google OAuth integration coming soon. All sign-ins are accepted.
      </p>
    </div>
  </div>
</template>

<script>
import { authService } from '../../js/service/authService.js';
import { Router } from '../../js/router.js';

export default {
  name: 'LoginView',
  data() {
    return {
      mode: 'login',
      loading: false,
    };
  },
  methods: {
    async handleAuth(role) {
      this.loading = true;
      try {
        if (this.mode === 'login') {
          await authService.loginWithGoogle(role);
        } else {
          await authService.signUpWithGoogle(role);
        }
        // Reload the application so mainScript.js initializes properly with the new auth state
        window.location.hash = '';
        window.location.reload();
      } catch (e) {
        this.loading = false;
      }
    },
  },
};
</script>

<style scoped>
.login-page {
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 100vh;
  background: linear-gradient(135deg, #e8f4fd 0%, #f0f8ff 100%);
  padding: 1em;
  box-sizing: border-box;
}

.login-card {
  background: #ffffff;
  border-radius: 12px;
  box-shadow: 0 4px 24px rgba(0, 0, 0, 0.12);
  padding: 2.5em 2em;
  max-width: 400px;
  width: 100%;
  text-align: center;
}

.login-logo {
  margin-bottom: 1.5em;
}

.login-logo h1 {
  font-size: 1.8em;
  margin: 0.3em 0 0.1em;
  color: #2c3e50;
}

.login-subtitle {
  color: #7f8c8d;
  margin: 0;
  font-size: 0.95em;
}

.login-tabs {
  display: flex;
  border: 2px solid #e0e0e0;
  border-radius: 8px;
  overflow: hidden;
  margin-bottom: 1.5em;
}

.login-tab-btn {
  flex: 1;
  padding: 0.6em;
  border: none;
  background: transparent;
  cursor: pointer;
  font-size: 1em;
  color: #7f8c8d;
  transition: background 0.2s, color 0.2s;
}

.login-tab-btn.active {
  background: #3498db;
  color: #fff;
  font-weight: bold;
}

.login-role-prompt {
  color: #555;
  margin-bottom: 1em;
  font-size: 0.95em;
}

.google-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.6em;
  width: 100%;
  padding: 0.75em 1em;
  border-radius: 6px;
  border: 2px solid #e0e0e0;
  background: #ffffff;
  cursor: pointer;
  font-size: 1em;
  margin-bottom: 0.8em;
  transition: background 0.2s, border-color 0.2s, box-shadow 0.2s;
  font-weight: 500;
}

.google-btn:hover:not(:disabled) {
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.15);
  border-color: #bbb;
}

.google-btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.caregiver-btn {
  border-color: #3498db;
  color: #2980b9;
}

.caregiver-btn:hover:not(:disabled) {
  background: #eaf4fd;
  border-color: #2980b9;
}

.student-btn {
  border-color: #27ae60;
  color: #219a52;
}

.student-btn:hover:not(:disabled) {
  background: #eafaf1;
  border-color: #219a52;
}

.google-icon {
  display: flex;
  align-items: center;
}

.login-loading {
  margin-top: 0.5em;
  color: #7f8c8d;
}

.login-note {
  font-size: 0.78em;
  color: #aaa;
  margin-top: 1.5em;
  margin-bottom: 0;
}
</style>
