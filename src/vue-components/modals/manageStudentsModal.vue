<template>
  <div class="modal">
    <div class="modal-mask" style="z-index: 9999">
      <div class="modal-wrapper">
        <div class="modal-container" @keydown.esc="$emit('close')">
          <a
            class="inline close-button"
            href="javascript:void(0);"
            @click="$emit('close')"
          >
            <i class="fas fa-times" />
          </a>

          <div class="modal-header">
            <h1>
              <i class="fas fa-users" style="margin-right: 0.5em"></i>Manage
              Students
            </h1>
          </div>

          <div class="modal-body">
            <!-- Add Student -->
            <div class="add-student-row">
              <input
                v-model="newStudentId"
                type="text"
                class="student-id-input"
                placeholder="Student ID (e.g. SL-A3F2)"
                @keydown.enter="addStudent"
                maxlength="7"
              />
              <button
                class="btn-primary-sm"
                @click="addStudent"
                :disabled="!newStudentId.trim() || addingStudent"
              >
                <i
                  class="fas"
                  :class="addingStudent ? 'fa-spinner fa-spin' : 'fa-plus'"
                ></i>
                Add
              </button>
            </div>
            <p
              v-if="addMessage"
              :class="['ms-status', addSuccess ? 'ms-success' : 'ms-error']"
            >
              {{ addMessage }}
            </p>

            <!-- Loading -->
            <div v-if="loadingStudents" class="ms-loading">
              <i class="fas fa-spinner fa-spin"></i> Loading students...
            </div>

            <!-- Empty -->
            <div v-else-if="students.length === 0" class="ms-empty">
              <i class="fas fa-user-plus"></i>
              <p>No students linked yet.</p>
              <p class="ms-hint">
                Have your student sign in, then enter their Student ID above.
              </p>
            </div>

            <!-- Student List -->
            <div v-else class="ms-student-list">
              <div
                v-for="student in students"
                :key="student.id"
                class="ms-student-card"
              >
                <div class="ms-student-info">
                  <span class="ms-id-badge">{{ student.id }}</span>
                  <div class="ms-student-details">
                    <span class="ms-student-name">{{
                      student.name || "Unnamed Student"
                    }}</span>
                    <span class="ms-student-email" v-if="student.email">{{
                      student.email
                    }}</span>
                    <span class="ms-board-label" v-if="student.activeBoardSet">
                      <i class="fas fa-th-large"></i>
                      {{ student.activeBoardSet }}
                    </span>
                  </div>
                </div>
                <div class="ms-student-actions">
                  <button
                    class="btn-action btn-push"
                    :disabled="pushingStudentId === student.id"
                    @click="pushBoard(student)"
                    title="Push current board to student"
                  >
                    <i
                      class="fas"
                      :class="
                        pushingStudentId === student.id
                          ? 'fa-spinner fa-spin'
                          : 'fa-upload'
                      "
                    ></i>
                    Push Board
                  </button>
                  <button
                    class="btn-action btn-unlink"
                    @click="confirmUnlink(student)"
                    title="Unlink student"
                  >
                    <i class="fas fa-unlink"></i>
                  </button>
                </div>
              </div>
            </div>

            <!-- Push result message -->
            <p
              v-if="pushMessage"
              :class="['ms-status', pushSuccess ? 'ms-success' : 'ms-error']"
              style="margin-top: 0.6em"
            >
              {{ pushMessage }}
            </p>

            <!-- Confirm unlink -->
            <div v-if="unlinkTarget" class="ms-confirm-overlay">
              <div class="ms-confirm-box">
                <p>
                  Unlink <strong>{{ unlinkTarget.id }}</strong
                  >? Their local board data won't be affected.
                </p>
                <div class="ms-confirm-actions">
                  <button
                    class="btn-secondary-sm"
                    @click="unlinkTarget = null"
                    :disabled="unlinking"
                  >
                    Cancel
                  </button>
                  <button
                    class="btn-danger-sm"
                    @click="doUnlink"
                    :disabled="unlinking"
                  >
                    <i
                      class="fas"
                      :class="unlinking ? 'fa-spinner fa-spin' : 'fa-unlink'"
                    ></i>
                    {{ unlinking ? "Removing..." : "Unlink" }}
                  </button>
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
import "../../css/modal.css";
import { authService } from "../../js/service/authService.js";
import { firestoreSyncService } from "../../js/service/firestoreSyncService.js";

