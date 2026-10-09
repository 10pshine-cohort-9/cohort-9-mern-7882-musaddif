import { Archive, BookOpen, BriefcaseBusiness, Heart, Lightbulb, NotebookPen, Plane } from "lucide-react";

export const categories = [
  { name: "Personal", theme: "purple", icon: Heart, count: 4 },
  { name: "Work", theme: "blue", icon: BriefcaseBusiness, count: 3 },
  { name: "Study", theme: "green", icon: BookOpen, count: 2 },
  { name: "Ideas", theme: "yellow", icon: Lightbulb, count: 2 },
  { name: "Others", theme: "slate", icon: Archive, count: 1 },
];

export const notes = [
  { id: "1", title: "Project Ideas", content: "Some great project ideas for our upcoming hackathon...", category: "Ideas", theme: "purple", time: "2 mins ago", icon: Lightbulb, createdAt: "Aug 23, 2026 at 10:24 AM", updatedAt: "Aug 23, 2026 at 10:24 AM", tags: "hackathon, ideas" },
  { id: "2", title: "Daily Thoughts", content: "Today was a productive day. Learnt something new about...", category: "Personal", theme: "yellow", time: "1 hour ago", icon: Lightbulb, createdAt: "Aug 23, 2026 at 9:24 AM", updatedAt: "Aug 23, 2026 at 9:24 AM", tags: "daily" },
  { id: "3", title: "Study Notes", content: "Important concepts from Data Structures and Algorithms.", category: "Study", theme: "green", time: "3 hours ago", icon: BookOpen, createdAt: "Aug 23, 2026 at 7:24 AM", updatedAt: "Aug 23, 2026 at 7:24 AM", tags: "study" },
  { id: "4", title: "Work Tasks", content: "- Review PRD document\n- Update the API endpoint...", category: "Work", theme: "blue", time: "Yesterday", icon: BriefcaseBusiness, createdAt: "Aug 22, 2026 at 4:15 PM", updatedAt: "Aug 22, 2026 at 4:15 PM", tags: "todo, work" },
  { id: "5", title: "Favorite Quotes", content: '"The only way to do great work is to love what you do."\n- Steve Jobs', category: "Personal", theme: "red", time: "2 days ago", icon: Heart, createdAt: "Aug 21, 2026 at 2:10 PM", updatedAt: "Aug 21, 2026 at 2:10 PM", tags: "quotes" },
  { id: "6", title: "Travel Plans", content: "Places to visit in Northern Areas of Pakistan...", category: "Others", theme: "purple", time: "3 days ago", icon: Plane, createdAt: "Aug 20, 2026 at 11:00 AM", updatedAt: "Aug 20, 2026 at 11:00 AM", tags: "travel" },
  { id: "7", title: "Code Snippets", content: "Useful JavaScript array methods...\n.map(), .filter(), .reduce()", category: "Work", theme: "blue", time: "3 days ago", icon: NotebookPen, createdAt: "Aug 20, 2026 at 9:30 AM", updatedAt: "Aug 20, 2026 at 9:30 AM", tags: "javascript, code", isTrashed: true },
  { id: "8", title: "Books to Read", content: "- Atomic Habits\n- The Pragmatic Programmer\n- Deep Work", category: "Study", theme: "orange", time: "5 days ago", icon: BookOpen, createdAt: "Aug 18, 2026 at 3:00 PM", updatedAt: "Aug 18, 2026 at 3:00 PM", tags: "books", isTrashed: true },
];
