<template>
  <div class="modal">
    <div class="modal-mask">
      <div class="modal-wrapper">
        <div class="modal-container caregiver-auth-modal" @keyup.27="close()">
          <a class="inline close-button" href="javascript:void(0);" @click="close()">
            <i class="fas fa-times"/>
          </a>
          <div class="modal-header">
            <h1>{{ $t('caregiverAuth') || 'Caregiver Authentication' }}</h1>
          </div>

          <div class="modal-body">
            <div class="auth-container">
      <!-- Tab Navigation -->
      <div class="tab-navigation">
        <button
          class="tab-button"
          :class="{ active: activeTab === 'signin' }"
          @click="activeTab = 'signin'"
        >
          <i class="fas fa-sign-in-alt"></i>
          {{ $t('signIn') || 'Sign In' }}
        </button>
        <button
          class="tab-button"
          :class="{ active: activeTab === 'signup' }"
          @click="activeTab = 'signup'"
        >
          <i class="fas fa-user-plus"></i>
          {{ $t('signUp') || 'Sign Up' }}
        </button>
      </div>

      <!-- Sign In Tab -->
      <div v-if="activeTab === 'signin'" class="tab-content">
        <div class="auth-form">
          <h3>{{ $t('signInAsCaregiver') || 'Sign in as Caregiver' }}</h3>
          <p class="form-description">
            {{ $t('signInDescription') || 'Enter your caregiver credentials to access admin features.' }}
          </p>

          <div class="form-group">
            <label for="signin-username">
              <i class="fas fa-user"></i>
              {{ $t('username') || 'Username' }}
            </label>
            <input
              id="signin-username"
              v-model="signInForm.username"
              type="text"
              class="form-control"
              :placeholder="$t('enterUsername') || 'Enter username'"
              @keyup.enter="handleSignIn"
            />
          </div>

          <div class="form-group">
            <label for="signin-password">
              <i class="fas fa-lock"></i>
              {{ $t('password') || 'Password' }}
            </label>
            <input
              id="signin-password"
              v-model="signInForm.password"
              type="password"
              class="form-control"
              :placeholder="$t('enterPassword') || 'Enter password'"
              @keyup.enter="handleSignIn"
            />
          </div>

          <div v-if="signInError" class="error-message">
            <i class="fas fa-exclamation-circle"></i>
            {{ signInError }}
          </div>

          <div class="form-actions">
            <button
              @click="handleSignIn"
              class="btn-primary btn-large"
              :disabled="!signInForm.username || !signInForm.password || isProcessing"
            >
              <i class="fas fa-sign-in-alt"></i>
              {{ isProcessing ? ($t('signingIn') || 'Signing In...') : ($t('signIn') || 'Sign In') }}
            </button>
          </div>

          <div class="switch-tab-link">
            {{ $t('dontHaveAccount') || "Don't have an account?" }}
            <a @click="activeTab = 'signup'" href="#">{{ $t('signUpHere') || 'Sign up here' }}</a>
          </div>
        </div>
      </div>

      <!-- Sign Up Tab -->
      <div v-if="activeTab === 'signup'" class="tab-content">
        <div class="auth-form">
          <h3>{{ $t('createCaregiverAccount') || 'Create Caregiver Account' }}</h3>
          <p class="form-description">
            {{ $t('signUpDescription') || 'Register as a caregiver to manage student boards and word libraries.' }}
          </p>

          <div class="form-group">
            <label for="signup-username">
              <i class="fas fa-user"></i>
              {{ $t('username') || 'Username' }}
            </label>
            <input
              id="signup-username"
              v-model="signUpForm.username"
              type="text"
              class="form-control"
              :placeholder="$t('chooseUsername') || 'Choose a username'"
              @input="validateUsername"
            />
            <div v-if="usernameValidation.message" 
                 class="validation-message"
                 :class="{ 'validation-error': !usernameValidation.isValid, 'validation-success': usernameValidation.isValid }">
              <i :class="usernameValidation.isValid ? 'fas fa-check-circle' : 'fas fa-exclamation-circle'"></i>
              {{ usernameValidation.message }}
            </div>
          </div>

          <div class="form-group">
            <label for="signup-password">
              <i class="fas fa-lock"></i>
              {{ $t('password') || 'Password' }}
            </label>
            <input
              id="signup-password"
              v-model="signUpForm.password"
              type="password"
              class="form-control"
              :placeholder="$t('choosePassword') || 'Choose a password'"
              @input="validatePassword"
            />
            <div v-if="passwordValidation.message" 
                 class="validation-message"
                 :class="{ 'validation-error': !passwordValidation.isValid, 'validation-success': passwordValidation.isValid }">
              <i :class="passwordValidation.isValid ? 'fas fa-check-circle' : 'fas fa-exclamation-circle'"></i>
              {{ passwordValidation.message }}
            </div>
          </div>

          <div class="form-group">
            <label for="signup-confirm-password">
              <i class="fas fa-lock"></i>
              {{ $t('confirmPassword') || 'Confirm Password' }}
            </label>
            <input
              id="signup-confirm-password"
              v-model="signUpForm.confirmPassword"
              type="password"
              class="form-control"
              :placeholder="$t('confirmPassword') || 'Confirm password'"
              @input="validateConfirmPassword"
              @keyup.enter="handleSignUp"
            />
            <div v-if="confirmPasswordValidation.message" 
                 class="validation-message"
                 :class="{ 'validation-error': !confirmPasswordValidation.isValid, 'validation-success': confirmPasswordValidation.isValid }">
              <i :class="confirmPasswordValidation.isValid ? 'fas fa-check-circle' : 'fas fa-exclamation-circle'"></i>
              {{ confirmPasswordValidation.message }}
            </div>
          </div>

          <div class="form-group">
            <label for="signup-fullname">
              <i class="fas fa-id-card"></i>
              {{ $t('fullName') || 'Full Name' }}
            </label>
            <input
              id="signup-fullname"
              v-model="signUpForm.fullName"
              type="text"
              class="form-control"
              :placeholder="$t('enterFullName') || 'Enter your full name'"
            />
          </div>

          <div v-if="signUpError" class="error-message">
            <i class="fas fa-exclamation-circle"></i>
            {{ signUpError }}
          </div>

          <div class="form-actions">
            <button
              @click="handleSignUp"
              class="btn-primary btn-large"
              :disabled="!isSignUpFormValid || isProcessing"
            >
              <i class="fas fa-user-plus"></i>
              {{ isProcessing ? ($t('signingUp') || 'Signing Up...') : ($t('signUp') || 'Sign Up') }}
            </button>
          </div>

          <div class="switch-tab-link">
            {{ $t('alreadyHaveAccount') || 'Already have an account?' }}
            <a @click="activeTab = 'signin'" href="#">{{ $t('signInHere') || 'Sign in here' }}</a>
          </div>
        </div>
      </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import './../../css/modal.css';
