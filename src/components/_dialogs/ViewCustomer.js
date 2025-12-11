"use client";

import React, { useEffect, useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import useAxios from "@/hooks/useAxios";
import { Spinner } from "@/components/_ui/spinner";
import { Card, CardContent } from "@/components/ui/card";
import { showToast } from "@/components/_ui/toast-utils";
export default function ViewCustomerModal({ isOpen, onClose, customerId }) {
  const [customer, setCustomer] = useState(null);
  const [loading, setLoading] = useState(false);
  const { request } = useAxios();

  useEffect(() => {
    if (isOpen && customerId) {
      getCustomerDetails();
    }
  }, [isOpen, customerId]);

  const getCustomerDetails = async () => {
    setLoading(true);
    try {
      const { data, error } = await request({
        method: "GET",
        url: `/admin/get-customer-by-id?customerId=${customerId}`,
        authRequired: true,
      });

     if (error) throw new Error(error?.message || error);
     if(data.success) showToast("success", data.message );
      setCustomer(data?.data);
    } catch (err) {
      console.error("Error fetching customer:", err);
      showToast("error", err.message || "Failed to fetch customer details");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      {/* <DialogContent className="max-w-2xl rounded-2xl p-6 max-h-screen overflow-y-auto"> */}
      <DialogContent className="sm:max-w-2xl max-h-[85vh] overflow-y-auto rounded-none border border-border bg-background p-6 shadow-lg">

        <DialogHeader>
          <DialogTitle className="text-2xl font-semibold text-gray-900">
            👤 Customer Details
          </DialogTitle>
          <DialogDescription className="text-gray-500">
            Complete information about the selected customer.
          </DialogDescription>
        </DialogHeader>

        {loading ? (
          <div className="flex justify-center items-center h-40 text-gray-600">
            <Spinner className="w-8 h-8 mr-2" />
            <span className="text-base">Loading customer details...</span>
          </div>
        ) : customer ? (
          <div className="space-y-6 mt-4">
            {/* 🧠 Basic Details Section */}
            <Card className="border border-gray-200 shadow-sm">
              <CardContent className="p-5">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">
                  Basic Information
                </h3>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-gray-500">Full Name</p>
                    <p className="font-medium text-gray-900">
                      {customer.full_name || "N/A"}
                    </p>
                  </div>

                  <div>
                    <p className="text-sm text-gray-500">Email</p>
                    <p className="font-medium text-gray-900">
                      {customer.email || "N/A"}
                    </p>
                  </div>

                  <div>
                    <p className="text-sm text-gray-500">Phone</p>
                    <p className="font-medium text-gray-900">
                      {customer.phone || "N/A"}
                    </p>
                  </div>

                  <div>
                    <p className="text-sm text-gray-500">Status</p>
                    <Badge
                      className={`${
                        customer.is_active
                          ? "bg-green-600 hover:bg-green-700"
                          : "bg-red-600 hover:bg-red-700"
                      } text-white`}
                    >
                      {customer.is_active ? "Active" : "Inactive"}
                    </Badge>
                  </div>

                  <div>
                    <p className="text-sm text-gray-500">Joined On</p>
                    <p className="font-medium text-gray-900">
                      {new Date(customer.created_at).toLocaleDateString("en-GB")}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* 🏠 Address Section */}
            {customer.addresses?.length > 0 && (
              <Card className="border border-gray-200 shadow-sm">
                <CardContent className="p-5">
                  <h3 className="text-lg font-semibold text-gray-900 mb-3">
                    Addresses
                  </h3>
                  <div className="space-y-3">
                    {customer.addresses.map((addr) => (
                      <Card
                        key={addr.id}
                        className="border border-gray-200 hover:shadow-md transition-all duration-200"
                      >
                        <CardContent className="p-4 space-y-2">
                          <div className="flex justify-between items-center">
                            <p className="font-medium text-gray-900">
                              {addr.label || "Address"}
                            </p>
                            {addr.is_default && (
                              <Badge className="bg-blue-600 text-white">
                                Default
                              </Badge>
                            )}
                          </div>
                          <div className="text-sm text-gray-700 leading-relaxed">
                            <p>{addr.street || "N/A"}</p>
                            <p>
                              {addr.city}, {addr.state}, {addr.country} -{" "}
                              {addr.postal_code}
                            </p>
                            <p>
                              <span className="text-gray-500">Mobile:</span>{" "}
                              {addr.mobile || "N/A"}
                            </p>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        ) : (
          <p className="text-center text-gray-500 py-10">
            No customer details found.
          </p>
        )}

        <DialogFooter className="mt-4">
          <Button
            variant="outline"
            onClick={onClose}
            className="border-gray-300 text-gray-700 hover:bg-gray-100"
          >
            Close
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
