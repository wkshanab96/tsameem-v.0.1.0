"use client";

import {
  InfoIcon,
  UserCircle,
  FileText,
  History,
  Brain,
  Grid,
} from "lucide-react";
import DocumentGrid from "@/components/document-grid";
import RevisionTimeline from "@/components/revision-timeline";
import AIDocumentAssistant from "@/components/ai-document-assistant";
import { motion } from "framer-motion";

export default function ClientDashboard({ user }: { user: any }) {
  return (
    <main className="w-full">
      <div className="container mx-auto px-4 py-8 flex flex-col gap-8">
        {/* Header Section */}
        <motion.header
          className="flex flex-col gap-4"
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <div className="flex justify-between items-center">
            <h1 className="text-3xl font-bold text-gray-900">
              Welcome to Tsameem.AI
            </h1>
            <div className="flex items-center gap-2">
              <UserCircle size={36} className="text-orange-600" />
              <div>
                <p className="font-medium">{user.email}</p>
                <p className="text-xs text-gray-500">Master Access</p>
              </div>
            </div>
          </div>
          <div className="bg-white p-4 rounded-lg text-sm border border-orange-100 text-gray-700 flex gap-2 items-center shadow-sm">
            <InfoIcon size="16" className="text-orange-500" />
            <span>
              Your engineering documents are ready to be managed. Use the tools
              below to organize, track, and analyze your documents.
            </span>
          </div>
        </motion.header>

        {/* Stats Overview */}
        <motion.section
          className="grid grid-cols-1 md:grid-cols-4 gap-4"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.5, delay: 0.2 }}
        >
          {[
            {
              icon: <FileText className="h-6 w-6" />,
              title: "Total Documents",
              value: "24",
              color: "bg-orange-50 text-orange-600",
            },
            {
              icon: <History className="h-6 w-6" />,
              title: "Recent Updates",
              value: "7",
              color: "bg-red-50 text-red-600",
            },
            {
              icon: <Brain className="h-6 w-6" />,
              title: "AI Insights",
              value: "12",
              color: "bg-orange-50 text-orange-600",
            },
            {
              icon: <Grid className="h-6 w-6" />,
              title: "Active Projects",
              value: "3",
              color: "bg-red-50 text-red-600",
            },
          ].map((stat, index) => (
            <motion.div
              key={index}
              className={`${stat.color} p-4 rounded-lg shadow-sm border border-white flex items-center gap-4`}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, delay: 0.3 + index * 0.1 }}
              whileHover={{ y: -5, transition: { duration: 0.2 } }}
            >
              <div className="p-3 bg-white rounded-full shadow-sm">
                {stat.icon}
              </div>
              <div>
                <p className="text-sm font-medium">{stat.title}</p>
                <p className="text-2xl font-bold">{stat.value}</p>
              </div>
            </motion.div>
          ))}
        </motion.section>

        {/* Document Grid */}
        <motion.section
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.4 }}
        >
          <DocumentGrid />
        </motion.section>

        {/* Revision Timeline and AI Assistant */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5, delay: 0.6 }}
          >
            <RevisionTimeline />
          </motion.div>

          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5, delay: 0.6 }}
            className="h-full"
          >
            <AIDocumentAssistant />
          </motion.div>
        </div>
      </div>
    </main>
  );
}