import { dataService } from '../../js/service/data/dataService';
import { caregiverDataService } from '../../js/service/data/caregiverDataService';
import { encryptionService } from '../../js/service/data/encryptionService';
import { UserProfile } from '../../js/model/UserProfile';

export default {
  components: {},
  props: {},
  data() {
    return {
      activeTab: 'signin', // 'signin' or 'signup'
      isProcessing: false,
      signInForm: {
        username: '',
        password: ''
      },
      signUpForm: {
        username: '',
        password: '',
        confirmPassword: '',
        fullName: ''
      },
      signInError: '',
      signUpError: '',
      usernameValidation: { isValid: false, message: '' },
      passwordValidation: { isValid: false, message: '' },
      confirmPasswordValidation: { isValid: false, message: '' }
    };
  },
  computed: {
    isSignUpFormValid() {
      return (
        this.usernameValidation.isValid &&
        this.passwordValidation.isValid &&
        this.confirmPasswordValidation.isValid &&
        this.signUpForm.fullName.trim().length > 0
      );
    }
  },
  mounted() {
    // Modal is automatically shown when v-if condition is true in parent
  },
  methods: {
    close() {
      this.$emit('close');
    },
    resetForms() {
      this.signInForm = { username: '', password: '' };
      this.signUpForm = { username: '', password: '', confirmPassword: '', fullName: '' };
      this.signInError = '';
      this.signUpError = '';
      this.usernameValidation = { isValid: false, message: '' };
      this.passwordValidation = { isValid: false, message: '' };
      this.confirmPasswordValidation = { isValid: false, message: '' };
      this.isProcessing = false;
    },
    validateUsername() {
      const username = this.signUpForm.username.trim();
      
      if (!username) {
        this.usernameValidation = { isValid: false, message: '' };
        return;
      }

      if (username.length < 3) {
        this.usernameValidation = {
          isValid: false,
          message: this.$t('usernameTooShort') || 'Username must be at least 3 characters'
        };
        return;
      }

      if (username.length > 20) {
        this.usernameValidation = {
          isValid: false,
          message: this.$t('usernameTooLong') || 'Username must be less than 20 characters'
        };
        return;
      }

      const usernameRegex = /^[a-z0-9_-]+$/;
      if (!usernameRegex.test(username)) {
        this.usernameValidation = {
          isValid: false,
          message: this.$t('usernameInvalidChars') || 'Username can only contain lowercase letters, numbers, hyphens and underscores'
        };
        return;
      }

      this.usernameValidation = {
        isValid: true,
        message: this.$t('usernameValid') || 'Username is valid'
      };
    },
    validatePassword() {
      const password = this.signUpForm.password;
      
      if (!password) {
        this.passwordValidation = { isValid: false, message: '' };
        return;
      }

      if (password.length < 6) {
        this.passwordValidation = {
          isValid: false,
          message: this.$t('passwordTooShort') || 'Password must be at least 6 characters'
        };
        return;
      }

      this.passwordValidation = {
        isValid: true,
        message: this.$t('passwordValid') || 'Password is valid'
      };

      // Re-validate confirm password if it's already filled
      if (this.signUpForm.confirmPassword) {
        this.validateConfirmPassword();
      }
    },
    validateConfirmPassword() {
      const password = this.signUpForm.password;
      const confirmPassword = this.signUpForm.confirmPassword;
      
      if (!confirmPassword) {
        this.confirmPasswordValidation = { isValid: false, message: '' };
        return;
      }

      if (password !== confirmPassword) {
        this.confirmPasswordValidation = {
          isValid: false,
          message: this.$t('passwordsDoNotMatch') || 'Passwords do not match'
        };
        return;
      }

      this.confirmPasswordValidation = {
        isValid: true,
        message: this.$t('passwordsMatch') || 'Passwords match'
      };
    },
    async handleSignIn() {
      const normalizedUsername = (this.signInForm.username || '').trim().toLowerCase();
      if (!normalizedUsername || !this.signInForm.password) {
        return;
      }

      this.isProcessing = true;
      this.signInError = '';

      try {
        // Verify credentials against all matching caregiver records (handles legacy duplicates)
        const caregiverProfile = await caregiverDataService.verifyCaregiverCredentials(
          normalizedUsername,
          this.signInForm.password
        );

        if (!caregiverProfile) {
          this.signInError = this.$t('invalidCredentials') || 'Invalid username or password';
          this.isProcessing = false;
          return;
        }

        // Successful login
        this.$emit('auth-success', {
          type: 'signin',
          caregiver: caregiverProfile
        });

        this.close();
      } catch (error) {
        console.error('Sign in error:', error);
        this.signInError = this.$t('signInFailed') || 'Sign in failed. Please try again.';
      } finally {
        this.isProcessing = false;
      }
    },
    async handleSignUp() {
      if (!this.isSignUpFormValid) {
        return;
      }

      this.isProcessing = true;
      this.signUpError = '';

      try {
        console.log('Starting sign up process...');
        
        // Check if username already exists
        const existingCaregiver = await caregiverDataService.getCaregiverByUsername(
          this.signUpForm.username.trim()
        );

        if (existingCaregiver) {
          console.log('Username already exists');
          this.signUpError = this.$t('usernameAlreadyExists') || 'Username already exists';
          this.isProcessing = false;
          return;
        }

        console.log('Username available, creating profile...');

        // Hash the password
        const hashedPassword = encryptionService.getUserPasswordHash(this.signUpForm.password);
        console.log('Password hashed successfully');

        // Create new caregiver profile
        const profileData = {
          username: this.signUpForm.username.trim().toLowerCase(),
          fullName: this.signUpForm.fullName.trim(),
          role: 'caregiver',
          passwordHash: hashedPassword,
          studentIds: [],
          createdAt: Date.now(),
          lastModified: Date.now(),
          isActive: true
        };
        console.log('Profile data:', profileData);

        const newCaregiver = new UserProfile(profileData);
        console.log('UserProfile instance created:', newCaregiver);

        // Save to database
        console.log('Saving to database...');
        await caregiverDataService.saveUserProfile(newCaregiver);
        console.log('Successfully saved to database');

        // Successful registration
        this.$emit('auth-success', {
          type: 'signup',
          caregiver: newCaregiver
        });

        this.close();
      } catch (error) {
        console.error('Sign up error details:', error);
        console.error('Error message:', error.message);
        console.error('Error stack:', error.stack);
        this.signUpError = this.$t('signUpFailed') || 'Sign up failed. Please try again.';
      } finally {
        this.isProcessing = false;
      }
    }
  }
};
</script>