export default {
  name: "ManageStudentsModal",
  data() {
    return {
      students: [],
      loadingStudents: true,

      newStudentId: "",
      addingStudent: false,
      addMessage: "",
      addSuccess: false,

      pushingStudentId: null,
      pushMessage: "",
      pushSuccess: false,

      unlinkTarget: null,
      unlinking: false,
    };
  },
  async mounted() {
    await this.loadStudents();
  },
  methods: {
    async loadStudents() {
      this.loadingStudents = true;
      try {
        let ids = await firestoreSyncService.getStudents();
        let details = await Promise.all(
          ids.map((id) =>
            firestoreSyncService
              .getStudentInfo(id)
              .then((info) => info || { id, name: "", email: "" }),
          ),
        );
        this.students = details;
      } catch (e) {
        console.error("Failed to load students:", e);
        this.students = [];
      }
      this.loadingStudents = false;
    },

    async addStudent() {
      const id = this.newStudentId.trim().toUpperCase();
      if (!id) return;
      this.addingStudent = true;
      this.addMessage = "";
      try {
        let result = await firestoreSyncService.addStudent(id);
        this.addMessage = result.message;
        this.addSuccess = result.success;
        if (result.success) {
          this.newStudentId = "";
          await this.loadStudents();
        }
      } catch (e) {
        this.addMessage = "Failed to add student. Please try again.";
        this.addSuccess = false;
        console.error("Add student error:", e);
      }
      this.addingStudent = false;
      setTimeout(() => {
        this.addMessage = "";
      }, 5000);
    },

    async pushBoard(student) {
      this.pushingStudentId = student.id;
      this.pushMessage = "";
      try {
        // Build visibility config keyed by grid LABEL (not ID) because
        // caregiver and student import the gridset independently and get
        // different generated IDs.  Elements are identified by their label
        // text combined with their (x,y) grid position so a match is
        // unambiguous even if two tiles share the same text.
        let grids = await dataService.getGrids(true);
        let visibilityConfig = {};
        for (let grid of grids) {
          let gridLabel = this.getGridLabel(grid);
          if (!gridLabel) continue;
          let hiddenElements = (grid.gridElements || [])
            .filter(e => e.hidden)
            .map(e => ({
              label: this.getElementLabel(e),
              x: e.x,
              y: e.y,
            }));
          if (hiddenElements.length > 0) {
            visibilityConfig[gridLabel] = hiddenElements;
          }
        }
        let result = await firestoreSyncService.pushVisibilityToStudent(student.id, visibilityConfig);
        this.pushMessage = result.message;
        this.pushSuccess = result.success;
        if (result.success) {
          await this.loadStudents();
          setTimeout(() => {
            this.pushMessage = "";
          }, 4000);
        }
      } catch (e) {
        this.pushMessage = "Failed to push board. Please try again.";
        this.pushSuccess = false;
        console.error("Push board error:", e);
      }
      this.pushingStudentId = null;
    },

    getGridLabel(grid) {
      if (!grid || !grid.label) return "";
      // grid.label is an i18n object like { en: "Core Words" }
      // Extract the first available translation
      let keys = Object.keys(grid.label);
      for (let k of keys) {
        if (grid.label[k]) return grid.label[k];
      }
      return "";
    },

    getElementLabel(elem) {
      if (!elem || !elem.label) return "";
      let keys = Object.keys(elem.label);
      for (let k of keys) {
        if (elem.label[k]) return elem.label[k];
      }
      return "";
    },

    confirmUnlink(student) {
      this.unlinkTarget = student;
    },

    async doUnlink() {
      if (!this.unlinkTarget) return;
      this.unlinking = true;
      try {
        await firestoreSyncService.removeStudent(this.unlinkTarget.id);
        await this.loadStudents();
      } catch (e) {
        console.error("Unlink error:", e);
      }
      this.unlinking = false;
      this.unlinkTarget = null;
    },
  },
};
</script>

<style scoped>
.add-student-row {
  display: flex;
  gap: 0.5em;
  margin-bottom: 0.6em;
}

.student-id-input {
  flex: 1;
  padding: 0.5em 0.75em;
  border: 2px solid #ddd;
  border-radius: 6px;
  font-size: 1em;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  outline: none;
  transition: border-color 0.2s;
}
.student-id-input:focus {
  border-color: #3498db;
}

