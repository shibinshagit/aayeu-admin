"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { ChevronDown, ChevronRight, PlusCircle } from "lucide-react";
import { showToast } from "@/components/_ui/toast-utils";
import useAxios from "@/hooks/useAxios";
import AddCategoryModel from "@/components/_dialogs/AddCategoryModel";

const normalizeCategories = (categories = []) =>
  (categories || []).map((category) => ({
    ...category,
    id: category.id || category._id,
    name: category.name || category.title || "Untitled",
    children: category.children ? normalizeCategories(category.children) : [],
  }));

const filterTree = (categories = [], searchTerm = "") => {
  if (!searchTerm) return categories;
  const lower = searchTerm.toLowerCase();

  const recurse = (node) => {
    const childMatches = (node.children || [])
      .map(recurse)
      .filter((child) => child !== null);
    const isMatch = node.name?.toLowerCase().includes(lower);
    if (isMatch || childMatches.length > 0) {
      return {
        ...node,
        children: childMatches,
      };
    }
    return null;
  };

  return categories
    .map(recurse)
    .filter((node) => node !== null);
};

const MapProductCategoryDialog = ({
  open,
  onClose,
  productId,
  productName,
  initialCategoryId = null,
  onSuccess,
}) => {
  const router = useRouter();
  const { request } = useAxios();
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [categories, setCategories] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategoryId, setSelectedCategoryId] = useState(
    initialCategoryId
  );
  const [expanded, setExpanded] = useState({});
  const [isAddCategoryOpen, setIsAddCategoryOpen] = useState(false);
  const [preselectCategoryId, setPreselectCategoryId] = useState("");

  useEffect(() => {
    if (!open) {
      setSearchTerm("");
      setSelectedCategoryId(initialCategoryId || null);
      return;
    }
    fetchCategories();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  useEffect(() => {
    if (initialCategoryId) {
      setSelectedCategoryId(initialCategoryId);
    }
  }, [initialCategoryId]);

  const fetchCategories = async () => {
    setLoading(true);
    try {
      const { data, error } = await request({
        method: "GET",
        url: "/admin/get-our-categories",
        authRequired: true,
      });

      if (error) throw new Error(error?.message || error);

      const normalized = normalizeCategories(data?.data || []);
      setCategories(normalized);
      setExpanded((prev) => {
        const next = { ...prev };
        normalized.forEach((cat) => {
          if (typeof next[cat.id] === "undefined") {
            next[cat.id] = true;
          }
        });
        return next;
      });
    } catch (err) {
      console.error("Error fetching categories:", err);
      showToast("error", err.message || "Failed to load categories");
    } finally {
      setLoading(false);
    }
  };

  const filteredCategories = useMemo(
    () => filterTree(categories, searchTerm),
    [categories, searchTerm]
  );

  const handleSubmit = async () => {
    if (!selectedCategoryId) {
      showToast("error", "Please select a category");
      return;
    }
    setSubmitting(true);
    try {
      const { data, error } = await request({
        method: "POST",
        url: "/admin/map-product-directly-to-category",
        payload: {
          our_category_id: selectedCategoryId,
          product_ids: [productId],
        },
        authRequired: true,
      });

      if (error) throw new Error(error?.message || error);

      showToast(
        "success",
        data?.message || "Product mapped successfully"
      );

      onSuccess?.(selectedCategoryId);
      onClose();
    } catch (err) {
      console.error("Error mapping product:", err);
      showToast("error", err.message || "Failed to map product");
    } finally {
      setSubmitting(false);
    }
  };

  const toggleExpanded = (id) => {
    setExpanded((prev) => ({
      ...prev,
      [id]: !prev[id],
    }));
  };

  const handleAddCategory = (categoryId) => {
    setPreselectCategoryId(categoryId || "");
    setIsAddCategoryOpen(true);
  };

  const renderTree = (items = [], depth = 0) => {
    return items.map((cat) => {
      const hasChildren = cat.children && cat.children.length > 0;
      const isExpanded = searchTerm
        ? true
        : expanded[cat.id] ?? depth === 0;

      return (
        <div key={cat.id} className="border-b border-muted/40">
          <div
            className="flex items-center gap-2 px-3 py-2 hover:bg-muted/50 transition-colors"
            style={{ paddingLeft: `${depth * 20}px` }}
          >
            {hasChildren ? (
              <button
                type="button"
                onClick={() => toggleExpanded(cat.id)}
                className="text-muted-foreground hover:text-foreground"
                aria-label={isExpanded ? "Collapse" : "Expand"}
              >
                {isExpanded ? (
                  <ChevronDown className="h-4 w-4" />
                ) : (
                  <ChevronRight className="h-4 w-4" />
                )}
              </button>
            ) : (
              <span className="w-4" />
            )}

            <input
              type="radio"
              name="our-category"
              value={cat.id}
              checked={selectedCategoryId === cat.id}
              onChange={() => setSelectedCategoryId(cat.id)}
              className="h-4 w-4 border border-gray-300 text-primary focus:ring-primary"
            />

            <span className="flex-1 text-sm text-foreground">
              {cat.name}
            </span>

            <Button
            //   variant="ghost"
              size="sm"
              className="gap-1 text-xs rounded-md"
              onClick={() => handleAddCategory(cat.id)}
            >
              <PlusCircle className="h-3 w-3" />
              Add Category
            </Button>
          </div>

          {hasChildren && isExpanded && (
            <div>{renderTree(cat.children, depth + 1)}</div>
          )}
        </div>
      );
    });
  };

  return (
    <>
      <Dialog open={open} onOpenChange={onClose}>
        <DialogContent className="max-h-[90vh] w-full max-w-5xl overflow-hidden p-0">
          <DialogHeader className="px-6 pt-6">
            <DialogTitle>Map Product To Category</DialogTitle>
            <DialogDescription>
              Select a category to map{" "} 
              <span className="font-semibold text-foreground">
                {productName || "this product"}
              </span>{" "}
              to our catalog.
            </DialogDescription>
          </DialogHeader>

          <div className="px-6 pb-6 space-y-4">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <Input
                placeholder="Search our categories..."
                value={searchTerm}
                onChange={(event) => setSearchTerm(event.target.value)}
                className="sm:w-72"
              />

              <Button
                variant="default"
                onClick={() => router.push("/dashboard/inventories/categorymanagement")}
              >
                Manage Category
              </Button>
            </div>

            <div className="max-h-[55vh] overflow-y-auto rounded-lg border">
              {loading ? (
                <div className="space-y-3 p-4">
                  {Array.from({ length: 8 }).map((_, idx) => (
                    <div key={idx} className="flex items-center gap-3">
                      <Skeleton className="h-4 w-4 rounded-full" />
                      <Skeleton className="h-4 flex-1" />
                    </div>
                  ))}
                </div>
              ) : filteredCategories.length === 0 ? (
                <div className="p-6 text-center text-sm text-muted-foreground">
                  No categories found. Try adjusting your search.
                </div>
              ) : (
                <div className="divide-y">{renderTree(filteredCategories)}</div>
              )}
            </div>
          </div>

          <DialogFooter className="flex flex-col gap-2 px-6 pb-6 sm:flex-row sm:justify-end">
            <Button
              variant="outline"
              onClick={onClose}
              disabled={submitting}
              className="w-full sm:w-auto"
            >
              Cancel
            </Button>
            <Button
              onClick={handleSubmit}
              disabled={submitting || !selectedCategoryId}
              className="w-full sm:w-auto"
            >
              {submitting ? "Mapping..." : "Map Category"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <AddCategoryModel
        open={isAddCategoryOpen}
        onClose={() => setIsAddCategoryOpen(false)}
        onSuccess={() => {
          setIsAddCategoryOpen(false);
          fetchCategories();
        }}
        categories={categories}
        preselectCategoryId={preselectCategoryId}
      />
    </>
  );
};

export default MapProductCategoryDialog;
