"use client";

import Link from "next/link";
import { Button } from "./ui/button";
import { FileText } from "lucide-react";
import UserProfile from "./user-profile";
import { motion } from "framer-motion";

import { useEffect, useState } from "react";
import { createClientComponentClient } from "@supabase/ssr";

export default function ClientNavbar({ userId }: { userId?: string }) {
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(!!userId);

  useEffect(() => {
    // Only fetch user data if we have a userId and the user is logged in
    if (userId) {
      const fetchUserData = async () => {
        try {
          const supabase = createClientComponentClient();
          const { data, error } = await supabase.auth.getUser();
          if (!error && data.user) {
            setUser(data.user);
          }
        } catch (error) {
          console.error("Error fetching user data:", error);
        } finally {
          setLoading(false);
        }
      };

      fetchUserData();
    }
  }, [userId]);
  return (
    <nav className="w-full border-b border-gray-100 bg-white py-4 sticky top-0 z-50 shadow-sm">
      <div className="container mx-auto px-4 flex justify-between items-center">
        <Link href="/" prefetch className="flex items-center gap-2">
          <motion.div
            initial={{ rotate: -10 }}
            animate={{ rotate: 0 }}
            transition={{ duration: 0.5 }}
          >
            <FileText className="h-7 w-7 text-orange-600" />
          </motion.div>
          <motion.span
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="text-xl font-bold bg-gradient-to-r from-orange-600 to-red-600 text-transparent bg-clip-text"
          >
            Tsameem.AI
          </motion.span>
        </Link>

        <div className="hidden md:flex space-x-8">
          <Link
            href="#features"
            className="text-gray-700 hover:text-orange-600 transition-colors duration-300"
          >
            Features
          </Link>
          <Link
            href="#solutions"
            className="text-gray-700 hover:text-orange-600 transition-colors duration-300"
          >
            Solutions
          </Link>
          <Link
            href="#"
            className="text-gray-700 hover:text-orange-600 transition-colors duration-300"
          >
            Resources
          </Link>
        </div>

        <div className="flex gap-4 items-center">
          {user ? (
            <>
              <Link href="/dashboard" className="px-4 py-2 text-sm font-medium">
                <Button className="bg-gradient-to-r from-orange-500 to-red-600 hover:from-orange-600 hover:to-red-700 transition-all duration-300">
                  Dashboard
                </Button>
              </Link>
              <UserProfile />
            </>
          ) : (
            <>
              <Link
                href="/dashboard"
                className="px-4 py-2 text-sm font-medium text-gray-700 hover:text-orange-600 transition-colors duration-300"
              >
                Sign In
              </Link>
              <Link
                href="/dashboard"
                className="px-4 py-2 text-sm font-medium text-white bg-gradient-to-r from-orange-500 to-red-600 rounded-md hover:from-orange-600 hover:to-red-700 transition-all duration-300"
              >
                Sign Up
              </Link>
            </>
          )}
        </div>
      </div>
    </nav>
  );
}
