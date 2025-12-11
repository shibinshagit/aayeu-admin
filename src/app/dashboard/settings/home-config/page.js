"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import Link from "next/link";
import { motion } from "framer-motion";
import { actions } from "@/utils/constants";
import { useRouter } from "next/navigation";
import CustomBreadcrumb from "@/components/_ui/breadcrumb";

export default function SettingsActions() {
  const router = useRouter();
  
  return (
    <div className="p-4">
      <CustomBreadcrumb/>
      <div className="border border-gray-300 rounded-2xl p-4 mt-4 bg-white shadow-sm">
        <h2 className="text-lg font-semibold mb-4 text-gray-800">
          Actions
        </h2>
        
        <div className="space-y-3">
          {actions.map((card) => (
            <Link
              key={card.id}
              href={card.href}
              className="flex items-center justify-between rounded-xl border border-gray-300 p-3 hover:bg-gray-200 transition"
            >
              <div className="flex items-center gap-3">
                <div className={`p-2 rounded-lg flex items-center justify-center`}>
                  {card.icon}
                </div>

                <div>
                  <div className="font-medium text-gray-800">
                    {card.title}
                  </div>
                  <div className="text-sm text-gray-500">
                    {card.description}
                  </div>
                </div>
              </div>

              <button
                type="button"
                className={`px-3 py-1.5 text-sm font-medium rounded-lg hover:opacity-90 transition`}
              >
                View
              </button>
            </Link>
          ))}
        </div>
      </div>
      
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 overflow-hidden mt-6">
        {actions.map((action, index) => (
          <motion.div
            key={index}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: index * 0.1 }}
            onClick={() => {
              if (action.href) {
                router.push(action.href);
              }
            }}
          >
            {/* <Card
              className={`rounded-2xl shadow-md hover:shadow-lg m-2 transition duration-200 cursor-pointer ${action.color}`}
            >
              <CardContent className="flex flex-col items-center justify-center p-6 gap-4">
                <div className="p-4 bg-white rounded-full shadow-md flex items-center justify-center">
                  {action.icon}
                </div>
                <h3 className="text-lg font-semibold text-gray-800">{action.title}</h3>
              </CardContent>
            </Card> */}
          </motion.div>
        ))}
      </div>
    </div>
  );
}
