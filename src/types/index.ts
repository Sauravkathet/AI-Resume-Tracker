export interface User {
  _id: string;
  name: string;
  email: string;
  token?: string;
}

export type DateValue = string | Date;

export interface Skill {
  name: string;
  category: string;
  proficiency: string;
}

export interface Experience {
  company: string;
  position: string;
  duration: string;
  description: string;
}

export interface Education {
  institution: string;
  degree: string;
  field: string;
  year: string;
}

export interface ResumeAnalysis {
  skills: Skill[];
  experience: Experience[];
  education: Education[];
  summary: string;
  strengths: string[];
  areasForImprovement: string[];
  overallScore: number;
  analyzedAt: DateValue;
}

export interface Resume {
  _id: string;
  user: string;
  filename: string;
  originalName: string;
  filePath: string;
  fileSize: number;
  mimeType: string;
  analysis?: ResumeAnalysis | null;
  uploadedAt: DateValue;
}

export type JobApplicationStatus = 'Applied' | 'Interview' | 'Offer' | 'Rejected' | 'Withdrawn';

export interface JobApplication {
  _id: string;
  user: string;
  resume: Resume | string;
  company: string;
  position: string;
  jobDescription?: string;
  status: JobApplicationStatus;
  applicationDate: DateValue;
  salary?: string;
  location?: string;
  jobUrl?: string;
  notes?: string;
  followUpDate?: DateValue;
  updatedAt: DateValue;
}

export interface JobApplicationStatusCount {
  _id: JobApplicationStatus;
  count: number;
}

export interface JobApplicationStats {
  total: number;
  byStatus?: JobApplicationStatusCount[];
}

export interface AuthResponse {
  success: boolean;
  data: User;
}

export interface ApiError {
  success: boolean;
  message: string;
  errors?: Array<{ msg: string }>;
}
