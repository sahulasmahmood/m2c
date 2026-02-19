"use client";

import { useState, useEffect } from "react";
import { MapPin, Plus, Edit, Trash2, Save, X } from "lucide-react";
import { Card, CardContent } from "../../UI/Card";
import { showSuccessToast, showErrorToast } from "@/lib/toast-utils";

interface Hub {
  id: string;
  name: string;
  location: string;
  address: string;
  city: string;
  state: string;
  zipCode: string;
  phone: string;
  email: string;
  isActive: boolean;
}

export default function HubSettingsTab() {
  const [hubs, setHubs] = useState<Hub[]>([
    {
      id: "1",
      name: "Mumbai Hub",
      location: "Mumbai, Maharashtra",
      address: "123 Hub Street, Andheri",
      city: "Mumbai",
      state: "Maharashtra",
      zipCode: "400053",
      phone: "+91 22-1234-5678",
      email: "mumbai@hub.com",
      isActive: true,
    },
    {
      id: "2",
      name: "Delhi Hub",
      location: "New Delhi, Delhi",
      address: "456 Hub Road, Connaught Place",
      city: "New Delhi",
      state: "Delhi",
      zipCode: "110001",
      phone: "+91 11-1234-5678",
      email: "delhi@hub.com",
      isActive: true,
    },
    {
      id: "3",
      name: "Bangalore Hub",
      location: "Bangalore, Karnataka",
      address: "789 Hub Avenue, Koramangala",
      city: "Bangalore",
      state: "Karnataka",
      zipCode: "560034",
      phone: "+91 80-1234-5678",
      email: "bangalore@hub.com",
      isActive: true,
    },
  ]);

  const [showModal, setShowModal] = useState(false);
  const [editingHub, setEditingHub] = useState<Hub | null>(null);
  const [formData, setFormData] = useState<Partial<Hub>>({
    name: "",
    address: "",
    city: "",
    state: "",
    zipCode: "",
    phone: "",
    email: "",
    isActive: true,
  });
  const [isSaving, setIsSaving] = useState(false);

  const handleAddHub = () => {
    setEditingHub(null);
    setFormData({
      name: "",
      address: "",
      city: "",
      state: "",
      zipCode: "",
      phone: "",
      email: "",
      isActive: true,
    });
    setShowModal(true);
  };

  const handleEditHub = (hub: Hub) => {
    setEditingHub(hub);
    setFormData(hub);
    setShowModal(true);
  };

  const handleDeleteHub = (hubId: string) => {
    if (confirm("Are you sure you want to delete this hub?")) {
      setHubs(hubs.filter((h) => h.id !== hubId));
      showSuccessToast("Hub Deleted", "Hub has been deleted successfully");
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validation
    if (!formData.name || !formData.city || !formData.state) {
      showErrorToast("Validation Error", "Please fill in all required fields");
      return;
    }

    setIsSaving(true);

    try {
      // Simulate API call
      await new Promise((resolve) => setTimeout(resolve, 1000));

      if (editingHub) {
        // Update existing hub
        setHubs(
          hubs.map((h) =>
            h.id === editingHub.id
              ? {
                  ...h,
                  ...formData,
                  location: `${formData.city}, ${formData.state}`,
                }
              : h
          )
        );
        showSuccessToast("Hub Updated", "Hub has been updated successfully");
      } else {
        // Add new hub
        const newHub: Hub = {
          id: Date.now().toString(),
          name: formData.name!,
          location: `${formData.city}, ${formData.state}`,
          address: formData.address || "",
          city: formData.city!,
          state: formData.state!,
          zipCode: formData.zipCode || "",
          phone: formData.phone || "",
          email: formData.email || "",
          isActive: formData.isActive ?? true,
        };
        setHubs([...hubs, newHub]);
        showSuccessToast("Hub Added", "New hub has been added successfully");
      }

      setShowModal(false);
      setEditingHub(null);
      setFormData({
        name: "",
        address: "",
        city: "",
        state: "",
        zipCode: "",
        phone: "",
        email: "",
        isActive: true,
      });
    } catch (error) {
      showErrorToast("Error", "Failed to save hub. Please try again.");
    } finally {
      setIsSaving(false);
    }
  };

  const handleCancel = () => {
    setShowModal(false);
    setEditingHub(null);
    setFormData({
      name: "",
      address: "",
      city: "",
      state: "",
      zipCode: "",
      phone: "",
      email: "",
      isActive: true,
    });
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-gray-900">Hub Management</h2>
          <p className="text-sm text-gray-600 mt-1">
            Manage delivery hubs and their locations
          </p>
        </div>
        <button
          onClick={handleAddHub}
          className="flex items-center gap-2 bg-gray-900 hover:bg-gray-700 text-white font-semibold py-2 px-4 rounded-lg transition-colors"
        >
          <Plus className="h-4 w-4" />
          Add Hub
        </button>
      </div>

      {/* Hubs List */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {hubs.map((hub) => (
          <Card key={hub.id}>
            <CardContent className="p-6">
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-blue-100 rounded-lg">
                    <MapPin className="h-5 w-5 text-blue-600" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900">{hub.name}</h3>
                    <p className="text-sm text-gray-600">{hub.location}</p>
                  </div>
                </div>
                <span
                  className={`px-2 py-1 rounded-full text-xs font-medium ${
                    hub.isActive
                      ? "bg-green-100 text-green-800"
                      : "bg-gray-100 text-gray-800"
                  }`}
                >
                  {hub.isActive ? "Active" : "Inactive"}
                </span>
              </div>

              <div className="space-y-2 mb-4">
                <div>
                  <p className="text-xs text-gray-500">Address</p>
                  <p className="text-sm text-gray-900">{hub.address}</p>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <p className="text-xs text-gray-500">Phone</p>
                    <p className="text-sm text-gray-900">{hub.phone}</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500">ZIP Code</p>
                    <p className="text-sm text-gray-900">{hub.zipCode}</p>
                  </div>
                </div>
                <div>
                  <p className="text-xs text-gray-500">Email</p>
                  <p className="text-sm text-gray-900">{hub.email}</p>
                </div>
              </div>

              <div className="flex gap-2">
                <button
                  onClick={() => handleEditHub(hub)}
                  className="flex-1 flex items-center justify-center gap-2 px-3 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors text-sm"
                >
                  <Edit className="h-4 w-4" />
                  Edit
                </button>
                <button
                  onClick={() => handleDeleteHub(hub.id)}
                  className="flex-1 flex items-center justify-center gap-2 px-3 py-2 border border-red-300 text-red-700 rounded-lg hover:bg-red-50 transition-colors text-sm"
                >
                  <Trash2 className="h-4 w-4" />
                  Delete
                </button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {hubs.length === 0 && (
        <Card>
          <CardContent className="p-12 text-center">
            <MapPin className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              No Hubs Added
            </h3>
            <p className="text-gray-600 mb-4">
              Get started by adding your first delivery hub
            </p>
            <button
              onClick={handleAddHub}
              className="inline-flex items-center gap-2 bg-gray-900 hover:bg-gray-700 text-white font-semibold py-2 px-4 rounded-lg transition-colors"
            >
              <Plus className="h-4 w-4" />
              Add Hub
            </button>
          </CardContent>
        </Card>
      )}

      {/* Add/Edit Hub Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-gray-200 flex items-center justify-between">
              <div>
                <h2 className="text-xl font-bold text-gray-900">
                  {editingHub ? "Edit Hub" : "Add New Hub"}
                </h2>
                <p className="text-sm text-gray-600 mt-1">
                  {editingHub
                    ? "Update hub information"
                    : "Enter details for the new hub"}
                </p>
              </div>
              <button
                onClick={handleCancel}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <X className="h-5 w-5 text-gray-600" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Hub Name <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) =>
                      setFormData({ ...formData, name: e.target.value })
                    }
                    placeholder="e.g., Mumbai Hub"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-900 focus:border-transparent"
                    required
                  />
                </div>

                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Address
                  </label>
                  <input
                    type="text"
                    value={formData.address}
                    onChange={(e) =>
                      setFormData({ ...formData, address: e.target.value })
                    }
                    placeholder="Street address"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-900 focus:border-transparent"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    City <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={formData.city}
                    onChange={(e) =>
                      setFormData({ ...formData, city: e.target.value })
                    }
                    placeholder="City name"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-900 focus:border-transparent"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    State <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={formData.state}
                    onChange={(e) =>
                      setFormData({ ...formData, state: e.target.value })
                    }
                    placeholder="State name"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-900 focus:border-transparent"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    ZIP Code
                  </label>
                  <input
                    type="text"
                    value={formData.zipCode}
                    onChange={(e) =>
                      setFormData({ ...formData, zipCode: e.target.value })
                    }
                    placeholder="e.g., 400053"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-900 focus:border-transparent"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Phone
                  </label>
                  <input
                    type="tel"
                    value={formData.phone}
                    onChange={(e) =>
                      setFormData({ ...formData, phone: e.target.value })
                    }
                    placeholder="+91 XX-XXXX-XXXX"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-900 focus:border-transparent"
                  />
                </div>

                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Email
                  </label>
                  <input
                    type="email"
                    value={formData.email}
                    onChange={(e) =>
                      setFormData({ ...formData, email: e.target.value })
                    }
                    placeholder="hub@example.com"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-900 focus:border-transparent"
                  />
                </div>

                <div className="md:col-span-2">
                  <label className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={formData.isActive}
                      onChange={(e) =>
                        setFormData({ ...formData, isActive: e.target.checked })
                      }
                      className="h-4 w-4 text-gray-900 border-gray-300 rounded focus:ring-gray-900"
                    />
                    <span className="text-sm font-medium text-gray-700">
                      Active Hub
                    </span>
                  </label>
                  <p className="text-xs text-gray-500 ml-6">
                    Only active hubs will be available for order assignment
                  </p>
                </div>
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={handleCancel}
                  className="flex-1 px-6 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors font-medium"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSaving}
                  className="flex-1 flex items-center justify-center gap-2 bg-gray-900 hover:bg-gray-700 text-white font-semibold py-2 px-6 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <Save className="h-4 w-4" />
                  {isSaving ? "Saving..." : editingHub ? "Update Hub" : "Add Hub"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
