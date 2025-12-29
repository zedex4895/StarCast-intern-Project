import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { useAuth } from "../context/AuthContext";

const MyRegistrationsPage = () => {
  const [registrations, setRegistrations] = useState([]);
  const [loading, setLoading] = useState(true);
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!user || user.role !== "user") {
      navigate("/");
      return;
    }
    fetchRegistrations();
  }, [user, navigate]);

  const fetchRegistrations = async () => {
    try {
      const response = await axios.get(
        "http://localhost:5001/api/casting/user/registrations"
      );
      setRegistrations(response.data || []);
    } catch (error) {
      console.error("Error fetching registrations:", error);
      const errorMessage =
        error.response?.data?.message ||
        error.message ||
        "Failed to fetch registrations";
      console.error("Error details:", {
        status: error.response?.status,
        message: errorMessage,
        data: error.response?.data,
      });
      alert(`Failed to fetch registrations: ${errorMessage}`);
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadge = (status) => {
    const statusConfig = {
      pending: {
        bg: "bg-yellow-100",
        text: "text-yellow-800",
        label: "Pending",
      },
      approved: {
        bg: "bg-green-100",
        text: "text-green-800",
        label: "Approved ✓",
      },
      rejected: { bg: "bg-red-100", text: "text-red-800", label: "Rejected ✗" },
    };

    const config = statusConfig[status] || statusConfig.pending;
    return (
      <span
        className={`px-3 py-1 rounded-full text-sm font-medium ${config.bg} ${config.text}`}
      >
        {config.label}
      </span>
    );
  };

  return (
    <div className="min-h-screen relative overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-br from-black via-[#0f0f0f] to-black" />

      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,#dc2626_0%,transparent_30%)] opacity-40" />

      {/* CONTENT WRAPPER */}
      <div className="relative">
        {/* NAVBAR */}
        <nav className="bg-black/60 backdrop-blur shadow border-b border-white/10">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between h-16 items-center">
              <div className="text-2xl font-extrabold text-red-600 tracking-wide">
                StarCast
              </div>

              {/* TEXT LINKS */}
              <div className="flex gap-6 items-center text-sm font-semibold">
                <span
                  onClick={() => navigate("/")}
                  className="cursor-pointer text-gray-200 hover:text-red-500 hover:underline underline-offset-4 transition"
                >
                  Home
                </span>

                <span
                  onClick={() => navigate("/profile")}
                  className="cursor-pointer text-gray-200 hover:text-red-500 hover:underline underline-offset-4 transition"
                >
                  Profile
                </span>

                <span
                  onClick={() => {
                    logout();
                    navigate("/");
                  }}
                  className="cursor-pointer text-gray-200 hover:text-red-600 hover:underline underline-offset-4 transition"
                >
                  Logout
                </span>
              </div>
            </div>
          </div>
        </nav>

        {/* MAIN SECTION */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
          <h1 className="text-4xl font-extrabold text-white mb-8">
            My Audition Registrations
          </h1>

          {loading ? (
            <div className="text-center py-12">
              <div className="text-xl text-gray-300">
                Loading your registrations...
              </div>
            </div>
          ) : registrations.length === 0 ? (
            <div className="text-center py-12 bg-white/95 rounded-xl shadow border border-gray-200">
              <div className="text-xl text-gray-800 font-semibold mb-2">
                No registrations yet 🙂
              </div>

              <div className="text-sm text-gray-600 mb-6">
                Register for auditions to see them here.
              </div>

              <span
                onClick={() => navigate("/")}
                className="cursor-pointer text-red-600 font-bold hover:text-red-700 hover:underline underline-offset-4 transition"
              >
                Browse Auditions →
              </span>
            </div>
          ) : (
            <div className="space-y-6">
              {registrations.map((registration) => {
                const ticket = registration.ticket;
                const status = registration.status || "pending";

                return (
                  <div
                    key={registration._id}
                    className="bg-white rounded-xl shadow border border-gray-200"
                  >
                    <div className="p-6">
                      <div className="flex justify-between items-start mb-4">
                        <div className="flex-1">
                          <h2 className="text-2xl font-bold text-gray-900 mb-2">
                            {ticket?.title || "Unknown Audition"}
                          </h2>

                          <p className="text-gray-600 mb-4">
                            {ticket?.description || ""}
                          </p>
                        </div>

                        <div className="ml-4">{getStatusBadge(status)}</div>
                      </div>

                      {ticket?.images?.length > 0 && (
                        <div className="mb-4">
                          <img
                            src={ticket.images[0]}
                            alt={ticket?.title}
                            className="w-full h-60 object-cover rounded-lg"
                            onError={(e) => (e.target.style.display = "none")}
                          />
                        </div>
                      )}

                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                        <div>
                          <div className="text-sm font-medium text-gray-500">
                            Category
                          </div>
                          <div className="text-lg text-gray-900 capitalize">
                            {ticket?.category || "N/A"}
                          </div>
                        </div>

                        <div>
                          <div className="text-sm font-medium text-gray-500">
                            Location
                          </div>
                          <div className="text-lg text-gray-900">
                            {ticket?.location || "N/A"}
                          </div>
                        </div>

                        <div>
                          <div className="text-sm font-medium text-gray-500">
                            Date
                          </div>
                          <div className="text-lg text-gray-900">
                            {ticket?.date
                              ? new Date(ticket.date).toLocaleDateString()
                              : "N/A"}
                          </div>
                        </div>

                        <div>
                          <div className="text-sm font-medium text-gray-500">
                            Registered On
                          </div>
                          <div className="text-lg text-gray-900">
                            {registration?.registeredAt
                              ? new Date(
                                  registration.registeredAt
                                ).toLocaleDateString()
                              : "N/A"}
                          </div>
                        </div>
                      </div>

                      <div
                        className={`mt-4 p-4 rounded-lg ${
                          status === "approved"
                            ? "bg-red-50 border border-red-200"
                            : status === "rejected"
                            ? "bg-gray-100 border border-gray-300"
                            : "bg-yellow-50 border border-yellow-200"
                        }`}
                      >
                        <div
                          className={`font-semibold ${
                            status === "approved"
                              ? "text-red-700"
                              : status === "rejected"
                              ? "text-gray-700"
                              : "text-yellow-800"
                          }`}
                        >
                          {status === "approved" &&
                            " Your registration has been approved. The casting director will contact you soon."}

                          {status === "rejected" &&
                            "Your registration has been rejected. You can try registering for other auditions."}

                          {status === "pending" &&
                            " Your registration is pending review."}
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default MyRegistrationsPage;
