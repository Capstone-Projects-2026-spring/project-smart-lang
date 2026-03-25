<template>
  <div class="modal">
    <div class="modal-mask" style="z-index: 9999">
      <div class="modal-wrapper">
        <div class="modal-container" @keydown.esc="$emit('close')">
          <a
            class="inline close-button"
            href="javascript:void(0);"
            @click="$emit('close')"
          ><i class="fas fa-times" /></a>

          <div class="modal-header">
            <h1><i class="fas fa-users" style="margin-right: 0.5em;"></i>Manage Students</h1>
          </div>

          <div class="modal-body">
            <p class="manage-students-desc">
              Enter a student's unique ID to view and manage their board.
            </p>

            <div class="student-id-input-row">
              <input
                v-model="studentIdInput"
                type="text"
                class="student-id-input"
                placeholder="Student ID (e.g. SL-A3F2)"
                @keydown.enter="loadStudent"
                maxlength="7"
              />
              <button class="load-btn" @click="loadStudent" :disabled="!studentIdInput.trim()">
                <i class="fas fa-search"></i> Load Board
              </button>
            </div>

            <div v-if="error" class="manage-error">
              <i class="fas fa-exclamation-circle"></i> {{ error }}
            </div>

            <div v-if="loadedStudent" class="loaded-student-info">
              <div class="student-info-header">
                <i class="fas fa-user-graduate"></i>
                <span>Student: <strong>{{ loadedStudent.name }}</strong></span>
              </div>
              <div class="student-actions">
                <button class="action-btn primary-btn" @click="viewBoard">
                  <i class="fas fa-th"></i> View Tile Board
                </button>
              </div>
            </div>

            <div class="recent-students" v-if="recentStudents.length > 0">
              <h3>Recently Accessed</h3>
              <ul class="recent-list">
                <li v-for="s in recentStudents" :key="s.id" @click="selectRecent(s)">
                  <i class="fas fa-user-graduate"></i>
                  <span>{{ s.name }}</span>
                  <span class="recent-id">{{ s.id }}</span>
                </li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import '../../css/modal.css';

// Mock student lookup — in production this would query a backend.
const MOCK_STUDENTS = {
    'SL-A3F2': { id: 'SL-A3F2', name: 'Alex Smith' },
    'SL-B7C1': { id: 'SL-B7C1', name: 'Jordan Lee' },
    'SL-D4E9': { id: 'SL-D4E9', name: 'Taylor Brown' },
};

const RECENT_KEY = 'SMART_LANG_RECENT_STUDENTS';

export default {
    name: 'ManageStudentsModal',
    data() {
        return {
            studentIdInput: '',
            loadedStudent: null,
            error: null,
            recentStudents: [],
        };
    },
    mounted() {
        try {
            this.recentStudents = JSON.parse(localStorage.getItem(RECENT_KEY) || '[]');
        } catch (e) {
            this.recentStudents = [];
        }
    },
    methods: {
        loadStudent() {
            this.error = null;
            this.loadedStudent = null;
            const id = this.studentIdInput.trim().toUpperCase();
            if (!id) return;

            // Mock lookup — any ID starting with "SL-" followed by 4 chars is accepted
            let student = MOCK_STUDENTS[id];
            if (!student && /^SL-[A-Z0-9]{4}$/.test(id)) {
                student = { id: id, name: 'Student (' + id + ')' };
            }

            if (student) {
                this.loadedStudent = student;
                this.addToRecent(student);
            } else {
                this.error = 'No student found with ID "' + id + '". Please check the ID and try again.';
            }
        },
        addToRecent(student) {
            const list = this.recentStudents.filter(s => s.id !== student.id);
            list.unshift(student);
            this.recentStudents = list.slice(0, 5);
            try {
                localStorage.setItem(RECENT_KEY, JSON.stringify(this.recentStudents));
            } catch (e) {
                // ignore
            }
        },
        selectRecent(student) {
            this.studentIdInput = student.id;
            this.loadedStudent = student;
            this.error = null;
        },
        viewBoard() {
            if (this.loadedStudent) {
                // In a full implementation, this would switch to the student's board data.
                // For now, emit an event and close the modal.
                this.$emit('view-student-board', this.loadedStudent);
                this.$emit('close');
            }
        },
    },
};
</script>

<style scoped>
.manage-students-desc {
    color: #555;
    margin-bottom: 1.2em;
}

.student-id-input-row {
    display: flex;
    gap: 0.5em;
    margin-bottom: 0.8em;
}

.student-id-input {
    flex: 1;
    padding: 0.5em 0.75em;
    border: 2px solid #ddd;
    border-radius: 6px;
    font-size: 1em;
    text-transform: uppercase;
    letter-spacing: 0.05em;
}

.student-id-input:focus {
    border-color: #3498db;
    outline: none;
}

.load-btn {
    padding: 0.5em 1em;
    background: #3498db;
    color: white;
    border: none;
    border-radius: 6px;
    cursor: pointer;
    font-size: 1em;
    white-space: nowrap;
}

.load-btn:hover:not(:disabled) {
    background: #2980b9;
}

.load-btn:disabled {
    opacity: 0.5;
    cursor: not-allowed;
}

.manage-error {
    color: #e74c3c;
    margin-bottom: 0.8em;
    font-size: 0.9em;
}

.loaded-student-info {
    background: #eafaf1;
    border: 1px solid #27ae60;
    border-radius: 8px;
    padding: 1em;
    margin-bottom: 1em;
}

.student-info-header {
    display: flex;
    align-items: center;
    gap: 0.5em;
    margin-bottom: 0.8em;
    color: #219a52;
    font-size: 1.05em;
}

.student-actions {
    display: flex;
    gap: 0.5em;
    flex-wrap: wrap;
}

.action-btn {
    padding: 0.5em 1em;
    border: none;
    border-radius: 6px;
    cursor: pointer;
    font-size: 0.95em;
    display: flex;
    align-items: center;
    gap: 0.4em;
}

.primary-btn {
    background: #27ae60;
    color: white;
}

.primary-btn:hover {
    background: #219a52;
}

.recent-students h3 {
    font-size: 0.95em;
    color: #777;
    margin: 0.5em 0;
    text-transform: uppercase;
    letter-spacing: 0.05em;
}

.recent-list {
    list-style: none;
    padding: 0;
    margin: 0;
}

.recent-list li {
    display: flex;
    align-items: center;
    gap: 0.5em;
    padding: 0.4em 0.5em;
    cursor: pointer;
    border-radius: 4px;
    color: #444;
    font-size: 0.95em;
}

.recent-list li:hover {
    background: #f0f0f0;
}

.recent-id {
    margin-left: auto;
    color: #999;
    font-family: monospace;
    font-size: 0.9em;
}
</style>
