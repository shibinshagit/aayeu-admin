"use client";

import React, { useEffect, useMemo, useState } from "react";
import ViewCustomerModal from "@/components/_dialogs/ViewCustomer";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import CustomBreadcrumb from "@/components/_ui/breadcrumb";
import useAxios from "@/hooks/useAxios";
import { Spinner } from "@/components/_ui/spinner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { showToast } from "@/components/_ui/toast-utils";

const PAGE_SIZE = 10;

export default function CustomerPage() {
  const [isOpen, setIsOpen] = useState(false);
  const [selectedCustomerId, setSelectedCustomerId] = useState(null);
  const [customers, setCustomers] = useState([]);
  const [loading, setLoading] = useState(true);
  const { request } = useAxios();
  const [searchTerm, setSearchTerm] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const [hasNext, setHasNext] = useState(false);
  const [hasPrev, setHasPrev] = useState(false);

  useEffect(() => {
    const timeoutId = setTimeout(() => {
      setDebouncedSearch(searchTerm.trim());
      setPage(1);
    }, 500);

    return () => clearTimeout(timeoutId);
  }, [searchTerm]);

  // 🔹 Fetch customers
  const getCustomers = async (targetPage = 1) => {
    setLoading(true);
    try {
      const params = {
        page: targetPage,
        limit: PAGE_SIZE,
      };

      if (debouncedSearch) {
        params.search = debouncedSearch;
      }

      const { data, error } = await request({
        method: "GET",
        url: "/admin/get-all-customers",
        authRequired: true,
        params,
      });
      if (error) throw new Error(error?.message || error);
      // if (data.success) showToast("success", data.message);

      const customerList = data?.data?.customers || [];
      setCustomers(customerList);

      // Use backend pagination response
      const pagination = data?.data?.pagination || {};

      setTotalCount(pagination.total || 0);
      setTotalPages(pagination.pages || 1);
      setHasNext(pagination.hasNext || false);
      setHasPrev(pagination.hasPrev || false);

      // Update current page from backend response
      if (pagination.page && pagination.page !== page) {
        setPage(pagination.page);
      }
    } catch (err) {
      console.error("Error fetching customers:", err);
      showToast("error", err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    getCustomers(page);
  }, [debouncedSearch, page]);

  const showingRange = useMemo(() => {
    if (totalCount === 0) return null;
    const start = (page - 1) * PAGE_SIZE + 1;
    const end = Math.min(start + customers.length - 1, totalCount);
    return { start, end };
  }, [page, customers.length, totalCount]);

  const handlePageChange = (newPage) => {
    if (newPage < 1 || newPage > totalPages || newPage === page) return;
    setPage(newPage);
  };

  const handleRefresh = () => {
    getCustomers(page);
  };

  return (
    <div className="p-6 space-y-6">
      <CustomBreadcrumb />

      <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900">Customers</h1>
          {showingRange && (
            <p className="text-sm text-muted-foreground mt-1">
              Showing {showingRange.start}-{showingRange.end} of {totalCount} customers
            </p>
          )}
        </div>
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
          <Input
            placeholder="Search customers..."
            value={searchTerm}
            onChange={(event) => setSearchTerm(event.target.value)}
            className="w-full sm:w-[220px] md:w-[260px]"
          />
          <Button onClick={handleRefresh}>Refresh</Button>
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center items-center h-40 text-gray-600">
          <Spinner className="w-8 h-8 mr-2" />
          <span>Loading customers...</span>
        </div>
      ) : customers.length === 0 ? (
        <p className="text-center text-gray-500 py-10">No customers found</p>
      ) : (
        <div className="space-y-4">
          <div className="overflow-x-auto border rounded-xl bg-white shadow-sm">
            <Table>
              <TableHeader>
                <TableRow className="bg-gray-100">
                  <TableHead className="w-[180px]">Name</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Phone</TableHead>
                  <TableHead>Joined</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="w-[120px] text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {customers.map((cust) => (
                  <TableRow key={cust.id} className="hover:bg-gray-50 transition-all">
                    <TableCell className="font-medium">
                      {cust.full_name || "N/A"}
                    </TableCell>
                    <TableCell>{cust.email || "N/A"}</TableCell>
                    <TableCell>{cust.phone || "N/A"}</TableCell>
                    <TableCell>
                      {cust.created_at
                        ? new Date(cust.created_at).toLocaleDateString("en-GB")
                        : "—"}
                    </TableCell>
                    <TableCell>
                      <Badge
                        className={
                          cust.is_active
                            ? "bg-green-600 hover:bg-green-700"
                            : "bg-red-600 hover:bg-red-700"
                        }
                      >
                        {cust.is_active ? "Active" : "Inactive"}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <Button
                        variant="outline"
                        onClick={() => {
                          setSelectedCustomerId(cust.id);
                          setIsOpen(true);
                        }}
                      >
                        View
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
          {totalPages > 0 && (
            <div className="flex justify-center gap-2 pt-2">
              <Button
                className="cursor-pointer"
                variant="outline"
                disabled={!hasPrev}
                onClick={() => handlePageChange(page - 1)}
              >
                Prev
              </Button>
              <span className="px-3 py-2">
                Page {page} of {totalPages}
              </span>
              <Button
                className="cursor-pointer"
                variant="outline"
                disabled={!hasNext}
                onClick={() => handlePageChange(page + 1)}
              >
                Next
              </Button>
            </div>
          )}
        </div>
      )}

      <ViewCustomerModal
        isOpen={isOpen}
        onClose={() => setIsOpen(false)}
        customerId={selectedCustomerId}
      />
    </div>
  );
}
