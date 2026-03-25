<template>
  <div style="
    position: fixed;
    top: 0; left: 0; right: 0; bottom: 0;
    background: #f5f5f5;
    z-index: 10000;
    display: flex;
    align-items: center;
    justify-content: center;
    font-family: 'Roboto', Arial, sans-serif;
  ">
    <div style="
      background: white;
      border-radius: 12px;
      box-shadow: 0 4px 24px rgba(0,0,0,0.15);
      padding: 2.5em 2em;
      max-width: 420px;
      width: 100%;
      text-align: center;
    ">
      <img src="app/img/logo.svg" alt="AAC Communicator" style="height: 64px; margin-bottom: 1em;" />
      <h1 style="font-size: 1.5em; color: #333; margin-bottom: 0.3em;">AAC Communicator</h1>
      <p style="color: #666; margin-bottom: 1.8em; font-size: 0.95em;">Sign in to continue</p>

      <!-- Step 1: Google sign-in button -->
      <div v-if="!showForm">
        <button
          @click="showForm = true"
          style="
            display: inline-flex;
            align-items: center;
            gap: 0.75em;
            border: 1px solid #dadce0;
            border-radius: 4px;
            padding: 0.65em 1.4em;
            background: white;
            font-size: 1em;
            color: #3c4043;
            cursor: pointer;
            box-shadow: 0 1px 3px rgba(0,0,0,0.1);
            transition: box-shadow 0.2s;
          "
          @mouseover="e => e.currentTarget.style.boxShadow='0 2px 6px rgba(0,0,0,0.18)'"
          @mouseout="e => e.currentTarget.style.boxShadow='0 1px 3px rgba(0,0,0,0.1)'"
        >
          <svg width="18" height="18" viewBox="0 0 48 48">
            <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"/>
            <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"/>
            <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"/>
            <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.18 1.48-4.97 2.31-8.16 2.31-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"/>
            <path fill="none" d="M0 0h48v48H0z"/>
          </svg>
          Sign in with Google
        </button>
      </div>

      <!-- Step 2: Profile + role form -->
      <div v-if="showForm" style="text-align: left;">
        <div style="margin-bottom: 1em;">
          <label style="display: block; font-size: 0.85em; color: #666; margin-bottom: 0.3em;">Name</label>
          <input
            v-model="form.name"
            type="text"
            style="
              width: 100%; box-sizing: border-box;
              border: 1px solid #dadce0; border-radius: 4px;
              padding: 0.6em 0.8em; font-size: 1em; color: #333;
            "
          />
        </div>
        <div style="margin-bottom: 1.2em;">
          <label style="display: block; font-size: 0.85em; color: #666; margin-bottom: 0.3em;">Email</label>
          <input
            v-model="form.email"
            type="email"
            style="
              width: 100%; box-sizing: border-box;
              border: 1px solid #dadce0; border-radius: 4px;
              padding: 0.6em 0.8em; font-size: 1em; color: #333;
            "
          />
        </div>

        <div style="margin-bottom: 1.5em;">
          <label style="display: block; font-size: 0.85em; color: #666; margin-bottom: 0.6em;">Select your role</label>
          <div style="display: flex; gap: 0.8em;">
            <label
              :style="roleCardStyle(form.role === 'student')"
              @click="form.role = 'student'"
            >
              <i class="fas fa-user-graduate" style="font-size: 1.5em; margin-bottom: 0.3em;"></i>
              <span>Student</span>
            </label>
            <label
              :style="roleCardStyle(form.role === 'caregiver')"
              @click="form.role = 'caregiver'"
            >
              <i class="fas fa-user-nurse" style="font-size: 1.5em; margin-bottom: 0.3em;"></i>
              <span>Caregiver</span>
            </label>
          </div>
        </div>

        <button
          @click="signIn"
          :disabled="!form.name || !form.email || !form.role"
          style="
            width: 100%;
            background: #4caf50;
            color: white;
            border: none;
            border-radius: 4px;
            padding: 0.75em;
            font-size: 1em;
            cursor: pointer;
            transition: background 0.2s;
          "
          :style="{ background: (!form.name || !form.email || !form.role) ? '#a5d6a7' : '#4caf50', cursor: (!form.name || !form.email || !form.role) ? 'not-allowed' : 'pointer' }"
        >
          Sign In
        </button>
        <button
          @click="showForm = false"
          style="
            width: 100%; margin-top: 0.6em;
            background: none; border: none;
            color: #666; font-size: 0.9em;
            cursor: pointer; padding: 0.4em;
          "
        >Back</button>
      </div>
    </div>
  </div>
</template>

<script>
import { authService } from "../../js/service/authService.js";

export default {
  name: "LoginView",
  data() {
    return {
      showForm: false,
      form: {
        name: "Google User",
        email: "user@gmail.com",
        role: "",
      },
    };
  },
  methods: {
    roleCardStyle(active) {
      return {
        flex: "1",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        padding: "0.9em 0.5em",
        border: active ? "2px solid #4caf50" : "2px solid #dadce0",
        borderRadius: "8px",
        cursor: "pointer",
        background: active ? "#e8f5e9" : "white",
        color: active ? "#388e3c" : "#555",
        fontWeight: active ? "bold" : "normal",
        transition: "all 0.2s",
        userSelect: "none",
        gap: "0.3em",
      };
    },
    signIn() {
      if (!this.form.name || !this.form.email || !this.form.role) return;
      let userInfo = {
        name: this.form.name,
        email: this.form.email,
        role: this.form.role,
      };
      if (this.form.role === "student") {
        userInfo.studentId = authService.generateStudentId();
      }
      authService.login(userInfo);
      this.$emit("loggedIn");
    },
  },
};
</script>
