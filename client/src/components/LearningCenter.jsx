import React, { useMemo, useState } from "react";
import { BookOpen, CheckCircle2, ChevronDown, GraduationCap, ShieldAlert, Smartphone } from "lucide-react";

const LESSONS = [
  {
    id: "phishing",
    title: "What is phishing?",
    summary: "Attackers pretend to be a trusted bank, brand, or colleague to steal passwords, OTPs, or money.",
    points: [
      "Phishing usually arrives as email, SMS (smishing), a phone call (vishing), or a fake website.",
      "Messages often create urgency: “Your account will be blocked in 1 hour.”",
      "They ask you to click a link, call a number, or send an OTP “for verification.”",
      "Legitimate Sri Lankan banks never ask for your full password, PIN, or OTP in a message.",
    ],
  },
  {
    id: "smishing",
    title: "SMS scams (smishing)",
    summary: "Fake Dialog, SLT, or bank SMS with shortened links or unknown sender IDs.",
    points: [
      "Check the sender: official alerts usually come from a named bank ID, not a random number.",
      "Short links (bit.ly, tinyurl) are a common trick to hide fake login pages.",
      "Prize, lottery, and “unclaimed funds” SMS are almost always scams.",
      "If a message tells you to install an app from a link, stop. Use the official Play Store / App Store listing only.",
    ],
  },
  {
    id: "email",
    title: "Email phishing",
    summary: "Lookalike addresses, copied bank logos, and attachments that install malware.",
    points: [
      "Hover over links before clicking. The real website name should match the bank’s official domain.",
      "Look for misspellings: commerclalbank, sampath-secure, etc.",
      "Unexpected invoices, “KYC update”, or “salary PDF” attachments can carry malware.",
      "When in doubt, open the bank app or type the official URL yourself. Do not use the email link.",
    ],
  },
  {
    id: "threats",
    title: "Security threats to watch",
    summary: "Social engineering, malware, fake apps, and account takeover.",
    points: [
      "Social engineering: the attacker uses fear, greed, or helpfulness instead of hacking your phone.",
      "Malware / spyware: fake “security” apps can read SMS OTPs.",
      "SIM swap: criminals convince a telco to move your number, then intercept OTPs.",
      "Public Wi-Fi: avoid logging into internet banking on open cafe networks.",
    ],
  },
  {
    id: "scams",
    title: "Common scam patterns",
    summary: "OTP theft, fake customer care, investment, job, and romance fraud.",
    points: [
      "OTP / 2FA scam: nobody legitimate will ask you to read an OTP aloud or type it into a chat.",
      "Fake customer care: they call after a phishing SMS and “help” you log in.",
      "Investment / crypto “guaranteed returns”: pressure to deposit quickly is a red flag.",
      "Job / parcel / tax refund scams: they ask for a small “clearance fee” first.",
    ],
  },
  {
    id: "safety",
    title: "How to stay safe",
    summary: "Habits that stop most attacks before they succeed.",
    points: [
      "Enable two-factor authentication in the official bank app, not via a random SMS link.",
      "Keep OS and banking apps updated.",
      "Never share screen control (AnyDesk, TeamViewer) with “bank officers.”",
      "Use PhishGuard Scanner or Chatbot to check a suspicious message before you tap anything.",
      "Report phishing to your bank and, in Sri Lanka, consider CERT / police cybercrime channels.",
    ],
  },
  {
    id: "incident",
    title: "If you already clicked or paid",
    summary: "Act quickly to limit damage.",
    points: [
      "Change the password from a different device if you can.",
      "Call your bank using the number on the back of your card or the official website — not the number in the scam message.",
      "Ask the bank to freeze cards or mark transactions as disputed.",
      "If an OTP was shared, treat the account as compromised immediately.",
    ],
  },
];

const QUIZ = [
  {
    q: "A bank SMS asks you to send the OTP you just received. What should you do?",
    options: ["Send it so they can unlock the account", "Ignore it and contact the bank through official channels", "Forward the OTP to a friend for advice"],
    answer: 1,
  },
  {
    q: "Which is a typical phishing sign?",
    options: ["A calm statement of a completed transaction you made", "Urgent threat plus a shortened unknown link", "A message inside the official mobile banking app inbox"],
    answer: 1,
  },
  {
    q: "The safest way to open internet banking after a suspicious email is to:",
    options: ["Click the email button", "Search a random Google ad", "Type the official URL or use the official app"],
    answer: 2,
  },
];

