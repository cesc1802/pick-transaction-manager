"use client";

import React, { useState, useMemo, useEffect, useCallback } from "react";
import {
  Sun,
  Moon,
  User,
  DollarSign,
  CreditCard,
} from "lucide-react";
import { useThemeStore, ThemeContext } from "@/hook/theme.hook";
import StatCard from "@/ui/StatCard";
import { Transaction, getTransactions } from "@/lib/supabase";

// Helper function to parse transfer date
// Handles format: "DD/MM/YYYY HH:MM:SS"
const parseTransferDate = (dateString: string | null): Date | null => {
  if (!dateString) return null;

  try {
    // Try to parse Vietnamese format: "DD/MM/YYYY HH:MM:SS"
    const parts = dateString.trim().split(" ");

    if (parts.length >= 1) {
      const dateParts = parts[0].split("/");

      if (dateParts.length === 3) {
        const day = parseInt(dateParts[0], 10);
        const month = parseInt(dateParts[1], 10) - 1; // Month is 0-indexed
        const year = parseInt(dateParts[2], 10);

        let hours = 0, minutes = 0, seconds = 0;

        // Parse time if available
        if (parts.length === 2 && parts[1]) {
          const timeParts = parts[1].split(":");
          if (timeParts.length >= 2) {
            hours = parseInt(timeParts[0], 10) || 0;
            minutes = parseInt(timeParts[1], 10) || 0;
            seconds = parseInt(timeParts[2], 10) || 0;
          }
        }

        const date = new Date(year, month, day, hours, minutes, seconds);

        // Validate the date
        if (isNaN(date.getTime())) {
          return null;
        }

        return date;
      }
    }

    // Fallback to standard Date parsing
    const fallbackDate = new Date(dateString);
    if (!isNaN(fallbackDate.getTime())) {
      return fallbackDate;
    }

    return null;
  } catch {
    return null;
  }
};

