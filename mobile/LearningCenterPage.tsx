import { useMemo, useState } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";

const LESSONS = [
  {
    id: "phishing",
    title: "What is phishing?",
    body: "Attackers pose as a bank or brand to steal passwords, OTPs, or money. They use urgency and fake links. Banks never ask for your full password or OTP in a message.",
  },
  {
    id: "smishing",
    title: "SMS scams (smishing)",
    body: "Watch unknown sender IDs, prize SMS, and short links. Do not install apps from a text. Use the official store listing only.",
  },
  {
    id: "email",
    title: "Email phishing",
    body: "Check lookalike addresses and misspellings. Hover links. Open banking from the official app or by typing the real URL — never from a surprise email button.",
  },
  {
    id: "threats",
    title: "Other security threats",
    body: "Social engineering, fake security apps that read OTPs, SIM swap, and logging into banking on public Wi-Fi are common risks.",
  },
  {
    id: "scams",
    title: "Common scams",
    body: "OTP theft, fake customer care, investment “guaranteed returns”, job fees, and parcel/tax refund tricks. Nobody legitimate needs your OTP in chat.",
  },
  {
    id: "safety",
    title: "Stay safe",
    body: "Use the official bank app, keep software updated, never share screen-control apps with “officers”, and paste suspicious texts into PhishGuard Scanner or Chatbot.",
  },
  {
    id: "incident",
    title: "If you already clicked",
    body: "Change passwords, call the bank using the number on your card or official site (not the scam number), freeze cards, and treat shared OTPs as a full compromise.",
  },
];

const QUIZ = [
  {
    q: "A bank SMS asks you to send your OTP. What should you do?",
    options: ["Send it", "Ignore and use official bank channels", "Forward the OTP to a friend"],
    answer: 1,
  },
  {
    q: "A typical phishing sign is:",
    options: ["A normal alert for a transfer you made", "Urgent threat plus a short unknown link", "A notice inside the official bank app"],
    answer: 1,
  },
];

export default function LearningCenterPage() {
  const [openId, setOpenId] = useState(LESSONS[0].id);
  const [quizIndex, setQuizIndex] = useState(0);
  const [score, setScore] = useState(0);
  const [picked, setPicked] = useState<number | null>(null);
  const [done, setDone] = useState(false);
  const current = useMemo(() => QUIZ[quizIndex], [quizIndex]);

  const choose = (index: number) => {
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

  return (
    <View>
      <Text style={styles.title}>Learning Center</Text>
      <Text style={styles.subtitle}>Phishing, scams, and practical security habits for online banking.</Text>

      {LESSONS.map((lesson) => {
        const open = openId === lesson.id;
        return (
          <Pressable key={lesson.id} style={styles.card} onPress={() => setOpenId(open ? "" : lesson.id)}>
            <Text style={styles.sectionTitle}>{lesson.title}</Text>
            {open ? <Text style={styles.text}>{lesson.body}</Text> : <Text style={styles.small}>Tap to read</Text>}
          </Pressable>
        );
      })}

      <View style={styles.card}>
        <Text style={styles.sectionTitle}>Quick quiz</Text>
        {done ? (
          <>
            <Text style={styles.text}>
              Score: {score} / {QUIZ.length}
            </Text>
            <Pressable
              style={styles.primaryBtn}
              onPress={() => {
                setQuizIndex(0);
                setScore(0);
                setPicked(null);
                setDone(false);
              }}
            >
              <Text style={styles.primaryText}>Retry</Text>
            </Pressable>
          </>
        ) : (
          <>
            <Text style={styles.text}>{current.q}</Text>
            {current.options.map((option, index) => {
              const selected = picked === index;
              const correct = picked != null && index === current.answer;
              const wrong = selected && index !== current.answer;
              return (
                <Pressable
                  key={option}
                  style={[styles.option, correct && styles.optionOk, wrong && styles.optionBad]}
                  onPress={() => choose(index)}
                >
                  <Text style={styles.optionText}>{option}</Text>
                </Pressable>
              );
            })}
            {picked != null ? (
              <Pressable style={styles.primaryBtn} onPress={nextQuestion}>
                <Text style={styles.primaryText}>{quizIndex + 1 >= QUIZ.length ? "See score" : "Next"}</Text>
              </Pressable>
            ) : null}
          </>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  title: { fontSize: 20, fontWeight: "700", color: "#fafafa", marginBottom: 4 },
  subtitle: { color: "#a3a3a3", marginBottom: 12, fontSize: 14 },
  card: {
    backgroundColor: "#1c1c1e",
    borderRadius: 14,
    padding: 14,
    marginBottom: 10,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: "#333333",
  },
  sectionTitle: { fontSize: 15, fontWeight: "700", color: "#fafafa", marginBottom: 6 },
  text: { color: "#d4d4d8", marginBottom: 8, lineHeight: 20 },
  small: { color: "#a3a3a3", fontSize: 12 },
  option: {
    backgroundColor: "#262626",
    borderRadius: 10,
    padding: 10,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: "#404040",
  },
  optionOk: { borderColor: "#22c55e", backgroundColor: "#14532d" },
  optionBad: { borderColor: "#ef4444", backgroundColor: "#7f1d1d" },
  optionText: { color: "#e5e5e5" },
  primaryBtn: { backgroundColor: "#2563eb", borderRadius: 12, alignItems: "center", paddingVertical: 12, marginTop: 8 },
  primaryText: { color: "#ffffff", fontWeight: "700" },
});
