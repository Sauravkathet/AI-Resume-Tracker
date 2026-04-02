import fs from 'fs';
import os from 'os';
import path from 'path';
import bcrypt from 'bcryptjs';
import cors from 'cors';
import express, { type NextFunction, type Request, type Response } from 'express';
import helmet from 'helmet';
import morgan from 'morgan';
import multer from 'multer';
import { z } from 'zod';
import { env } from './config/env';
import { initializePersistence } from './config/persistence';
import { jobApplications, resumes, users } from './data/store';
import { requireAuth } from './middleware/auth';
import { errorHandler, notFoundHandler } from './middleware/errorHandler';
import type {
  JobApplicationRecord,
  JobApplicationStatus,
  ResumeRecord,
  UserRecord,
} from './types/models';
import { createId } from './utils/id';
import { canSendTransactionalEmail, sendVerificationOtpEmail } from './utils/email';
import { generateOtp, getOtpExpiry, isOtpExpired } from './utils/otp';
import { createResumeAnalysis } from './utils/resumeAnalysis';
import { signToken } from './utils/token';
import { toPublicUser } from './utils/userMapper';

const app = express();
const uploadDir = path.join(os.tmpdir(), 'ai-resume-tracker-uploads');

fs.mkdirSync(uploadDir, { recursive: true });

const allowedMimeTypes = new Set([
  'application/pdf',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
]);

const allowedExtensions = new Set(['.pdf', '.doc', '.docx']);

const upload = multer({
  dest: uploadDir,
  limits: {
    fileSize: 5 * 1024 * 1024,
  },
  fileFilter: (_req, file, callback) => {
    const extension = path.extname(file.originalname).toLowerCase();
    const hasValidMimeType = allowedMimeTypes.has(file.mimetype);
    const hasValidExtension = allowedExtensions.has(extension);

    if (hasValidMimeType || hasValidExtension) {
      callback(null, true);
      return;
    }

    callback(new Error('Only PDF, DOC, and DOCX files are supported.'));
  },
});

const registerSchema = z.object({
  name: z.string().trim().min(1, 'Name is required.'),
  email: z.string().trim().email('A valid email is required.'),
  password: z.string().min(6, 'Password must be at least 6 characters long.'),
});

const verifyOtpSchema = z.object({
  email: z.string().trim().email('A valid email is required.'),
  otp: z.string().trim().regex(/^\d{6}$/, 'OTP must be 6 digits.'),
});

const resendOtpSchema = z.object({
  email: z.string().trim().email('A valid email is required.'),
});

const loginSchema = z.object({
  email: z.string().trim().email('A valid email is required.'),
  password: z.string().min(1, 'Password is required.'),
});

const jobApplicationStatusSchema = z.enum([
  'Applied',
  'Interview',
  'Offer',
  'Rejected',
  'Withdrawn',
]);

const jobApplicationSchema = z.object({
  resume: z.string().trim().min(1, 'Resume is required.'),
  company: z.string().trim().min(1, 'Company is required.'),
  position: z.string().trim().min(1, 'Position is required.'),
  jobDescription: z.string().trim().optional().or(z.literal('')),
  status: jobApplicationStatusSchema.default('Applied'),
  salary: z.string().trim().optional().or(z.literal('')),
  location: z.string().trim().optional().or(z.literal('')),
  jobUrl: z
    .string()
    .trim()
    .url('Job URL must be a valid URL.')
    .optional()
    .or(z.literal('')),
  notes: z.string().trim().optional().or(z.literal('')),
  followUpDate: z.string().datetime().optional().or(z.literal('')),
});

const jobApplicationUpdateSchema = jobApplicationSchema.partial();

type SanitizedJobApplicationInput = {
  resume: string;
  company: string;
  position: string;
  jobDescription?: string;
  status: JobApplicationStatus;
  salary?: string;
  location?: string;
  jobUrl?: string;
  notes?: string;
  followUpDate?: string;
};

type JobApplicationResponse = Omit<JobApplicationRecord, 'resume'> & {
  resume: string | ResumeRecord;
};

const createOtpDeliveryMessage = (otpCode: string): string => {
  if (canSendTransactionalEmail()) {
    return 'Verification code sent successfully. Check your inbox.';
  }

  if (env.NODE_ENV === 'production') {
    return 'Verification code sent successfully.';
  }

  return `Verification code sent successfully. Use ${otpCode} while running locally.`;
};

