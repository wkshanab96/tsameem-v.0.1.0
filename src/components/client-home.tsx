"use client";

import {
  ArrowUpRight,
  CheckCircle2,
  FileText,
  History,
  Users,
  Brain,
  Shield,
  Grid,
  Layers,
} from "lucide-react";
import Image from "next/image";
import { motion } from "framer-motion";

export default function ClientHome() {
  const fadeInUp = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0 },
  };

  return (
    <>
      {/* Features Section */}
      <section className="py-24 bg-white" id="features">
        <div className="container mx-auto px-4">
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
            variants={fadeInUp}
            className="text-center mb-16"
          >
            <h2 className="text-3xl font-bold mb-4 text-gray-900">
              Key Features
            </h2>
            <p className="text-gray-600 max-w-2xl mx-auto">
              Our document management system is designed specifically for
              engineering teams with powerful features to streamline your
              workflow.
            </p>
          </motion.div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            {[
              {
                icon: <Grid className="w-6 h-6" />,
                title: "Document Grid View",
                description:
                  "Clean grid layout with thumbnails and metadata for quick identification",
              },
              {
                icon: <History className="w-6 h-6" />,
                title: "Revision Timeline",
                description:
                  "Interactive timeline to view and compare document versions",
              },
              {
                icon: <Users className="w-6 h-6" />,
                title: "Role-based Access",
                description:
                  "Dynamic interface that adapts based on user permissions",
              },
              {
                icon: <Brain className="w-6 h-6" />,
                title: "AI Document Assistant",
                description:
                  "RAG capabilities to answer technical questions about drawings",
              },
            ].map((feature, index) => (
              <motion.div
                key={index}
                initial="hidden"
                whileInView="visible"
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
                variants={fadeInUp}
                className="p-6 bg-white rounded-xl shadow-sm hover:shadow-lg transition-all duration-300 border border-gray-100 hover:border-orange-200 group"
              >
                <div className="text-orange-500 mb-4 group-hover:text-red-500 transition-colors duration-300">
                  {feature.icon}
                </div>
                <h3 className="text-xl font-semibold mb-2">{feature.title}</h3>
                <p className="text-gray-600">{feature.description}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Document Management Showcase */}
      <section
        className="py-20 bg-gradient-to-b from-white to-orange-50"
        id="solutions"
      >
        <div className="container mx-auto px-4">
          <div className="grid md:grid-cols-2 gap-12 items-center">
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.8 }}
            >
              <h2 className="text-3xl font-bold mb-6 text-gray-900">
                Intelligent Document Management
              </h2>
              <p className="text-gray-600 mb-6">
                Our system provides a OneDrive-style interface specifically
                designed for engineering drawings and technical documents.
              </p>

              <ul className="space-y-4">
                {[
                  {
                    icon: <FileText className="w-5 h-5" />,
                    text: "AI-generated summaries for quick document identification",
                  },
                  {
                    icon: <Layers className="w-5 h-5" />,
                    text: "Visual diff highlighting between document revisions",
                  },
                  {
                    icon: <Shield className="w-5 h-5" />,
                    text: "Secure, role-based access control for sensitive documents",
                  },
                  {
                    icon: <Brain className="w-5 h-5" />,
                    text: "Extract relevant information with AI-powered document analysis",
                  },
                ].map((item, index) => (
                  <motion.li
                    key={index}
                    className="flex items-start"
                    initial={{ opacity: 0, x: -20 }}
                    whileInView={{ opacity: 1, x: 0 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.5, delay: 0.2 + index * 0.1 }}
                  >
                    <div className="text-orange-500 mr-3 mt-1">{item.icon}</div>
                    <span className="text-gray-700">{item.text}</span>
                  </motion.li>
                ))}
              </ul>
            </motion.div>

            <motion.div
              className="relative rounded-xl overflow-hidden shadow-xl"
              initial={{ opacity: 0, scale: 0.9 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              transition={{ duration: 0.8 }}
            >
              <Image
                src="https://images.unsplash.com/photo-1664575198308-3959904fa430?w=800&q=80"
                alt="Document Management Interface"
                width={600}
                height={400}
                className="w-full h-auto"
              />
              <div className="absolute inset-0 bg-gradient-to-tr from-orange-600/20 to-transparent"></div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-20 bg-gradient-to-r from-orange-600 to-red-600 text-white">
        <div className="container mx-auto px-4">
          <div className="grid md:grid-cols-3 gap-8 text-center">
            {[
              { number: "85%", text: "Faster Document Retrieval" },
              { number: "500+", text: "Engineering Teams" },
              { number: "99.9%", text: "Uptime Guaranteed" },
            ].map((stat, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: index * 0.2 }}
              >
                <motion.div
                  className="text-5xl font-bold mb-2"
                  initial={{ scale: 0.8 }}
                  whileInView={{ scale: 1 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.5, delay: 0.3 + index * 0.2 }}
                >
                  {stat.number}
                </motion.div>
                <div className="text-orange-100">{stat.text}</div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Revision Timeline Feature */}
      <section className="py-24 bg-white">
        <div className="container mx-auto px-4">
          <div className="grid md:grid-cols-2 gap-12 items-center">
            <motion.div
              className="order-2 md:order-1 relative rounded-xl overflow-hidden shadow-xl"
              initial={{ opacity: 0, scale: 0.9 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              transition={{ duration: 0.8 }}
            >
              <Image
                src="https://images.unsplash.com/photo-1581291518633-83b4ebd1d83e?w=800&q=80"
                alt="Revision Timeline Interface"
                width={600}
                height={400}
                className="w-full h-auto"
              />
              <div className="absolute inset-0 bg-gradient-to-bl from-red-600/20 to-transparent"></div>
            </motion.div>

            <motion.div
              className="order-1 md:order-2"
              initial={{ opacity: 0, x: 20 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.8 }}
            >
              <h2 className="text-3xl font-bold mb-6 text-gray-900">
                Interactive Revision Timeline
              </h2>
              <p className="text-gray-600 mb-6">
                Track the complete history of your engineering documents with
                our intuitive revision timeline.
              </p>

              <ul className="space-y-4">
                {[
                  {
                    icon: <History className="w-5 h-5" />,
                    text: "View the complete revision history of any document",
                  },
                  {
                    icon: <CheckCircle2 className="w-5 h-5" />,
                    text: "Compare any two versions with visual diff highlighting",
                  },
                  {
                    icon: <Users className="w-5 h-5" />,
                    text: "See who made changes and when they were made",
                  },
                  {
                    icon: <ArrowUpRight className="w-5 h-5" />,
                    text: "Restore previous versions with a single click",
                  },
                ].map((item, index) => (
                  <motion.li
                    key={index}
                    className="flex items-start"
                    initial={{ opacity: 0, x: 20 }}
                    whileInView={{ opacity: 1, x: 0 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.5, delay: 0.2 + index * 0.1 }}
                  >
                    <div className="text-orange-500 mr-3 mt-1">{item.icon}</div>
                    <span className="text-gray-700">{item.text}</span>
                  </motion.li>
                ))}
              </ul>
            </motion.div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-gradient-to-b from-white to-orange-50">
        <div className="container mx-auto px-4 text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8 }}
          >
            <h2 className="text-3xl font-bold mb-4 text-gray-900">
              Ready to Transform Your Document Management?
            </h2>
            <p className="text-gray-600 mb-8 max-w-2xl mx-auto">
              Join hundreds of engineering teams who've streamlined their
              document workflows.
            </p>
            <motion.a
              href="/dashboard"
              className="inline-flex items-center px-8 py-4 text-white bg-gradient-to-r from-orange-500 to-red-600 rounded-lg hover:from-orange-600 hover:to-red-700 transition-all duration-300 shadow-lg hover:shadow-xl transform hover:-translate-y-1 text-lg font-medium"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              Get Started Now
              <ArrowUpRight className="ml-2 w-5 h-5" />
            </motion.a>
          </motion.div>
        </div>
      </section>
    </>
  );
}