.btn-primary-sm {
  padding: 0.5em 1em;
  background: #3498db;
  color: #fff;
  border: none;
  border-radius: 6px;
  cursor: pointer;
  font-size: 0.95em;
  display: flex;
  align-items: center;
  gap: 0.35em;
  white-space: nowrap;
  transition: background 0.2s;
}
.btn-primary-sm:hover:not(:disabled) {
  background: #2980b9;
}
.btn-primary-sm:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.ms-status {
  font-size: 0.85em;
  padding: 0.4em 0.6em;
  border-radius: 5px;
  margin-top: 0.4em;
}
.ms-success {
  background: #eafaf1;
  color: #219a52;
  border: 1px solid #27ae60;
}
.ms-error {
  background: #fdf2f2;
  color: #c0392b;
  border: 1px solid #e74c3c;
}

.ms-loading,
.ms-empty {
  text-align: center;
  padding: 2em 1em;
  color: #999;
  font-size: 0.95em;
}
.ms-empty i {
  font-size: 2em;
  display: block;
  margin-bottom: 0.4em;
  opacity: 0.4;
}
.ms-hint {
  font-size: 0.85em;
  color: #bbb;
  margin: 0;
}

.ms-student-list {
  display: flex;
  flex-direction: column;
  gap: 0.5em;
  margin-top: 0.8em;
}

.ms-student-card {
  display: flex;
  align-items: center;
  justify-content: space-between;
  background: #f9fafb;
  border: 1px solid #e5e7eb;
  border-radius: 8px;
  padding: 0.65em 0.9em;
  gap: 0.75em;
}

.ms-student-info {
  display: flex;
  align-items: center;
  gap: 0.75em;
  min-width: 0;
}

.ms-id-badge {
  background: #3498db;
  color: #fff;
  padding: 0.25em 0.55em;
  border-radius: 5px;
  font-size: 0.78em;
  font-weight: 700;
  font-family: monospace;
  letter-spacing: 0.04em;
  white-space: nowrap;
  flex-shrink: 0;
}

.ms-student-details {
  display: flex;
  flex-direction: column;
  gap: 0.1em;
  min-width: 0;
}
.ms-student-name {
  font-weight: 600;
  font-size: 0.92em;
  color: #222;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}
.ms-student-email {
  font-size: 0.78em;
  color: #999;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}
.ms-board-label {
  font-size: 0.75em;
  color: #6366f1;
  display: flex;
  align-items: center;
  gap: 0.25em;
}

.ms-student-actions {
  display: flex;
  align-items: center;
  gap: 0.4em;
  flex-shrink: 0;
}

.btn-action {
  border: none;
  border-radius: 5px;
  cursor: pointer;
  font-size: 0.8em;
  padding: 0.4em 0.7em;
  display: flex;
  align-items: center;
  gap: 0.3em;
  transition: all 0.15s;
  white-space: nowrap;
}
.btn-push {
  background: rgba(39, 174, 96, 0.12);
  color: #219a52;
  border: 1px solid rgba(39, 174, 96, 0.25);
}
.btn-push:hover:not(:disabled) {
  background: rgba(39, 174, 96, 0.22);
}
.btn-push:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}
.btn-unlink {
  background: rgba(231, 76, 60, 0.09);
  color: #c0392b;
  border: 1px solid rgba(231, 76, 60, 0.2);
}
.btn-unlink:hover {
  background: rgba(231, 76, 60, 0.18);
}

/* Inline confirm */
.ms-confirm-overlay {
  margin-top: 0.75em;
  background: #fff8f8;
  border: 1px solid #f5c6cb;
  border-radius: 8px;
  padding: 0.9em 1em;
}
.ms-confirm-box p {
  margin: 0 0 0.75em;
  font-size: 0.9em;
  color: #444;
}
.ms-confirm-actions {
  display: flex;
  gap: 0.5em;
}

.btn-secondary-sm {
  padding: 0.4em 0.9em;
  background: #eee;
  color: #555;
  border: 1px solid #ccc;
  border-radius: 5px;
  cursor: pointer;
  font-size: 0.88em;
  transition: background 0.15s;
}
.btn-secondary-sm:hover:not(:disabled) {
  background: #e0e0e0;
}
.btn-secondary-sm:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.btn-danger-sm {
  padding: 0.4em 0.9em;
  background: #e74c3c;
  color: #fff;
  border: none;
  border-radius: 5px;
  cursor: pointer;
  font-size: 0.88em;
  display: flex;
  align-items: center;
  gap: 0.35em;
  transition: background 0.15s;
}
.btn-danger-sm:hover:not(:disabled) {
  background: #c0392b;
}
.btn-danger-sm:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}
</style>
