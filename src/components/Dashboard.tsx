import React, { useCallback, useEffect, useState } from 'react';
import { resumeAPI, jobApplicationAPI, authAPI } from '../services/api';
import type { User, Resume, JobApplication, JobApplicationStats } from '../types';
import ResumeUpload from './ResumeUpload';
import ResumeList from './ResumeList';
import JobApplicationForm from './JobApplicationForm';
import AnalysisResults from './AnalysisResults';
import LoadingScreen from './LoadingScreen';
import { TOKEN_STORAGE_KEY } from '../constants/auth';
import { getApiErrorMessage } from '../utils/getApiErrorMessage';
import { formatDate, getApplicationStatusClass, getScoreBadgeClass } from '../utils/formatters';

interface DashboardProps {
  user: User;
  onLogout: () => void;
}

type View = 'overview' | 'upload' | 'resumes' | 'applications' | 'analysis';

const Dashboard: React.FC<DashboardProps> = ({ user, onLogout }) => {
  const [currentView, setCurrentView] = useState<View>('overview');
  const [resumes, setResumes] = useState<Resume[]>([]);
  const [applications, setApplications] = useState<JobApplication[]>([]);
  const [selectedResume, setSelectedResume] = useState<Resume | null>(null);
  const [stats, setStats] = useState<JobApplicationStats | null>(null);
  const [pageError, setPageError] = useState('');
  const [loading, setLoading] = useState(true);

  const loadData = useCallback(async () => {
    try {
      setPageError('');
      const [resumesRes, appsRes, statsRes] = await Promise.all([
        resumeAPI.getAll(),
        jobApplicationAPI.getAll(),
        jobApplicationAPI.getStats(),
      ]);
      setResumes(resumesRes.data);
      setApplications(appsRes.data);
      setStats(statsRes.data);
    } catch (error: unknown) {
      console.error('Error loading data:', error);
      setPageError(getApiErrorMessage(error, 'Unable to load dashboard data.'));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadData();
  }, [loadData]);

  const handleUploadSuccess = (resume: Resume) => {
    setResumes((currentResumes) => [resume, ...currentResumes]);
    setPageError('');
    setSelectedResume(resume);
    setCurrentView('analysis');
  };

  const handleResumeDelete = async (id: string) => {
    try {
      await resumeAPI.delete(id);
      setResumes((currentResumes) => currentResumes.filter((resume) => resume._id !== id));
    } catch (error: unknown) {
      console.error('Error deleting resume:', error);
      setPageError(getApiErrorMessage(error, 'Unable to delete resume.'));
    }
  };

  const handleApplicationSubmit = async (data: Partial<JobApplication>): Promise<void> => {
    try {
      setPageError('');
      const response = await jobApplicationAPI.create(data);
      setApplications((currentApplications) => [response.data, ...currentApplications]);
      await loadData();
    } catch (error: unknown) {
      console.error('Error creating application:', error);
      setPageError(getApiErrorMessage(error, 'Unable to create job application.'));
      throw error;
    }
  };

  const handleDeleteAccount = async () => {
    const confirmed = window.confirm(
      'Warning: This action cannot be undone.\n\n' +
      'This will permanently delete:\n' +
      '• Your account\n' +
      '• All uploaded resumes\n' +
      '• All job applications\n' +
      '• All analysis data\n\n' +
      'Are you absolutely sure you want to continue?'
    );

    if (!confirmed) return;

    const confirmationInput = window.prompt(
      'Final confirmation:\nType your account email to permanently delete this account.',
      ''
    );

    if (confirmationInput !== user.email) {
      window.alert('Account deletion cancelled. Email did not match.');
      return;
    }

    try {
      setLoading(true);
      await authAPI.deleteAccount();
      window.alert('Your account has been permanently deleted.');
      localStorage.removeItem(TOKEN_STORAGE_KEY);
      onLogout();
    } catch (error: unknown) {
      console.error('Error deleting account:', error);
      window.alert(`Error deleting account: ${getApiErrorMessage(error, 'Please try again.')}`);
      setLoading(false);
    }
  };

  const getStatusStats = () => {
    const statusCounts = stats?.byStatus ?? [];
    const getCount = (status: JobApplication['status']) =>
      statusCounts.find((item) => item._id === status)?.count ?? 0;

    return {
      applied: getCount('Applied'),
      interview: getCount('Interview'),
      offer: getCount('Offer'),
      rejected: getCount('Rejected'),
    };
  };

  if (loading) {
    return <LoadingScreen message="Loading your dashboard..." />;
  }

  const statusData = getStatusStats();
  const totalApplications = stats?.total ?? 0;

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-blue-50 to-indigo-50">
      {/* Premium Navigation Bar */}
      <nav className="bg-white border-b border-gray-200 sticky top-0 z-50 shadow-sm backdrop-blur-lg bg-opacity-90">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-lg flex items-center justify-center shadow-lg">
                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              </div>
              <div>
                <h1 className="text-xl font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
                  AI Resume Tracker
                </h1>
                <p className="text-xs text-gray-500">Your Career Intelligence Platform</p>
              </div>
            </div>
            
            <div className="flex items-center space-x-4">
              <div className="hidden md:flex items-center space-x-2 px-4 py-2 bg-gradient-to-r from-indigo-50 to-purple-50 rounded-lg border border-indigo-100">
                <div className="w-8 h-8 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-full flex items-center justify-center text-white font-semibold text-sm shadow-md">
                  {user.name.charAt(0).toUpperCase()}
                </div>
                <div className="text-left">
                  <p className="text-sm font-semibold text-gray-800">{user.name}</p>
                  <p className="text-xs text-gray-500">{user.email}</p>
                </div>
              </div>
              <button
                onClick={handleDeleteAccount}
                className="group px-4 py-2 text-sm font-medium text-gray-600 hover:text-red-600 bg-gray-50 hover:bg-red-50 rounded-lg border border-gray-200 hover:border-red-300 transition-all duration-200 shadow-sm hover:shadow-md"
                title="Delete Account"
              >
                <span className="flex items-center space-x-2">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                  </svg>
                  <span className="hidden lg:inline">Delete Account</span>
                </span>
              </button>
              <button
                onClick={onLogout}
                className="group px-4 py-2 text-sm font-medium text-red-600 hover:text-white bg-red-50 hover:bg-red-600 rounded-lg border border-red-200 hover:border-red-600 transition-all duration-200 shadow-sm hover:shadow-md"
              >
                <span className="flex items-center space-x-2">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                  </svg>
                  <span>Logout</span>
                </span>
              </button>
            </div>
          </div>
        </div>
      </nav>

      <div className="max-w-7xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
        {/* Enhanced Tab Navigation */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 mb-6 overflow-hidden">
          <nav className="flex space-x-1 p-2">
            {[
              { id: 'overview', label: 'Overview', icon: '📊' },
              { id: 'upload', label: 'Upload Resume', icon: '📤' },
              { id: 'resumes', label: 'My Resumes', icon: '📄' },
              { id: 'applications', label: 'Applications', icon: '💼' }
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setCurrentView(tab.id as View)}
                className={`flex-1 flex items-center justify-center space-x-2 py-3 px-4 rounded-lg font-medium text-sm transition-all duration-200 ${
                  currentView === tab.id
                    ? 'bg-gradient-to-r from-indigo-500 to-purple-600 text-white shadow-md'
                    : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                }`}
              >
                <span className="text-lg">{tab.icon}</span>
                <span>{tab.label}</span>
              </button>
            ))}
          </nav>
        </div>

        {/* Premium Content Container */}
        <div className="bg-white rounded-xl shadow-lg border border-gray-200 overflow-hidden">
          <div className="p-8">
            {pageError && (
              <div className="mb-6 rounded-lg border border-red-200 bg-red-50 p-4 flex items-center justify-between gap-4">
                <p className="text-sm text-red-700">{pageError}</p>
                <button
                  type="button"
                  onClick={() => void loadData()}
                  className="whitespace-nowrap px-3 py-1.5 rounded-md text-xs font-semibold text-red-700 border border-red-300 hover:bg-red-100"
                >
                  Retry
                </button>
              </div>
            )}

            {currentView === 'overview' && (
              <div className="space-y-8">
                <div className="flex items-center justify-between">
                  <div>
                    <h2 className="text-3xl font-bold text-gray-900">Dashboard Overview</h2>
                    <p className="text-gray-500 mt-1">Track your job search journey at a glance</p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm text-gray-500">Last updated</p>
                    <p className="text-sm font-semibold text-gray-700">{formatDate(new Date())}</p>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                  <div className="group relative bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl p-6 text-white shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105 overflow-hidden">
                    <div className="absolute top-0 right-0 w-32 h-32 bg-white opacity-10 rounded-full -mr-16 -mt-16"></div>
                    <div className="relative">
                      <div className="flex items-center justify-between mb-4">
                        <h3 className="text-sm font-semibold uppercase tracking-wide opacity-90">Total Resumes</h3>
                        <svg className="w-8 h-8 opacity-80" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                        </svg>
                      </div>
                      <p className="text-5xl font-bold mb-2">{resumes.length}</p>
                      <p className="text-sm opacity-90">Active resume versions</p>
                    </div>
                  </div>

                  <div className="group relative bg-gradient-to-br from-green-500 to-green-600 rounded-xl p-6 text-white shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105 overflow-hidden">
                    <div className="absolute top-0 right-0 w-32 h-32 bg-white opacity-10 rounded-full -mr-16 -mt-16"></div>
                    <div className="relative">
                      <div className="flex items-center justify-between mb-4">
                        <h3 className="text-sm font-semibold uppercase tracking-wide opacity-90">Applications</h3>
                        <svg className="w-8 h-8 opacity-80" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 13.255A23.931 23.931 0 0 1 12 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v2m4 6h.01M5 20h14a2 2 0 0 0 2-2V8a2 2 0 0 0-2-2H5a2 2 0 0 0-2 2v10a2 2 0 0 0 2 2z" />
                        </svg>
                      </div>
                      <p className="text-5xl font-bold mb-2">{totalApplications}</p>
                      <p className="text-sm opacity-90">Total submissions</p>
                    </div>
                  </div>

                  <div className="group relative bg-gradient-to-br from-purple-500 to-purple-600 rounded-xl p-6 text-white shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105 overflow-hidden">
                    <div className="absolute top-0 right-0 w-32 h-32 bg-white opacity-10 rounded-full -mr-16 -mt-16"></div>
                    <div className="relative">
                      <div className="flex items-center justify-between mb-4">
                        <h3 className="text-sm font-semibold uppercase tracking-wide opacity-90">Active</h3>
                        <svg className="w-8 h-8 opacity-80" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                        </svg>
                      </div>
                      <p className="text-5xl font-bold mb-2">{statusData.applied}</p>
                      <p className="text-sm opacity-90">Applications pending</p>
                    </div>
                  </div>

                  <div className="group relative bg-gradient-to-br from-amber-500 to-orange-600 rounded-xl p-6 text-white shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105 overflow-hidden">
                    <div className="absolute top-0 right-0 w-32 h-32 bg-white opacity-10 rounded-full -mr-16 -mt-16"></div>
                    <div className="relative">
                      <div className="flex items-center justify-between mb-4">
                        <h3 className="text-sm font-semibold uppercase tracking-wide opacity-90">Interviews</h3>
                        <svg className="w-8 h-8 opacity-80" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                      </div>
                      <p className="text-5xl font-bold mb-2">{statusData.interview}</p>
                      <p className="text-sm opacity-90">Scheduled interviews</p>
                    </div>
                  </div>
                </div>

                {totalApplications > 0 && (
                  <div className="bg-gradient-to-r from-indigo-50 to-purple-50 rounded-xl p-6 border border-indigo-100">
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">Application Pipeline</h3>
                    <div className="space-y-3">
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-gray-600">Success Rate</span>
                        <span className="font-semibold text-gray-900">
                          {Math.round(((statusData.interview + statusData.offer) / totalApplications) * 100)}%
                        </span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-3 overflow-hidden">
                        <div className="flex h-full">
                          <div 
                            className="bg-blue-500 transition-all duration-500" 
                            style={{ width: `${(statusData.applied / totalApplications) * 100}%` }}
                          ></div>
                          <div 
                            className="bg-amber-500 transition-all duration-500" 
                            style={{ width: `${(statusData.interview / totalApplications) * 100}%` }}
                          ></div>
                          <div 
                            className="bg-green-500 transition-all duration-500" 
                            style={{ width: `${(statusData.offer / totalApplications) * 100}%` }}
                          ></div>
                        </div>
                      </div>
                      <div className="flex items-center justify-between text-xs text-gray-500">
                        <span>🔵 Applied ({statusData.applied})</span>
                        <span>🟡 Interview ({statusData.interview})</span>
                        <span>🟢 Offer ({statusData.offer})</span>
                        <span>🔴 Rejected ({statusData.rejected})</span>
                      </div>
                    </div>
                  </div>
                )}

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <h3 className="text-xl font-semibold text-gray-900">Recent Resumes</h3>
                      <button 
                        onClick={() => setCurrentView('resumes')}
                        className="text-sm text-indigo-600 hover:text-indigo-700 font-medium"
                      >
                        View all →
                      </button>
                    </div>
                    <div className="space-y-3">
                      {resumes.length === 0 ? (
                        <div className="text-center py-12 bg-gray-50 rounded-lg border-2 border-dashed border-gray-300">
                          <svg className="w-12 h-12 text-gray-400 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                          </svg>
                          <p className="text-gray-500 font-medium">No resumes yet uploaded!</p>
                          <button 
                            onClick={() => setCurrentView('upload')}
                            className="mt-3 text-sm text-indigo-600 hover:text-indigo-700 font-medium"
                          >
                            Upload your first resume
                          </button>
                        </div>
                      ) : (
                        resumes.slice(0, 3).map((resume) => (
                          <div 
                            key={resume._id} 
                            className="group p-4 bg-gradient-to-r from-gray-50 to-white border border-gray-200 rounded-lg hover:shadow-md hover:border-indigo-300 transition-all duration-200 cursor-pointer"
                            onClick={() => {
                              setSelectedResume(resume);
                              setCurrentView('analysis');
                            }}
                          >
                            <div className="flex items-center justify-between">
                              <div className="flex items-center space-x-3">
                                <div className="w-10 h-10 bg-indigo-100 rounded-lg flex items-center justify-center">
                                  <svg className="w-6 h-6 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                                  </svg>
                                </div>
                                <div>
                                  <p className="font-semibold text-gray-900 group-hover:text-indigo-600 transition-colors">
                                    {resume.originalName}
                                  </p>
                                  <p className="text-xs text-gray-500">
                                    {formatDate(resume.uploadedAt)}
                                  </p>
                                </div>
                              </div>
                              <div className={`px-3 py-1 rounded-full text-sm font-semibold ${
                                getScoreBadgeClass(resume.analysis?.overallScore ?? 0)
                              }`}>
                                {resume.analysis?.overallScore || 'N/A'}
                              </div>
                            </div>
                          </div>
                        ))
                      )}
                    </div>
                  </div>

                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <h3 className="text-xl font-semibold text-gray-900">Recent Applications</h3>
                      <button 
                        onClick={() => setCurrentView('applications')}
                        className="text-sm text-indigo-600 hover:text-indigo-700 font-medium"
                      >
                        View all →
                      </button>
                    </div>
                    <div className="space-y-3">
                      {applications.length === 0 ? (
                        <div className="text-center py-12 bg-gray-50 rounded-lg border-2 border-dashed border-gray-300">
                          <svg className="w-12 h-12 text-gray-400 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 13.255A23.931 23.931 0 0 1 12 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v2m4 6h.01M5 20h14a2 2 0 0 0 2-2V8a2 2 0 0 0-2-2H5a2 2 0 0 0-2 2v10a2 2 0 0 0 2 2z" />
                          </svg>
                          <p className="text-gray-500 font-medium">No applications yet</p>
                          <button 
                            onClick={() => setCurrentView('applications')}
                            className="mt-3 text-sm text-indigo-600 hover:text-indigo-700 font-medium"
                          >
                            Create your application to get started
                          </button>
                        </div>
                      ) : (
                        applications.slice(0, 3).map((app) => (
                          <div key={app._id} className="p-4 bg-gradient-to-r from-gray-50 to-white border border-gray-200 rounded-lg hover:shadow-md hover:border-indigo-300 transition-all duration-200">
                            <div className="flex items-start justify-between mb-2">
                              <div>
                                <p className="font-semibold text-gray-900">{app.position}</p>
                                <p className="text-sm text-gray-600">{app.company}</p>
                              </div>
                              <span className={`px-3 py-1 text-xs font-semibold rounded-full ${
                                getApplicationStatusClass(app.status)
                              }`}>
                                {app.status}
                              </span>
                            </div>
                            <div className="flex items-center text-xs text-gray-500 space-x-3">
                              <span>📅 {formatDate(app.applicationDate)}</span>
                              {app.location && <span>📍 {app.location}</span>}
                            </div>
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {currentView === 'upload' && (
              <ResumeUpload onUploadSuccess={handleUploadSuccess} />
            )}

            {currentView === 'resumes' && (
              <ResumeList
                resumes={resumes}
                onDelete={handleResumeDelete}
                onSelect={(resume) => {
                  setSelectedResume(resume);
                  setCurrentView('analysis');
                }}
              />
            )}

            {currentView === 'applications' && (
              <div>
                <JobApplicationForm
                  resumes={resumes}
                  onSubmit={handleApplicationSubmit}
                />
                <div className="mt-8">
                  <h3 className="text-xl font-semibold text-gray-900 mb-4">All Applications</h3>
                  <div className="space-y-3">
                    {applications.map((app) => (
                      <div key={app._id} className="border border-gray-200 rounded-xl p-5 hover:shadow-md hover:border-indigo-300 transition-all duration-200 bg-gradient-to-r from-white to-gray-50">
                        <div className="flex justify-between items-start mb-3">
                          <div>
                            <h4 className="font-semibold text-lg text-gray-900">{app.position}</h4>
                            <p className="text-gray-600 font-medium">{app.company}</p>
                          </div>
                          <span className={`px-4 py-1.5 text-sm font-semibold rounded-full ${
                            getApplicationStatusClass(app.status)
                          }`}>
                            {app.status}
                          </span>
                        </div>
                        <div className="flex items-center space-x-4 text-sm text-gray-500">
                          <span className="flex items-center">
                            📅 {formatDate(app.applicationDate)}
                          </span>
                          {app.location && <span className="flex items-center">📍 {app.location}</span>}
                          {app.salary && <span className="flex items-center">💰 {app.salary}</span>}
                        </div>
                        {app.notes && (
                          <p className="mt-3 text-sm text-gray-600 bg-gray-50 rounded-lg p-3 border border-gray-200">
                            💬 {app.notes}
                          </p>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {currentView === 'analysis' && selectedResume && (
              <AnalysisResults resume={selectedResume} />
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
