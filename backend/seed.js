require("dotenv").config();
const mongoose = require("mongoose");
const Expert = require("./models/Expert");
const connectDB = require("./config/db");

// Generate slots for next 7 days
const generateSlots = () => {
  const slots = [];
  const times = [
    "09:00 AM", "10:00 AM", "11:00 AM",
    "12:00 PM", "02:00 PM", "03:00 PM",
    "04:00 PM", "05:00 PM",
  ];

  for (let i = 1; i <= 7; i++) {
    const date = new Date();
    date.setDate(date.getDate() + i);
    const dateStr = date.toISOString().split("T")[0];

    times.forEach((time) => {
      slots.push({ date: dateStr, time, isBooked: false });
    });
  }
  return slots;
};

const experts = [
  {
    name: "Priya Sharma",
    category: "Technology",
    experience: 8,
    rating: 4.9,
    bio: "Senior Software Architect at Google with expertise in distributed systems and cloud-native architecture. Former IIT Delhi alumna.",
    imageUrl: "https://randomuser.me/api/portraits/women/44.jpg",
    hourlyRate: 2500,
  },
  {
    name: "Rahul Verma",
    category: "Finance",
    experience: 12,
    rating: 4.7,
    bio: "SEBI-registered investment advisor and ex-Goldman Sachs analyst. Specializes in equity research and portfolio management.",
    imageUrl: "https://randomuser.me/api/portraits/men/32.jpg",
    hourlyRate: 3000,
  },
  {
    name: "Ananya Krishnan",
    category: "Design",
    experience: 6,
    rating: 4.8,
    bio: "Product design lead with experience at Swiggy and Razorpay. Expert in UX research, design systems, and Figma.",
    imageUrl: "https://randomuser.me/api/portraits/women/68.jpg",
    hourlyRate: 2000,
  },
  {
    name: "Vikram Mehta",
    category: "Business",
    experience: 15,
    rating: 4.6,
    bio: "Serial entrepreneur and startup mentor. Co-founded 3 successful startups. Angel investor with 20+ portfolio companies.",
    imageUrl: "https://randomuser.me/api/portraits/men/75.jpg",
    hourlyRate: 5000,
  },
  {
    name: "Sneha Patel",
    category: "Marketing",
    experience: 9,
    rating: 4.5,
    bio: "Growth marketing expert. Scaled multiple D2C brands from 0 to ₹100Cr ARR. Specializes in performance marketing and brand building.",
    imageUrl: "https://randomuser.me/api/portraits/women/12.jpg",
    hourlyRate: 2200,
  },
  {
    name: "Dr. Arjun Nair",
    category: "Health",
    experience: 14,
    rating: 4.9,
    bio: "MBBS, MD (Psychiatry) from AIIMS. Mental health consultant and wellness coach. Expertise in stress management and work-life balance.",
    imageUrl: "https://randomuser.me/api/portraits/men/52.jpg",
    hourlyRate: 4000,
  },
  {
    name: "Kavya Reddy",
    category: "Legal",
    experience: 10,
    rating: 4.4,
    bio: "Corporate lawyer specializing in startup law, IP rights, and international contracts. Previously at Cyril Amarchand Mangaldas.",
    imageUrl: "https://randomuser.me/api/portraits/women/31.jpg",
    hourlyRate: 3500,
  },
  {
    name: "Rohan Gupta",
    category: "Technology",
    experience: 5,
    rating: 4.6,
    bio: "Full-stack developer and React Native specialist. Built apps with 1M+ downloads. Open source contributor and tech blogger.",
    imageUrl: "https://randomuser.me/api/portraits/men/22.jpg",
    hourlyRate: 1800,
  },
  {
    name: "Meera Joshi",
    category: "Education",
    experience: 11,
    rating: 4.8,
    bio: "EdTech entrepreneur and curriculum designer. Former teacher turned educator, helped 50,000+ students crack competitive exams.",
    imageUrl: "https://randomuser.me/api/portraits/women/55.jpg",
    hourlyRate: 1500,
  },
  {
    name: "Siddharth Agarwal",
    category: "Finance",
    experience: 7,
    rating: 4.5,
    bio: "Chartered Accountant and tax consultant. Expert in personal finance, tax planning, and NRI taxation. Big 4 background.",
    imageUrl: "https://randomuser.me/api/portraits/men/41.jpg",
    hourlyRate: 2800,
  },
  {
    name: "Divya Menon",
    category: "Design",
    experience: 4,
    rating: 4.3,
    bio: "Brand identity designer and illustrator. Worked with 100+ startups on visual branding, logo design, and brand guidelines.",
    imageUrl: "https://randomuser.me/api/portraits/women/79.jpg",
    hourlyRate: 1600,
  },
  {
    name: "Aakash Singh",
    category: "Business",
    experience: 8,
    rating: 4.7,
    bio: "Operations consultant and Lean Six Sigma Black Belt. Helped 30+ SMEs optimize processes and scale operations efficiently.",
    imageUrl: "https://randomuser.me/api/portraits/men/88.jpg",
    hourlyRate: 2700,
  },
];

const seed = async () => {
  try {
    await connectDB();
    await Expert.deleteMany({});
    console.log("🗑️  Cleared existing experts");

    const expertsWithSlots = experts.map((e) => ({
      ...e,
      availableSlots: generateSlots(),
    }));

    await Expert.insertMany(expertsWithSlots);
    console.log(`✅ Seeded ${experts.length} experts with slots`);
    process.exit(0);
  } catch (err) {
    console.error("❌ Seed failed:", err);
    process.exit(1);
  }
};

seed();
