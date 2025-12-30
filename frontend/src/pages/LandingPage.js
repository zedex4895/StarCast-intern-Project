import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { useAuth } from "../context/AuthContext";
// Use images from the public folder to avoid importing files outside `src`
const LandingPage = () => {
  const [tickets, setTickets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showPhoneModal, setShowPhoneModal] = useState(false);
  const [selectedTicketId, setSelectedTicketId] = useState(null);
  const [phoneNumber, setPhoneNumber] = useState("");
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
      const response = await axios.get("http://localhost:5001/api/casting");
      setTickets(response.data);
    } catch (error) {
      console.error("Error fetching tickets:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleRegister = async (ticketId) => {
    if (!user) {
      navigate("/login");
      return;
    }

    // Show phone number modal
    setSelectedTicketId(ticketId);
    setShowPhoneModal(true);
  };

  const handlePhotoChange = (e) => {
    const files = Array.from(e.target.files);
    if (files.length + photos.length > 5) {
      alert("Maximum 5 photos allowed");
      return;
    }

    files.forEach((file) => {
      if (file.size > 5 * 1024 * 1024) {
        // 5MB limit
        alert(`Photo ${file.name} is too large. Maximum size is 5MB.`);
        return;
      }

      const reader = new FileReader();
      reader.onloadend = () => {
        setPhotos((prev) => [...prev, reader.result]);
      };
      reader.readAsDataURL(file);
    });
  };

  const handleVideoChange = (e) => {
    const files = Array.from(e.target.files);
    if (files.length + videos.length > 3) {
      alert("Maximum 3 videos allowed");
      return;
    }

    files.forEach((file) => {
      if (file.size > 15 * 1024 * 1024) {
        // 15MB limit for better reliability
        alert(`Video "${file.name}" is too large (${(file.size / (1024 * 1024)).toFixed(1)}MB). Please use a video under 15MB for reliable upload.`);
        return;
      }

      const reader = new FileReader();
      reader.onloadend = () => {
        setVideos((prev) => [...prev, reader.result]);
      };
      reader.onerror = () => {
        alert(`Failed to read video "${file.name}". Please try a smaller file.`);
      };
      reader.readAsDataURL(file);
    });
  };

  const removePhoto = (index) => {
    setPhotos((prev) => prev.filter((_, i) => i !== index));
  };

  const removeVideo = (index) => {
    setVideos((prev) => prev.filter((_, i) => i !== index));
  };

  const handlePhoneSubmit = async (e) => {
    e.preventDefault();
    if (!phoneNumber.trim()) {
      alert("Please enter a phone number");
      return;
    }

    setUploading(true);
    try {
      await axios.post(
        `http://localhost:5001/api/casting/${selectedTicketId}/register`,
        {
          phoneNumber: phoneNumber.trim(),
          photos: photos,
          videos: videos,
        }
      );
      alert("Registered successfully!");
      setShowPhoneModal(false);
      setPhoneNumber("");
      setPhotos([]);
      setVideos([]);
      setSelectedTicketId(null);
      fetchTickets();
    } catch (error) {
      alert(error.response?.data?.message || "Registration failed");
    } finally {
      setUploading(false);
    }
  };

  const isRegistered = (ticket) => {
    if (!user) return false;
    return ticket.registeredUsers?.some(
      (id) => id === user.id || id._id === user.id
    );
  };

  return (
    <div className="min-h-screen bg-black">
      {/* Hero Section with Background Image */}
      <div
        className="relative bg-cover bg-center bg-no-repeat bg-black"
        style={{
          backgroundImage: "url(/img.jpg)",
          height: "100vh",
          width: "100%",
        }}
      >
        {/* Overlay for better text readability */}
        <div className="absolute inset-0 bg-black bg-opacity-50"></div>

        {/* Navigation */}
        <nav className="relative z-10 bg-black bg-opacity-90 backdrop-blur-sm shadow-sm">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between h-16 items-center">
              <div className="text-2xl font-bold text-white">Star Cast</div>
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
                            {user.name?.charAt(0)?.toUpperCase() || "U"}
                          </span>
                        </div>
                      )}
                      <span className="text-gray-700">
                        Welcome, {user.name} {user.lastName || ""}
                      </span>
                    </div>
                    <button
                      onClick={() => navigate("/profile")}
                      className="px-4 py-2  text-white rounded-lg  transition-colors shadow-md"
                    >
                      Profile
                    </button>
                    {user.role === "user" && (
                      <button
                        onClick={() => navigate("/my-registrations")}
                        className="px-4 py-2 text-white rounded-lg  transition-colors shadow-md"
                      >
                        My Registrations
                      </button>
                    )}
                    {user.role === "casting" && (
                      <button
                        onClick={() => navigate("/casting")}
                        className="px-4 py-2 text-white rounded-lg  transition-colors shadow-md"
                      >
                        Casting Dashboard
                      </button>
                    )}
                    {user.role === "admin" && (
                      <button
                        onClick={() => navigate("/admin")}
                        className="px-4 py-2  text-white rounded-lg  transition-colors shadow-md"
                      >
                        Admin Dashboard
                      </button>
                    )}
                    <button
                      onClick={() => {
                        logout();
                        navigate("/");
                      }}
                      className="px-4 py-2 text-white rounded-lg  transition-colors shadow-md"
                    >
                      Logout
                    </button>
                  </>
                ) : (
                  <>
                    <button
                      class="group/button relative inline-flex items-center justify-center overflow-hidden rounded-md bg-gray-800/30 backdrop-blur-lg px-6 py-2 text-base font-semibold text-white transition-all duration-300 ease-in-out hover:scale-110 hover:shadow-xl hover:shadow-gray-600/50 border border-white/20"
                      onClick={() => navigate("/login")}
                    >
                      <span class="text-lg">Login</span>
                      <div class="absolute inset-0 flex h-full w-full justify-center [transform:skew(-13deg)_translateX(-100%)] group-hover/button:duration-1000 group-hover/button:[transform:skew(-13deg)_translateX(100%)]">
                        <div class="relative h-full w-10 bg-white/20"></div>
                      </div>
                    </button>

                    <button
                      class="group/button relative inline-flex items-center justify-center overflow-hidden rounded-md bg-red-700 backdrop-blur-lg px-6 py-2 text-base font-semibold text-white transition-all duration-300 ease-in-out hover:scale-110 hover:shadow-xl hover:shadow-gray-600/50 border border-white/20"
                      onClick={() => navigate("/register")}
                    >
                      <span class="text-lg">Create a Account</span>
                      <div class="absolute inset-0 flex h-full w-full justify-center [transform:skew(-13deg)_translateX(-100%)] group-hover/button:duration-1000 group-hover/button:[transform:skew(-13deg)_translateX(100%)]">
                        <div class="relative h-full w-10 bg-white/20"></div>
                      </div>
                    </button>
                  </>
                )}
              </div>
            </div>
          </div>
        </nav>

        {/* Hero Content */}
        <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 ">
          <section className="relative h-[720px]">
            <div className="absolute inset-0 bg-cover bg-center" />
            <div className="absolute inset-0 " />
            <div className="relative z-10 max-w-6xl mx-auto h-full flex items-center px-6">
              <div className="w-full grid grid-cols-1 lg:grid-cols-2 gap-8 items-center">
                <div>
                  <h1 className="text-5xl lg:text-6xl font-extrabold text-white">
                    Star Cast
                  </h1>
                  <p className="mt-4 text-lg text-gray-200">
                    Real Roles. Real Reels. Real Time.
                  </p>
                  <p className="mt-2 text-gray-300">
                    The industry's trusted pipeline for Movie & Serial casting
                  </p>
                  <div className="mt-6">
                    <button
                      className="bg-red-600 hover:bg-red-700 px-6 py-3 rounded-md font-semibold"
                      onClick={() => navigate("/login")}
                    >
                      Get Started
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </section>
          <div className="w-full bg-black py-8">
            {loading ? (
              <div className="text-center w-full bg-black py-12">
                <div className="text-xl text-white">Loading Auditions...</div>
              </div>
            ) : tickets.length === 0 ? (
              <div className="text-center py-12 w-full bg-black">
                <div className="text-xl text-white drop-shadow-md">
                  No auditions available
                </div>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 w-full bg-black">
                {tickets?.map((ticket) => {
                  const registered = isRegistered(ticket);

                  return (
                    <div
                      key={ticket._id}
                      className="relative h-[400px] w-[90%] sm:w-[85%] mx-auto group rounded-[1.5em] shadow-lg hover:shadow-2xl transition-all duration-300 overflow-hidden flex flex-col justify-end p-6 bg-cover bg-center bg-no-repeat"
                      style={{
                        backgroundImage: ticket.images && ticket.images.length > 0
                          ? `url(${ticket.images[0]})`
                          : ticket.image
                          ? `url(${ticket.image})`
                          : "linear-gradient(135deg,#444,#111)",
                      }}
                    >
                      {/* Base dark overlay */}
                      <div className="absolute inset-0 bg-black/40 transition-all duration-300 group-hover:bg-black/60" />

                      {/* Light tint for style */}
                      <div className="absolute inset-0 " />

                      {/* Ribbon */}
                      {registered && (
                        <div className="absolute -right-10 top-5 rotate-45 bg-green-600 text-white text-xs font-semibold px-10 py-1 shadow-md z-10">
                          Registered
                        </div>
                      )}

                      {/* Registered count */}
                      <div className="absolute top-2 left-2 bg-black bg-opacity-90 px-2 py-1 rounded-full text-xs font-semibold text-gray-700 z-10">
                        {ticket.registeredUsers?.length || 0} Registered
                      </div>

                      {/* Content */}
                      <div className="relative z-10 mt-24 text-white">
                        <h2
                          className="text-[1.3em] tracking-[.15em]"
                          style={{
                            fontWeight: 900,
                            WebkitTextFillColor: "transparent",
                            WebkitTextStrokeWidth: "1px",
                          }}
                        >
                          {ticket.title}
                        </h2>

                        <div className="text-xs space-y-1 mt-2">
                          <p>
                            <b>Category:</b> {ticket.category}
                          </p>
                          <p>
                            <b>Location:</b> {ticket.location}
                          </p>
                          <p>
                            <b>Date:</b>{" "}
                            {new Date(ticket.date).toLocaleDateString("en-IN")}
                          </p>
                        </div>

                        {/* Tags */}
                        <div className="flex gap-2 mt-2">
                          {[ticket.category, ticket.location].map((tag, i) => (
                            <span
                              key={i}
                              className="border border-white rounded-lg px-2 py-[2px] text-xs hover:bg-white hover:text-black transition"
                            >
                              {tag}
                            </span>
                          ))}
                        </div>

                        {/* Buttons */}
                        {user && user.role === "user" ? (
                          <button
                            onClick={() => handleRegister(ticket._id)}
                            disabled={registered}
                            className={`w-full mt-3 py-2 rounded-lg text-sm font-semibold transition-all duration-200 ${
                              registered
                                ? "bg-gray-400 cursor-not-allowed text-white"
                                : "bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white shadow-md hover:shadow-lg"
                            }`}
                          >
                            {registered ? "Already Registered" : "Register Now"}
                          </button>
                        ) : (
                          <button
                            onClick={() => navigate("/login")}
                            className="w-full mt-3 py-2 bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 text-white rounded-lg text-sm font-semibold shadow-md hover:shadow-lg transition-all duration-200"
                          >
                            Login to Register
                          </button>
                        )}
                      </div>

                      {/* Hover-expand description */}
                      <p className="font-nunito text-white relative h-[0em] group-hover:h-[7em] leading-[1.2em] duration-500 overflow-hidden mt-2 z-10">
                        {ticket.description}
                      </p>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Auditions Grid */}
        </div>

        <section className=" bg-black">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <h2 className="text-zinc-100 font-bold text-xl lg:text-4xl sm:text-2xl py-5">
              The Core Offerings
            </h2>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {[
                {
                  id: "audition",
                  title: "Find Your Role",
                  desc: "Get instant access to verified audition calls from major production houses. Upload professional headshots, showreels, and vocal clips, and apply directly to roles that match your profile and passion.",
                  image: "/Audition.png",
                },
                {
                  id: "discover",
                  title: "Discover Star Power",
                  desc: "Streamline your search using the Star Registry. Filter through a curated database of verified talent, post private or public Production Briefs, and manage submissions efficiently.",
                  image: "/Director.png",
                },
                {
                  id: "integrity",
                  title: "The Integrity Seal",
                  desc: "Every audition call and every talent profile on StarCast is meticulously vetted and verified by our team. We ensure a safe, professional, and transparent environment for casting.",
                  image: "/Admin.png",
                },
              ].map((f) => (
                <div key={f.id} className="p-3">
                  <div
                    className="relative rounded-xl overflow-hidden shadow-lg mx-auto w-56 sm:w-64 md:w-72 h-64 sm:h-72 md:h-80 bg-center bg-cover border border-white/20"
                    style={{ backgroundImage: `url('${f.image}')` }}
                  >
                    <div className="absolute inset-0 bg-black/40 flex items-center justify-center p-4">
                      <div className="text-center text-white">
                        <h3 className="font-semibold text-lg sm:text-xl mb-2">
                          {f.title}
                        </h3>
                        <p className="text-sm sm:text-base opacity-95">
                          {f.desc}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>
      </div>

      {/* Registration Modal */}
      {showPhoneModal && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 overflow-y-auto p-4">
          <div className="bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 rounded-2xl p-6 max-w-2xl w-full mx-4 my-8 max-h-[90vh] overflow-y-auto border border-white/10 shadow-2xl">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-red-500 to-orange-500 flex items-center justify-center">
                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                </svg>
              </div>
              <div>
                <h2 className="text-2xl font-bold text-white">
                  Ready to Shine? ✨
                </h2>
                <p className="text-white/60 text-sm">Let's get you registered for this audition!</p>
              </div>
            </div>
            <form onSubmit={handlePhoneSubmit}>
              <div className="mb-5">
                <label className="block text-sm font-medium text-white/80 mb-2">
                  📱 Your Phone Number *
                </label>
                <input
                  type="tel"
                  required
                  placeholder="e.g., +91 98765 43210"
                  className="w-full px-4 py-3 bg-white/5 border border-white/20 rounded-xl text-white placeholder-white/40 focus:outline-none focus:ring-2 focus:ring-red-500/50 focus:border-red-500/50 transition-all duration-300"
                  value={phoneNumber}
                  onChange={(e) => setPhoneNumber(e.target.value)}
                  autoComplete="tel"
                />
              </div>

              {/* Photos Upload */}
              <div className="mb-5">
                <label className="block text-sm font-medium text-white/80 mb-2">
                  📷 Your Best Shots (Max 5, 5MB each)
                </label>
                <div className="relative">
                  <input
                    type="file"
                    accept="image/*"
                    multiple
                    onChange={handlePhotoChange}
                    className="w-full px-4 py-3 bg-white/5 border border-white/20 border-dashed rounded-xl text-white/70 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:bg-red-600 file:text-white file:cursor-pointer hover:file:bg-red-700 transition-all duration-300"
                  />
                </div>
                {photos.length > 0 && (
                  <div className="mt-3 grid grid-cols-3 sm:grid-cols-5 gap-2">
                    {photos.map((photo, index) => (
                      <div key={index} className="relative group">
                        <img
                          src={photo}
                          alt={`Preview ${index + 1}`}
                          className="w-full h-20 object-cover rounded-lg border border-white/20"
                        />
                        <button
                          type="button"
                          onClick={() => removePhoto(index)}
                          className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center text-xs hover:bg-red-600 shadow-lg transition-all"
                        >
                          ×
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Videos Upload */}
              <div className="mb-6">
                <label className="block text-sm font-medium text-white/80 mb-2">
                  🎬 Your Showreel (Max 3, 15MB each)
                </label>
                <input
                  type="file"
                  accept="video/*"
                  multiple
                  onChange={handleVideoChange}
                  className="w-full px-4 py-3 bg-white/5 border border-white/20 border-dashed rounded-xl text-white/70 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:bg-red-600 file:text-white file:cursor-pointer hover:file:bg-red-700 transition-all duration-300"
                />
                {videos.length > 0 && (
                  <div className="mt-3 space-y-3">
                    {videos.map((video, index) => (
                      <div key={index} className="relative bg-black/50 rounded-xl p-2 border border-white/10">
                        <video
                          src={video}
                          controls
                          className="w-full h-32 object-contain rounded-lg"
                        />
                        <button
                          type="button"
                          onClick={() => removeVideo(index)}
                          className="absolute top-1 right-1 bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center text-xs hover:bg-red-600 shadow-lg transition-all"
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
                    setPhoneNumber("");
                    setPhotos([]);
                    setVideos([]);
                    setSelectedTicketId(null);
                  }}
                  className="flex-1 px-4 py-3 bg-white/10 text-white rounded-xl hover:bg-white/20 transition-all duration-300 font-medium"
                >
                  Maybe Later
                </button>
                <button
                  type="submit"
                  disabled={uploading}
                  className="flex-1 px-4 py-3 bg-gradient-to-r from-red-600 to-orange-500 text-white rounded-xl hover:from-red-700 hover:to-orange-600 hover:shadow-lg hover:shadow-red-500/25 transition-all duration-300 font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {uploading ? (
                    <span className="flex items-center justify-center gap-2">
                      <svg className="animate-spin h-5 w-5" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      Submitting...
                    </span>
                  ) : (
                    "🚀 Submit Application"
                  )}
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
