<template>
  <div class="modal">
    <div class="modal-mask" style="z-index: 9999">
      <div class="modal-wrapper">
        <div class="modal-container" @keydown.esc="$emit('close')">
          <a
            class="inline close-button"
            href="javascript:void(0);"
            @click="$emit('close')"
            ><i class="fas fa-times"
          /></a>
          <div class="modal-header">
            <h1><i class="fas fa-users" style="margin-right: 0.4em;"></i>Manage Students</h1>
          </div>

          <div class="modal-body mt-5">
            <div style="display: flex; gap: 0.6em; margin-bottom: 1.2em;">
              <input
                v-model="newStudentId"
                type="text"
                placeholder="Enter Student ID (e.g. ST-A1B2C3)"
                style="
                  flex: 1; padding: 0.55em 0.8em;
                  border: 1px solid #dadce0; border-radius: 4px;
                  font-size: 0.95em;
                "
                @keydown.enter="addStudent"
              />
              <button
                @click="addStudent"
                style="
                  background: #4caf50; color: white;
                  border: none; border-radius: 4px;
                  padding: 0.55em 1.1em; font-size: 0.95em;
                  cursor: pointer; white-space: nowrap;
                "
              >
                <i class="fas fa-plus"></i> Add
              </button>
            </div>

            <div v-if="errorMessage" style="color: #c62828; font-size: 0.88em; margin-bottom: 0.8em;">
              {{ errorMessage }}
            </div>

            <div v-if="students.length === 0" style="text-align: center; color: #999; padding: 2em 0;">
              <i class="fas fa-users" style="font-size: 2em; margin-bottom: 0.4em; display: block;"></i>
              No students added yet. Enter a Student ID above to add one.
            </div>

            <ul v-else style="list-style: none; padding: 0; margin: 0;">
              <li
                v-for="(student, idx) in students"
                :key="student.id"
                style="
                  display: flex; align-items: center; justify-content: space-between;
                  padding: 0.7em 0.9em; border: 1px solid #e0e0e0; border-radius: 6px;
                  margin-bottom: 0.5em; background: #fafafa;
                "
              >
                <div style="display: flex; align-items: center; gap: 0.6em;">
                  <i class="fas fa-id-card" style="color: #4caf50;"></i>
                  <div>
                    <div style="font-weight: bold; font-size: 0.95em;">{{ student.id }}</div>
                    <div style="font-size: 0.8em; color: #888;">Student</div>
                  </div>
                </div>
                <div style="display: flex; gap: 0.5em; align-items: center;">
                  <button
                    @click="viewBoard(student)"
                    style="
                      background: #1976d2; color: white;
                      border: none; border-radius: 4px;
                      padding: 0.4em 0.8em; font-size: 0.85em;
                      cursor: pointer;
                    "
                  >
                    <i class="fas fa-th"></i> View Board
                  </button>
                  <button
                    @click="removeStudent(idx)"
                    style="
                      background: #f44336; color: white;
                      border: none; border-radius: 4px;
                      padding: 0.4em 0.7em; font-size: 0.85em;
                      cursor: pointer;
                    "
                    title="Remove student"
                  >
                    <i class="fas fa-trash"></i>
                  </button>
                </div>
              </li>
            </ul>
          </div>

          <div class="modal-footer"></div>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import "./../../css/modal.css";

export default {
  name: "ManageStudentsModal",
  data() {
    return {
      newStudentId: "",
      errorMessage: "",
      students: [],
    };
  },
  methods: {
    addStudent() {
      let id = this.newStudentId.trim().toUpperCase();
      if (!id) {
        this.errorMessage = "Please enter a Student ID.";
        return;
      }
      if (!/^ST-[A-Z0-9]{6}$/.test(id)) {
        this.errorMessage = "Invalid format. Expected format: ST-A1B2C3";
        return;
      }
      if (this.students.find((s) => s.id === id)) {
        this.errorMessage = "This student has already been added.";
        return;
      }
      this.errorMessage = "";
      this.students.push({ id });
      this.newStudentId = "";
    },
    removeStudent(idx) {
      this.students.splice(idx, 1);
    },
    viewBoard(student) {
      alert("Viewing board for student: " + student.id + "\n(Backend integration coming soon)");
    },
  },
};
</script>