const deliverOtp = async ({
  email,
  name,
  otpCode,
}: {
  email: string;
  name: string;
  otpCode: string;
}): Promise<string> => {
  if (!canSendTransactionalEmail()) {
    return createOtpDeliveryMessage(otpCode);
  }

  try {
    await sendVerificationOtpEmail({
      email,
      name,
      otpCode,
    });

    return createOtpDeliveryMessage(otpCode);
  } catch (error) {
    if (env.NODE_ENV === 'production') {
      throw error;
    }

    const reason = error instanceof Error ? error.message : 'Unknown email delivery error.';
    console.warn(`[Email] Falling back to local OTP delivery for ${email}: ${reason}`);

    return `Email delivery is unavailable locally. Use ${otpCode} to continue.`;
  }
};

const cleanOptionalString = (value?: string): string | undefined => {
  if (!value) {
    return undefined;
  }

  const trimmedValue = value.trim();
  return trimmedValue.length > 0 ? trimmedValue : undefined;
};

const getUserById = (userId: string): UserRecord | undefined => {
  return users.find((user) => user._id === userId);
};

const getAuthenticatedUser = (req: Request): UserRecord => {
  const user = getUserById(req.auth?.userId ?? '');

  if (!user) {
    throw new Error('Authenticated user could not be found.');
  }

  return user;
};

const getResumeForUser = (resumeId: string, userId: string): ResumeRecord | undefined => {
  return resumes.find((resume) => resume._id === resumeId && resume.user === userId);
};

const sortByDateDescending = <T>(items: T[], getDateValue: (item: T) => string): T[] => {
  return [...items].sort(
    (left, right) => new Date(getDateValue(right)).getTime() - new Date(getDateValue(left)).getTime()
  );
};

const normalizeJobApplicationInput = (
  input: z.infer<typeof jobApplicationSchema>
): SanitizedJobApplicationInput => {
  return {
    resume: input.resume,
    company: input.company.trim(),
    position: input.position.trim(),
    jobDescription: cleanOptionalString(input.jobDescription),
    status: input.status,
    salary: cleanOptionalString(input.salary),
    location: cleanOptionalString(input.location),
    jobUrl: cleanOptionalString(input.jobUrl),
    notes: cleanOptionalString(input.notes),
    followUpDate: cleanOptionalString(input.followUpDate),
  };
};

const mapJobApplicationResponse = (
  application: JobApplicationRecord,
  includeResumeObject = false
): JobApplicationResponse => {
  if (!includeResumeObject) {
    return { ...application };
  }

  const relatedResume = resumes.find((resume) => resume._id === application.resume);

  return {
    ...application,
    resume: relatedResume ?? application.resume,
  };
};

const removeFileIfPresent = (filePath: string): void => {
  if (!filePath) {
    return;
  }

  try {
    fs.rmSync(filePath, { force: true });
  } catch {
    // Ignore cleanup failures for temp files.
  }
};

const asyncRoute =
  (handler: (req: Request, res: Response, next: NextFunction) => Promise<void> | void) =>
  (req: Request, res: Response, next: NextFunction): void => {
    Promise.resolve(handler(req, res, next)).catch(next);
  };

app.use(helmet());
app.use(
  cors({
    origin: env.FRONTEND_URL,
  })
);
app.use(express.json({ limit: '2mb' }));
app.use(express.urlencoded({ extended: true }));
app.use(morgan('dev'));

app.get('/api/health', (_req, res) => {
  res.json({
    success: true,
    data: {
      status: 'ok',
      uptime: process.uptime(),
      timestamp: new Date().toISOString(),
    },
  });
});

app.post(
  '/api/auth/register',
  asyncRoute(async (req, res) => {
    const { name, email, password } = registerSchema.parse(req.body);
    const normalizedEmail = email.toLowerCase();
    const existingUser = users.find((user) => user.email === normalizedEmail);
    const passwordHash = await bcrypt.hash(password, 10);
    const otpCode = generateOtp();
    const otpExpiresAt = getOtpExpiry();
    const timestamp = new Date().toISOString();

    if (existingUser && existingUser.isVerified) {
      res.status(409).json({ success: false, message: 'An account already exists for this email.' });
      return;
    }

    if (existingUser) {
      existingUser.name = name;
      existingUser.passwordHash = passwordHash;
      existingUser.otpCode = otpCode;
      existingUser.otpExpiresAt = otpExpiresAt;
      existingUser.updatedAt = timestamp;
      const deliveryMessage = await deliverOtp({
        email: normalizedEmail,
        name,
        otpCode,
      });

      res.json({
        success: true,
        message: deliveryMessage,
      });
      return;
    }

    users.push({
      _id: createId(),
      name,
      email: normalizedEmail,
      passwordHash,
      isVerified: false,
      otpCode,
      otpExpiresAt,
      createdAt: timestamp,
      updatedAt: timestamp,
    });
    const deliveryMessage = await deliverOtp({
      email: normalizedEmail,
      name,
      otpCode,
    });

    res.status(201).json({
      success: true,
      message: deliveryMessage,
    });
  })
);