export default function LearningCenter() {
  const [openId, setOpenId] = useState(LESSONS[0].id);
  const [quizIndex, setQuizIndex] = useState(0);
  const [score, setScore] = useState(0);
  const [picked, setPicked] = useState(null);
  const [done, setDone] = useState(false);

  const current = useMemo(() => QUIZ[quizIndex], [quizIndex]);

  const choose = (index) => {
    if (picked != null || done) return;
    setPicked(index);
    if (index === current.answer) setScore((s) => s + 1);
  };

  const nextQuestion = () => {
    if (quizIndex + 1 >= QUIZ.length) {
      setDone(true);
      return;
    }
    setQuizIndex((i) => i + 1);
    setPicked(null);
  };

  const resetQuiz = () => {
    setQuizIndex(0);
    setScore(0);
    setPicked(null);
    setDone(false);
  };

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      <div>
        <h1 className="text-3xl text-slate-900">Learning Center</h1>
        <p className="text-slate-600 mt-1">
          Learn how phishing, scams, and other security threats work — and how to protect your banking details.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white border border-slate-200 rounded-xl p-4">
          <GraduationCap className="w-6 h-6 text-indigo-600 mb-2" />
          <p className="text-slate-900">Awareness first</p>
          <p className="text-slate-600 mt-1">Most successful attacks trick people, not systems.</p>
        </div>
        <div className="bg-white border border-slate-200 rounded-xl p-4">
          <Smartphone className="w-6 h-6 text-blue-600 mb-2" />
          <p className="text-slate-900">Email and SMS</p>
          <p className="text-slate-600 mt-1">Sri Lankan banks still use both channels for alerts.</p>
        </div>
        <div className="bg-white border border-slate-200 rounded-xl p-4">
          <ShieldAlert className="w-6 h-6 text-red-600 mb-2" />
          <p className="text-slate-900">Practice with PhishGuard</p>
          <p className="text-slate-600 mt-1">Paste a suspicious message into Scanner or Chatbot after you read a lesson.</p>
        </div>
      </div>

      <div className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden">
        {LESSONS.map((lesson) => {
          const open = openId === lesson.id;
          return (
            <div key={lesson.id} className="border-b border-slate-100 last:border-b-0">
              <button
                type="button"
                onClick={() => setOpenId(open ? "" : lesson.id)}
                className="w-full flex items-center justify-between gap-3 px-5 py-4 text-left hover:bg-slate-50"
              >
                <span className="flex items-start gap-3">
                  <BookOpen className="w-5 h-5 text-slate-500 mt-0.5" />
                  <span>
                    <span className="block text-slate-900">{lesson.title}</span>
                    <span className="block text-slate-600 mt-1">{lesson.summary}</span>
                  </span>
                </span>
                <ChevronDown className={`w-5 h-5 text-slate-400 transition ${open ? "rotate-180" : ""}`} />
              </button>
              {open ? (
                <ul className="px-5 pb-5 space-y-2">
                  {lesson.points.map((point) => (
                    <li key={point} className="flex gap-2 text-slate-700">
                      <CheckCircle2 className="w-4 h-4 text-green-600 mt-1 flex-shrink-0" />
                      <span>{point}</span>
                    </li>
                  ))}
                </ul>
              ) : null}
            </div>
          );
        })}
      </div>

      <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-sm">
        <h2 className="text-xl text-slate-900 mb-1">Quick quiz</h2>
        <p className="text-slate-600 mb-4">Three questions to check what you learned.</p>

        {done ? (
          <div>
            <p className="text-slate-900">You scored {score} / {QUIZ.length}.</p>
            <p className="text-slate-600 mt-2">
              {score === QUIZ.length
                ? "Excellent. Keep using official apps and PhishGuard before you tap unknown links."
                : "Review the lessons above, then try the quiz again."}
            </p>
            <button type="button" onClick={resetQuiz} className="mt-4 bg-slate-900 text-white px-4 py-2 rounded-lg">
              Retry quiz
            </button>
          </div>
        ) : (
          <div>
            <p className="text-slate-900 mb-3">
              {quizIndex + 1}. {current.q}
            </p>
            <div className="space-y-2">
              {current.options.map((option, index) => {
                const selected = picked === index;
                const correct = picked != null && index === current.answer;
                const wrong = selected && index !== current.answer;
                return (
                  <button
                    key={option}
                    type="button"
                    onClick={() => choose(index)}
                    className={`w-full text-left px-4 py-3 rounded-lg border ${
                      correct
                        ? "border-green-500 bg-green-50"
                        : wrong
                          ? "border-red-400 bg-red-50"
                          : "border-slate-200 hover:bg-slate-50"
                    }`}
                  >
                    {option}
                  </button>
                );
              })}
            </div>
            {picked != null ? (
              <button type="button" onClick={nextQuestion} className="mt-4 bg-blue-600 text-white px-4 py-2 rounded-lg">
                {quizIndex + 1 >= QUIZ.length ? "See score" : "Next"}
              </button>
            ) : null}
          </div>
        )}
      </div>
    </div>
  );
}