<style scoped>
.caregiver-auth-modal {
  max-width: 500px;
}

.auth-container {
  min-height: 400px;
}

.tab-navigation {
  display: flex;
  gap: 10px;
  margin-bottom: 25px;
  border-bottom: 2px solid #ddd;
}

.tab-button {
  flex: 1;
  padding: 12px 20px;
  background: none;
  border: none;
  cursor: pointer;
  font-size: 1em;
  color: #666;
  border-bottom: 3px solid transparent;
  transition: all 0.3s ease;
}

.tab-button i {
  margin-right: 8px;
}

.tab-button:hover {
  color: #333;
  background: #f9f9f9;
}

.tab-button.active {
  color: #4CAF50;
  border-bottom-color: #4CAF50;
  font-weight: bold;
}

.tab-content {
  animation: fadeIn 0.3s ease;
}

@keyframes fadeIn {
  from { opacity: 0; transform: translateY(-10px); }
  to { opacity: 1; transform: translateY(0); }
}

.auth-form {
  padding: 10px 0;
}

.auth-form h3 {
  margin: 0 0 10px 0;
  color: #333;
  font-size: 1.4em;
}

.form-description {
  color: #666;
  margin-bottom: 25px;
  font-size: 0.95em;
  line-height: 1.5;
}

.form-group {
  margin-bottom: 20px;
}

