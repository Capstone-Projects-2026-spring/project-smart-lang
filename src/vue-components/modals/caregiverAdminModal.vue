<template>
  <div class="modal">
    <div class="modal-mask" style="z-index: 9999">
      <div class="modal-wrapper">
        <div class="modal-container caregiver-modal" @keydown.esc="close()">
          <a class="inline close-button" href="javascript:void(0);" @click="close()">
            <i class="fas fa-times" />
          </a>
          <div class="modal-header">
            <i class="fas fa-user-nurse"></i>
            <h1>{{ $t('caregiverAdmin') || 'Caregiver Admin' }}</h1>
          </div>

          <div class="modal-body mt-5">
            <!-- Tab Navigation -->
            <div class="tab-navigation">
              <button 
                v-for="tab in tabs" 
                :key="tab"
                :class="['tab-button', { active: activeTab === tab }]"
                @click="activeTab = tab"
              >
                <i :class="getTabIcon(tab)"></i>
                {{ getTabLabel(tab) }}
              </button>
            </div>

            <!-- Tab 1: Search & Add Words -->
            <div v-show="activeTab === 'search'" class="tab-content">
              <search-bar
                :placeholder="$t('searchSuggestedWords') || 'Search words...'"
                v-model="searchTerm"
                @input="searchWords()"
                :debounce-time="300"
              ></search-bar>

              <div class="mt-5">
                <div v-if="searchInProgress" class="text-center">
                  <i class="fas fa-spinner fa-spin"></i>
                  <span>{{ $t('searching') || 'Searching...' }}</span>
                </div>
                <div v-else-if="filteredResults && filteredResults.length > 0" class="word-list">
                  <h3>{{ $t('suggestedWords') || 'Suggested Words' }} ({{ filteredResults.length }})</h3>
                  <div
                    v-for="(word, index) in filteredResults"
                    :key="index"
                    class="word-card"
                  >
                    <div class="word-preview">
                      <img
                        v-if="word.image"
                        :src="word.image.data || word.image.url"
                        class="word-image"
                      />
                      <div class="word-info">
                        <div class="word-label">{{ word.label | extractTranslation }}</div>
                        <div class="word-category" v-if="word.category">
                          <i class="fas fa-tag"></i> {{ word.category }}
                        </div>
                        <div class="word-description" v-if="word.description">
                          {{ word.description | extractTranslation }}
                        </div>
                      </div>
                    </div>

                    <div class="word-actions">
                      <button
                        @click="addWordToBoard(word)"
                        :disabled="isWordAdded(word.id)"
                        class="btn-primary"
                      >
                        <i class="fas fa-plus"></i>
                        {{ isWordAdded(word.id) ? ($t('added') || 'Added') : ($t('add') || 'Add') }}
                      </button>
                    </div>
                  </div>
                </div>
                <div v-else-if="searchTerm && !searchInProgress" class="text-muted">
                  {{ $t('noSearchResults') || 'No results found' }}
                </div>
                <div v-else-if="!searchTerm" class="text-muted">
                  {{ $t('startSearching') || 'Start typing to search' }}
                </div>
              </div>
            </div>

            <!-- Tab 2: Manage Board Words -->
            <div v-show="activeTab === 'manage'" class="tab-content">
              <div class="manage-controls mb-3">
                <input 
                  v-model="filterBoardTerm"
                  type="text"
                  class="filter-input"
                  :placeholder="$t('filterBoardWords') || 'Filter words...'"
                />
              </div>

              <div v-if="boardWords && boardWords.length > 0" class="word-list">
                <h3>{{ $t('boardWords') || 'Words on Board' }} ({{ boardWords.length }})</h3>
                <div
                  v-for="(word, index) in filteredBoardWords"
                  :key="word.id"
                  class="word-card"
                  :class="{ 'editing-mode': editingWordId === word.id }"
                >
                  <!-- View Mode -->
                  <div v-if="editingWordId !== word.id" class="word-preview">
                    <img
                      v-if="word.image"
                      :src="word.image.data || word.image.url"
                      class="word-image"
                    />
                    <div class="word-info">
                      <div class="word-label">{{ word.label | extractTranslation }}</div>
                      <div class="word-description" v-if="word.description">
                        {{ word.description | extractTranslation }}
                      </div>
                    </div>
                  </div>

                  <!-- Edit Mode -->
                  <div v-else class="word-edit-form">
                    <div class="form-group-inline">
                      <label>{{ $t('wordLabel') || 'Label' }}:</label>
                      <input 
                        v-model="editingWordData.label" 
                        type="text" 
                        class="form-control-inline"
                      />
                    </div>
                    <div class="form-group-inline">
                      <label>{{ $t('wordDescription') || 'Description' }}:</label>
                      <input 
                        v-model="editingWordData.description" 
                        type="text" 
                        class="form-control-inline"
                      />
                    </div>
                  </div>

                  <div class="word-actions">
                    <!-- View Mode Actions -->
                    <template v-if="editingWordId !== word.id">
                      <button
                        @click="editWord(word, index)"
                        class="btn-secondary"
                        title="Edit word"
                      >
                        <i class="fas fa-edit"></i>
                      </button>
                      <button
                        @click="removeWordFromBoard(word.id, index)"
                        class="btn-danger"
                        title="Remove word"
                      >
                        <i class="fas fa-trash"></i>
                      </button>
                    </template>
                    
                    <!-- Edit Mode Actions -->
                    <template v-else>
                      <button
                        @click="saveEdit(index)"
                        class="btn-success"
                        title="Save changes"
                      >
                        <i class="fas fa-check"></i>
                      </button>
                      <button
                        @click="cancelEdit()"
                        class="btn-cancel-edit"
                        title="Cancel"
                      >
                        <i class="fas fa-times"></i>
                      </button>
                    </template>
                  </div>
                </div>
              </div>
              <div v-else class="text-muted text-center">
                {{ $t('noBoardWords') || 'No words on board yet' }}
              </div>
            </div>

            <!-- Tab 3: Upload Custom Words -->
            <div v-show="activeTab === 'upload'" class="tab-content">
              <div class="upload-section">
                <h3>{{ $t('addCustomWord') || 'Add Custom Word' }}</h3>
                
                <div class="form-group">
                  <label>{{ $t('wordLabel') || 'Word Label' }}:</label>
                  <input v-model="newWord.label" type="text" class="form-control" />
                </div>

                <div class="form-group">
                  <label>{{ $t('wordDescription') || 'Description' }}:</label>
                  <textarea v-model="newWord.description" class="form-control" rows="3"></textarea>
                </div>

                <div class="form-group">
                  <label>{{ $t('wordCategory') || 'Category' }}:</label>
                  <select v-model="newWord.category" class="form-control">
                    <option value="">{{ $t('selectCategory') || 'Select category' }}</option>
                    <option value="common">Common</option>
                    <option value="eating">Eating</option>
                    <option value="emotions">Emotions</option>
                    <option value="actions">Actions</option>
                    <option value="greetings">Greetings</option>
                    <option value="custom">Custom</option>
                  </select>
                </div>

                <div class="form-group">
                  <label>{{ $t('uploadImage') || 'Upload Image' }}:</label>
                  <div class="image-upload">
                    <input 
                      type="file" 
                      @change="handleImageUpload"
                      accept="image/*"
                      class="file-input"
                    />
                    <div v-if="newWord.imagePreview" class="image-preview">
                      <img :src="newWord.imagePreview" />
                      <button @click="clearImage" class="btn-small">
                        <i class="fas fa-times"></i>
                      </button>
                    </div>
                  </div>
                </div>

                <div class="form-actions">
                  <button @click="addCustomWord" class="btn-primary">
                    <i class="fas fa-save"></i>
                    {{ $t('addWord') || 'Add Word' }}
                  </button>
                  <button @click="resetForm" class="btn-secondary">
                    <i class="fas fa-redo"></i>
                    {{ $t('reset') || 'Reset' }}
                  </button>
                </div>
              </div>
            </div>

            <!-- Tab 4: Manage Multiple Students -->
            <div v-show="activeTab === 'users'" class="tab-content">
              <div class="users-section">
                <h3>{{ $t('manageStudents') || 'Manage Students' }}</h3>
                
                <div v-if="myStudents && myStudents.length > 0" class="student-list">
                  <div
                    v-for="student in myStudents"
                    :key="student.id"
                    class="student-card"
                  >
                    <div class="student-info">
                      <div class="student-name">{{ student.username }}</div>
                      <div class="student-meta" v-if="student.email">
                        <i class="fas fa-envelope"></i> {{ student.email }}
                      </div>
                    </div>
                    <div class="student-actions">
                      <button
                        @click="switchStudent(student.id)"
                        class="btn-secondary"
                        :class="{ active: currentStudentId === student.id }"
                      >
                        <i class="fas fa-eye"></i>
                      </button>
                      <button
                        @click="removeStudent(student.id)"
                        class="btn-danger"
                      >
                        <i class="fas fa-link-slash"></i>
                      </button>
                    </div>
                  </div>
                </div>

                <div class="add-student-form">
                  <h4>{{ $t('addNewStudent') || 'Add New Student' }}</h4>
                  <input 
                    v-model="newStudentPin"
                    type="text"
                    class="form-control"
                    :placeholder="$t('enterStudentPin') || 'Enter student PIN'"
                  />
                  <button @click="addStudent" class="btn-primary mt-2">
                    <i class="fas fa-plus"></i>
                    {{ $t('addStudent') || 'Add Student' }}
                  </button>
                </div>
              </div>
            </div>
          </div>

          <div class="modal-footer">
            <button @click="signOut()" class="btn-secondary">
              <i class="fas fa-sign-out-alt"></i> {{ $t('logout') || 'Sign Out' }}
            </button>
            <button @click="close()" class="btn-cancel">
              <i class="fas fa-times"></i> {{ $t('close') || 'Close' }}
            </button>
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
import { i18nService } from '../../js/service/i18nService';
import SearchBar from '../components/searchBar.vue';
import { GridElement } from '../../js/model/GridElement';
import { SuggestedWord } from '../../js/model/SuggestedWord';

