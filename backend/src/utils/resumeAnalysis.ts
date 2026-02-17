import path from 'path';
import type { ResumeAnalysis, Skill } from '../types/models';

const SKILL_POOL: Skill[] = [
  { name: 'TypeScript', category: 'Technical', proficiency: 'Advanced' },
  { name: 'React', category: 'Technical', proficiency: 'Advanced' },
  { name: 'Node.js', category: 'Technical', proficiency: 'Intermediate' },
  { name: 'REST APIs', category: 'Technical', proficiency: 'Intermediate' },
  { name: 'Problem Solving', category: 'Soft', proficiency: 'Advanced' },
  { name: 'Communication', category: 'Soft', proficiency: 'Intermediate' },
  { name: 'Leadership', category: 'Soft', proficiency: 'Intermediate' },
];

const pickSkills = (seed: number): Skill[] => {
  const picked: Skill[] = [];
  const usedIndexes = new Set<number>();

  while (picked.length < 4 && usedIndexes.size < SKILL_POOL.length) {
    const index = (seed + Math.floor(Math.random() * SKILL_POOL.length)) % SKILL_POOL.length;
    if (!usedIndexes.has(index)) {
      usedIndexes.add(index);
      picked.push(SKILL_POOL[index]);
    }
  }

  return picked;
};

const getSeed = (fileName: string): number => {
  return fileName.split('').reduce((sum, character) => sum + character.charCodeAt(0), 0);
};

export const createResumeAnalysis = (fileName: string): ResumeAnalysis => {
  const seed = getSeed(fileName);
  const baseName = path.parse(fileName).name;
  const score = 65 + (seed % 31);

  return {
    skills: pickSkills(seed),
    experience: [
      {
        company: 'Sample Company',
        position: 'Software Engineer',
        duration: '2 years',
        description: 'Built and maintained web applications with a focus on performance and reliability.',
      },
    ],
    education: [
      {
        institution: 'Sample University',
        degree: 'Bachelor of Technology',
        field: 'Computer Science',
        year: '2023',
      },
    ],
    summary: `${baseName} demonstrates relevant technical fundamentals and practical project experience.`,
    strengths: [
      'Clear role progression',
      'Skills align with common product engineering roles',
      'Strong technical stack coverage',
    ],
    areasForImprovement: [
      'Add quantified impact metrics in experience bullets',
      'Include notable projects with measurable outcomes',
      'Refine summary for target job role keywords',
    ],
    overallScore: score,
    analyzedAt: new Date().toISOString(),
  };
};
