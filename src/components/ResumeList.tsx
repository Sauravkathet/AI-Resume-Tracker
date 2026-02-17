import React from 'react';
import type { Resume } from '../types';
import { formatDate, formatFileSize } from '../utils/formatters';

interface ResumeListProps {
  resumes: Resume[];
  onDelete: (id: string) => void;
  onSelect: (resume: Resume) => void;
}

const ResumeList: React.FC<ResumeListProps> = ({ resumes, onDelete, onSelect }) => {
  const getScoreColor = (score: number) => {
    if (score >= 80) return 'text-green-600 bg-green-100';
    if (score >= 60) return 'text-yellow-600 bg-yellow-100';
    return 'text-red-600 bg-red-100';
  };

  if (resumes.length === 0) {
    return (
      <div className="text-center py-12">
        <svg
          className="mx-auto h-12 w-12 text-gray-400"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
          />
        </svg>
        <h3 className="mt-2 text-sm font-medium text-gray-900">No resumes</h3>
        <p className="mt-1 text-sm text-gray-500">Get started by uploading your first resume.</p>
      </div>
    );
  }

  return (
    <div>
      <h2 className="text-2xl font-bold text-gray-900 mb-6">My Resumes</h2>
      <div className="space-y-4">
        {resumes.map((resume) => (
          <div
            key={resume._id}
            className="border border-gray-200 rounded-lg p-6 hover:shadow-md transition-shadow"
          >
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <div className="flex items-center space-x-3">
                  <svg
                    className="h-10 w-10 text-indigo-600"
                    fill="currentColor"
                    viewBox="0 0 20 20"
                  >
                    <path
                      fillRule="evenodd"
                      d="M4 4a2 2 0 012-2h4.586A2 2 0 0112 2.586L15.414 6A2 2 0 0116 7.414V16a2 2 0 01-2 2H6a2 2 0 01-2-2V4z"
                      clipRule="evenodd"
                    />
                  </svg>
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900">
                      {resume.originalName}
                    </h3>
                    <p className="text-sm text-gray-500">
                      {formatFileSize(resume.fileSize)} • Uploaded {formatDate(resume.uploadedAt)}
                    </p>
                  </div>
                </div>

                {resume.analysis && (
                  <div className="mt-4 grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div>
                      <p className="text-xs text-gray-500 uppercase tracking-wide">Overall Score</p>
                      <p className={`mt-1 text-2xl font-bold ${getScoreColor(resume.analysis.overallScore)}`}>
                        {resume.analysis.overallScore}/100
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500 uppercase tracking-wide">Skills</p>
                      <p className="mt-1 text-2xl font-bold text-gray-900">
                        {resume.analysis.skills?.length || 0}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500 uppercase tracking-wide">Experience</p>
                      <p className="mt-1 text-2xl font-bold text-gray-900">
                        {resume.analysis.experience?.length || 0}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500 uppercase tracking-wide">Education</p>
                      <p className="mt-1 text-2xl font-bold text-gray-900">
                        {resume.analysis.education?.length || 0}
                      </p>
                    </div>
                  </div>
                )}
              </div>

              <div className="flex flex-col space-y-2 ml-4">
                <button
                  onClick={() => onSelect(resume)}
                  className="px-4 py-2 text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 rounded-md"
                >
                  View Analysis 
                </button>
                <button
                  onClick={() => {
                    if (window.confirm('Are you sure that you want to delete this resume?')) {
                      onDelete(resume._id);
                    }
                  }}
                  className="px-4 py-2 text-sm font-medium text-red-600 hover:text-red-800 border border-red-300 hover:border-red-400 rounded-md"
                >
                  Delete
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default ResumeList;
