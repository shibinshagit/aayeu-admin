"use client";

import React, { useState, useEffect, useCallback } from "react";
import useAxios from "@/hooks/useAxios";
import CustomBreadcrumb from "@/components/_ui/breadcrumb";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { debounce } from "lodash";
import { showToast } from "@/components/_ui/toast-utils";
import Image from "next/image";
import SectionToggle from "@/components/_ui/sectiontoggle";
import {
  AlertDialog,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
  AlertDialogAction,
} from "@/components/ui/alert-dialog";

import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
} from "@/components/ui/table";

import { Trash2 } from "lucide-react";

const ManageFeaturedBrands = () => {
  const { request } = useAxios();

  useEffect(() => {
    document.title = "Manage Featured Brands";
  }, []);

  // 🧠 State
  const [brands, setBrands] = useState([]);
  const [loading, setLoading] = useState(false);

  const [searchValue, setSearchValue] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [searchedBrands, setSearchedBrands] = useState([]);
  const [selectedBrand, setSelectedBrand] = useState(null);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [tableSearch, setTableSearch] = useState("");
  const [sectionActive,setSectionActive]=useState(false);
  const [sectionData,setSectionData]=useState(false);
const [errors, setErrors] = useState({});

  const [reference, setReference] = useState("");
  const [showTable, setShowTable] = useState(true); // ✅ table show/hide


  const [formFields, setFormFields] = useState({
  rank: 1,        // default rank
  badge: "",      // optional
  promoText: "",  // optional
  startAt: "",    // optional, if needed
  endAt: "",      // optional, if needed
});
  // ✅ Fetch featured brands list on mount
  useEffect(() => {
    fetchFeaturedBrands();
    fetchStatus();
  }, []);
  
  const fetchStatus = async () => {
    try {
      const endpoint = "/admin/section-by-key?key=brand_spotlight";
      const { data, error } = await request({
        method: "GET",
        url: endpoint,
        authRequired: true,
      });

      if (error) {
        console.log(error,"error")
        return;
      }

      console.log("fetchStatus response:", data);

      // Always guard before reading nested props — data can be null/undefined
      if (data && data.success) {
        setSectionActive(!!data.data?.active);
        setSectionData(data);
      } else {
        // If API responded but shape is unexpected, avoid accessing null
        console.warn("Unexpected fetchStatus response:", data);
      }
    } catch (err) {
      console.error(err);
      showToast("error", err?.message || "Failed to fetch section status");
    } finally {
      setLoading(false);
    }
  };
  // handleToggle
    const handleToggle = async () => {
    const payload={...sectionData, key: "brand_spotlight",active: !sectionActive,}
    const { error } = await request({ method: "PUT", url: "/admin/update-section", payload });
    if (!error) setSectionActive(!sectionActive);
  };
  const fetchFeaturedBrands = async () => {
    try {
      setLoading(true);
      const { data, error } = await request({
        method: "GET",
        url: "/admin/list-brand-spotlights",
        authRequired:true,
      });

      if (error) {
        showToast("error", "Failed to fetch brands");
        return;
      }
      setBrands(data?.data?.items || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  // 🕵️‍♂️ Debounced Search
  const debounceSearch = useCallback(
    debounce((val) => setSearchQuery(val), 500),
    []
  );


  const handleChangeField = (field, value) => {
  setFormFields((prev) => ({
    ...prev,
    [field]: value,
  }));
};

  const handleSearchChange = (e) => {
    const val = e.target.value;
    setSearchValue(val);
    debounceSearch(val);
    if (!val) setSearchedBrands([]);
  };

  // 🔍 Fetch brands from search
  useEffect(() => {
    if (!searchQuery) return;

    const fetchBrands = async () => {
      setLoading(true);
      try {
        const { data, error } = await request({
          method: "GET",
          url: `/admin/get-products?q=${searchQuery}`,
          authRequired: true,
        });

        if (error) {
          showToast("error", "Failed to fetch brands");
          return;
        }
        setSearchedBrands(data?.data?.products || []);
      } catch (err) {
        showToast("error", "Something went wrong");
      } finally {
        setLoading(false);
      }
    };

    fetchBrands();
  }, [searchQuery]);

  // 📝 Select brand from search
  const handleSelectBrand =async(productId) => {
     try{
       setLoading(true)
       const endpoint = `/admin/get-product-by-id?productId=${productId}`;
      const { data, error } = await request({ method: "GET", url: endpoint , authRequired:true });

      if (error) {
              showToast("error", "Failed to fetch product details");
              return;
            }
       setSelectedBrand(data.data);
       setSearchValue("");
       setIsModalOpen(false);
     }catch(err){
         showToast("error", "Something went wrong");
     }finally{
       setLoading(false)
     }

    
  };
  // setSelectedBrand(brand);
  // setReference(""); // clear reference when selecting new brand
  // setIsModalOpen(false);
  // setSearchValue("");
  // // setSearchedBrands([]);
  // setShowTable(false); // ✅ hide table when brand selected

  // 🗑 Delete featured brand
  const handleRemove = async (id) => {
    try {
      const { error } = await request({
        method: "DELETE",
        url: `/admin/remove-featured-brand?id=${id}`,
        authRequired: true,
      });

      if (error) {
        showToast("error", "Failed to remove brand");
        return;
      }

      showToast("success", "Brand removed successfully");
      setBrands((prev) => prev.filter((b) => b.id !== id));
    } catch (err) {
      console.error(err);
      showToast("error", "Something went wrong");
    }
  };

  // 📝 Add featured brand (with reference)
  const handleSubmit = async (e) => {
    e.preventDefault();
   if (!formFields.startAt || !formFields.endAt) {
    setErrors({
      startAt: !formFields.startAt ? "Start date is required" : "",
      endAt: !formFields.endAt ? "End date is required" : "",
    });
    return;
  }

    try {
        const payload = {
    brand_id: selectedBrand.id,
    brand_name: selectedBrand.name,
    rank: formFields.rank,
    badge: formFields.badge,
    promo_text: formFields.promoText,
    start_at: formFields.startAt,
    end_at: formFields.endAt,
  };

      const { error } = await request({
        method: "POST",
        url: "/admin/add-brand-spotlight",
        payload,
        authRequired: true,
      });

      if (error) {
        showToast("error", "Failed to add brand");
        return;
      }
 showToast("success", "Brand added successfully");
  setSelectedBrand(null);
  setFormFields({
    rank: 1,
    badge: "",
    promoText: "",
    startAt: "",
    endAt: "",
  });
  await fetchFeaturedBrands();
  setShowTable(true);
    } catch (err) {
      showToast("error", "Something went wrong");
    }
  };

  // 🧠 Filter table by search
  const filteredBrands = brands.filter((b) =>
    b.brand_name?.toLowerCase().includes(tableSearch.toLowerCase())
  );

  return (
    <div className="p-6">
      <CustomBreadcrumb  tail='Featured Brand'/>
      <div className="flex flex-col justify-between mb-4">
        <h1 className="text-2xl font-bold ">Manage Featured Brands</h1>
        {!selectedBrand && (
          <div className="flex flex-row justify-between items-center mb-4">

          <Button onClick={() => setIsModalOpen(true)} className="max-w-[150px] px-2 mt-2">+ Add Featured Brand</Button>
          <div className="flex items-center gap-3">
                        <SectionToggle sectionActive={sectionActive} handleToggle={handleToggle} />
                        <span>{sectionActive ? "Section Active" : "Section Inactive"}</span>
                      </div>
          </div>
        )}
      </div>

      {/* 🔍 Modal for searching brands */}
      <AlertDialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <AlertDialogContent className="max-w-lg">
          <AlertDialogHeader>
            <AlertDialogTitle>Search Brand</AlertDialogTitle>
            <AlertDialogDescription>
              Search and select a brand to feature
            </AlertDialogDescription>
          </AlertDialogHeader>

          <Input
            value={searchValue}
            placeholder="Search brand..."
            onChange={handleSearchChange}
            className="mb-3"
          />

          {loading && <p>Loading...</p>}
          {!loading && searchQuery && searchedBrands.length === 0 && (
            <p>No brands found</p>
          )}

          <ul className="max-h-60 overflow-y-auto">
            {searchedBrands.map((brand) => {
              const alreadyAdded = brands.some((b) => b.brand_name === brand.brand_name);
                 {/* console.log(alreadyAdded,"brand",brand,",, brands",brands) */}
              return (
                <li
                  key={brand.id}
                  className="p-2 border mb-2 flex justify-between items-center"
                >
                  <div className="flex items-center gap-3">
                    {brand.product_img && (
                      <Image
                        width={100}
                        height={100}
                        className="w-10 h-10 object-cover rounded border"
                        src={brand.product_img || "/placeholder.png"}
                        alt={brand.name}
                      />
                    )}
                    <span className="font-medium">{brand.name}</span>
                  </div>
                  {alreadyAdded==true ? (
                    <Button size="sm" variant="outline" disabled>
                      Already Added
                    </Button>
                  ) : (
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleSelectBrand(brand.id)}
                    >
                      Select
                    </Button>
                  )}
                </li>
              );
            })}
          </ul>

          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => {setIsModalOpen(false); setSearchValue(""); setShowTable(true); setSearchQuery("") }}>Close</AlertDialogCancel>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* 📝 Selected Brand Card + Reference Field */}
     
{selectedBrand && (
  <div className="flex flex-col md:flex-row items-center gap-4 mb-6 border-b pb-4">
    <Image
      width={100}
      height={100}
      src={selectedBrand.product_img || "/placeholder.png"}
      alt={selectedBrand.name || "Selected Brand"}
      className="w-28 h-28 object-cover rounded-md border"
    />
    <div className="flex flex-col gap-1 w-full">
      <h2 className="text-lg font-semibold">{selectedBrand.name}</h2>
      <p className="text-sm text-gray-600">Brand ID: {selectedBrand.id}</p>
      <p className="text-sm text-gray-600">
        Vendor ID: {selectedBrand.vendor_id || "-"}
      </p>
      <p className="text-sm text-gray-600">
        Category: {selectedBrand.category_name || "-"}
      </p>
    </div>
  </div>
)}

{/* Featured Brand Form */}
 
      {selectedBrand && (
        <form onSubmit={handleSubmit} className="border p-4 rounded-md">
          <div className="mb-2">
            <label className="inline font-medium">ID:</label>
            <Input value={selectedBrand.id} readOnly />
          </div>

          <div className="mb-2  mt-4 flex flex-col md:flex-row justify-start items-start gap-8">
           <div>
            <label className="inline font-medium">Name:</label>
            <Input value={selectedBrand.name} readOnly />
           </div>
              <div>
            <label className="inline font-medium">SKU:</label>
            <Input value={selectedBrand.product_sku || "-"} readOnly />
              </div>
          <div className=" ">
            <label className="inline-block font-medium">Brand:</label>
            <Input value={selectedBrand.brand_name || "-"} readOnly />
          </div>
          </div>


            <div className="mb-2 mt-4  flex flex-col md:flex-row justify-start items-start gap-8">
            <div>
            <label className=" font-medium">Start Date:</label>
            <Input
              type="date"
              value={formFields.startAt}
              onChange={(e) => handleChangeField("startAt", e.target.value)}
            /> 
            {errors.startAt && <p className="text-red-500 text-sm mt-1">{errors.startAt}</p>}
            </div>
             
             <div>
            <label className="font-medium">End Date:</label>
            <Input
              type="date"
              value={formFields.endAt}
              onChange={(e) => handleChangeField("endAt", e.target.value)}
            /> 
            {errors.endAt && <p className="text-red-500 text-sm mt-1">{errors.endAt}</p>}
            </div>
          </div>

        
          <div className="mb-2 flex flex-col md:flex-row justify-start items-start gap-8" >
          <div className="">
            <label className="inline font-medium">Badge:</label>
            <Input
              value={formFields.badge}
              onChange={(e) => handleChangeField("badge", e.target.value)}
            />
          </div>

          <div className="">
            <label className="font-medium">Promo Text:</label>
            <Input
               
              value={formFields.promoText}
              onChange={(e) => handleChangeField("promoText", e.target.value)}
            />
          </div>

          <div className="relative">
            <label className="font-medium block">Rank:</label>
           <select
             value={formFields.rank}
             onChange={(e) => handleChangeField("rank", e.target.value)}
             className="border  block rounded-xl px-4 py-2 box-border appearance-none ">
              
            {[...Array(10)].map((_, i) => (
           <option className="bg-gray-200 rounded-xl  border hover:bg-white text-bold font-sans" key={i} value={i + 1}>Rank {i + 1}</option>
            ))}
</select>
            {/* Custom arrow */}
  <div className="pointer-events-none absolute inset-y-0 right-2 ml-1 mt-[30%] flex items-center">
    <svg
      className="h-4 w-4 text-gray-500"
      fill="none"
      stroke="currentColor"
      viewBox="0 0 24 24"
    >
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
    </svg>
  </div>

          </div>
          
          </div>
          <div className="mt-4 flex gap-2">
            <Button type="submit" variant="default"
             >
              Save
            </Button>
           <Button
  type="button"
  variant="outline"
  onClick={() => {
    setSelectedBrand(null);
    setShowTable(true);
  }}
>
  Cancel
</Button>

          </div>
        </form>
      )}

      {/* 📋 Featured Brands Table */}
      {showTable && (
        <div className="mt-6">
          <Input
            placeholder="Search in featured brands..."
            className="mb-3 w-[250px]"
            value={tableSearch}
            onChange={(e) => setTableSearch(e.target.value)}
          />

          <div className="overflow-x-auto border rounded-xl shadow-sm">
            <Table>
              <TableHeader className="bg-gray-100">
                <TableRow>
                    <TableHead>Brand ID</TableHead>
                  <TableHead>Name</TableHead>
                  <TableHead>Rank</TableHead>
                  <TableHead className="text-center">Status</TableHead>
                  <TableHead className="text-center">Action</TableHead>
                </TableRow>
              </TableHeader>

              <TableBody>
  {filteredBrands.length > 0 ? (
    filteredBrands.map((brand) => (
      <TableRow key={brand.id}>
        <TableCell>{brand.id}</TableCell>
        <TableCell>{brand.brand_name}</TableCell>
        <TableCell>{brand.rank || "-"}</TableCell>
       <TableCell className="text-center">
  <span
    className={`inline-block px-3 py-1 rounded-full font-semibold text-sm ${
      brand.active ? "bg-green-600 text-white" : "bg-red-600 text-white"
    }`}
  >
    {brand.active ? "Active" : "Inactive"}
  </span>
</TableCell>


        <TableCell className="text-center">
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button variant="destructive" size="sm">
                <Trash2 className="w-4 h-4" />
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>
                  Remove Featured Brand?
                </AlertDialogTitle>
                <AlertDialogDescription>
                  Are you sure you want to remove this brand?
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction
                  onClick={() => handleRemove(brand.id)}
                  className="bg-red-600 hover:bg-red-700"
                >
                  Remove
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </TableCell>
      </TableRow>
    ))
  ) : (
    <TableRow>
      <TableCell colSpan={4} className="text-center py-6">
        No featured brands found
      </TableCell>
    </TableRow>
  )}
</TableBody>

            </Table>
          </div>
        </div>
      )}
    </div>
  );
};

export default ManageFeaturedBrands;
