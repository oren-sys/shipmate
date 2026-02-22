"use client";

import { useState } from "react";
import { Mail, ArrowLeft } from "lucide-react";

export default function NewsletterSignup() {
  const [email, setEmail] = useState("");
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) return;
    // TODO: Save to Firestore marketing list
    setSubmitted(true);
  };

  return (
    <section className="py-12 bg-gradient-to-bl from-teal to-teal-dark">
      <div className="max-w-2xl mx-auto px-4 text-center">
        <div className="inline-flex items-center justify-center w-14 h-14 bg-white/15
                      rounded-2xl mb-4">
          <Mail size={26} className="text-white" />
        </div>
        <h2 className="text-2xl font-bold text-white mb-2">
          רוצים לשמוע ראשונים על מבצעים?
        </h2>
        <p className="text-white/70 mb-6">
          הירשמו לניוזלטר וקבלו 10% הנחה על ההזמנה הבאה 🎁
        </p>

        {submitted ? (
          <div className="bg-white/15 backdrop-blur-sm rounded-2xl p-6">
            <p className="text-white font-bold text-lg">תודה! 🎉</p>
            <p className="text-white/80 text-sm mt-1">
              נשלח אליך קוד הנחה למייל
            </p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="flex gap-2 max-w-md mx-auto">
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="כתובת אימייל"
              required
              className="flex-1 py-3 px-5 bg-white/15 backdrop-blur-sm border border-white/20
                       rounded-xl text-white placeholder-white/50
                       focus:outline-none focus:ring-2 focus:ring-white/30 text-sm"
            />
            <button
              type="submit"
              className="bg-coral hover:bg-coral-dark text-white font-bold py-3 px-6 rounded-xl
                       transition-all duration-200 hover:shadow-lg flex items-center gap-2 flex-shrink-0"
            >
              <ArrowLeft size={16} />
              הרשמה
            </button>
          </form>
        )}
      </div>
    </section>
  );
}