export default {
  components: {
    SearchBar
  },
  props: {
    gridId: String,
    metadata: Object,
    caregiverId: String,
    currentUserId: String
  },
  data() {
    return {
      activeTab: 'search',
      tabs: ['search', 'manage', 'upload', 'users'],
      searchTerm: '',
      filterBoardTerm: '',
      searchResults: [],
      searchInProgress: false,
      suggestedWords: [],
      boardWords: [],
      addedWordIds: new Set(),
      myStudents: [],
      currentStudentId: null,
      newStudentPin: '',
      gridData: null,
      i18nService: i18nService,
      editingWordId: null,
      editingWordData: null,
      newWord: {
        label: '',
        description: '',
        category: '',
        imagePreview: null,
        imageData: null
      }
    };
  },
  computed: {
    filteredResults() {
      if (!this.searchResults) return [];
      return this.searchResults.filter(word => 
        !this.isWordAdded(word.id)
      );
    },
    filteredBoardWords() {
      if (!this.boardWords) return [];
      const term = this.filterBoardTerm.toLowerCase();
      if (!term) return this.boardWords;
      return this.boardWords.filter(word =>
        (word.label || '').toLowerCase().includes(term) ||
        (word.description || '').toLowerCase().includes(term)
      );
    }
  },
  methods: {
    open(gridId) {
      this.activeTab = 'search';
      this.loadGridData(gridId || this.gridId);
      this.loadSuggestedWords();
      this.loadMyStudents();
    },
    close() {
      this.searchTerm = '';
      this.filterBoardTerm = '';
      this.searchResults = [];
      this.addedWordIds.clear();
      this.$emit('close');
    },
    signOut() {
      this.searchTerm = '';
      this.filterBoardTerm = '';
      this.searchResults = [];
      this.addedWordIds.clear();
      this.$emit('sign-out');
    },
    async loadGridData(gridId) {
      try {
        this.gridData = await dataService.getGrid(gridId, false, true);
        if (this.gridData) {
          this.boardWords = this.gridData.gridElements || [];
          this.boardWords.forEach(elem => {
            this.addedWordIds.add(elem.id);
          });
        }
      } catch (error) {
        console.error('Error loading grid data:', error);
      }
    },
    async loadSuggestedWords() {
      try {
        this.searchInProgress = true;
        this.suggestedWords = await caregiverDataService.getAllSuggestedWords();
        this.searchResults = this.suggestedWords;
      } catch (error) {
        console.error('Error loading suggested words from local library:', error);
        this.suggestedWords = [];
        this.searchResults = [];
      } finally {
        this.searchInProgress = false;
      }
    },
    async loadMyStudents() {
      try {
        if (!this.caregiverId) {
          this.myStudents = [];
          return;
        }
        this.myStudents = await caregiverDataService.getCaregiverStudents(this.caregiverId);
      } catch (error) {
        console.error('Error loading students:', error);
        this.myStudents = [];
      }
    },
    async searchWords() {
      this.searchInProgress = true;
      try {
        const term = (this.searchTerm || '').trim();
        if (!term) {
          this.searchResults = this.suggestedWords || [];
          return;
        }
        this.searchResults = await caregiverDataService.searchSuggestedWords(term);
      } catch (error) {
        console.error('Error searching suggested words:', error);
        this.searchResults = [];
      } finally {
        this.searchInProgress = false;
      }
    },
    isWordAdded(wordId) {
      return this.addedWordIds.has(wordId);
    },
    async addWordToBoard(word) {
      if (!this.gridData) return;

      try {
        const newElement = new GridElement();
        newElement.id = word.id;
        newElement.label = word.label;
        newElement.description = word.description || '';
        newElement.image = word.image || null;

        this.gridData.gridElements.push(newElement);
        this.addedWordIds.add(word.id);
        this.boardWords.push(newElement);

        await dataService.saveGrid(this.gridData);
        this.showSuccessMessage(word.label, 'added');

        this.$emit('word-added', { word, gridId: this.gridId });
      } catch (error) {
        console.error('Error adding word:', error);
        this.showErrorMessage();
      }
    },
    async removeWordFromBoard(wordId, index) {
      if (!this.gridData) return;

      try {
        const wordLabel = (this.boardWords[index].label || '').toString();
        
        this.gridData.gridElements = this.gridData.gridElements.filter(
          elem => elem.id !== wordId
        );
        this.boardWords.splice(index, 1);
        this.addedWordIds.delete(wordId);

        await dataService.saveGrid(this.gridData);
        this.showSuccessMessage(wordLabel, 'removed');

        this.$emit('word-removed', { wordId, gridId: this.gridId });
      } catch (error) {
        console.error('Error removing word:', error);
        this.showErrorMessage();
      }
    },
    editWord(word, index) {
      this.editingWordId = word.id;
      this.editingWordData = {
        label: typeof word.label === 'object' ? word.label : { en: word.label },
        description: typeof word.description === 'object' ? word.description : { en: word.description || '' },
        image: word.image
      };
    },
    async saveEdit(index) {
      if (!this.editingWordData || !this.gridData) {
        return;
      }

      try {
        const wordIndex = this.gridData.gridElements.findIndex(
          elem => elem.id === this.editingWordId
        );

        if (wordIndex !== -1) {
          // Update the word in gridData
          this.gridData.gridElements[wordIndex].label = this.editingWordData.label;
          this.gridData.gridElements[wordIndex].description = this.editingWordData.description;

          // Update the local boardWords array
          this.boardWords[index].label = this.editingWordData.label;
          this.boardWords[index].description = this.editingWordData.description;

          // Save to database
          await dataService.saveGrid(this.gridData);

          // Show success message
          const wordLabel = typeof this.editingWordData.label === 'object' 
            ? this.editingWordData.label.en || Object.values(this.editingWordData.label)[0]
            : this.editingWordData.label;
          this.showSuccessMessage(wordLabel, 'updated');

          // Emit event
          this.$emit('word-edited', { 
            wordId: this.editingWordId, 
            gridId: this.gridId 
          });
        }

        // Exit edit mode
        this.cancelEdit();
      } catch (error) {
        console.error('Error saving word edit:', error);
        this.showErrorMessage();
      }
    },
    cancelEdit() {
      this.editingWordId = null;
      this.editingWordData = null;
    },
    handleImageUpload(event) {
      const file = event.target.files[0];
      if (file) {
        const reader = new FileReader();
        reader.onload = (e) => {
          this.newWord.imagePreview = e.target.result;
          this.newWord.imageData = e.target.result;
        };
        reader.readAsDataURL(file);
      }
    },
    clearImage() {
      this.newWord.imagePreview = null;
      this.newWord.imageData = null;
    },
    async addCustomWord() {
      if (!this.newWord.label) {
        alert(this.$t('wordLabelRequired') || 'Word label is required');
        return;
      }

      try {
        const newElement = new GridElement();
        newElement.id = `custom_${Date.now()}`;
        newElement.label = this.newWord.label;
        newElement.description = this.newWord.description || '';
        if (this.newWord.imageData) {
          newElement.image = {
            data: this.newWord.imageData // Base64 encoded image
          };
        }

        if (this.gridData) {
          this.gridData.gridElements.push(newElement);
          this.boardWords.push(newElement);
          await dataService.saveGrid(this.gridData);
        }

        const customSuggestedWord = new SuggestedWord({
          label: this.newWord.label,
          description: this.newWord.description || '',
          category: this.newWord.category || 'custom',
          image: this.newWord.imageData ? { data: this.newWord.imageData } : null,
          createdAt: Date.now(),
          lastModified: Date.now(),
          isActive: true
        });
        await caregiverDataService.saveSuggestedWord(customSuggestedWord);
        await this.loadSuggestedWords();
        this.searchWords();

        this.showSuccessMessage(this.newWord.label, 'added');
        this.resetForm();
        this.$emit('word-added', { word: newElement, gridId: this.gridId });
      } catch (error) {
        console.error('Error adding custom word:', error);
        this.showErrorMessage();
      }
    },
    resetForm() {
      this.newWord = {
        label: '',
        description: '',
        category: '',
        imagePreview: null,
        imageData: null
      };
    },
    switchStudent(studentId) {
      this.currentStudentId = studentId;
      this.loadGridData(studentId); // Load that student's grid
      this.$emit('student-switched', { studentId });
    },
    async addStudent() {
      if (!this.newStudentPin) {
        alert(this.$t('pinRequired') || 'PIN is required');
        return;
      }

      try {
        if (!this.caregiverId) {
          alert(this.$t('pleaseSignIn') || 'Please sign in as a caregiver');
          return;
        }

        await caregiverDataService.addStudentToCaregiverByPin(this.caregiverId, this.newStudentPin);
        this.newStudentPin = '';
        await this.loadMyStudents();
      } catch (error) {
        console.error('Error adding student:', error);
        alert(error.message || (this.$t('errorOperation') || 'Operation failed'));
      }
    },
    async removeStudent(studentId) {
      if (confirm(this.$t('confirmRemoveStudent') || 'Remove this student?')) {
        try {
          if (!this.caregiverId) {
            return;
          }
          await caregiverDataService.removeStudentFromCaregiver(this.caregiverId, studentId);
          await this.loadMyStudents();
        } catch (error) {
          console.error('Error removing student:', error);
          this.showErrorMessage();
        }
      }
    },
    getTabIcon(tab) {
      const icons = {
        'search': 'fas fa-search',
        'manage': 'fas fa-list',
        'upload': 'fas fa-cloud-upload-alt',
        'users': 'fas fa-users'
      };
      return icons[tab] || 'fas fa-folder';
    },
    getTabLabel(tab) {
      const labels = {
        'search': this.$t('search') || 'Search',
        'manage': this.$t('manage') || 'Manage',
        'upload': this.$t('upload') || 'Upload',
        'users': this.$t('users') || 'Students'
      };
      return labels[tab] || tab;
    },
    showSuccessMessage(wordLabel, action) {
      const actionMap = {
        'added': 'added to',
        'removed': 'removed from',
        'updated': 'updated on'
      };
      const actionText = actionMap[action] || action;
      const message = `${wordLabel} ${actionText} the board successfully!`;
      
      if (window.messageBox) {
        window.messageBox.show({
          header: 'success',
          message,
          type: window.messageBox.MODAL_TYPE_SUCCESS,
          autoCloseDuration: 2000
        });
      }
    },
    showErrorMessage() {
      if (window.messageBox) {
        window.messageBox.show({
          header: 'error',
          message: this.$t('errorOperation') || 'Operation failed',
          type: window.messageBox.MODAL_TYPE_WARNING,
          autoCloseDuration: 3000
        });
      }
    }
  },
  mounted() {
    // Auto-load data when modal is mounted
    this.open(this.gridId);
  }
};
</script>

