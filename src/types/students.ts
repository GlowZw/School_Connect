export type ClassProfile = {
  id: string;
  schoolId: string;
  name: string;
  grade?: string;
  teacherId?: string;
  teacherIds?: string[];
  subject?: string;
  scheduleSummary?: string;
};

export type StudentProfile = {
  id: string;
  schoolId: string;
  fullName: string;
  firstName?: string;
  surname?: string;
  grade?: string;
  dob?: string;
  gender?: 'Male' | 'Female' | 'Other' | 'Prefer not to say';
  allergies?: string;
  medicalNotes?: string;
  emergencyContact?: string;
  relationshipToChild?: string;
  studentNumber?: string;
  additionalNotes?: string;
  parentName?: string;
  parentEmail?: string;
  parentPhone?: string;
  photoUrl?: string;
  classId?: string;
  classIds: string[];
  className?: string;
  parentIds?: string[];
};

export type TeacherOption = {
  uid: string;
  name: string;
  email: string;
};

export type ParentStudentRelationship = {
  parentId: string;
  studentIds: string[];
};

export type StudentInput = {
  fullName: string;
  firstName?: string;
  surname?: string;
  grade: string;
  className: string;
  classId?: string;
  classIds: string[];
  parentIds?: string[];
  dob?: string;
  gender?: 'Male' | 'Female' | 'Other' | 'Prefer not to say';
  allergies?: string;
  medicalNotes?: string;
  emergencyContact?: string;
  relationshipToChild?: string;
  studentNumber?: string;
  additionalNotes?: string;
  parentName?: string;
  parentEmail?: string;
  parentPhone?: string;
};

export type ClassInput = {
  name: string;
  grade: string;
  teacherIds?: string[];
  subject?: string;
  scheduleSummary?: string;
};
