import React, { useEffect, useState } from "react";
import PageWrapper from "../../components/layout/PageWrapper";
import api from "../../api/axios";
import DRStageBadge from "../../components/shared/DRStageBadge";
import { formatDate } from "../../utils/helpers";
import { useNavigate } from "react-router-dom";
import { Search, PlusCircle, ChevronLeft, ChevronRight } from "lucide-react";

const Patients = () => {
  const navigate = useNavigate();
  const [patients, setPatients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  const fetchPatients = async (p = page, s = search) => {
    setLoading(true);
    try {
      const res = await api.get(`/patients/?page=${p}&limit=10&search=${s}`);
      setPatients(res.data.items || []);
      setTotalPages(res.data.pages || 1);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPatients();
  }, [page]);

  const handleSearch = (e) => {
    e.preventDefault();
    setPage(1);
    fetchPatients(1, search);
  };

  return (
    <PageWrapper title="Patients">
      {/* Top Bar */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
        <form onSubmit={handleSearch} className="flex items-center bg-white rounded-lg shadow-card px-3 py-2 w-full sm:w-auto">
          <Search size={18} className="text-gray-400 mr-2" />
          <input
            type="text"
            placeholder="Search patients..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="border-none outline-none bg-transparent text-sm w-64"
          />
        </form>
        <button
          onClick={() => navigate("/patients/new")}
          className="flex items-center px-4 py-2 bg-cyprus text-white rounded-lg hover:bg-cyprus-light transition-colors text-sm font-medium"
        >
          <PlusCircle size={18} className="mr-2" /> Add Patient
        </button>
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl shadow-card overflow-hidden">
        {loading ? (
          <div className="flex justify-center py-16">
            <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-cyprus"></div>
          </div>
        ) : patients.length === 0 ? (
          <div className="text-center py-16 text-gray-400">
            <p className="text-lg">No patients found</p>
            <p className="text-sm mt-1">Add your first patient to get started</p>
          </div>
        ) : (
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-sand">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Name</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">DOB</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Diabetes Type</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Phone</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {patients.map((patient, idx) => (
                <tr key={patient.id} className={idx % 2 === 0 ? "bg-white" : "bg-sand-light"}>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{patient.full_name}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{formatDate(patient.date_of_birth)}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 capitalize">{patient.diabetes_type || "—"}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{patient.phone || "—"}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm">
                    <button
                      onClick={() => navigate(`/patients/${patient.id}`)}
                      className="text-accent hover:text-cyprus font-medium transition-colors"
                    >
                      View
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex justify-center items-center mt-6 space-x-4">
          <button
            onClick={() => setPage(Math.max(1, page - 1))}
            disabled={page === 1}
            className="p-2 bg-white rounded-lg shadow-card disabled:opacity-30 hover:bg-sand transition-colors"
          >
            <ChevronLeft size={18} />
          </button>
          <span className="text-sm text-gray-600">Page {page} of {totalPages}</span>
          <button
            onClick={() => setPage(Math.min(totalPages, page + 1))}
            disabled={page === totalPages}
            className="p-2 bg-white rounded-lg shadow-card disabled:opacity-30 hover:bg-sand transition-colors"
          >
            <ChevronRight size={18} />
          </button>
        </div>
      )}
    </PageWrapper>
  );
};

export default Patients;