<style scoped>
.caregiver-modal {
  max-width: 900px;
}

.tab-navigation {
  display: flex;
  gap: 10px;
  margin-bottom: 20px;
  border-bottom: 2px solid #ddd;
}

.tab-button {
  padding: 10px 15px;
  background: none;
  border: none;
  cursor: pointer;
  font-size: 0.95em;
  color: #666;
  border-bottom: 3px solid transparent;
  transition: all 0.3s ease;
}

.tab-button i {
  margin-right: 8px;
}

.tab-button:hover {
  color: #333;
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
  from { opacity: 0; }
  to { opacity: 1; }
}

.word-list {
  margin-top: 20px;
}

.word-card {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 12px;
  margin-bottom: 10px;
  background: #f9f9f9;
  border: 1px solid #ddd;
  border-radius: 6px;
  transition: all 0.3s ease;
}

.word-card:hover {
  background: #f0f0f0;
  box-shadow: 0 2px 8px rgba(0,0,0,0.1);
}

.word-preview {
  display: flex;
  align-items: center;
  flex: 1;
  gap: 15px;
}

.word-image {
  width: 50px;
  height: 50px;
  object-fit: cover;
  border-radius: 4px;
}

.word-info {
  flex: 1;
}

.word-label {
  font-weight: bold;
  font-size: 1.05em;
}

