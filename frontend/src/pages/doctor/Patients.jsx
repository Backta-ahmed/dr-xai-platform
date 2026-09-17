import React, { useCallback, useState } from "react";
import { useNavigate } from "react-router-dom";
import { ChevronLeft, ChevronRight, PlusCircle, Search } from "lucide-react";

import PageWrapper from "../../components/layout/PageWrapper";
import ErrorState from "../../components/shared/ErrorState";
import Button from "../../components/ui/Button";
import Card from "../../components/ui/Card";
import { PAGE_SIZE, TBody, TableShell, Td, Th, Tr } from "../../components/ui/DataTable";
import { controlClass } from "../../components/ui/Field";
import { LoadingPanel } from "../../components/ui/Spinner";
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
        .get("/patients/", { params: { page, limit: PAGE_SIZE, search: query || undefined } })
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
  const total = data?.total;

  const handleSearch = (e) => {
    e.preventDefault();
    setPage(1);
    setQuery(search.trim());
  };

  return (
    <PageWrapper title="Patients">
      <div className="mb-3 flex flex-col items-stretch gap-2 sm:flex-row sm:items-center sm:justify-between">
        <form onSubmit={handleSearch} role="search" className="relative w-full sm:w-72">
          <Search
            size={15}
            className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-gray-500"
            aria-hidden="true"
          />
          <input
            type="search"
            placeholder="Search patients…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            maxLength={100}
            aria-label="Search patients by name"
            className={`${controlClass} pl-9`}
          />
        </form>
        <Button variant="primary" onClick={() => navigate("/patients/new")}>
          <PlusCircle size={16} aria-hidden="true" />
          Add patient
        </Button>
      </div>

      <Card padding="none">
        {loading ? (
          <LoadingPanel label="Loading patients" />
        ) : error ? (
          <ErrorState message={error} onRetry={load} />
        ) : patients.length === 0 ? (
          <div className="px-6 py-14 text-center">
            <p className="text-base font-medium text-gray-900">
              {query ? `No patients match “${query}”.` : "No patients yet"}
            </p>
            <p className="mt-1 text-sm text-gray-600">
              {query ? "Try a different name." : "Add your first patient to get started."}
            </p>
          </div>
        ) : (
          <TableShell>
            <thead>
              <tr>
                <Th>Name</Th>
                <Th>Date of birth</Th>
                <Th>Diabetes type</Th>
                <Th>Phone</Th>
                <Th>Actions</Th>
              </tr>
            </thead>
            <TBody>
              {patients.map((patient, i) => (
                <Tr key={patient.id} index={i}>
                  <Td nowrap className="font-medium text-gray-900">
                    {patient.full_name}
                  </Td>
                  <Td nowrap className="tabular">
                    {formatDate(patient.date_of_birth)}
                  </Td>
                  <Td nowrap className="capitalize">
                    {patient.diabetes_type || "—"}
                  </Td>
                  <Td nowrap className="tabular">
                    {patient.phone || "—"}
                  </Td>
                  <Td nowrap>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => navigate(`/patients/${patient.id}`)}
                    >
                      View
                    </Button>
                  </Td>
                </Tr>
              ))}
            </TBody>
          </TableShell>
        )}
      </Card>

      {!loading && !error && patients.length > 0 && (
        <div className="mt-3 flex flex-wrap items-center justify-between gap-3">
          <p className="tabular text-xs text-gray-600">
            {total != null
              ? `${total} patient${total === 1 ? "" : "s"} · showing ${patients.length}`
              : `${patients.length} shown`}
          </p>
          {totalPages > 1 && (
            <div className="flex items-center gap-2">
              <Button
                variant="secondary"
                size="sm"
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page === 1}
                aria-label="Previous page"
              >
                <ChevronLeft size={15} aria-hidden="true" />
              </Button>
              <span className="tabular text-xs text-gray-700">
                Page {page} of {totalPages}
              </span>
              <Button
                variant="secondary"
                size="sm"
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                disabled={page === totalPages}
                aria-label="Next page"
              >
                <ChevronRight size={15} aria-hidden="true" />
              </Button>
            </div>
          )}
        </div>
      )}
    </PageWrapper>
  );
};

export default Patients;
