import React, { useEffect, useState } from "react";
import PageWrapper from "../../components/layout/PageWrapper";
import api from "../../api/axios";
import { formatDate } from "../../utils/helpers";
import toast from "react-hot-toast";
import { PlusCircle, X } from "lucide-react";

const ManageDoctors = () => {
  const [doctors, setDoctors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState({ full_name: "", email: "", password: "" });
  const [submitting, setSubmitting] = useState(false);

  const fetchDoctors = async () => {
    try {
      const res = await api.get("/admin/doctors");
      setDoctors(res.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchDoctors(); }, []);

  const handleAddDoctor = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      await api.post("/admin/doctors", { ...form, role: "doctor" });
      toast.success("Doctor added successfully");
      setShowModal(false);
      setForm({ full_name: "", email: "", password: "" });
      fetchDoctors();
    } catch (err) {
      toast.error(err.response?.data?.detail || "Failed to add doctor");
    } finally {
      setSubmitting(false);
    }
  };

  const toggleActive = async (doctor) => {
    try {
      await api.put(`/admin/doctors/${doctor.id}`, { is_active: !doctor.is_active });
      toast.success(`Doctor ${doctor.is_active ? "deactivated" : "activated"}`);
      fetchDoctors();
    } catch (err) {
      toast.error("Failed to update");
    }
  };

  const inputClass = "mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-accent focus:border-accent text-sm";

  return (
    <PageWrapper title="Manage Doctors">
      <div className="flex justify-end mb-6">
        <button onClick={() => setShowModal(true)} className="flex items-center px-4 py-2 bg-cyprus text-white rounded-lg hover:bg-cyprus-light transition-colors text-sm font-medium">
          <PlusCircle size={18} className="mr-2" /> Add Doctor
        </button>
      </div>

      <div className="bg-white rounded-xl shadow-card overflow-hidden">
        {loading ? (
          <div className="flex justify-center py-16">
            <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-cyprus"></div>
          </div>
        ) : doctors.length === 0 ? (
          <p className="text-gray-400 text-center py-16">No doctors registered yet</p>
        ) : (
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-sand">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Name</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Email</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Created</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {doctors.map((doc, idx) => (
                <tr key={doc.id} className={idx % 2 === 0 ? "bg-white" : "bg-sand-light"}>
                  <td className="px-6 py-4 text-sm font-medium text-gray-900">{doc.full_name}</td>
                  <td className="px-6 py-4 text-sm text-gray-500">{doc.email}</td>
                  <td className="px-6 py-4">
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${doc.is_active ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"}`}>
                      {doc.is_active ? "Active" : "Inactive"}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-500">{formatDate(doc.created_at)}</td>
                  <td className="px-6 py-4 text-sm">
                    <button onClick={() => toggleActive(doc)} className="text-accent hover:text-cyprus font-medium transition-colors">
                      {doc.is_active ? "Deactivate" : "Activate"}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Add Doctor Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <div className="bg-white rounded-2xl shadow-modal w-full max-w-md p-8 relative">
            <button onClick={() => setShowModal(false)} className="absolute top-4 right-4 text-gray-400 hover:text-gray-600">
              <X size={20} />
            </button>
            <h3 className="text-lg font-semibold text-gray-900 mb-6">Add New Doctor</h3>
            <form onSubmit={handleAddDoctor} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">Full Name *</label>
                <input type="text" required value={form.full_name} onChange={(e) => setForm({ ...form, full_name: e.target.value })} className={inputClass} />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Email *</label>
                <input type="email" required value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} className={inputClass} />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Password *</label>
                <input type="password" required minLength={8} value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} className={inputClass} />
              </div>
              <div className="flex justify-end space-x-3 pt-2">
                <button type="button" onClick={() => setShowModal(false)} className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors text-sm">Cancel</button>
                <button type="submit" disabled={submitting} className="px-6 py-2 bg-cyprus text-white rounded-lg hover:bg-cyprus-light disabled:opacity-50 transition-colors text-sm font-medium">
                  {submitting ? "Adding..." : "Add Doctor"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </PageWrapper>
  );
};

export default ManageDoctors;