.word-category {
  font-size: 0.85em;
  color: #666;
  margin-top: 3px;
}

.word-category i {
  margin-right: 5px;
}

.word-description {
  font-size: 0.9em;
  color: #888;
  margin-top: 5px;
}

.word-actions {
  display: flex;
  gap: 8px;
}

.btn-primary, .btn-secondary, .btn-danger {
  padding: 8px 12px;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  transition: all 0.2s ease;
  font-size: 0.9em;
}

.btn-primary {
  background-color: #4CAF50;
  color: white;
}

.btn-primary:hover:not(:disabled) {
  background-color: #45a049;
}

.btn-primary:disabled {
  background-color: #ccc;
  cursor: not-allowed;
  opacity: 0.7;
}

.btn-secondary {
  background-color: #2196F3;
  color: white;
}

.btn-secondary:hover {
  background-color: #0b7dda;
}

.btn-secondary.active {
  background-color: #004085;
}

.btn-danger {
  background-color: #f44336;
  color: white;
}

.btn-danger:hover {
  background-color: #da190b;
}

.btn-cancel {
  padding: 8px 16px;
  background-color: #f44336;
  color: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;
}

.btn-cancel:hover {
  background-color: #da190b;
}

.form-group {
  margin-bottom: 15px;
}

.form-group label {
  display: block;
  margin-bottom: 5px;
  font-weight: bold;
}