app.post(
  '/api/auth/verify-otp',
  asyncRoute(async (req, res) => {
    const { email, otp } = verifyOtpSchema.parse(req.body);
    const normalizedEmail = email.toLowerCase();
    const user = users.find((candidate) => candidate.email === normalizedEmail);

    if (!user) {
      res.status(404).json({ success: false, message: 'No pending registration found for this email.' });
      return;
    }

    if (user.isVerified) {
      const token = signToken(user._id);
      res.json({ success: true, data: toPublicUser(user, token) });
      return;
    }

    if (!user.otpCode || user.otpCode !== otp) {
      res.status(400).json({ success: false, message: 'Invalid verification code.' });
      return;
    }

    if (isOtpExpired(user.otpExpiresAt)) {
      const nextOtp = generateOtp();
      user.otpCode = nextOtp;
      user.otpExpiresAt = getOtpExpiry();
      user.updatedAt = new Date().toISOString();

      res.status(400).json({
        success: false,
        message:
          env.NODE_ENV === 'production'
            ? 'Verification code expired. Please request a new code.'
            : `Verification code expired. Request a new code. New local code: ${nextOtp}`,
      });
      return;
    }

    user.isVerified = true;
    user.otpCode = null;
    user.otpExpiresAt = null;
    user.updatedAt = new Date().toISOString();

    const token = signToken(user._id);
    res.json({ success: true, data: toPublicUser(user, token) });
  })
);

app.post(
  '/api/auth/resend-otp',
  asyncRoute(async (req, res) => {
    const { email } = resendOtpSchema.parse(req.body);
    const normalizedEmail = email.toLowerCase();
    const user = users.find((candidate) => candidate.email === normalizedEmail);

    if (!user) {
      res.status(404).json({ success: false, message: 'No account found for this email.' });
      return;
    }

    if (user.isVerified) {
      res.status(400).json({ success: false, message: 'This account is already verified.' });
      return;
    }

    user.otpCode = generateOtp();
    user.otpExpiresAt = getOtpExpiry();
    user.updatedAt = new Date().toISOString();
    const deliveryMessage = await deliverOtp({
      email: normalizedEmail,
      name: user.name,
      otpCode: user.otpCode,
    });

    res.json({
      success: true,
      message: deliveryMessage,
    });
  })
);

app.post(
  '/api/auth/login',
  asyncRoute(async (req, res) => {
    const { email, password } = loginSchema.parse(req.body);
    const normalizedEmail = email.toLowerCase();
    const user = users.find((candidate) => candidate.email === normalizedEmail);

    if (!user) {
      res.status(401).json({ success: false, message: 'Invalid email or password.' });
      return;
    }

    if (!user.isVerified) {
      const otpMessage =
        env.NODE_ENV === 'production' || !user.otpCode
          ? 'Please verify your email before signing in.'
          : `Please verify your email before signing in. Local code: ${user.otpCode}`;

      res.status(403).json({ success: false, message: otpMessage });
      return;
    }

    const passwordMatches = await bcrypt.compare(password, user.passwordHash);

    if (!passwordMatches) {
      res.status(401).json({ success: false, message: 'Invalid email or password.' });
      return;
    }

    const token = signToken(user._id);
    res.json({
      success: true,
      data: toPublicUser(user, token),
    });
  })
);

app.get(
  '/api/auth/me',
  requireAuth,
  asyncRoute(async (req, res) => {
    const user = getAuthenticatedUser(req);
    res.json({ success: true, data: toPublicUser(user) });
  })
);

app.delete(
  '/api/auth/account',
  requireAuth,
  asyncRoute(async (req, res) => {
    const user = getAuthenticatedUser(req);
    const userResumeIds = new Set(
      resumes.filter((resume) => resume.user === user._id).map((resume) => resume._id)
    );

    for (let index = resumes.length - 1; index >= 0; index -= 1) {
      if (resumes[index].user === user._id) {
        removeFileIfPresent(resumes[index].filePath);
        resumes.splice(index, 1);
      }
    }

    for (let index = jobApplications.length - 1; index >= 0; index -= 1) {
      const application = jobApplications[index];
      if (application.user === user._id || userResumeIds.has(application.resume)) {
        jobApplications.splice(index, 1);
      }
    }

    const userIndex = users.findIndex((candidate) => candidate._id === user._id);
    if (userIndex >= 0) {
      users.splice(userIndex, 1);
    }

    res.json({ success: true, message: 'Account deleted successfully.' });
  })
);

