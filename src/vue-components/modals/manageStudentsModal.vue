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
                <span v-if="!editingName">Student: <strong>{{ loadedStudent.name }}</strong></span>
                <input
                  v-else
                  v-model="editNameInput"
                  type="text"
                  class="edit-name-input"
                  placeholder="Enter student name"
                  @keydown.enter="saveName"
                  @keydown.esc="cancelEdit"
                  ref="editNameInput"
                />
              </div>
              <div class="student-actions">
                <button v-if="!editingName" class="action-btn edit-btn" @click="startEditName">
                  <i class="fas fa-pencil-alt"></i> Edit Name
                </button>
                <button v-if="editingName" class="action-btn save-btn" @click="saveName">
                  <i class="fas fa-check"></i> Save
                </button>
                <button v-if="editingName" class="action-btn cancel-btn" @click="cancelEdit">
                  <i class="fas fa-times"></i> Cancel
                </button>
                <button class="action-btn primary-btn" @click="viewBoard">
                  <i class="fas fa-th"></i> View Tile Board
                </button>
              </div>
            </div>

            <div class="recent-students" v-if="recentStudents.length > 0">
              <h3>Recently Accessed</h3>
              <ul class="recent-list">
                <li v-for="s in recentStudents" :key="s.id">
                  <div class="recent-student-main" @click="selectRecent(s)">
                    <i class="fas fa-user-graduate"></i>
                    <span v-if="editingRecentId !== s.id">{{ s.name }}</span>
                    <input
                      v-else
                      v-model="editRecentNameInput"
                      type="text"
                      class="edit-recent-name-input"
                      placeholder="Enter student name"
                      @keydown.enter="saveRecentName(s)"
                      @keydown.esc="cancelRecentEdit"
                      @click.stop
                      ref="editRecentNameInput"
                    />
                    <span 
                      class="recent-id clickable-id"
                      @click.stop="copyIdToClipboard(s.id)"
                      :title="copiedId === s.id ? 'Copied!' : 'Click to copy'"
                    >
                      {{ s.id }}
                      <i :class="copiedId === s.id ? 'fas fa-check' : 'fas fa-copy'" class="copy-icon"></i>
                    </span>
                  </div>
                  <button
                    v-if="editingRecentId !== s.id"
                    class="edit-recent-btn"
                    @click.stop="startEditRecentName(s)"
                    title="Edit Name"
                  >
                    <i class="fas fa-pencil-alt"></i>
                  </button>
                  <button
                    v-if="editingRecentId === s.id"
                    class="save-recent-btn"
                    @click.stop="saveRecentName(s)"
                    title="Save"
                  >
                    <i class="fas fa-check"></i>
                  </button>
                  <button
                    v-if="editingRecentId === s.id"
                    class="cancel-recent-btn"
                    @click.stop="cancelRecentEdit"
                    title="Cancel"
                  >
                    <i class="fas fa-times"></i>
                  </button>
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
            editingName: false,
            editNameInput: '',
            editingRecentId: null,
            editRecentNameInput: '',
            copiedId: null,
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
        copyIdToClipboard(studentId) {
            navigator.clipboard.writeText(studentId).then(() => {
                this.copiedId = studentId;
                setTimeout(() => {
                    this.copiedId = null;
                }, 1500);
            }).catch(err => {
                console.error('Failed to copy student ID:', err);
            });
        },
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
        startEditName() {
            this.editingName = true;
            this.editNameInput = this.loadedStudent.name;
            this.$nextTick(() => {
                if (this.$refs.editNameInput) {
                    this.$refs.editNameInput.focus();
                }
            });
        },
        saveName() {
            const newName = this.editNameInput.trim();
            if (newName && this.loadedStudent) {
                this.loadedStudent.name = newName;
                this.updateRecentStudent(this.loadedStudent);
            }
            this.editingName = false;
        },
        cancelEdit() {
            this.editingName = false;
            this.editNameInput = '';
        },
        startEditRecentName(student) {
            this.editingRecentId = student.id;
            this.editRecentNameInput = student.name;
            this.$nextTick(() => {
                if (this.$refs.editRecentNameInput) {
                    const input = Array.isArray(this.$refs.editRecentNameInput)
                        ? this.$refs.editRecentNameInput[0]
                        : this.$refs.editRecentNameInput;
                    if (input) input.focus();
                }
            });
        },
        saveRecentName(student) {
            const newName = this.editRecentNameInput.trim();
            if (newName) {
                student.name = newName;
                this.saveRecentStudents();
                if (this.loadedStudent && this.loadedStudent.id === student.id) {
                    this.loadedStudent.name = newName;
                }
            }
            this.editingRecentId = null;
            this.editRecentNameInput = '';
        },
        cancelRecentEdit() {
            this.editingRecentId = null;
            this.editRecentNameInput = '';
        },
        updateRecentStudent(student) {
            const idx = this.recentStudents.findIndex(s => s.id === student.id);
            if (idx !== -1) {
                this.recentStudents[idx].name = student.name;
                this.saveRecentStudents();
            }
        },
        saveRecentStudents() {
            try {
                localStorage.setItem(RECENT_KEY, JSON.stringify(this.recentStudents));
            } catch (e) {
                // ignore
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

.recent-id {
    margin-left: auto;
    color: #999;
    font-family: monospace;
    font-size: 0.9em;
}

.clickable-id {
    cursor: pointer;
    padding: 0.3em 0.5em;
    border-radius: 4px;
    transition: background-color 0.15s, color 0.15s;
    display: flex;
    align-items: center;
    gap: 0.3em;
}

.clickable-id:hover {
    background: #e8f4fd;
    color: #3498db;
}

.copy-icon {
    font-size: 0.85em;
    opacity: 0.7;
}

.clickable-id:hover .copy-icon {
    opacity: 1;
}

.edit-name-input {
    flex: 1;
    padding: 0.3em 0.5em;
    border: 2px solid #3498db;
    border-radius: 4px;
    font-size: 1em;
    margin-left: 0.3em;
}

.edit-name-input:focus {
    outline: none;
    border-color: #2980b9;
}

.edit-btn {
    background: #f39c12;
    color: white;
}

.edit-btn:hover {
    background: #d68910;
}

.save-btn {
    background: #27ae60;
    color: white;
}

.save-btn:hover {
    background: #219a52;
}

.cancel-btn {
    background: #95a5a6;
    color: white;
}

.cancel-btn:hover {
    background: #7f8c8d;
}

.recent-list li {
    display: flex;
    align-items: center;
    gap: 0.5em;
    padding: 0.4em 0.5em;
    border-radius: 4px;
    color: #444;
    font-size: 0.95em;
}

.recent-student-main {
    display: flex;
    align-items: center;
    gap: 0.5em;
    flex: 1;
    cursor: pointer;
}

.recent-student-main:hover {
    background: #f0f0f0;
    border-radius: 4px;
}

.edit-recent-name-input {
    flex: 1;
    padding: 0.2em 0.4em;
    border: 2px solid #3498db;
    border-radius: 4px;
    font-size: 0.9em;
    max-width: 140px;
}

.edit-recent-name-input:focus {
    outline: none;
    border-color: #2980b9;
}

.edit-recent-btn,
.save-recent-btn,
.cancel-recent-btn {
    padding: 0.3em 0.5em;
    border: none;
    border-radius: 4px;
    cursor: pointer;
    font-size: 0.8em;
    display: flex;
    align-items: center;
}

.edit-recent-btn {
    background: #f39c12;
    color: white;
}

.edit-recent-btn:hover {
    background: #d68910;
}

.save-recent-btn {
    background: #27ae60;
    color: white;
}

.save-recent-btn:hover {
    background: #219a52;
}

.cancel-recent-btn {
    background: #95a5a6;
    color: white;
}

.cancel-recent-btn:hover {
    background: #7f8c8d;
}
</style>
