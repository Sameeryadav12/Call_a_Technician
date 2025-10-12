import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { incomingJobsApi } from '../lib/api';
import Header from '../components/Header';

export default function IncomingJobs() {
  const [selectedJob, setSelectedJob] = useState(null);
  const [statusFilter, setStatusFilter] = useState('All');
  const [searchQuery, setSearchQuery] = useState('');
  const queryClient = useQueryClient();

  // Fetch incoming jobs
  const { data: jobs = [], isLoading, error } = useQuery({
    queryKey: ['incomingJobs', statusFilter, searchQuery],
    queryFn: () => incomingJobsApi.getIncomingJobs({ status: statusFilter, q: searchQuery }),
  });

  // Update job mutation
  const updateJobMutation = useMutation({
    mutationFn: ({ id, updates }) => incomingJobsApi.updateIncomingJob(id, updates),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['incomingJobs'] });
      setSelectedJob(null);
    },
  });

  // Delete job mutation
  const deleteJobMutation = useMutation({
    mutationFn: (id) => incomingJobsApi.deleteIncomingJob(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['incomingJobs'] });
      setSelectedJob(null);
    },
  });

  const handleStatusChange = (jobId, newStatus) => {
    updateJobMutation.mutate({ id: jobId, updates: { status: newStatus } });
  };

  const handleAssignmentChange = (jobId, technician) => {
    updateJobMutation.mutate({ id: jobId, updates: { assignedTo: technician } });
  };

  const handleNotesUpdate = (jobId, notes) => {
    updateJobMutation.mutate({ id: jobId, updates: { notes } });
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-AU', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'New': return 'bg-blue-100 text-blue-800';
      case 'In Progress': return 'bg-yellow-100 text-yellow-800';
      case 'Completed': return 'bg-green-100 text-green-800';
      case 'Cancelled': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  if (isLoading) return (
    <>
      <Header />
      <div className="loading-container">
        <div className="text-center">
          <div className="text-xl font-semibold mb-2">Loading incoming jobs...</div>
          <div className="text-sm text-gray-400">Please wait while we fetch your data</div>
        </div>
      </div>
    </>
  );
  
  if (error) return (
    <>
      <Header />
      <div className="loading-container">
        <div className="text-center">
          <div className="text-xl font-semibold mb-2 text-red-400">Error loading jobs</div>
          <div className="text-sm text-gray-400">{error.message}</div>
        </div>
      </div>
    </>
  );

  return (
    <>
      <Header />
      <div className="p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-white mb-2">Incoming Job Requests</h1>
        <p className="text-slate-300">Manage job requests from the marketing website</p>
      </div>

      {/* Filters */}
      <div className="mb-6 flex flex-wrap gap-4">
        <div className="flex-1 min-w-64">
          <input
            type="text"
            placeholder="Search jobs..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="input"
          />
        </div>
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="select"
        >
          <option value="All">All Statuses</option>
          <option value="New">New</option>
          <option value="In Progress">In Progress</option>
          <option value="Completed">Completed</option>
          <option value="Cancelled">Cancelled</option>
        </select>
      </div>

      {/* Jobs List */}
      <div className="panel overflow-hidden">
        <div className="overflow-x-auto">
          <table className="table">
            <thead>
              <tr>
                <th className="py-3 text-left text-xs font-medium text-slate-300 uppercase tracking-wider">
                  Customer
                </th>
                <th className="py-3 text-left text-xs font-medium text-slate-300 uppercase tracking-wider">
                  Contact
                </th>
                <th className="py-3 text-left text-xs font-medium text-slate-300 uppercase tracking-wider">
                  Description
                </th>
                <th className="py-3 text-left text-xs font-medium text-slate-300 uppercase tracking-wider">
                  Images
                </th>
                <th className="py-3 text-left text-xs font-medium text-slate-300 uppercase tracking-wider">
                  Status
                </th>
                <th className="py-3 text-left text-xs font-medium text-slate-300 uppercase tracking-wider">
                  Assigned To
                </th>
                <th className="py-3 text-left text-xs font-medium text-slate-300 uppercase tracking-wider">
                  Date
                </th>
                <th className="py-3 text-left text-xs font-medium text-slate-300 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody>
              {jobs.map((job) => (
                <tr key={job._id}>
                  <td className="py-3 whitespace-nowrap">
                    <div className="text-sm font-medium text-white">{job.fullName}</div>
                  </td>
                  <td className="py-3 whitespace-nowrap">
                    <div className="text-sm text-white">{job.phone}</div>
                    {job.email && (
                      <div className="text-sm text-slate-300">{job.email}</div>
                    )}
                  </td>
                  <td className="py-3">
                    <div className="text-sm text-white max-w-xs truncate">
                      {job.description}
                    </div>
                  </td>
                  <td className="py-3 whitespace-nowrap">
                    {job.images && job.images.length > 0 ? (
                      <div className="flex items-center gap-1">
                        <img 
                          src={job.images[0]} 
                          alt="Preview" 
                          className="w-10 h-10 object-cover rounded border border-white/20"
                        />
                        {job.images.length > 1 && (
                          <span className="text-xs text-white bg-white/10 px-2 py-1 rounded">
                            +{job.images.length - 1}
                          </span>
                        )}
                      </div>
                    ) : (
                      <span className="text-xs text-slate-400">No images</span>
                    )}
                  </td>
                  <td className="py-3 whitespace-nowrap">
                    <select
                      value={job.status}
                      onChange={(e) => handleStatusChange(job._id, e.target.value)}
                      className="text-xs font-medium px-2 py-1 rounded-full border border-white/10 bg-white/5 text-white focus:ring-2 focus:ring-brand-sky"
                    >
                      <option value="New" className="bg-brand-bg text-white">New</option>
                      <option value="In Progress" className="bg-brand-bg text-white">In Progress</option>
                      <option value="Completed" className="bg-brand-bg text-white">Completed</option>
                      <option value="Cancelled" className="bg-brand-bg text-white">Cancelled</option>
                    </select>
                  </td>
                  <td className="py-3 whitespace-nowrap">
                    <input
                      type="text"
                      value={job.assignedTo || ''}
                      onChange={(e) => handleAssignmentChange(job._id, e.target.value)}
                      placeholder="Assign technician..."
                      className="text-sm border border-white/10 bg-white/5 text-white rounded px-2 py-1 focus:ring-2 focus:ring-brand-sky"
                    />
                  </td>
                  <td className="py-3 whitespace-nowrap text-sm text-slate-300">
                    {formatDate(job.createdAt)}
                  </td>
                  <td className="py-3 whitespace-nowrap text-sm font-medium">
                    <div className="flex gap-2">
                      <button
                        onClick={() => setSelectedJob(job)}
                        className="px-3 py-1 rounded-lg bg-white/10 hover:bg-white/20 text-white"
                      >
                        View
                      </button>
                      <button
                        onClick={() => {
                          if (window.confirm('Are you sure you want to delete this job request?')) {
                            deleteJobMutation.mutate(job._id);
                          }
                        }}
                        className="px-3 py-1 rounded-lg bg-rose-600/80 hover:bg-rose-600 text-white"
                        disabled={deleteJobMutation.isPending}
                      >
                        Delete
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {jobs.length === 0 && (
        <div className="text-center py-12">
          <p className="text-gray-500">No incoming job requests found.</p>
        </div>
      )}

      {/* Job Detail Modal */}
      {selectedJob && (
        <div className="fixed inset-0 bg-black/60 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border border-white/10 w-11/12 md:w-3/4 lg:w-1/2 shadow-lg rounded-md bg-brand-bg">
            <div className="mt-3">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-medium text-white">
                  Job Request Details
                </h3>
                <button
                  onClick={() => setSelectedJob(null)}
                  className="text-slate-400 hover:text-white"
                >
                  <span className="sr-only">Close</span>
                  <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-slate-300">Customer Name</label>
                  <p className="mt-1 text-sm text-white">{selectedJob.fullName}</p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-300">Phone</label>
                  <p className="mt-1 text-sm text-white">{selectedJob.phone}</p>
                </div>

                {selectedJob.email && (
                  <div>
                    <label className="block text-sm font-medium text-slate-300">Email</label>
                    <p className="mt-1 text-sm text-white">{selectedJob.email}</p>
                  </div>
                )}

                <div>
                  <label className="block text-sm font-medium text-slate-300">Description</label>
                  <p className="mt-1 text-sm text-white">{selectedJob.description}</p>
                </div>

                {/* Image Gallery */}
                {selectedJob.images && selectedJob.images.length > 0 && (
                  <div>
                    <label className="block text-sm font-medium text-slate-300 mb-2">
                      Uploaded Images ({selectedJob.images.length})
                    </label>
                    <div className="grid grid-cols-2 gap-3">
                      {selectedJob.images.map((image, index) => (
                        <div key={index} className="relative group">
                          <img
                            src={image}
                            alt={`Job image ${index + 1}`}
                            className="w-full h-40 object-cover rounded-lg border-2 border-white/20 cursor-pointer hover:border-brand-sky transition"
                            onClick={() => window.open(image, '_blank')}
                          />
                          <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-30 transition rounded-lg flex items-center justify-center">
                            <span className="text-white opacity-0 group-hover:opacity-100 text-sm font-medium">
                              Click to enlarge
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                <div>
                  <label className="block text-sm font-medium text-slate-300">Status</label>
                  <select
                    value={selectedJob.status}
                    onChange={(e) => {
                      setSelectedJob({ ...selectedJob, status: e.target.value });
                      handleStatusChange(selectedJob._id, e.target.value);
                    }}
                    className="mt-1 block w-full px-3 py-2 border border-white/10 bg-white/5 text-white rounded-md shadow-sm focus:outline-none focus:ring-brand-sky focus:border-brand-sky"
                  >
                    <option value="New" className="bg-brand-bg text-white">New</option>
                    <option value="In Progress" className="bg-brand-bg text-white">In Progress</option>
                    <option value="Completed" className="bg-brand-bg text-white">Completed</option>
                    <option value="Cancelled" className="bg-brand-bg text-white">Cancelled</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-300">Assigned To</label>
                  <input
                    type="text"
                    value={selectedJob.assignedTo || ''}
                    onChange={(e) => {
                      setSelectedJob({ ...selectedJob, assignedTo: e.target.value });
                      handleAssignmentChange(selectedJob._id, e.target.value);
                    }}
                    placeholder="Assign technician..."
                    className="mt-1 block w-full px-3 py-2 border border-white/10 bg-white/5 text-white rounded-md shadow-sm focus:outline-none focus:ring-brand-sky focus:border-brand-sky"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-300">Notes</label>
                  <textarea
                    value={selectedJob.notes || ''}
                    onChange={(e) => {
                      setSelectedJob({ ...selectedJob, notes: e.target.value });
                      handleNotesUpdate(selectedJob._id, e.target.value);
                    }}
                    rows={3}
                    placeholder="Add notes..."
                    className="mt-1 block w-full px-3 py-2 border border-white/10 bg-white/5 text-white rounded-md shadow-sm focus:outline-none focus:ring-brand-sky focus:border-brand-sky"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-300">Submitted</label>
                  <p className="mt-1 text-sm text-white">{formatDate(selectedJob.createdAt)}</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
      </div>
    </>
  );
}