// Helper function to format date
const formatDate = (dateString: string | null): string => {
  const date = parseTransferDate(dateString);
  if (!date) return "N/A";

  return date.toLocaleDateString("vi-VN", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
};

// Helper function to format time
const formatTime = (dateString: string | null): string => {
  const date = parseTransferDate(dateString);
  if (!date) return "";

  return date.toLocaleTimeString("vi-VN", {
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  });
};

// Helper function to get just the date part (YYYY-MM-DD)
// Available for custom date formatting needs
// eslint-disable-next-line @typescript-eslint/no-unused-vars
const getDateOnly = (dateString: string | null): string => {
  const date = parseTransferDate(dateString);
  if (!date) return "";

  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");

  return `${year}-${month}-${day}`;
};

// Helper function to get just the time part (HH:MM:SS)
// Available for custom time formatting needs
// eslint-disable-next-line @typescript-eslint/no-unused-vars
const getTimeOnly = (dateString: string | null): string => {
  const date = parseTransferDate(dateString);
  if (!date) return "";

  const hours = String(date.getHours()).padStart(2, "0");
  const minutes = String(date.getMinutes()).padStart(2, "0");
  const seconds = String(date.getSeconds()).padStart(2, "0");

  return `${hours}:${minutes}:${seconds}`;
};

interface FilterState {
  month: string;
  date: string;
  sender: string;
  receiver: string;
}

const TransactionDashboard = () => {
  const { theme, toggleTheme } = useThemeStore();
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Fetch transactions from Supabase
  useEffect(() => {
    const fetchTransactions = async () => {
      try {
        setLoading(true);
        console.log("Fetching transactions from Supabase...");
        const data = await getTransactions();
        console.log("Transactions received:", data);
        console.log("Number of transactions:", data?.length || 0);
        setTransactions(data || []);
        setError(null);
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : "Failed to fetch transactions";
        setError(errorMessage);
        console.error("Error fetching transactions:", err);
        setTransactions([]);
      } finally {
        setLoading(false);
      }
    };

    fetchTransactions();
  }, []);

  // Individual filters for each stat
  const [totalAmountFilter, setTotalAmountFilter] = useState<FilterState>({
    month: "",
    date: "",
    sender: "",
    receiver: "",
  });
  const [avgAmountFilter, setAvgAmountFilter] = useState<FilterState>({
    month: "",
    date: "",
    sender: "",
    receiver: "",
  });

  // Combined filter for table (merge all active filters)
  const combinedFilter = useMemo(() => {
    return {
      month: totalAmountFilter.month || avgAmountFilter.month,
      date: totalAmountFilter.date || avgAmountFilter.date,
      sender: avgAmountFilter.sender,
      receiver: "",
    };
  }, [totalAmountFilter, avgAmountFilter]);

  // Helper function to filter transactions
  const filterTransactions = useCallback((filter: FilterState) => {
    return transactions.filter((transaction) => {
      const transactionDate = parseTransferDate(transaction.transfer_time);

      if (filter.month && transactionDate) {
        const monthYear = `${transactionDate.getFullYear()}-${String(
          transactionDate.getMonth() + 1
        ).padStart(2, "0")}`;
        if (monthYear !== filter.month) return false;
      }

      if (filter.date && transactionDate) {
        const dateStr = `${transactionDate.getFullYear()}-${String(
          transactionDate.getMonth() + 1
        ).padStart(2, "0")}-${String(transactionDate.getDate()).padStart(
          2,
          "0"
        )}`;
        if (dateStr !== filter.date) return false;
      }

      if (
        filter.sender &&
        !transaction.sender.toLowerCase().includes(filter.sender.toLowerCase())
      ) {
        return false;
      }

      if (
        filter.receiver &&
        transaction.receiver &&
        !transaction.receiver
          .toLowerCase()
          .includes(filter.receiver.toLowerCase())
      ) {
        return false;
      }

      return true;
    });
  }, [transactions]);

  // Calculate stats for each card with individual filters
  const totalAmountStats = useMemo(() => {
    const filtered = filterTransactions(totalAmountFilter);
    const total = filtered.reduce(
      (sum, t) => sum + parseFloat(t.amount || "0"),
      0
    );
    return total.toLocaleString("vi-VN");
  }, [totalAmountFilter, filterTransactions]);

  const avgAmountStats = useMemo(() => {
    const filtered = filterTransactions(avgAmountFilter);
    const total = filtered.reduce(
      (sum, t) => sum + parseFloat(t.amount || "0"),
      0
    );
    const avg = filtered.length > 0 ? total / filtered.length : 0;
    return avg.toLocaleString("vi-VN", { maximumFractionDigits: 0 });
  }, [avgAmountFilter, filterTransactions]);

  // Filtered transactions for table display
  const tableTransactions = useMemo(() => {
    return filterTransactions(combinedFilter);
  }, [combinedFilter, filterTransactions]);

  // Loading state
  if (loading) {
    return (
      <ThemeContext.Provider value={{ theme, toggleTheme }}>
        <div
          className={`min-h-screen flex items-center justify-center ${
            theme === "dark"
              ? "bg-gradient-to-br from-gray-900 via-gray-850 to-gray-900"
              : "bg-gradient-to-br from-gray-50 to-gray-100"
          }`}
        >
          <div className="text-center">
            <div
              className={`inline-block h-12 w-12 animate-spin rounded-full border-4 border-solid ${
                theme === "dark"
                  ? "border-blue-400 border-r-transparent"
                  : "border-blue-600 border-r-transparent"
              }`}
            />
            <p
              className={`mt-4 text-lg ${
                theme === "dark" ? "text-gray-300" : "text-gray-700"
              }`}
            >
              Loading transactions...
            </p>
          </div>
        </div>
      </ThemeContext.Provider>
    );
  }

  // Error state
  if (error) {
    return (
      <ThemeContext.Provider value={{ theme, toggleTheme }}>
        <div
          className={`min-h-screen flex items-center justify-center ${
            theme === "dark"
              ? "bg-gradient-to-br from-gray-900 via-gray-850 to-gray-900"
              : "bg-gradient-to-br from-gray-50 to-gray-100"
          }`}
        >
          <div className="text-center">
            <div
              className={`inline-block p-4 rounded-full ${
                theme === "dark" ? "bg-red-900/50" : "bg-red-100"
              }`}
            >
              <svg
                className={`w-12 h-12 ${
                  theme === "dark" ? "text-red-400" : "text-red-600"
                }`}
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
            </div>
            <h2
              className={`mt-4 text-xl font-semibold ${
                theme === "dark" ? "text-white" : "text-gray-900"
              }`}
            >
              Error Loading Data
            </h2>
            <p
              className={`mt-2 ${
                theme === "dark" ? "text-gray-400" : "text-gray-600"
              }`}
            >
              {error}
            </p>
            <button
              onClick={() => window.location.reload()}
              className={`mt-4 px-4 py-2 rounded-lg ${
                theme === "dark"
                  ? "bg-blue-900 hover:bg-blue-800 text-blue-300"
                  : "bg-blue-100 hover:bg-blue-200 text-blue-700"
              } transition-colors`}
            >
              Retry
            </button>
          </div>
        </div>
      </ThemeContext.Provider>
    );
  }

  return (
    <ThemeContext.Provider value={{ theme, toggleTheme }}>
      <div
        className={`min-h-screen ${
          theme === "dark"
            ? "bg-gradient-to-br from-gray-900 via-gray-850 to-gray-900"
            : "bg-gradient-to-br from-gray-50 to-gray-100"
        } transition-colors duration-200`}
      >
        {/* Header */}
        <header
          className={`${
            theme === "dark"
              ? "bg-gray-800/50 backdrop-blur-sm border-gray-700/50"
              : "bg-white/50 backdrop-blur-sm border-gray-200"
          } border-b sticky top-0 z-10`}
        >
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex items-center justify-between h-16">
              <div className="flex items-center gap-4">
                <h1
                  className={`text-2xl font-bold ${
                    theme === "dark" ? "text-white" : "text-gray-900"
                  }`}
                >
                  💰 Transaction Manager
                </h1>
              </div>

              <div className="flex items-center gap-4">
                {/* Theme Toggle */}
                <button
                  onClick={toggleTheme}
                  className={`p-2 rounded-lg ${
                    theme === "dark"
                      ? "bg-gray-700 hover:bg-gray-600 text-yellow-400"
                      : "bg-gray-100 hover:bg-gray-200 text-gray-700"
                  } transition-colors`}
                  aria-label="Toggle theme"
                >
                  {theme === "light" ? (
                    <Moon className="w-5 h-5" />
                  ) : (
                    <Sun className="w-5 h-5" />
                  )}
                </button>

                {/* Profile */}
                <div
                  className={`w-10 h-10 rounded-full ${
                    theme === "dark" ? "bg-blue-900" : "bg-blue-100"
                  } flex items-center justify-center cursor-pointer`}
                >
                  <User
                    className={`w-6 h-6 ${
                      theme === "dark" ? "text-blue-400" : "text-blue-600"
                    }`}
                  />
                </div>
              </div>
            </div>
          </div>
        </header>

        {/* Main Content */}
        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {/* Welcome Section */}
          <div className="mb-8">
            <h2
              className={`text-3xl font-bold mb-2 ${
                theme === "dark" ? "text-white" : "text-gray-900"
              }`}
            >
              Transaction Overview 📊
            </h2>
            <p
              className={`${
                theme === "dark" ? "text-gray-400" : "text-gray-600"
              }`}
            >
              View and filter your transaction statistics
            </p>
          </div>

          {/* Stats Grid */}
          <div className="grid grid-cols-2 gap-6">
            {/* Total Amount - Filter by Month and Date */}
            <StatCard
              icon={DollarSign}
              label="Total Amount"
              value={`${totalAmountStats} ₫`}
              bgColor={theme === "dark" ? "bg-blue-900/50" : "bg-blue-100"}
              iconColor={theme === "dark" ? "text-blue-400" : "text-blue-600"}
              filters={[
                {
                  key: "month",
                  label: "Filter by Month",
                  type: "month",
                  value: totalAmountFilter.month,
                },
                {
                  key: "date",
                  label: "Filter by Date",
                  type: "date",
                  value: totalAmountFilter.date,
                },
              ]}
              onFilterChange={(key, value) =>
                setTotalAmountFilter({ ...totalAmountFilter, [key]: value })
              }
              theme={theme}
            />

            {/* Average Amount - Filter by Sender */}
            <StatCard
              icon={DollarSign}
              label="Average Amount"
              value={`${avgAmountStats} ₫`}
              bgColor={theme === "dark" ? "bg-purple-900/50" : "bg-purple-100"}
              iconColor={
                theme === "dark" ? "text-purple-400" : "text-purple-600"
              }
              filters={[
                {
                  key: "sender",
                  label: "Filter by Sender",
                  type: "text",
                  value: avgAmountFilter.sender,
                  placeholder: "Enter sender name...",
                },
              ]}
              onFilterChange={(key, value) =>
                setAvgAmountFilter({ ...avgAmountFilter, [key]: value })
              }
              theme={theme}
            />
          </div>

          {/* Transactions Table */}
          <div
            className={`mt-8 rounded-xl p-6 ${
              theme === "dark"
                ? "bg-gradient-to-br from-gray-800 to-gray-850"
                : "bg-white"
            } shadow-lg`}
          >
            <div className="flex items-center justify-between mb-6">
              <div>
                <h3
                  className={`text-xl font-bold ${
                    theme === "dark" ? "text-white" : "text-gray-900"
                  }`}
                >
                  Transaction Details
                </h3>
                <p
                  className={`text-sm mt-1 ${
                    theme === "dark" ? "text-gray-400" : "text-gray-600"
                  }`}
                >
                  {tableTransactions.length} transaction
                  {tableTransactions.length !== 1 ? "s" : ""} found
                  {transactions.length === 0 && " (Database is empty or no access)"}
                </p>
              </div>
            </div>

            {/* Transactions Table */}
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead
                  className={`${
                    theme === "dark" ? "bg-gray-700/50" : "bg-gray-50"
                  }`}
                >
                  <tr>
                    <th
                      className={`px-4 py-3 text-left text-sm font-semibold ${
                        theme === "dark" ? "text-gray-300" : "text-gray-700"
                      }`}
                    >
                      Bank / ID
                    </th>
                    <th
                      className={`px-4 py-3 text-left text-sm font-semibold ${
                        theme === "dark" ? "text-gray-300" : "text-gray-700"
                      }`}
                    >
                      Date & Time
                    </th>
                    <th
                      className={`px-4 py-3 text-left text-sm font-semibold ${
                        theme === "dark" ? "text-gray-300" : "text-gray-700"
                      }`}
                    >
                      Sender
                    </th>
                    <th
                      className={`px-4 py-3 text-left text-sm font-semibold ${
                        theme === "dark" ? "text-gray-300" : "text-gray-700"
                      }`}
                    >
                      Receiver
                    </th>
                    <th
                      className={`px-4 py-3 text-left text-sm font-semibold ${
                        theme === "dark" ? "text-gray-300" : "text-gray-700"
                      }`}
                    >
                      Amount
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {tableTransactions.length > 0 ? (
                    tableTransactions.map((transaction) => {
                      const amount = parseFloat(transaction.amount || "0");

                      return (
                        <tr
                          key={transaction.id}
                          className={`${
                            theme === "dark"
                              ? "border-gray-700 hover:bg-gray-750"
                              : "border-gray-200 hover:bg-gray-50"
                          } border-b transition-colors`}
                        >
                          <td
                            className={`px-4 py-4 ${
                              theme === "dark"
                                ? "text-gray-300"
                                : "text-gray-900"
                            }`}
                          >
                            <div className="flex items-center gap-3">
                              <div
                                className={`w-10 h-10 rounded-full flex items-center justify-center ${
                                  theme === "dark"
                                    ? "bg-blue-900/50"
                                    : "bg-blue-100"
                                }`}
                              >
                                <CreditCard
                                  className={`w-5 h-5 ${
                                    theme === "dark"
                                      ? "text-blue-400"
                                      : "text-blue-600"
                                  }`}
                                />
                              </div>
                              <div>
                                <div
                                  className={`font-medium ${
                                    theme === "dark"
                                      ? "text-white"
                                      : "text-gray-900"
                                  }`}
                                >
                                  {transaction.bank_name}
                                </div>
                                <div
                                  className={`text-xs ${
                                    theme === "dark"
                                      ? "text-gray-400"
                                      : "text-gray-500"
                                  }`}
                                >
                                  ID: {transaction.id}
                                </div>
                              </div>
                            </div>
                          </td>
                          <td
                            className={`px-4 py-4 ${
                              theme === "dark"
                                ? "text-gray-300"
                                : "text-gray-600"
                            }`}
                          >
                            <div className="text-sm font-medium">
                              {formatDate(transaction.transfer_time)}
                            </div>
                            <div
                              className={`text-xs ${
                                theme === "dark"
                                  ? "text-gray-400"
                                  : "text-gray-500"
                              }`}
                            >
                              {formatTime(transaction.transfer_time)}
                            </div>
                          </td>
                          <td
                            className={`px-4 py-4 text-sm ${
                              theme === "dark"
                                ? "text-gray-300"
                                : "text-gray-600"
                            }`}
                          >
                            {transaction.sender}
                          </td>
                          <td
                            className={`px-4 py-4 text-sm ${
                              theme === "dark"
                                ? "text-gray-300"
                                : "text-gray-600"
                            }`}
                          >
                            {transaction.receiver}
                          </td>
                          <td className={`px-4 py-4`}>
                            <span
                              className={`font-semibold ${
                                theme === "dark"
                                  ? "text-green-400"
                                  : "text-green-600"
                              }`}
                            >
                              {amount.toLocaleString("vi-VN")} ₫
                            </span>
                          </td>
                        </tr>
                      );
                    })
                  ) : (
                    <tr>
                      <td
                        colSpan={5}
                        className={`px-4 py-8 text-center ${
                          theme === "dark" ? "text-gray-400" : "text-gray-600"
                        }`}
                      >
                        No transactions found matching your filters.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </main>
      </div>
    </ThemeContext.Provider>
  );
};

export default TransactionDashboard;
