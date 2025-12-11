"use client";

import React, { useMemo, useState, useEffect } from "react";
import Image from "next/image";

import CustomBreadcrumb from "@/components/_ui/breadcrumb";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import FileUploader from "@/components/comman/FileUploader";
import { showToast } from "@/components/_ui/toast-utils";
import useAxios from "@/hooks/useAxios";
import { useRouter } from "next/navigation";

const DEFAULT_OVERLAY = {
  id: null,
  title: "",
  mrp: "",
  salePrice: "",
  link: "",
  mediaUrl: "",
};

export default function ManageProductOverlay() {
  const { request } = useAxios();
  // We support up to 3 overlay items
  const [forms, setForms] = useState([
    { ...DEFAULT_OVERLAY },
    { ...DEFAULT_OVERLAY },
    { ...DEFAULT_OVERLAY },
  ]);
  const [overlays, setOverlays] = useState([]);
  const [isLoadingInitial, setIsLoadingInitial] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const router = useRouter();


  const allowedMedia = useMemo(
    () => ({
      "image/png": [],
      "image/jpeg": [],
      "image/webp": [],
      "image/svg+xml": [],
    }),
    []
  );

  const fetchOverlayGrid = async () => {
    try {
      setIsLoadingInitial(true);
      const { data, error } = await request({
        method: "GET",
        url: "/admin/get-overlay-grid",
        authRequired: true,
      });

      if (error || !data?.data) {
        console.log("No overlay grid data found");
        return;
      }

      const items = Array.isArray(data.data) ? data.data : [];

      if (!items.length) {
        setForms([
          { ...DEFAULT_OVERLAY },
          { ...DEFAULT_OVERLAY },
          { ...DEFAULT_OVERLAY },
        ]);
        setOverlays([]);
        return;
      }

      // Prefill up to 3 overlays from API response
      const nextForms = [...forms];
      items.slice(0, 3).forEach((item, index) => {
        nextForms[index] = {
          id: item.id,
          title: item.title || "",
          mrp: item.mrp ?? "",
          salePrice: item.sale_price ?? "",
          link: item.product_redirect_url || "",
          mediaUrl: item.product_image || "",
        };
      });

      setForms(nextForms);

      const formattedOverlays = items.slice(0, 3).map((item) => ({
        id: item.id,
        title: item.title || "",
        mrp: item.mrp ?? "",
        salePrice: item.sale_price ?? "",
        link: item.product_redirect_url || "",
        mediaUrl: item.product_image || "",
      }));

      setOverlays(formattedOverlays);
    } catch (err) {
      console.error("Failed to fetch overlay grid:", err);
    } finally {
      setIsLoadingInitial(false);
    }
  };

  useEffect(() => {
    fetchOverlayGrid();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const updateForm = (index, field, value) =>
    setForms((prev) => {
      const next = [...prev];
      next[index] = {
        ...next[index],
        [field]: value,
      };
      return next;
    });

  const handleUploadSuccess = (index, response) => {
    const payload = response?.data;
    const uploaded =
      payload?.uploaded ||
      payload?.files ||
      payload?.data ||
      (payload?.url ? [payload] : []);

    const mediaUrl =
      Array.isArray(uploaded) && uploaded.length > 0
        ? uploaded[0]?.url ||
          uploaded[0]?.location ||
          uploaded[0]?.path ||
          uploaded[0]?.image_url
        : typeof uploaded === "string"
        ? uploaded
        : "";

    if (!mediaUrl) {
      showToast("error", "Upload succeeded but no URL returned from server.");
      return;
    }

    updateForm(index, "mediaUrl", mediaUrl);
    showToast("success", "Overlay media uploaded.");
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

    // Take only those overlays where at least one field is filled
    const overlaysToSave = forms
      .map((item, idx) => ({ ...item, index: idx }))
      .filter(
        (item) =>
          item.title.trim() ||
          item.link.trim() ||
          item.mediaUrl
      );

    if (!overlaysToSave.length) {
      showToast(
        "error",
        "Please fill at least one overlay with title, link, and image."
      );
      return;
    }

    // Validate each filled overlay
    const invalid = overlaysToSave.find(
      (item) => !item.title.trim() || !item.link.trim() || !item.mediaUrl
    );

    if (invalid) {
      showToast(
        "error",
        "For every overlay you are using, title, link, and image are all required."
      );
      return;
    }

    try {
      setIsSaving(true);

      // Call create-overlay-grid for each filled overlay (supports create + update)
      const responses = await Promise.all(
        overlaysToSave.map((overlay) => {
          const payload = {
            title: overlay.title,
            mrp: overlay.mrp,
            sale_price: overlay.salePrice,
            product_image: overlay.mediaUrl,
            product_redirect_url: overlay.link,
          };

          // Only send id when it exists (update case). For new overlays, id is omitted.
          if (overlay.id) {
            payload.id = overlay.id;
          }

          return request({
            method: "POST",
            url: "/admin/create-overlay-grid",
            payload,
            authRequired: true,
          });
        })
      );

      const anyError = responses.find((res) => res.error);
      if (anyError) {
        showToast(
          "error",
          anyError.error || "Failed to save one or more overlays."
        );
        return;
      }

      showToast("success", "Overlays saved successfully.");
      router.push('/dashboard/settings/home-config/');
      await fetchOverlayGrid();
    } finally {
      setIsSaving(false);
    }
  };

  const toggleOverlay = (id) =>
    setOverlays((prev) =>
      prev.map((item) =>
        item.id === id ? { ...item, active: !item.active } : item
      )
    );

  const removeOverlay = (id) =>
    setOverlays((prev) => prev.filter((item) => item.id !== id));

  return (
    <div className="p-6 space-y-6">
      <CustomBreadcrumb />
      <div className="mt-4">
        <h1 className="text-3xl font-bold">Product Overlay</h1>
        <p className="text-muted-foreground">
          Manage the promotional overlay that sits just below the top banner.
        </p>
      </div>

      {isLoadingInitial ? (
        <div className="text-center py-8">
          <p className="text-sm text-gray-500">Loading overlay data...</p>
        </div>
      ) : (
        <form
          onSubmit={handleSubmit}
          className="space-y-4 rounded-2xl border border-dashed border-gray-300 p-6 bg-white"
        >
          {forms.map((overlayForm, index) => (
            <div
              key={index}
              className="space-y-3 rounded-2xl border border-gray-200 bg-gray-50 p-4"
            >
              <p className="text-sm font-semibold text-gray-800">
                Overlay {index + 1}
              </p>
          <div className="grid gap-4 md:grid-cols-3">
            <Input
              placeholder="Overlay title"
              value={overlayForm.title}
              onChange={(e) =>
                updateForm(index, "title", e.target.value)
              }
            />
            <Input
              placeholder="MRP"
              type="number"
              value={overlayForm.mrp}
              onChange={(e) =>
                updateForm(index, "mrp", e.target.value)
              }
            />
            <Input
              placeholder="Sale price"
              type="number"
              value={overlayForm.salePrice}
              onChange={(e) =>
                updateForm(index, "salePrice", e.target.value)
              }
            />
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <Input
              placeholder="Product redirect URL"
              value={overlayForm.link}
              onChange={(e) =>
                updateForm(index, "link", e.target.value)
              }
            />
          </div>

              <div className="space-y-2">
                <p className="text-sm font-medium text-gray-700">
                  Overlay Art / Image
                </p>
                <FileUploader
                  url="/admin/upload-banners"
                  fieldName="banners"
                  maxFiles={1}
                  multiple={false}
                  allowedTypes={allowedMedia}
                  onSuccess={(res) => handleUploadSuccess(index, res)}
                  onError={() =>
                    showToast(
                      "error",
                      "Failed to upload overlay media."
                    )
                  }
                />
                {overlayForm.mediaUrl && (
                  <div className="mt-3 flex items-center gap-3 rounded-xl border p-3 bg-white">
                    <div className="relative h-20 w-32 overflow-hidden rounded-lg bg-gray-100">
                      <Image
                        src={overlayForm.mediaUrl}
                        alt={`Overlay ${index + 1} preview`}
                        fill
                        className="object-cover"
                      />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-800">
                        Current preview
                      </p>
                      <p className="text-xs text-gray-500 truncate max-w-xs">
                        {overlayForm.mediaUrl}
                      </p>
                    </div>
                  </div>
                )}
              </div>
            </div>
          ))}

          {/* <div className="flex items-center gap-2">
            <Switch
              checked={form.active}
              onCheckedChange={(checked) => updateForm("active", checked)}
            />
            <Label className="text-sm text-gray-600">
              Show overlay on home page
            </Label>
          </div> */}

          <div className="flex items-end justify-end border-t pt-4">
            <Button
              type="submit"
              disabled={isSaving}
            >
              {isSaving ? "Saving..." : "Save Overlays"}
            </Button>
          </div>
        </form>
      )}

      <div className="space-y-4">
        <h2 className="text-xl font-semibold">Live Overlays</h2>
        {overlays.length === 0 ? (
          <p className="rounded-lg border border-dashed p-6 text-center text-sm text-gray-500">
            No overlay configured yet. Add one using the form above.
          </p>
        ) : (
          <div className="grid gap-4 md:grid-cols-2">
            {overlays.map((overlay) => (
              <div
                key={overlay.id}
                className="rounded-2xl border bg-white p-4 shadow-sm"
              >
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-base font-semibold">
                      {overlay.title}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      MRP: {overlay.mrp || "-"} | Sale:{" "}
                      {overlay.salePrice || "-"}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {overlay.link || "No link set"}
                    </p>
                  </div>
                  {/* <Switch
                    checked={overlay.active}
                    onCheckedChange={() => toggleOverlay(overlay.id)}
                  /> */}
                </div>

                {overlay.mediaUrl && (
                  <div className="mt-3 relative h-32 w-full overflow-hidden rounded-md">
                    <Image
                      src={overlay.mediaUrl}
                      alt={overlay.title}
                      fill
                      className="object-cover"
                    />
                  </div>
                )}

                <a
                  href={overlay.link || "#"}
                  target="_blank"
                  rel="noreferrer"
                  className="mt-3 block text-sm text-blue-600 break-all"
                >
                  {overlay.link || "No link"}
                </a>

                <div className="mt-3 flex items-end justify-end text-sm text-gray-500">
                  {/* <span>{overlay.active ? "Active" : "Inactive"}</span> */}
                     {/* <Button
                      variant="ghost"
                      type="button"
                      size="sm"
                      onClick={() => toggleOverlay(overlay.id)}
                    >
                      {overlay.active ? "Disable" : "Activate"}
                    </Button> */}
                    <Button
                      variant="destructive"
                      type="button"
                      size="sm"
                      onClick={() => removeOverlay(overlay.id)}
                    >
                      Remove
                    </Button>
                 </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