.form-group label {
  display: block;
  margin-bottom: 8px;
  font-weight: bold;
  color: #333;
  font-size: 0.95em;
}

.form-group label i {
  margin-right: 6px;
  color: #4CAF50;
}

.form-control {
  width: 100%;
  padding: 10px 12px;
  border: 2px solid #ddd;
  border-radius: 6px;
  font-size: 0.95em;
  transition: all 0.3s ease;
  box-sizing: border-box;
}

.form-control:focus {
  outline: none;
  border-color: #4CAF50;
  box-shadow: 0 0 0 3px rgba(76, 175, 80, 0.1);
}

.validation-message {
  margin-top: 6px;
  font-size: 0.85em;
  display: flex;
  align-items: center;
  gap: 6px;
}

.validation-message i {
  font-size: 0.9em;
}

.validation-error {
  color: #f44336;
}

.validation-success {
  color: #4CAF50;
}

.error-message {
  padding: 12px;
  background: #ffebee;
  border: 1px solid #f44336;
  border-radius: 6px;
  color: #c62828;
  margin-bottom: 20px;
  display: flex;
  align-items: center;
  gap: 8px;
}

.error-message i {
  font-size: 1.1em;
}

.form-actions {
  margin-top: 25px;
}

.btn-large {
  width: 100%;
  padding: 12px 20px;
  font-size: 1em;
  font-weight: bold;
}

.btn-primary {
  background-color: #4CAF50;
  color: white;
  border: none;
  border-radius: 6px;
  cursor: pointer;
  transition: all 0.3s ease;
}

.btn-primary:hover:not(:disabled) {
  background-color: #45a049;
  box-shadow: 0 2px 8px rgba(76, 175, 80, 0.3);
}

.btn-primary:disabled {
  background-color: #ccc;
  cursor: not-allowed;
  opacity: 0.6;
}

.btn-primary i {
  margin-right: 8px;
}

.switch-tab-link {
  text-align: center;
  margin-top: 20px;
  font-size: 0.9em;
  color: #666;
}

.switch-tab-link a {
  color: #4CAF50;
  text-decoration: none;
  font-weight: bold;
  cursor: pointer;
}

.switch-tab-link a:hover {
  text-decoration: underline;
}
</style>
