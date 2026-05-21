export type ClassProfile = {
  id: string;
  schoolId: string;
  name: string;
  grade?: string;
  teacherIds?: string[];
  scheduleSummary?: string;
};

export type StudentProfile = {
  id: string;
  schoolId: string;
  fullName: string;
  photoUrl?: string;
  classIds: string[];
  className?: string;
};

export type ParentStudentRelationship = {
  parentId: string;
  studentIds: string[];
};
