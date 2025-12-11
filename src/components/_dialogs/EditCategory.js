"use client";

import React, { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import useAxios from "@/hooks/useAxios";
import { showToast } from "@/components/_ui/toast-utils";

const EditCategoryModal = ({ category, open, onClose, onSuccess }) => {
  const { request } = useAxios();
  const [form, setForm] = useState({
    name: "",
    slug: "",
    is_active: true,
    priority: 0, // ✅ numeric type
  });
  const [loading, setLoading] = useState(false);

  // ✅ Load initial data
  useEffect(() => {
    if (category) {
      setForm({
        name: category.name || "",
        slug: category.slug || "",
        is_active: category.is_active ?? true,
        priority: Number(category.priority) || 0, // ✅ ensure number type
      });
    }
  }, [category]);

  // ✅ Handle form changes
  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setForm((prev) => ({
      ...prev,
      [name]:
        type === "checkbox"
          ? checked
          : name === "priority"
          ? Number(value) || 0
          : value,
    }));
  };

  // ✅ Auto-generate slug from name
  useEffect(() => {
    const generatedSlug = form.name
      .toLowerCase()
      .trim()
      .replace(/\s+/g, "-")
      .replace(/[^a-z0-9\-]/g, "");
    setForm((prev) => ({ ...prev, slug: generatedSlug }));
  }, [form.name]);

  // ✅ Submit
  const handleSubmit = async () => {
    setLoading(true);
    try {
      if (!form.name.trim()) throw new Error("Category name is required");
      if (!form.slug.trim()) throw new Error("Slug is required");

      const payload = {
        category_id: category.id,
        name: form.name,
        slug: form.slug,
        is_active: form.is_active,
        priority: form.priority,
        parent_id: category.parent_id || null,
        metadata: category.metadata || null,
      };

      console.log("➡️ Payload being sent:", payload);

    const { data, error } = await request({
      method: "PUT",
      url: "/admin/update-category",  // ✅ backend URL
      payload: payload,
      authRequired: true,
    });

  if (error) throw new Error(error?.message || error);
 if(data.success) showToast("success", data.message );
    onSuccess && onSuccess(data.data); // backend ka data
    onClose();
  } catch (err) {
    showToast("error", err.message || "Update failed");
  } finally {
    setLoading(false);
  }
};

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Edit Category</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* Name */}
          <div>
            <label className="block mb-1 font-medium">Category Name</label>
            <Input
              name="name"
              value={form.name}
              onChange={handleChange}
              placeholder="Category Name"
            />
          </div>

          {/* Slug */}
          <div>
            <label className="block mb-1 font-medium">
              Slug (Auto-Generated)
            </label>
            <Input
              name="slug"
              value={form.slug}
              readOnly
              className="bg-gray-100"
            />
          </div>

          {/* Priority */}
          <div>
            <label className="block mb-1 font-medium">Priority</label>
            <Input
              name="priority"
              type="number"
              min="0"
              value={form.priority}
              onChange={handleChange}
              placeholder="Enter numeric priority"
            />
          </div>

          {/* Active */}
          <div className="flex items-center space-x-2">
            <input
              type="checkbox"
              name="is_active"
              checked={form.is_active}
              onChange={handleChange}
              id="is_active"
            />
            <label htmlFor="is_active">Active</label>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button onClick={handleSubmit} disabled={loading}>
            {loading ? "Saving..." : "Save"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default EditCategoryModal;
