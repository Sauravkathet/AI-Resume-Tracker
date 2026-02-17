import type { DateValue, JobApplicationStatus } from '../types';

export const formatDate = (value: DateValue): string =>
  new Date(value).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });

export const formatDateTime = (value: DateValue): string =>
  new Date(value).toLocaleString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  });

export const formatFileSize = (bytes: number): string => {
  if (bytes < 1024) {
    return `${bytes} B`;
  }

  if (bytes < 1024 * 1024) {
    return `${(bytes / 1024).toFixed(2)} KB`;
  }

  return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
};

export const getScoreBadgeClass = (score: number): string => {
  if (score >= 80) {
    return 'text-green-700 bg-green-100';
  }

  if (score >= 60) {
    return 'text-amber-700 bg-amber-100';
  }

  return 'text-red-700 bg-red-100';
};

export const getApplicationStatusClass = (status: JobApplicationStatus): string => {
  if (status === 'Applied') {
    return 'bg-blue-100 text-blue-700';
  }

  if (status === 'Interview') {
    return 'bg-amber-100 text-amber-700';
  }

  if (status === 'Offer') {
    return 'bg-green-100 text-green-700';
  }

  if (status === 'Rejected') {
    return 'bg-red-100 text-red-700';
  }

  return 'bg-gray-100 text-gray-700';
};