app.post(
  '/api/resumes/upload',
  requireAuth,
  upload.single('resume'),
  asyncRoute(async (req, res) => {
    const user = getAuthenticatedUser(req);
    const file = req.file;

    if (!file) {
      res.status(400).json({ success: false, message: 'Resume file is required.' });
      return;
    }

    const resume: ResumeRecord = {
      _id: createId(),
      user: user._id,
      filename: file.filename,
      originalName: file.originalname,
      filePath: file.path,
      fileSize: file.size,
      mimeType: file.mimetype,
      analysis: createResumeAnalysis(file.originalname),
      uploadedAt: new Date().toISOString(),
    };

    resumes.unshift(resume);

    res.status(201).json({
      success: true,
      message: 'Resume uploaded and analyzed successfully.',
      data: resume,
    });
  })
);

app.get(
  '/api/resumes',
  requireAuth,
  asyncRoute(async (req, res) => {
    const user = getAuthenticatedUser(req);
    const userResumes = sortByDateDescending(
      resumes.filter((resume) => resume.user === user._id),
      (resume) => resume.uploadedAt
    );

    res.json({ success: true, data: userResumes });
  })
);

app.get(
  '/api/resumes/:id',
  requireAuth,
  asyncRoute(async (req, res) => {
    const user = getAuthenticatedUser(req);
    const resume = getResumeForUser(req.params.id, user._id);

    if (!resume) {
      res.status(404).json({ success: false, message: 'Resume not found.' });
      return;
    }

    res.json({ success: true, data: resume });
  })
);

app.delete(
  '/api/resumes/:id',
  requireAuth,
  asyncRoute(async (req, res) => {
    const user = getAuthenticatedUser(req);
    const resumeIndex = resumes.findIndex(
      (resume) => resume._id === req.params.id && resume.user === user._id
    );

    if (resumeIndex === -1) {
      res.status(404).json({ success: false, message: 'Resume not found.' });
      return;
    }

    const [removedResume] = resumes.splice(resumeIndex, 1);
    removeFileIfPresent(removedResume.filePath);

    for (let index = jobApplications.length - 1; index >= 0; index -= 1) {
      if (jobApplications[index].resume === removedResume._id) {
        jobApplications.splice(index, 1);
      }
    }

    res.json({ success: true, message: 'Resume deleted successfully.' });
  })
);

app.post(
  '/api/resumes/:id/reanalyze',
  requireAuth,
  asyncRoute(async (req, res) => {
    const user = getAuthenticatedUser(req);
    const resume = getResumeForUser(req.params.id, user._id);

    if (!resume) {
      res.status(404).json({ success: false, message: 'Resume not found.' });
      return;
    }

    resume.analysis = createResumeAnalysis(resume.originalName);

    res.json({
      success: true,
      message: 'Resume reanalyzed successfully.',
      data: resume,
    });
  })
);

app.get(
  '/api/job-applications/stats/overview',
  requireAuth,
  asyncRoute(async (req, res) => {
    const user = getAuthenticatedUser(req);
    const userApplications = jobApplications.filter((application) => application.user === user._id);
    const byStatus = Array.from(
      userApplications.reduce((counts, application) => {
        counts.set(application.status, (counts.get(application.status) ?? 0) + 1);
        return counts;
      }, new Map<JobApplicationStatus, number>())
    ).map(([status, count]) => ({
      _id: status,
      count,
    }));

    res.json({
      success: true,
      data: {
        total: userApplications.length,
        byStatus,
      },
    });
  })
);

app.post(
  '/api/job-applications',
  requireAuth,
  asyncRoute(async (req, res) => {
    const user = getAuthenticatedUser(req);
    const input = normalizeJobApplicationInput(jobApplicationSchema.parse(req.body));
    const resume = getResumeForUser(input.resume, user._id);

    if (!resume) {
      res.status(400).json({ success: false, message: 'Selected resume could not be found.' });
      return;
    }

    const timestamp = new Date().toISOString();
    const application: JobApplicationRecord = {
      _id: createId(),
      user: user._id,
      resume: resume._id,
      company: input.company,
      position: input.position,
      jobDescription: input.jobDescription,
      status: input.status,
      applicationDate: timestamp,
      salary: input.salary,
      location: input.location,
      jobUrl: input.jobUrl,
      notes: input.notes,
      followUpDate: input.followUpDate,
      updatedAt: timestamp,
    };

    jobApplications.unshift(application);

    res.status(201).json({
      success: true,
      message: 'Job application created successfully.',
      data: mapJobApplicationResponse(application, true),
    });
  })
);

