import React, { useState } from "react";
import { X, LucideIcon } from "lucide-react";

interface FilterConfig {
  key: string;
  label: string;
  type: "month" | "date" | "text";
  value: string;
  placeholder?: string;
}

interface StatCardProps {
  icon: LucideIcon;
  label: string;
  value: string;
  bgColor: string;
  iconColor: string;
  filters: FilterConfig[];
  onFilterChange: (key: string, value: string) => void;
  theme: "light" | "dark";
}

const StatCard: React.FC<StatCardProps> = ({
  icon: Icon,
  label,
  value,
  bgColor,
  iconColor,
  filters,
  onFilterChange,
  theme,
}) => {
  const [showFilter, setShowFilter] = useState(false);

  const hasActiveFilter = filters.some((f) => f.value);

  return (
    <div
      className={`rounded-xl p-6 ${
        theme === "dark"
          ? "bg-gradient-to-br from-gray-800 to-gray-850"
          : "bg-white"
      } shadow-lg hover:shadow-xl transition-all duration-200`}
    >
      <div className="flex items-start justify-between mb-4">
        <div className={`p-3 rounded-lg ${bgColor}`}>
          <Icon className={`w-6 h-6 ${iconColor}`} />
        </div>
        <button
          onClick={() => setShowFilter(!showFilter)}
          className={`text-xs px-3 py-1 rounded-md ${
            theme === "dark"
              ? "bg-gray-700 hover:bg-gray-600 text-gray-300"
              : "bg-gray-100 hover:bg-gray-200 text-gray-700"
          } transition-colors`}
        >
          {showFilter ? "Hide" : "Filter"}
        </button>
      </div>

      <h3
        className={`text-3xl font-bold mb-2 ${
          theme === "dark" ? "text-white" : "text-gray-900"
        }`}
      >
        {value}
      </h3>
      <p
        className={`text-sm ${
          theme === "dark" ? "text-gray-400" : "text-gray-600"
        }`}
      >
        {label}
      </p>

      {showFilter && (
        <div className="mt-4 pt-4 border-t border-gray-700 space-y-3">
          {filters.map((filter, index) => (
            <div key={index}>
              <label
                className={`block text-xs font-medium mb-2 ${
                  theme === "dark" ? "text-gray-300" : "text-gray-700"
                }`}
              >
                {filter.label}
              </label>
              {filter.type === "month" && (
                <input
                  type="month"
                  value={filter.value}
                  onChange={(e) => onFilterChange(filter.key, e.target.value)}
                  className={`w-full px-3 py-2 rounded-lg text-sm ${
                    theme === "dark"
                      ? "bg-gray-700 text-white border-gray-600"
                      : "bg-white text-gray-900 border-gray-300"
                  } border focus:outline-none focus:ring-2 focus:ring-blue-500`}
                />
              )}
              {filter.type === "date" && (
                <input
                  type="date"
                  value={filter.value}
                  onChange={(e) => onFilterChange(filter.key, e.target.value)}
                  className={`w-full px-3 py-2 rounded-lg text-sm ${
                    theme === "dark"
                      ? "bg-gray-700 text-white border-gray-600"
                      : "bg-white text-gray-900 border-gray-300"
                  } border focus:outline-none focus:ring-2 focus:ring-blue-500`}
                />
              )}
              {filter.type === "text" && (
                <input
                  type="text"
                  value={filter.value}
                  onChange={(e) => onFilterChange(filter.key, e.target.value)}
                  placeholder={filter.placeholder || "Search..."}
                  className={`w-full px-3 py-2 rounded-lg text-sm ${
                    theme === "dark"
                      ? "bg-gray-700 text-white placeholder-gray-400 border-gray-600"
                      : "bg-white text-gray-900 placeholder-gray-500 border-gray-300"
                  } border focus:outline-none focus:ring-2 focus:ring-blue-500`}
                />
              )}
            </div>
          ))}
          {hasActiveFilter && (
            <button
              onClick={() => filters.forEach((f) => onFilterChange(f.key, ""))}
              className={`w-full mt-2 text-xs px-3 py-2 rounded-md ${
                theme === "dark"
                  ? "bg-red-900 hover:bg-red-800 text-red-300"
                  : "bg-red-50 hover:bg-red-100 text-red-700"
              } transition-colors flex items-center justify-center gap-1`}
            >
              <X className="w-3 h-3" />
              Clear All Filters
            </button>
          )}
        </div>
      )}
    </div>
  );
};

export default StatCard;
