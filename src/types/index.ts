export interface User {
  _id: string;
  name: string;
  email: string;
  token?: string;
}

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
  analyzedAt: Date;
}

export interface Resume {
  _id: string;
  user: string;
  filename: string;
  originalName: string;
  filePath: string;
  fileSize: number;
  mimeType: string;
  analysis: ResumeAnalysis;
  uploadedAt: Date;
}

export interface JobApplication {
  _id: string;
  user: string;
  resume: Resume | string;
  company: string;
  position: string;
  jobDescription?: string;
  status: 'Applied' | 'Interview' | 'Offer' | 'Rejected' | 'Withdrawn';
  applicationDate: Date;
  salary?: string;
  location?: string;
  jobUrl?: string;
  notes?: string;
  followUpDate?: Date;
  updatedAt: Date;
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