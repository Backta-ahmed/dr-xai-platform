import React, { useCallback, useState } from "react";
import { useNavigate } from "react-router-dom";
import { ChevronLeft, ChevronRight, PlusCircle, Search } from "lucide-react";

import PageWrapper from "../../components/layout/PageWrapper";
import ErrorState from "../../components/shared/ErrorState";
import api from "../../api/axios";
import { useFetch } from "../../hooks/useFetch";
import { formatDate } from "../../utils/helpers";

const Patients = () => {
  const navigate = useNavigate();

  // `query` is what has actually been submitted; `search` is the input value.
  // Keeping them separate means typing does not refetch.
  const [search, setSearch] = useState("");
  const [query, setQuery] = useState("");
  const [page, setPage] = useState(1);

  const fetchPatients = useCallback(
    () =>
      // params, not string interpolation: a name containing & or # used to
      // corrupt the query string.
      api
        .get("/patients/", { params: { page, limit: 10, search: query || undefined } })
        .then((r) => r.data),
    [page, query]
  );

  const { data, loading, error, reload: load } = useFetch(
    fetchPatients,
    [page, query],
    "Could not load your patients."
  );

  const patients = data?.items ?? [];
  const totalPages = data?.pages ?? 1;

  const handleSearch = (e) => {
    e.preventDefault();
    setPage(1);
    setQuery(search.trim());
  };

  return (
    <PageWrapper title="Patients">
      <div className="mb-6 flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-center">
        <form
          onSubmit={handleSearch}
          className="flex w-full items-center rounded-lg bg-white px-3 py-2 shadow-card sm:w-auto"
          role="search"
        >
          <Search size={18} className="mr-2 text-gray-500" aria-hidden="true" />
          <input
            type="search"
            placeholder="Search patients…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            maxLength={100}
            aria-label="Search patients by name"
            className="w-full border-none bg-transparent text-sm outline-none sm:w-64"
          />
        </form>
        <button
          onClick={() => navigate("/patients/new")}
          className="flex items-center rounded-lg bg-cyprus px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-cyprus-light"
        >
          <PlusCircle size={18} className="mr-2" aria-hidden="true" /> Add patient
        </button>
      </div>

      <div className="rounded-xl bg-white shadow-card">
        {loading ? (
          <div className="flex justify-center py-16">
            <div
              role="status"
              aria-label="Loading"
              className="h-10 w-10 animate-spin rounded-full border-b-2 border-t-2 border-cyprus"
            />
          </div>
        ) : error ? (
          <ErrorState message={error} onRetry={load} />
        ) : patients.length === 0 ? (
          <div className="py-16 text-center">
            <p className="text-lg text-gray-700">
              {query ? `No patients match “${query}”.` : "No patients yet"}
            </p>
            <p className="mt-1 text-sm text-gray-600">
              {query ? "Try a different name." : "Add your first patient to get started."}
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-sand">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-700">Name</th>
                  <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-700">Date of birth</th>
                  <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-700">Diabetes type</th>
                  <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-700">Phone</th>
                  <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-700">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {patients.map((patient, idx) => (
                  <tr key={patient.id} className={idx % 2 === 0 ? "bg-white" : "bg-sand-light"}>
                    <td className="whitespace-nowrap px-6 py-4 text-sm font-medium text-gray-900">
                      {patient.full_name}
                    </td>
                    <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-600">
                      {formatDate(patient.date_of_birth)}
                    </td>
                    <td className="whitespace-nowrap px-6 py-4 text-sm capitalize text-gray-600">
                      {patient.diabetes_type || "—"}
                    </td>
                    <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-600">
                      {patient.phone || "—"}
                    </td>
                    <td className="whitespace-nowrap px-6 py-4 text-sm">
                      <button
                        onClick={() => navigate(`/patients/${patient.id}`)}
                        className="font-medium text-accent transition-colors hover:text-cyprus"
                      >
                        View
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {!loading && !error && totalPages > 1 && (
        <div className="mt-6 flex items-center justify-center space-x-4">
          <button
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            disabled={page === 1}
            className="rounded-lg bg-white p-2 shadow-card transition-colors hover:bg-sand disabled:opacity-30"
            aria-label="Previous page"
          >
            <ChevronLeft size={18} />
          </button>
          <span className="text-sm text-gray-700">
            Page {page} of {totalPages}
          </span>
          <button
            onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
            disabled={page === totalPages}
            className="rounded-lg bg-white p-2 shadow-card transition-colors hover:bg-sand disabled:opacity-30"
            aria-label="Next page"
          >
            <ChevronRight size={18} />
          </button>
        </div>
      )}
    </PageWrapper>
  );
};

export default Patients;
