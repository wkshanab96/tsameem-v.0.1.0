"use client";

import Link from "next/link";
import {
  ArrowUpRight,
  Check,
  FileText,
  History,
  Users,
  Brain,
} from "lucide-react";
import { motion } from "framer-motion";

export default function Hero() {
  return (
    <div className="relative overflow-hidden bg-white">
      {/* Background gradient */}
      <div className="absolute inset-0 bg-gradient-to-br from-orange-50 via-white to-red-50 opacity-70" />

      {/* Decorative elements */}
      <div className="absolute top-20 right-10 w-64 h-64 bg-orange-500 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob"></div>
      <div className="absolute bottom-20 left-10 w-64 h-64 bg-red-500 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob animation-delay-2000"></div>
      <div className="absolute top-40 left-1/4 w-64 h-64 bg-orange-300 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob animation-delay-4000"></div>

      <div className="relative pt-24 pb-32 sm:pt-32 sm:pb-40">
        <div className="container mx-auto px-4">
          <div className="text-center max-w-4xl mx-auto">
            <motion.h1
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8 }}
              className="text-5xl sm:text-6xl font-bold text-gray-900 mb-8 tracking-tight"
            >
              Engineering{" "}
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-orange-600 to-red-600">
                Document
              </span>{" "}
              Management System
            </motion.h1>

            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.2 }}
              className="text-xl text-gray-600 mb-12 max-w-2xl mx-auto leading-relaxed"
            >
              Streamline your engineering documentation with AI-powered
              insights, revision tracking, and role-based access control.
            </motion.p>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.4 }}
              className="flex flex-col sm:flex-row gap-4 justify-center items-center"
            >
              <Link
                href="/dashboard"
                className="inline-flex items-center px-8 py-4 text-white bg-gradient-to-r from-orange-500 to-red-600 rounded-lg hover:from-orange-600 hover:to-red-700 transition-all duration-300 text-lg font-medium shadow-lg hover:shadow-xl transform hover:-translate-y-1"
              >
                Try It Now
                <ArrowUpRight className="ml-2 w-5 h-5" />
              </Link>

              <Link
                href="#features"
                className="inline-flex items-center px-8 py-4 text-gray-700 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 hover:border-orange-200 transition-all duration-300 text-lg font-medium shadow-sm hover:shadow-md"
              >
                Learn More
              </Link>
            </motion.div>

            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 1, delay: 0.8 }}
              className="mt-16 flex flex-col sm:flex-row items-center justify-center gap-8 text-sm text-gray-600"
            >
              <div className="flex items-center gap-2">
                <Check className="w-5 h-5 text-orange-500" />
                <span>AI-powered document insights</span>
              </div>
              <div className="flex items-center gap-2">
                <Check className="w-5 h-5 text-orange-500" />
                <span>Revision history tracking</span>
              </div>
              <div className="flex items-center gap-2">
                <Check className="w-5 h-5 text-orange-500" />
                <span>Role-based access control</span>
              </div>
            </motion.div>
          </div>
        </div>
      </div>
    </div>
  );
}
