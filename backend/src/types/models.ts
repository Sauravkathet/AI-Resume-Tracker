export type JobApplicationStatus = 'Applied' | 'Interview' | 'Offer' | 'Rejected' | 'Withdrawn';

export interface UserRecord {
  _id: string;
  name: string;
  email: string;
  passwordHash: string;
  isVerified: boolean;
  otpCode: string | null;
  otpExpiresAt: string | null;
  createdAt: string;
  updatedAt: string;
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
  analyzedAt: string;
}

export interface ResumeRecord {
  _id: string;
  user: string;
  filename: string;
  originalName: string;
  filePath: string;
  fileSize: number;
  mimeType: string;
  analysis: ResumeAnalysis;
  uploadedAt: string;
}

export interface JobApplicationRecord {
  _id: string;
  user: string;
  resume: string;
  company: string;
  position: string;
  jobDescription?: string;
  status: JobApplicationStatus;
  applicationDate: string;
  salary?: string;
  location?: string;
  jobUrl?: string;
  notes?: string;
  followUpDate?: string;
  updatedAt: string;
}

export interface PublicUser {
  _id: string;
  name: string;
  email: string;
  token?: string;
}
