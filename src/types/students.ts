export type ClassProfile = {
  id: string;
  schoolId: string;
  name: string;
  grade?: string;
  teacherIds?: string[];
  subject?: string;
  scheduleSummary?: string;
};

export type StudentProfile = {
  id: string;
  schoolId: string;
  fullName: string;
  grade?: string;
  photoUrl?: string;
  classIds: string[];
  className?: string;
  parentIds?: string[];
};

export type ParentStudentRelationship = {
  parentId: string;
  studentIds: string[];
};

export type StudentInput = {
  fullName: string;
  grade: string;
  className: string;
  classIds: string[];
  parentIds?: string[];
};

export type ClassInput = {
  name: string;
  grade: string;
  teacherIds?: string[];
  subject?: string;
  scheduleSummary?: string;
};