app.get(
  '/api/job-applications',
  requireAuth,
  asyncRoute(async (req, res) => {
    const user = getAuthenticatedUser(req);
    const statusParam = typeof req.query.status === 'string' ? req.query.status : undefined;
    const sortByParam = typeof req.query.sortBy === 'string' ? req.query.sortBy : 'applicationDate';
    const orderParam = typeof req.query.order === 'string' ? req.query.order : 'desc';

    let userApplications = jobApplications.filter((application) => application.user === user._id);

    if (statusParam) {
      userApplications = userApplications.filter((application) => application.status === statusParam);
    }

    const sortableField =
      sortByParam === 'updatedAt' || sortByParam === 'company' || sortByParam === 'position'
        ? sortByParam
        : 'applicationDate';

    const sortedApplications = [...userApplications].sort((left, right) => {
      const leftValue = left[sortableField];
      const rightValue = right[sortableField];

      if (sortableField === 'company' || sortableField === 'position') {
        const comparison = String(leftValue ?? '').localeCompare(String(rightValue ?? ''));
        return orderParam === 'asc' ? comparison : comparison * -1;
      }

      const comparison =
        new Date(String(leftValue ?? '')).getTime() - new Date(String(rightValue ?? '')).getTime();

      return orderParam === 'asc' ? comparison : comparison * -1;
    });

    res.json({
      success: true,
      data: sortedApplications.map((application) => mapJobApplicationResponse(application, true)),
    });
  })
);

app.get(
  '/api/job-applications/:id',
  requireAuth,
  asyncRoute(async (req, res) => {
    const user = getAuthenticatedUser(req);
    const application = jobApplications.find(
      (candidate) => candidate._id === req.params.id && candidate.user === user._id
    );

    if (!application) {
      res.status(404).json({ success: false, message: 'Job application not found.' });
      return;
    }

    res.json({ success: true, data: mapJobApplicationResponse(application, true) });
  })
);

app.put(
  '/api/job-applications/:id',
  requireAuth,
  asyncRoute(async (req, res) => {
    const user = getAuthenticatedUser(req);
    const application = jobApplications.find(
      (candidate) => candidate._id === req.params.id && candidate.user === user._id
    );

    if (!application) {
      res.status(404).json({ success: false, message: 'Job application not found.' });
      return;
    }

    const parsedInput = jobApplicationUpdateSchema.parse(req.body);

    if (parsedInput.resume) {
      const resume = getResumeForUser(parsedInput.resume, user._id);
      if (!resume) {
        res.status(400).json({ success: false, message: 'Selected resume could not be found.' });
        return;
      }
      application.resume = parsedInput.resume;
    }

    if (parsedInput.company !== undefined) {
      application.company = parsedInput.company.trim();
    }

    if (parsedInput.position !== undefined) {
      application.position = parsedInput.position.trim();
    }

    if (parsedInput.jobDescription !== undefined) {
      application.jobDescription = cleanOptionalString(parsedInput.jobDescription);
    }

    if (parsedInput.status !== undefined) {
      application.status = parsedInput.status;
    }

    if (parsedInput.salary !== undefined) {
      application.salary = cleanOptionalString(parsedInput.salary);
    }

    if (parsedInput.location !== undefined) {
      application.location = cleanOptionalString(parsedInput.location);
    }

    if (parsedInput.jobUrl !== undefined) {
      application.jobUrl = cleanOptionalString(parsedInput.jobUrl);
    }

    if (parsedInput.notes !== undefined) {
      application.notes = cleanOptionalString(parsedInput.notes);
    }

    if (parsedInput.followUpDate !== undefined) {
      application.followUpDate = cleanOptionalString(parsedInput.followUpDate);
    }

    application.updatedAt = new Date().toISOString();

    res.json({
      success: true,
      message: 'Job application updated successfully.',
      data: mapJobApplicationResponse(application, true),
    });
  })
);

app.delete(
  '/api/job-applications/:id',
  requireAuth,
  asyncRoute(async (req, res) => {
    const user = getAuthenticatedUser(req);
    const applicationIndex = jobApplications.findIndex(
      (candidate) => candidate._id === req.params.id && candidate.user === user._id
    );

    if (applicationIndex === -1) {
      res.status(404).json({ success: false, message: 'Job application not found.' });
      return;
    }

    jobApplications.splice(applicationIndex, 1);

    res.json({ success: true, message: 'Job application deleted successfully.' });
  })
);

app.use(notFoundHandler);
app.use(errorHandler);

initializePersistence();

app.listen(env.PORT, () => {
  console.info(`[Server] API listening on http://localhost:${env.PORT}`);
});
