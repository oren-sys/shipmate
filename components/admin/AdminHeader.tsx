"use client";

import { signOut, useSession } from "next-auth/react";
import { useState } from "react";

export default function AdminHeader() {
  const { data: session } = useSession();
  const [showMenu, setShowMenu] = useState(false);

  return (
    <header className="h-16 bg-white border-b border-gray-200 flex items-center justify-between px-6 sticky top-0 z-20">
      {/* Page breadcrumb area */}
      <div className="flex items-center gap-3">
        <h2 className="text-lg font-bold text-charcoal font-heebo">
          ניהול ShipMate
        </h2>
      </div>

      {/* Right side: notifications + user */}
      <div className="flex items-center gap-4">
        {/* Quick stats */}
        <div className="hidden md:flex items-center gap-3 text-sm text-gray-500">
          <span className="flex items-center gap-1">
            <span className="w-2 h-2 rounded-full bg-mint animate-pulse" />
            חנות פעילה
          </span>
        </div>

        {/* Notifications bell */}
        <button className="relative p-2 text-gray-400 hover:text-charcoal transition-colors rounded-lg hover:bg-gray-100">
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"
            />
          </svg>
          {/* Notification badge */}
          <span className="absolute top-1 right-1 w-2 h-2 bg-coral rounded-full" />
        </button>

        {/* User dropdown */}
        <div className="relative">
          <button
            onClick={() => setShowMenu(!showMenu)}
            className="flex items-center gap-2 p-2 rounded-lg hover:bg-gray-100 transition-colors"
          >
            <div className="w-8 h-8 rounded-full bg-teal flex items-center justify-center">
              <span className="text-white text-sm font-bold">M</span>
            </div>
            <div className="hidden md:block text-right">
              <p className="text-sm font-medium text-charcoal">
                {session?.user?.name || "מנהל"}
              </p>
              <p className="text-xs text-gray-400">
                {session?.user?.email || "admin@shipmate.store"}
              </p>
            </div>
            <svg
              className={`w-4 h-4 text-gray-400 transition-transform ${showMenu ? "rotate-180" : ""}`}
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </button>

          {/* Dropdown menu */}
          {showMenu && (
            <>
              {/* Backdrop */}
              <div
                className="fixed inset-0 z-10"
                onClick={() => setShowMenu(false)}
              />
              <div className="absolute left-0 mt-2 w-48 bg-white rounded-xl shadow-lg border border-gray-200 py-2 z-20">
                <button
                  onClick={() => {
                    setShowMenu(false);
                    signOut({ callbackUrl: "/admin/login" });
                  }}
                  className="w-full text-right px-4 py-2 text-sm text-red-600 hover:bg-red-50 transition-colors flex items-center gap-2"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"
                    />
                  </svg>
                  <span>התנתק</span>
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </header>
  );
}
