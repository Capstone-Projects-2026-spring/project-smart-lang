import { modelUtil } from '../util/modelUtil';
import { Model } from '../externals/objectmodel';

class UserProfile extends Model({
    id: String,
    modelName: String,
    modelVersion: String,
    username: String,
    fullName: [String], // Full name for caregivers
    passwordHash: [String], // Hashed password for caregivers
    role: String, // 'caregiver', 'student', 'admin'
    email: [String],
    pin: [String], // Simple PIN for student selection
    studentIds: [Object], // For caregivers: array of student IDs they manage
    caregiverId: [String], // For students: ID of assigned caregiver
    createdAt: [Number],
    lastModified: [Number],
    isActive: [Boolean],
    preferences: [Object] // Custom preferences for user
}) {
    constructor(properties, elementToCopy) {
        properties = modelUtil.setDefaults(properties, elementToCopy, UserProfile) || {};
        properties.id = properties.id || modelUtil.generateId(UserProfile.getIdPrefix());
        properties.modelName = properties.modelName || 'UserProfile';
        properties.modelVersion = properties.modelVersion || '1.0';
        properties.createdAt = properties.createdAt || Date.now();
        properties.lastModified = properties.lastModified || Date.now();
        properties.isActive = properties.isActive !== undefined ? properties.isActive : true;
        properties.studentIds = properties.studentIds || [];
        properties.preferences = properties.preferences || {};
        super(properties);
    }

    static getIdPrefix() {
        return 'userprofile_';
    }

    static getModelName() {
        return 'UserProfile';
    }

    isCaregiver() {
        return this.role === 'caregiver';
    }

    isStudent() {
        return this.role === 'student';
    }

    addStudent(studentId) {
        if (!this.studentIds.includes(studentId)) {
            this.studentIds.push(studentId);
            this.lastModified = Date.now();
        }
    }

    removeStudent(studentId) {
        this.studentIds = this.studentIds.filter(id => id !== studentId);
        this.lastModified = Date.now();
    }
}

export { UserProfile };
