import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';

const CastingPage = () => {
  const [tickets, setTickets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [imageInputType, setImageInputType] = useState('url'); // 'url' or 'file'
  const [showRegistrations, setShowRegistrations] = useState(null); // ticket ID or null
  const [registrations, setRegistrations] = useState([]);
  const [loadingRegistrations, setLoadingRegistrations] = useState(false);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    category: '',
    location: '',
    date: '',
    image: null,
    imagePreview: null,
    images: []
  });
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const fetchTickets = useCallback(async () => {
    if (!user) {
      setLoading(false);
      return;
    }
    
    try {
      // Get user ID - handle both id and _id (MongoDB returns _id, but login/register return id)
      const userId = user.id || user._id;
      if (!userId) {
        console.error('User ID not found in user object:', user);
        setLoading(false);
        return;
      }
      
      const userIdStr = String(userId);
      
      const response = await axios.get('http://localhost:5001/api/casting?status=all');
      
      // Filter tickets created by this user
      const myTickets = response.data
        .filter(ticket => {
          if (!ticket.createdBy) {
            return false;
          }
          
          // Handle populated createdBy (object with _id) from backend
          let creatorId = null;
          if (ticket.createdBy && typeof ticket.createdBy === 'object' && ticket.createdBy._id) {
            // Populated object: { _id: ObjectId(...), name: ..., email: ... }
            creatorId = String(ticket.createdBy._id);
          } else if (typeof ticket.createdBy === 'string') {
            // Just the ID string
            creatorId = ticket.createdBy;
          } else if (ticket.createdBy && ticket.createdBy.toString) {
            // ObjectId or similar
            creatorId = String(ticket.createdBy);
          } else {
            return false;
          }
          
          // Compare as strings
          return creatorId === userIdStr;
        })
        .map(ticket => ({
          ...ticket,
          // Ensure registeredUsers is populated or at least an array
          registeredUsers: ticket.registeredUsers || []
        }));
      
      setTickets(myTickets);
    } catch (error) {
      console.error('Error fetching tickets:', error);
      alert('Failed to fetch auditions. Please try again.');
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    if (user && (user.id || user._id)) {
      fetchTickets();
    } else if (!user) {
      setLoading(false);
    }
  }, [fetchTickets, user]);

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      // Limit file size to 5MB to avoid payload issues
      if (file.size > 5 * 1024 * 1024) {
        alert('Image size should be less than 5MB. Please use a URL instead or compress the image.');
        return;
      }
      const reader = new FileReader();
      reader.onloadend = () => {
        setFormData({
          ...formData,
          image: reader.result, // Base64 string
          imagePreview: reader.result
        });
      };
      reader.readAsDataURL(file);
    }
  };

  const handleImageUrlChange = (e) => {
    const url = e.target.value;
    setFormData({
      ...formData,
      image: url || null,
      imagePreview: url || null
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      // Prepare data for submission - convert single image to images array if needed
      const submitData = {
        title: formData.title,
        description: formData.description,
        category: formData.category,
        location: formData.location,
        date: formData.date,
        images: formData.image ? [formData.image] : formData.images || []
      };
      
      await axios.post('http://localhost:5001/api/casting', submitData);
      alert('Audition created successfully! It will be pending admin approval.');
      setShowForm(false);
      setFormData({ title: '', description: '', category: '', location: '', date: '', image: null, imagePreview: null, images: [] });
      setImageInputType('url');
      fetchTickets();
    } catch (error) {
      console.error('Error creating audition:', error);
      alert(error.response?.data?.message || 'Failed to create audition');
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to delete this audition?')) {
      try {
        await axios.delete(`http://localhost:5001/api/casting/${id}`);
        fetchTickets();
      } catch (error) {
        alert(error.response?.data?.message || 'Failed to delete ticket');
      }
    }
  };

  const handleViewRegistrations = async (ticketId) => {
    if (showRegistrations === ticketId) {
      // Close if already open
      setShowRegistrations(null);
      setRegistrations([]);
      return;
    }

    setShowRegistrations(ticketId);
    setLoadingRegistrations(true);
    try {
      const response = await axios.get(`http://localhost:5001/api/casting/${ticketId}/registrations`);
      // Backend returns array directly
      setRegistrations(Array.isArray(response.data) ? response.data : []);
    } catch (error) {
      alert(error.response?.data?.message || 'Failed to fetch registrations');
      setShowRegistrations(null);
      setRegistrations([]);
    } finally {
      setLoadingRegistrations(false);
    }
  };

  const handleApproveRegistration = async (registrationId) => {
    try {
      await axios.patch(`http://localhost:5001/api/casting/registrations/${registrationId}/approve`);
      alert('Registration approved successfully');
      // Refresh registrations
      if (showRegistrations) {
        const response = await axios.get(`http://localhost:5001/api/casting/${showRegistrations}/registrations`);
        setRegistrations(Array.isArray(response.data) ? response.data : []);
      }
    } catch (error) {
      alert(error.response?.data?.message || 'Failed to approve registration');
    }
  };

  const handleRejectRegistration = async (registrationId) => {
    if (!window.confirm('Are you sure you want to reject this registration?')) {
      return;
    }
    try {
      await axios.patch(`http://localhost:5001/api/casting/registrations/${registrationId}/reject`);
      alert('Registration rejected successfully');
      // Refresh registrations
      if (showRegistrations) {
        const response = await axios.get(`http://localhost:5001/api/casting/${showRegistrations}/registrations`);
        setRegistrations(Array.isArray(response.data) ? response.data : []);
      }
    } catch (error) {
      alert(error.response?.data?.message || 'Failed to reject registration');
    }
  };

  return (
    <div className="min-h-screen bg-white">
      <nav className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16 items-center">
            <div className="text-2xl font-bold text-blue-600">Casting Dashboard</div>
            <div className="flex gap-4">
              <button
                onClick={() => navigate('/')}
                className="px-4 py-2 bg-gray-600 text-white rounded hover:bg-gray-700"
              >
                Home
              </button>
              <button
                onClick={() => {
                  logout();
                  navigate('/');
                }}
                className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700"
              >
                Logout
              </button>
            </div>
          </div>
        </div>
      </nav>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-4xl font-bold text-gray-900">My Auditions</h1>
          <button
            onClick={() => setShowForm(!showForm)}
            className="px-6 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
          >
            {showForm ? 'Cancel' : 'Create New Audition'}
          </button>
        </div>

        {showForm && (
          <div className="bg-white rounded-lg shadow-md p-6 mb-8">
            <h2 className="text-2xl font-semibold mb-4">Create New Audition</h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">Title</label>
                <input
                  type="text"
                  required
                  className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Description</label>
                <textarea
                  required
                  rows="3"
                  className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">Category *</label>
                  <select
                    required
                    className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md bg-white"
                    value={formData.category}
                    onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                  >
                    <option value="">Select Category</option>
                    <option value="cinema">Cinema</option>
                    <option value="serial">Serial</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Location</label>
                  <input
                    type="text"
                    required
                    className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md"
                    value={formData.location}
                    onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Date</label>
                <input
                  type="datetime-local"
                  required
                  className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md"
                  value={formData.date}
                  onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Image</label>
                <div className="mb-2">
                  <button
                    type="button"
                    onClick={() => {
                      setImageInputType('url');
                      setFormData({ ...formData, image: null, imagePreview: null });
                    }}
                    className={`px-3 py-1 text-sm rounded-l ${
                      imageInputType === 'url' ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-700'
                    }`}
                  >
                    URL
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setImageInputType('file');
                      setFormData({ ...formData, image: null, imagePreview: null });
                    }}
                    className={`px-3 py-1 text-sm rounded-r ${
                      imageInputType === 'file' ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-700'
                    }`}
                  >
                    Upload
                  </button>
                </div>
                {imageInputType === 'url' ? (
                  <input
                    type="url"
                    placeholder="https://example.com/image.jpg"
                    className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md"
                    value={formData.image || ''}
                    onChange={handleImageUrlChange}
                  />
                ) : (
                  <input
                    type="file"
                    accept="image/*"
                    className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md"
                    onChange={handleImageChange}
                  />
                )}
                {formData.imagePreview && (
                  <div className="mt-2">
                    <img
                      src={formData.imagePreview}
                      alt="Preview"
                      className="max-w-xs h-32 object-cover rounded"
                      onError={(e) => {
                        e.target.style.display = 'none';
                        alert('Failed to load image. Please check the URL or try again.');
                      }}
                    />
                  </div>
                )}
              </div>
              <button
                type="submit"
                className="px-6 py-2 bg-green-600 text-white rounded hover:bg-green-700"
              >
                Create Ticket
              </button>
            </form>
          </div>
        )}

        {loading ? (
          <div className="text-center py-12">
            <div className="text-xl text-gray-600">Loading...</div>
          </div>
        ) : tickets.length === 0 ? (
          <div className="text-center py-12">
            <div className="text-xl text-gray-600">No auditions created yet</div>
            <div className="text-sm text-gray-500 mt-2">Click "Create New Audition" to get started</div>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {tickets.map((ticket) => (
              <div key={ticket._id} className="bg-white rounded-lg shadow-md p-6 border border-gray-200">
                {/* Display first image from images array or single image */}
                {(ticket.images && ticket.images.length > 0) ? (
                  <img
                    src={ticket.images[0]}
                    alt={ticket.title}
                    className="w-full h-48 object-cover rounded mb-4"
                    onError={(e) => {
                      e.target.style.display = 'none';
                    }}
                  />
                ) : ticket.image ? (
                  <img
                    src={ticket.image}
                    alt={ticket.title}
                    className="w-full h-48 object-cover rounded mb-4"
                    onError={(e) => {
                      e.target.style.display = 'none';
                    }}
                  />
                ) : null}
                <h2 className="text-xl font-semibold text-gray-900 mb-2">{ticket.title}</h2>
                <p className="text-gray-600 mb-4">{ticket.description}</p>
                <div className="space-y-2 mb-4">
                  <div className="text-sm text-gray-500">
                    <span className="font-medium">Category:</span> <span className="capitalize">{ticket.category}</span>
                  </div>
                  <div className="text-sm text-gray-500">
                    <span className="font-medium">Location:</span> {ticket.location}
                  </div>
                  <div className="text-sm text-gray-500">
                    <span className="font-medium">Date:</span> {new Date(ticket.date).toLocaleDateString()}
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="text-sm text-gray-500">
                      <span className="font-medium">Registered:</span> {ticket.registeredUsers?.length || 0}
                    </div>
                    <div className="text-sm">
                      <span className={`px-2 py-1 rounded-full text-xs ${
                        ticket.status === 'approved' ? 'bg-green-100 text-green-800' :
                        ticket.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                        'bg-red-100 text-red-800'
                      }`}>
                        {ticket.status}
                      </span>
                    </div>
                  </div>
                  <button
                    onClick={() => handleViewRegistrations(ticket._id)}
                    className="w-full mt-3 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors"
                  >
                    View Registrations ({ticket.registeredUsers?.length || 0})
                  </button>
                </div>
                {showRegistrations === ticket._id && (
                  <div className="mt-6 -mx-6 -mb-6 bg-gray-50 border-t border-gray-200">
                    <div className="p-6">
                      <div className="flex justify-between items-center mb-4">
                        <h3 className="text-xl font-semibold text-gray-900">
                          Registrations ({registrations.length})
                        </h3>
                        <button
                          onClick={() => {
                            setShowRegistrations(null);
                            setRegistrations([]);
                          }}
                          className="text-gray-500 hover:text-gray-700"
                        >
                          ✕ Close
                        </button>
                      </div>
                      {loadingRegistrations ? (
                        <div className="text-center py-8">
                          <div className="text-gray-600">Loading registrations...</div>
                        </div>
                      ) : registrations.length === 0 ? (
                        <div className="text-center py-8 text-gray-500">
                          No users registered yet
                        </div>
                      ) : (
                        <div className="overflow-x-auto">
                          <table className="min-w-full bg-white border border-gray-200 rounded-lg">
                            <thead className="bg-gray-100">
                              <tr>
                                <th className="px-4 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">User</th>
                                <th className="px-4 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">Contact</th>
                                <th className="px-4 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">Media</th>
                                <th className="px-4 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">Status</th>
                                <th className="px-4 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">Actions</th>
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-200">
                              {registrations.map((registeredUser, index) => {
                                const profilePhoto = registeredUser.user?.profilePhoto || registeredUser.profilePhoto;
                                const userName = registeredUser.user?.name || registeredUser.name || 'User';
                                const userLastName = registeredUser.user?.lastName || registeredUser.lastName || '';
                                const userEmail = registeredUser.user?.email || registeredUser.email;
                                const userDob = registeredUser.user?.dob || registeredUser.dob;
                                const userAge = registeredUser.user?.age || registeredUser.age;
                                const userAddress = registeredUser.user?.address || registeredUser.address;
                                const phoneNumber = registeredUser.phoneNumber;
                                const status = registeredUser.status || 'pending';
                                const photos = registeredUser.photos || [];
                                const videos = registeredUser.videos || [];
                                
                                return (
                                  <tr key={registeredUser._id || index} className="hover:bg-gray-50">
                                    <td className="px-4 py-4 whitespace-nowrap">
                                      <div className="flex items-center gap-3">
                                        {profilePhoto && profilePhoto.trim() !== '' && profilePhoto !== 'null' ? (
                                          <img
                                            src={profilePhoto}
                                            alt={`${userName}'s profile`}
                                            className="w-12 h-12 rounded-full object-cover border-2 border-gray-300"
                                            onError={(e) => {
                                              e.target.style.display = 'none';
                                              const fallback = e.target.nextElementSibling;
                                              if (fallback) fallback.style.display = 'flex';
                                            }}
                                          />
                                        ) : null}
                                        <div
                                          className={`w-12 h-12 rounded-full bg-gradient-to-br from-blue-100 to-purple-100 flex items-center justify-center border-2 border-gray-300 ${profilePhoto && profilePhoto.trim() !== '' && profilePhoto !== 'null' ? 'hidden' : ''}`}
                                        >
                                          <span className="text-gray-600 font-semibold">
                                            {userName.charAt(0).toUpperCase()}
                                          </span>
                                        </div>
                                        <div>
                                          <div className="text-sm font-medium text-gray-900">
                                            {userName} {userLastName}
                                          </div>
                                          {userDob && (
                                            <div className="text-xs text-gray-500">
                                              DOB: {new Date(userDob).toLocaleDateString()}
                                            </div>
                                          )}
                                          {userAge && (
                                            <div className="text-xs text-gray-500">
                                              Age: {userAge}
                                            </div>
                                          )}
                                        </div>
                                      </div>
                                    </td>
                                    <td className="px-4 py-4">
                                      <div className="text-sm text-gray-900">{userEmail}</div>
                                      <div className="text-sm text-gray-500">Phone: {phoneNumber}</div>
                                      {userAddress && (
                                        <div className="text-xs text-gray-400 mt-1">{userAddress}</div>
                                      )}
                                    </td>
                                    <td className="px-4 py-4">
                                      <div className="text-sm text-gray-600">
                                        {photos.length > 0 && <span className="mr-2">📷 {photos.length}</span>}
                                        {videos.length > 0 && <span>🎥 {videos.length}</span>}
                                      </div>
                                      {(photos.length > 0 || videos.length > 0) && (
                                        <button
                                          onClick={() => {
                                            const modal = document.getElementById(`media-modal-${registeredUser._id}`);
                                            if (modal) modal.classList.remove('hidden');
                                          }}
                                          className="text-xs text-blue-600 hover:text-blue-800 mt-1"
                                        >
                                          View Media
                                        </button>
                                      )}
                                    </td>
                                    <td className="px-4 py-4 whitespace-nowrap">
                                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                                        status === 'approved' ? 'bg-green-100 text-green-800' :
                                        status === 'rejected' ? 'bg-red-100 text-red-800' :
                                        'bg-yellow-100 text-yellow-800'
                                      }`}>
                                        {status}
                                      </span>
                                    </td>
                                    <td className="px-4 py-4 whitespace-nowrap">
                                      <div className="flex gap-2">
                                        {status !== 'approved' && (
                                          <button
                                            onClick={() => handleApproveRegistration(registeredUser._id)}
                                            className="px-3 py-1 bg-green-600 text-white text-sm rounded hover:bg-green-700"
                                          >
                                            Approve
                                          </button>
                                        )}
                                        {status !== 'rejected' && (
                                          <button
                                            onClick={() => handleRejectRegistration(registeredUser._id)}
                                            className="px-3 py-1 bg-red-600 text-white text-sm rounded hover:bg-red-700"
                                          >
                                            Reject
                                          </button>
                                        )}
                                      </div>
                                    </td>
                                  </tr>
                                );
                              })}
                            </tbody>
                          </table>
                        </div>
                      )}
                    </div>
                  </div>
                )}
                
                {/* Media Modals */}
                {showRegistrations === ticket._id && registrations.map((registeredUser) => {
                  const photos = registeredUser.photos || [];
                  const videos = registeredUser.videos || [];
                  if (photos.length === 0 && videos.length === 0) return null;
                  
                  return (
                    <div
                      key={`modal-${registeredUser._id}`}
                      id={`media-modal-${registeredUser._id}`}
                      className="hidden fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"
                      onClick={(e) => {
                        if (e.target.id === `media-modal-${registeredUser._id}`) {
                          e.target.classList.add('hidden');
                        }
                      }}
                    >
                      <div className="bg-white rounded-lg p-6 max-w-4xl w-full mx-4 max-h-[90vh] overflow-y-auto">
                        <div className="flex justify-between items-center mb-4">
                          <h3 className="text-xl font-semibold">
                            Media from {registeredUser.user?.name || registeredUser.name}
                          </h3>
                          <button
                            onClick={() => {
                              const modal = document.getElementById(`media-modal-${registeredUser._id}`);
                              if (modal) modal.classList.add('hidden');
                            }}
                            className="text-gray-500 hover:text-gray-700 text-2xl"
                          >
                            ×
                          </button>
                        </div>
                        {photos.length > 0 && (
                          <div className="mb-6">
                            <h4 className="text-sm font-medium text-gray-700 mb-2">Photos ({photos.length})</h4>
                            <div className="grid grid-cols-3 gap-2">
                              {photos.map((photo, photoIndex) => (
                                <img
                                  key={photoIndex}
                                  src={photo}
                                  alt={`Submission ${photoIndex + 1}`}
                                  className="w-full h-32 object-cover rounded border cursor-pointer hover:opacity-80"
                                  onClick={() => window.open(photo, '_blank')}
                                />
                              ))}
                            </div>
                          </div>
                        )}
                        {videos.length > 0 && (
                          <div>
                            <h4 className="text-sm font-medium text-gray-700 mb-2">Videos ({videos.length})</h4>
                            <div className="space-y-3">
                              {videos.map((video, videoIndex) => (
                                <div key={videoIndex} className="border rounded overflow-hidden bg-black">
                                  <video
                                    src={video}
                                    controls
                                    preload="metadata"
                                    className="w-full h-64 object-contain"
                                  >
                                    Your browser does not support the video tag.
                                  </video>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
                <button
                  onClick={() => handleDelete(ticket._id)}
                  className="w-full mt-2 px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700"
                >
                  Delete
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default CastingPage;

