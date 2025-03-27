"use client";

import Link from "next/link";
import { createClient } from "../../supabase/client";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "./ui/dropdown-menu";
import { Button } from "./ui/button";
import {
  UserCircle,
  Home,
  FileText,
  Search,
  Bell,
  Settings,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";

export default function DashboardNavbar() {
  const supabase = createClient();
  const router = useRouter();

  return (
    <nav className="w-full border-b border-gray-100 bg-white py-4 sticky top-0 z-50 shadow-sm">
      <div className="container mx-auto px-4 flex justify-between items-center">
        <div className="flex items-center gap-4">
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

          <div className="hidden md:flex ml-8 space-x-6">
            <Link
              href="#"
              className="text-gray-700 hover:text-orange-600 transition-colors duration-300 font-medium"
            >
              Documents
            </Link>
            <Link
              href="#"
              className="text-gray-700 hover:text-orange-600 transition-colors duration-300 font-medium"
            >
              Projects
            </Link>
            <Link
              href="#"
              className="text-gray-700 hover:text-orange-600 transition-colors duration-300 font-medium"
            >
              Teams
            </Link>
            <Link
              href="#"
              className="text-gray-700 hover:text-orange-600 transition-colors duration-300 font-medium"
            >
              Analytics
            </Link>
          </div>
        </div>

        <div className="flex gap-4 items-center">
          <div className="relative hidden md:block">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search documents..."
              className="pl-10 pr-4 py-2 rounded-full border border-gray-200 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent text-sm w-64"
            />
          </div>

          <Button variant="ghost" size="icon" className="relative">
            <Bell className="h-5 w-5 text-gray-600" />
            <span className="absolute top-0 right-0 h-2 w-2 rounded-full bg-red-500"></span>
          </Button>

          <Button variant="ghost" size="icon">
            <Settings className="h-5 w-5 text-gray-600" />
          </Button>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="rounded-full h-9 w-9 bg-orange-100"
              >
                <UserCircle className="h-6 w-6 text-orange-600" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56 mt-1 p-1">
              <div className="px-2 py-1.5 border-b border-gray-100 mb-1">
                <p className="text-sm font-medium">My Account</p>
                <p className="text-xs text-gray-500 truncate">
                  user@example.com
                </p>
              </div>
              <DropdownMenuItem className="cursor-pointer hover:bg-orange-50 hover:text-orange-600 transition-colors duration-200">
                Profile Settings
              </DropdownMenuItem>
              <DropdownMenuItem className="cursor-pointer hover:bg-orange-50 hover:text-orange-600 transition-colors duration-200">
                Preferences
              </DropdownMenuItem>
              <DropdownMenuItem
                className="cursor-pointer text-red-600 hover:bg-red-50 transition-colors duration-200"
                onClick={async () => {
                  await supabase.auth.signOut();
                  router.push("/");
                }}
              >
                Sign out
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </nav>
  );
}