.form-control {
  width: 100%;
  padding: 8px;
  border: 1px solid #ddd;
  border-radius: 4px;
  font-size: 0.95em;
}

.image-upload {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.file-input {
  padding: 8px;
  border: 2px dashed #ddd;
  border-radius: 4px;
  cursor: pointer;
}

.image-preview {
  position: relative;
  width: 100px;
  height: 100px;
  border-radius: 4px;
  overflow: hidden;
}

.image-preview img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.image-preview .btn-small {
  position: absolute;
  top: 5px;
  right: 5px;
  padding: 4px 8px;
  background: #f44336;
  color: white;
  border: none;
  border-radius: 50%;
  cursor: pointer;
}

.form-actions {
  display: flex;
  gap: 10px;
  margin-top: 20px;
}

.student-list {
  margin-top: 20px;
}

.student-card {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 12px;
  margin-bottom: 10px;
  background: #f9f9f9;
  border: 1px solid #ddd;
  border-radius: 6px;
}

.student-info {
  flex: 1;
}

.student-name {
  font-weight: bold;
  font-size: 1.05em;
}

.student-meta {
  font-size: 0.9em;
  color: #666;
  margin-top: 5px;
}

.student-actions {
  display: flex;
  gap: 8px;
}

.add-student-form {
  margin-top: 20px;
  padding: 15px;
  background: #f5f5f5;
  border-radius: 6px;
}

.add-student-form h4 {
  margin-top: 0;
}

.manage-controls {
  display: flex;
  gap: 10px;
}

.filter-input {
  flex: 1;
  padding: 8px;
  border: 1px solid #ddd;
  border-radius: 4px;
  font-size: 0.95em;
}

.mt-2 {
  margin-top: 10px;
}

.mt-5 {
  margin-top: 20px;
}

.mb-3 {
  margin-bottom: 15px;
}

.text-muted {
  color: #999;
  text-align: center;
  padding: 20px;
}

.text-center {
  text-align: center;
}

/* Edit Mode Styles */
.word-card.editing-mode {
  background: #e8f5e9;
  border-color: #4CAF50;
  box-shadow: 0 2px 8px rgba(76, 175, 80, 0.2);
}

.word-edit-form {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.form-group-inline {
  display: flex;
  align-items: center;
  gap: 10px;
}

.form-group-inline label {
  font-weight: bold;
  min-width: 100px;
  margin: 0;
}

.form-control-inline {
  flex: 1;
  padding: 6px 10px;
  border: 1px solid #ddd;
  border-radius: 4px;
  font-size: 0.95em;
}

.form-control-inline:focus {
  outline: none;
  border-color: #4CAF50;
  box-shadow: 0 0 0 2px rgba(76, 175, 80, 0.2);
}

.btn-success {
  padding: 8px 12px;
  background-color: #4CAF50;
  color: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  transition: all 0.2s ease;
  font-size: 0.9em;
}

.btn-success:hover {
  background-color: #45a049;
}

.btn-cancel-edit {
  padding: 8px 12px;
  background-color: #757575;
  color: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  transition: all 0.2s ease;
  font-size: 0.9em;
}

.btn-cancel-edit:hover {
  background-color: #616161;
}
</style>
