import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';

const LandingPage = () => {
  const [tickets, setTickets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showPhoneModal, setShowPhoneModal] = useState(false);
  const [selectedTicketId, setSelectedTicketId] = useState(null);
  const [phoneNumber, setPhoneNumber] = useState('');
  const [photos, setPhotos] = useState([]);
  const [videos, setVideos] = useState([]);
  const [uploading, setUploading] = useState(false);
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    fetchTickets();
  }, []);

  const fetchTickets = async () => {
    try {
      const response = await axios.get('http://localhost:5001/api/casting');
      setTickets(response.data);
    } catch (error) {
      console.error('Error fetching tickets:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleRegister = async (ticketId) => {
    if (!user) {
      navigate('/login');
      return;
    }

    // Show phone number modal
    setSelectedTicketId(ticketId);
    setShowPhoneModal(true);
  };

  const handlePhotoChange = (e) => {
    const files = Array.from(e.target.files);
    if (files.length + photos.length > 5) {
      alert('Maximum 5 photos allowed');
      return;
    }

    files.forEach(file => {
      if (file.size > 5 * 1024 * 1024) { // 5MB limit
        alert(`Photo ${file.name} is too large. Maximum size is 5MB.`);
        return;
      }

      const reader = new FileReader();
      reader.onloadend = () => {
        setPhotos(prev => [...prev, reader.result]);
      };
      reader.readAsDataURL(file);
    });
  };

  const handleVideoChange = (e) => {
    const files = Array.from(e.target.files);
    if (files.length + videos.length > 3) {
      alert('Maximum 3 videos allowed');
      return;
    }

    files.forEach(file => {
      if (file.size > 50 * 1024 * 1024) { // 50MB limit
        alert(`Video ${file.name} is too large. Maximum size is 50MB.`);
        return;
      }

      const reader = new FileReader();
      reader.onloadend = () => {
        setVideos(prev => [...prev, reader.result]);
      };
      reader.readAsDataURL(file);
    });
  };

  const removePhoto = (index) => {
    setPhotos(prev => prev.filter((_, i) => i !== index));
  };

  const removeVideo = (index) => {
    setVideos(prev => prev.filter((_, i) => i !== index));
  };

  const handlePhoneSubmit = async (e) => {
    e.preventDefault();
    if (!phoneNumber.trim()) {
      alert('Please enter a phone number');
      return;
    }

    setUploading(true);
    try {
      await axios.post(`http://localhost:5001/api/casting/${selectedTicketId}/register`, {
        phoneNumber: phoneNumber.trim(),
        photos: photos,
        videos: videos
      });
      alert('Registered successfully!');
      setShowPhoneModal(false);
      setPhoneNumber('');
      setPhotos([]);
      setVideos([]);
      setSelectedTicketId(null);
      fetchTickets();
    } catch (error) {
      alert(error.response?.data?.message || 'Registration failed');
    } finally {
      setUploading(false);
    }
  };

  const isRegistered = (ticket) => {
    if (!user) return false;
    return ticket.registeredUsers?.some(id => id === user.id || id._id === user.id);
  };

  return (
    <div className="min-h-screen">
      {/* Hero Section with Background Image */}
      <div 
        className="relative bg-cover bg-center bg-no-repeat"
        style={{
          backgroundImage: 'url(/img.jpg)',
          height: '100vh',
          width: '100%'
        }}
      >
        {/* Overlay for better text readability */}
        <div className="absolute inset-0 bg-black bg-opacity-50"></div>
        
        {/* Navigation */}
        <nav className="relative z-10 bg-white bg-opacity-90 backdrop-blur-sm shadow-sm">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between h-16 items-center">
              <div className="text-2xl font-bold text-blue-600">Casting App</div>
              <div className="flex gap-4">
                {user ? (
                  <>
                    <div className="flex items-center gap-3">
                      {user.profilePhoto ? (
                        <img
                          src={user.profilePhoto}
                          alt={`${user.name}'s profile`}
                          className="w-10 h-10 rounded-full object-cover border-2 border-blue-500"
                        />
                      ) : (
                        <div className="w-10 h-10 rounded-full bg-gray-300 flex items-center justify-center border-2 border-blue-500">
                          <span className="text-gray-600 text-xs font-semibold">
                            {user.name?.charAt(0)?.toUpperCase() || 'U'}
                          </span>
                        </div>
                      )}
                      <span className="text-gray-700">Welcome, {user.name} {user.lastName || ''}</span>
                    </div>
                    <button
                      onClick={() => navigate('/profile')}
                      className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors shadow-md"
                    >
                      Profile
                    </button>
                    {user.role === 'user' && (
                      <button
                        onClick={() => navigate('/my-registrations')}
                        className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors shadow-md"
                      >
                        My Registrations
                      </button>
                    )}
                    {user.role === 'casting' && (
                      <button
                        onClick={() => navigate('/casting')}
                        className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors shadow-md"
                      >
                        Casting Dashboard
                      </button>
                    )}
                    {user.role === 'admin' && (
                      <button
                        onClick={() => navigate('/admin')}
                        className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors shadow-md"
                      >
                        Admin Dashboard
                      </button>
                    )}
                    <button
                      onClick={() => {
                        logout();
                        navigate('/');
                      }}
                      className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors shadow-md"
                    >
                      Logout
                    </button>
                  </>
                ) : (
                  <>
                    <button
                      onClick={() => navigate('/login')}
                      className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors shadow-md"
                    >
                      Login
                    </button>
                    <button
                      onClick={() => navigate('/register')}
                      className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors shadow-md"
                    >
                      Create Account
                    </button>
                  </>
                )}
              </div>
            </div>
          </div>
        </nav>

        {/* Hero Content */}
        <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="text-center mb-8">
            <h1 className="text-5xl md:text-6xl font-bold text-white mb-4 drop-shadow-lg">
              Discover Your Next Opportunity
            </h1>
            <p className="text-xl md:text-2xl text-white mb-6 drop-shadow-md">
              Explore amazing casting opportunities and take your career to the next level
            </p>
            <h2 className="text-3xl md:text-4xl font-bold text-white mb-4 drop-shadow-lg">
              Available Auditions
            </h2>
          </div>

          {/* Tickets Grid */}
          {loading ? (
            <div className="text-center py-12">
              <div className="text-xl text-white drop-shadow-md">Loading tickets...</div>
            </div>
          ) : tickets.length === 0 ? (
            <div className="text-center py-12">
              <div className="text-xl text-white drop-shadow-md">No auditions available</div>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 max-h-[60vh] overflow-y-auto">
              {tickets.map((ticket) => (
                <div 
                  key={ticket._id} 
                  className="bg-white bg-opacity-95 rounded-xl shadow-lg overflow-hidden hover:shadow-2xl transition-shadow duration-300 transform hover:-translate-y-1"
                >
                  {ticket.image && (
                    <div className="relative overflow-hidden">
                      <img
                        src={ticket.image}
                        alt={ticket.title}
                        className="w-full h-32 object-cover transition-transform duration-300 hover:scale-110"
                      />
                      <div className="absolute top-2 right-2 bg-white bg-opacity-90 px-2 py-1 rounded-full">
                        <span className="text-xs font-semibold text-gray-700">
                          {ticket.registeredUsers?.length || 0} Registered
                        </span>
                      </div>
                    </div>
                  )}
                  <div className="p-4">
                    <h2 className="text-lg font-bold text-gray-900 mb-2">{ticket.title}</h2>
                    <p className="text-gray-600 mb-3 text-sm line-clamp-2">{ticket.description}</p>
                    <div className="space-y-2 mb-4 text-xs">
                      <div className="flex items-center">
                        <span className="font-semibold text-gray-700 w-16">Category:</span>
                        <span className="text-gray-600">{ticket.category}</span>
                      </div>
                      <div className="flex items-center">
                        <span className="font-semibold text-gray-700 w-16">Location:</span>
                        <span className="text-gray-600">{ticket.location}</span>
                      </div>
                      <div className="flex items-center">
                        <span className="font-semibold text-gray-700 w-16">Date:</span>
                        <span className="text-gray-600">{new Date(ticket.date).toLocaleDateString()}</span>
                      </div>
                    </div>
                    {user && user.role === 'user' && (
                      <button
                        onClick={() => handleRegister(ticket._id)}
                        disabled={isRegistered(ticket)}
                        className={`w-full px-3 py-2 rounded-lg text-sm font-semibold transition-all duration-200 ${
                          isRegistered(ticket)
                            ? 'bg-gray-400 cursor-not-allowed text-white'
                            : 'bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white shadow-md hover:shadow-lg'
                        }`}
                      >
                        {isRegistered(ticket) ? 'Already Registered' : 'Register Now'}
                      </button>
                    )}
                    {!user && (
                      <button
                        onClick={() => navigate('/login')}
                        className="w-full px-3 py-2 bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white rounded-lg text-sm font-semibold shadow-md hover:shadow-lg transition-all duration-200"
                      >
                        Login to Register
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Registration Modal */}
      {showPhoneModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 overflow-y-auto">
          <div className="bg-white rounded-lg p-6 max-w-2xl w-full mx-4 my-8 max-h-[90vh] overflow-y-auto">
            <h2 className="text-2xl font-semibold mb-4">Register for Audition</h2>
            <form onSubmit={handlePhoneSubmit}>
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Phone Number *
                </label>
                <input
                  type="tel"
                  required
                  placeholder="Enter your phone number"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  value={phoneNumber}
                  onChange={(e) => setPhoneNumber(e.target.value)}
                />
              </div>

              {/* Photos Upload */}
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Photos (Max 5, 5MB each)
                </label>
                <input
                  type="file"
                  accept="image/*"
                  multiple
                  onChange={handlePhotoChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                {photos.length > 0 && (
                  <div className="mt-2 grid grid-cols-3 gap-2">
                    {photos.map((photo, index) => (
                      <div key={index} className="relative">
                        <img
                          src={photo}
                          alt={`Preview ${index + 1}`}
                          className="w-full h-24 object-cover rounded border"
                        />
                        <button
                          type="button"
                          onClick={() => removePhoto(index)}
                          className="absolute top-1 right-1 bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center text-xs hover:bg-red-600"
                        >
                          ×
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Videos Upload */}
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Videos (Max 3, 50MB each)
                </label>
                <input
                  type="file"
                  accept="video/*"
                  multiple
                  onChange={handleVideoChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                {videos.length > 0 && (
                  <div className="mt-2 space-y-2">
                    {videos.map((video, index) => (
                      <div key={index} className="relative border rounded p-2">
                        <video
                          src={video}
                          controls
                          className="w-full h-32 object-contain rounded"
                        />
                        <button
                          type="button"
                          onClick={() => removeVideo(index)}
                          className="absolute top-3 right-3 bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center text-xs hover:bg-red-600"
                        >
                          ×
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={() => {
                    setShowPhoneModal(false);
                    setPhoneNumber('');
                    setPhotos([]);
                    setVideos([]);
                    setSelectedTicketId(null);
                  }}
                  className="flex-1 px-4 py-2 bg-gray-300 text-gray-700 rounded hover:bg-gray-400"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={uploading}
                  className="flex-1 px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 disabled:opacity-50"
                >
                  {uploading ? 'Registering...' : 'Register'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default LandingPage;

