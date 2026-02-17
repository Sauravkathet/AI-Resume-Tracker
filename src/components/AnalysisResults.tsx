import React from 'react';
import type { Resume } from '../types';
import { formatDateTime } from '../utils/formatters';

interface AnalysisResultsProps {
  resume: Resume;
}

const AnalysisResults: React.FC<AnalysisResultsProps> = ({ resume }) => {
  const { analysis } = resume;

  if (!analysis) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-500">No analysis available for this resume.</p>
      </div>
    );
  }

  const getScoreColor = (score: number) => {
    if (score >= 80) return 'from-green-500 to-green-600';
    if (score >= 60) return 'from-yellow-500 to-yellow-600';
    return 'from-red-500 to-red-600';
  };

  const getCategoryColor = (category: string) => {
    const colors: { [key: string]: string } = {
      Technical: 'bg-blue-100 text-blue-800',
      Soft: 'bg-green-100 text-green-800',
      Language: 'bg-purple-100 text-purple-800'
    };
    return colors[category] || 'bg-gray-100 text-gray-800';
  };

  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Resume Analysis</h2>
        <p className="text-gray-600">{resume.originalName}</p>
      </div>

      {/* Overall Score */}
      <div className={`bg-gradient-to-br ${getScoreColor(analysis.overallScore)} rounded-lg p-8 text-white`}>
        <h3 className="text-lg font-semibold mb-2">Overall Score</h3>
        <div className="flex items-baseline">
          <span className="text-6xl font-bold">{analysis.overallScore}</span>
          <span className="text-2xl ml-2">/100</span>
        </div>
        <p className="mt-4 text-white/90">
          {analysis.overallScore >= 80
            ? 'Excellent resume! Your resume is well-structured and comprehensive.'
            : analysis.overallScore >= 60
            ? 'Good resume with room for improvement. Check the suggestions below.'
            : 'Your resume needs significant improvements. Focus on the areas highlighted.'}
        </p>
      </div>

      {/* Summary */}
      {analysis.summary && (
        <div className="bg-white border border-gray-200 rounded-lg p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Professional Summary</h3>
          <p className="text-gray-700">{analysis.summary}</p>
        </div>
      )}

      {/* Skills */}
      <div className="bg-white border border-gray-200 rounded-lg p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">
          Skills ({analysis.skills?.length || 0})
        </h3>
        <div className="flex flex-wrap gap-2">
          {analysis.skills?.map((skill, index) => (
            <span
              key={index}
              className={`px-3 py-1 rounded-full text-sm font-medium ${getCategoryColor(skill.category)}`}
            >
              {skill.name} • {skill.proficiency}
            </span>
          ))}
        </div>
      </div>

      {/* Experience */}
      <div className="bg-white border border-gray-200 rounded-lg p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">
          Work Experience ({analysis.experience?.length || 0})
        </h3>
        <div className="space-y-4">
          {analysis.experience?.map((exp, index) => (
            <div key={index} className="border-l-4 border-indigo-500 pl-4">
              <h4 className="font-semibold text-gray-900">{exp.position}</h4>
              <p className="text-sm text-gray-600">{exp.company}</p>
              <p className="text-sm text-gray-500">{exp.duration}</p>
              {exp.description && (
                <p className="mt-2 text-sm text-gray-700">{exp.description}</p>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Education */}
      <div className="bg-white border border-gray-200 rounded-lg p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">
          Education ({analysis.education?.length || 0})
        </h3>
        <div className="space-y-4">
          {analysis.education?.map((edu, index) => (
            <div key={index} className="border-l-4 border-green-500 pl-4">
              <h4 className="font-semibold text-gray-900">{edu.degree}</h4>
              <p className="text-sm text-gray-600">{edu.institution}</p>
              <p className="text-sm text-gray-500">{edu.field} • {edu.year}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Strengths and Areas for Improvement */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Strengths */}
        <div className="bg-green-50 border border-green-200 rounded-lg p-6">
          <h3 className="text-lg font-semibold text-green-900 mb-4 flex items-center">
            <svg className="h-5 w-5 mr-2" fill="currentColor" viewBox="0 0 20 20">
              <path
                fillRule="evenodd"
                d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                clipRule="evenodd"
              />
            </svg>
            Strengths
          </h3>
          <ul className="space-y-2">
            {analysis.strengths?.map((strength, index) => (
              <li key={index} className="flex items-start">
                <span className="text-green-600 mr-2">•</span>
                <span className="text-sm text-gray-700">{strength}</span>
              </li>
            ))}
          </ul>
        </div>

        {/* Areas for Improvement */}
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6">
          <h3 className="text-lg font-semibold text-yellow-900 mb-4 flex items-center">
            <svg className="h-5 w-5 mr-2" fill="currentColor" viewBox="0 0 20 20">
              <path
                fillRule="evenodd"
                d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z"
                clipRule="evenodd"
              />
            </svg>
            Areas for Improvement
          </h3>
          <ul className="space-y-2">
            {analysis.areasForImprovement?.map((area, index) => (
              <li key={index} className="flex items-start">
                <span className="text-yellow-600 mr-2">•</span>
                <span className="text-sm text-gray-700">{area}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>

      {/* Analysis Timestamp */}
      <div className="text-center text-sm text-gray-500">
        Analyzed on {formatDateTime(analysis.analyzedAt)}
      </div>
    </div>
  );
};

export default AnalysisResults;
