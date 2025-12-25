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
    imagePreview: null
  });
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const fetchTickets = useCallback(async () => {
    try {
      const response = await axios.get('http://localhost:5001/api/casting?status=all');
      const myTickets = response.data
        .filter(ticket => ticket.createdBy._id === user.id || ticket.createdBy === user.id)
        .map(ticket => ({
          ...ticket,
          // Ensure registeredUsers is populated or at least an array
          registeredUsers: ticket.registeredUsers || []
        }));
      setTickets(myTickets);
    } catch (error) {
      console.error('Error fetching tickets:', error);
    } finally {
      setLoading(false);
    }
  }, [user.id]);

  useEffect(() => {
    if (user) {
      fetchTickets();
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
      await axios.post('http://localhost:5001/api/casting', formData);
      alert('Ticket created successfully! It will be pending admin approval.');
      setShowForm(false);
      setFormData({ title: '', description: '', category: '', location: '', date: '', image: null, imagePreview: null });
      fetchTickets();
    } catch (error) {
      alert(error.response?.data?.message || 'Failed to create ticket');
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to delete this ticket?')) {
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
      setRegistrations(response.data.registeredUsers || []);
    } catch (error) {
      alert(error.response?.data?.message || 'Failed to fetch registrations');
      setShowRegistrations(null);
    } finally {
      setLoadingRegistrations(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
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
          <h1 className="text-4xl font-bold text-gray-900">My Casting Tickets</h1>
          <button
            onClick={() => setShowForm(!showForm)}
            className="px-6 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
          >
            {showForm ? 'Cancel' : 'Create New Ticket'}
          </button>
        </div>

        {showForm && (
          <div className="bg-white rounded-lg shadow-md p-6 mb-8">
            <h2 className="text-2xl font-semibold mb-4">Create New Casting Ticket</h2>
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
                  <label className="block text-sm font-medium text-gray-700">Category</label>
                  <input
                    type="text"
                    required
                    className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md"
                    value={formData.category}
                    onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                  />
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
            <div className="text-xl text-gray-600">No tickets created yet</div>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {tickets.map((ticket) => (
              <div key={ticket._id} className="bg-white rounded-lg shadow-md p-6">
                {ticket.image && (
                  <img
                    src={ticket.image}
                    alt={ticket.title}
                    className="w-full h-48 object-cover rounded mb-4"
                  />
                )}
                <h2 className="text-xl font-semibold text-gray-900 mb-2">{ticket.title}</h2>
                <p className="text-gray-600 mb-4">{ticket.description}</p>
                <div className="space-y-2 mb-4">
                  <div className="text-sm text-gray-500">
                    <span className="font-medium">Category:</span> {ticket.category}
                  </div>
                  <div className="text-sm text-gray-500">
                    <span className="font-medium">Location:</span> {ticket.location}
                  </div>
                  <div className="text-sm text-gray-500">
                    <span className="font-medium">Date:</span> {new Date(ticket.date).toLocaleDateString()}
                  </div>
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
                <div className="space-y-2">
                  <button
                    onClick={() => handleViewRegistrations(ticket._id)}
                    className="w-full px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
                  >
                    View Registrations ({ticket.registeredUsers?.length || 0})
                  </button>
                  {showRegistrations === ticket._id && (
                    <div className="mt-4 p-4 bg-gray-50 rounded-lg border border-gray-200">
                      <h3 className="font-semibold text-gray-900 mb-3">Registered Users</h3>
                      {loadingRegistrations ? (
                        <div className="text-center py-4">
                          <div className="text-gray-600">Loading registrations...</div>
                        </div>
                      ) : registrations.length === 0 ? (
                        <div className="text-center py-4 text-gray-500">
                          No users registered yet
                        </div>
                      ) : (
                        <div className="space-y-2">
                          {registrations.map((registeredUser, index) => (
                            <div
                              key={registeredUser._id || index}
                              className="bg-white p-3 rounded border border-gray-200"
                            >
                              <div className="flex justify-between items-start">
                                <div>
                                  <div className="font-medium text-gray-900">
                                    {registeredUser.name}
                                  </div>
                                  <div className="text-sm text-gray-500">
                                    {registeredUser.email}
                                  </div>
                                  <div className="text-sm text-gray-600 mt-1">
                                    <span className="font-medium">Phone:</span> {registeredUser.phoneNumber}
                                  </div>
                                  {registeredUser.registeredAt && (
                                    <div className="text-xs text-gray-400 mt-1">
                                      Registered: {new Date(registeredUser.registeredAt).toLocaleDateString()}
                                    </div>
                                  )}
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  )}
                  <button
                    onClick={() => handleDelete(ticket._id)}
                    className="w-full px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700"
                  >
                    Delete
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default CastingPage;

