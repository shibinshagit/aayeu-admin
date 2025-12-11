"use client";

import React from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogClose,
} from "@/components/ui/dialog";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "react-hot-toast";
import useAxios from "@/hooks/useAxios";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { showToast } from "@/components/_ui/toast-utils";

// ✅ Zod schema
const categorySchema = z.object({
  name: z.string().min(1, "Category Name is required"),
  slug: z.string().min(1, "Slug is required"),
  metadata: z.object({
    icon: z.string().min(1, "Metadata Icon is required"),
  }),
  priority: z
    .string()
    .min(1, "Priority is required")
    .refine((val) => !isNaN(Number(val)), "Priority must be a number"),
  selectedCategory: z.string().optional(),
});

const AddCategoryModel = ({ open, onClose, onSuccess, categories = [], preselectCategoryId = "" }) => {
  const { request } = useAxios();

  const {
    handleSubmit,
    control,
    watch,
    setValue,
    formState: { errors },
    reset,
  } = useForm({
    resolver: zodResolver(categorySchema),
    defaultValues: {
      name: "",
      slug: "",
      metadata: { icon: "" },
      priority: "",
      selectedCategory: "",
    },
  });

  const nameValue = watch("name");

  // When modal opens or preselect changes, set selectedCategory
  React.useEffect(() => {
    if (open) {
      setValue("selectedCategory", preselectCategoryId || "");
    }
  }, [open, preselectCategoryId, setValue]);

  // ✅ Auto-generate slug
  React.useEffect(() => {
    const generatedSlug = nameValue
      .toLowerCase()
      .trim()
      .replace(/\s+/g, "-")
      .replace(/[^a-z0-9\-]/g, "");
    setValue("slug", generatedSlug);
  }, [nameValue, setValue]);

  const onSubmit = async (data) => {
    try {
      const payload = {
        name: data.name,
        slug: data.slug,
        metadata: data.metadata,
        priority: Number(data.priority),
        parent_id: data.selectedCategory || null,
      };

      const { data: response, error } = await request({
        method: "POST",
        url: "/admin/create-category",
        payload,
        authRequired: true,
      });

      if (error) throw new Error(error?.message || error);
      if (response.success) showToast("success", response.message);
      // showToast("success", response.message || "Category created successfully");
      onSuccess && onSuccess(response.data);
      reset();
      onClose();
    } catch (err) {
      showToast("error", err.message || "Failed to create category");
    }
  };

  // ✅ Name formatter for nested display
  const formatName = (name) =>
    name
      .split("-")
      .map((part) =>
        part
          .split(" ")
          .map((w) => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase())
          .join(" ")
      )
      .join("-");

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-h-[80vh] flex flex-col">
        <DialogHeader>
          <DialogTitle className="lg:text-2xl md:text-xl text-start font-bold">
            Add Category
          </DialogTitle>
        </DialogHeader>

        <div className="overflow-y-auto flex-1 pr-2">
          <form onSubmit={handleSubmit(onSubmit)}>
            {/* Select Existing Category */}
            <div className="mt-4 w-full">
              <label className="block mb-1 font-medium">
                Choose Existing Category
              </label>
              <p className="text-sm text-gray-500 mb-1">
                Select an existing category if you want to add data under it,
                otherwise leave it blank to create a new category.
              </p>
              <Controller
                name="selectedCategory"
                control={control}
                render={({ field }) => (
                  <Select
                    value={field.value || ""}
                    onValueChange={field.onChange}
                  >
                    <SelectTrigger className="w-full border">
                      <SelectValue placeholder="Select Category (optional)" />
                    </SelectTrigger>
                    <SelectContent className="w-full">
                      {categories.map((parent) => (
                        <React.Fragment key={parent.id}>
                          <SelectItem value={parent.id}>
                            {formatName(parent.name)}
                          </SelectItem>
                          {parent.children?.map((child) => (
                            <SelectItem
                              key={child.id}
                              value={child.id}
                              className="text-sm pl-4"
                            >
                              - {formatName(child.name)}
                            </SelectItem>
                          ))}
                        </React.Fragment>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              />
            </div>

            {/* Category Name */}
            <div className="mt-4">
              <label className="block mb-1 font-medium">Category Name</label>
              <Controller
                name="name"
                control={control}
                render={({ field }) => (
                  <Input
                    {...field}
                    placeholder="Category Name"
                    className="border p-2 rounded w-full"
                  />
                )}
              />
              {errors.name && (
                <p className="text-red-500 text-sm mt-1">
                  {errors.name.message}
                </p>
              )}
            </div>

            {/* Slug */}
            <div className="mt-4">
              <label className="block mb-1 font-medium">Slug (Auto)</label>
              <Controller
                name="slug"
                control={control}
                render={({ field }) => (
                  <Input
                    {...field}
                    placeholder="Auto-generated"
                    className="border p-2 rounded w-full bg-gray-100"
                    readOnly
                  />
                )}
              />
            </div>

            {/* Priority */}
            <div className="mt-4">
              <label className="block mb-1 font-medium">Priority</label>
              <Controller
                name="priority"
                control={control}
                render={({ field }) => (
                  <Input
                    {...field}
                    placeholder="Enter numeric priority (e.g., 1)"
                    className="border p-2 rounded w-full"
                    type="number"
                    min="0"
                  />
                )}
              />
              {errors.priority && (
                <p className="text-red-500 text-sm mt-1">
                  {errors.priority.message}
                </p>
              )}
            </div>

            {/* Metadata Icon */}
            <div className="mt-4">
              <label className="block mb-1 font-medium">Metadata Icon</label>
              <Controller
                name="metadata.icon"
                control={control}
                render={({ field }) => (
                  <Input
                    {...field}
                    placeholder="Metadata Icon (e.g., man)"
                    className="border p-2 rounded w-full"
                  />
                )}
              />
              {errors.metadata?.icon && (
                <p className="text-red-500 text-sm mt-1">
                  {errors.metadata.icon.message}
                </p>
              )}
            </div>
          </form>
        </div>

        <div className="flex justify-end gap-2 mt-4">
          <DialogClose asChild>
            <Button type="button" variant="outline">
              Cancel
            </Button>
          </DialogClose>
          <Button onClick={handleSubmit(onSubmit)}>Submit</Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default AddCategoryModel;
