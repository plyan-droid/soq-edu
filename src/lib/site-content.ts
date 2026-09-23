import aiImage from "@/assets/course-ai.jpg";
import beautyImage from "@/assets/course-beauty.jpg";
import serviceImage from "@/assets/course-service.jpg";
import diplomaImage from "@/assets/course-diploma.jpg";

export type CourseCategory = "AI & Business" | "Beauty & Wellness" | "Retail & Service" | "Diplomas";

export type Course = {
  slug: string;
  title: string;
  category: CourseCategory;
  summary: string;
  duration: string;
  mode: string;
  price: string;
  badge: string;
  image: string;
  outcomes: string[];
};

export const courses: Course[] = [
  {
    slug: "integrated-digital-marketing-with-generative-ai",
    title: "Integrated Digital Marketing with Generative AI",
    category: "AI & Business",
    summary: "Build practical marketing campaigns and use generative AI to create, test and improve content.",
    duration: "2 days",
    mode: "Classroom",
    price: "From $216",
    badge: "WSQ",
    image: aiImage,
    outcomes: ["Plan an integrated digital campaign", "Create responsible AI-assisted content", "Measure and improve campaign performance"],
  },
  {
    slug: "professional-makeup-artistry",
    title: "Professional Makeup Artistry",
    category: "Beauty & Wellness",
    summary: "Develop professional techniques for consultation, preparation and complete makeup application.",
    duration: "3 days",
    mode: "Classroom",
    price: "From $360",
    badge: "WSQ",
    image: beautyImage,
    outcomes: ["Prepare clients and work areas safely", "Select products for different needs", "Deliver polished day and evening looks"],
  },
  {
    slug: "customer-service-excellence",
    title: "Customer Service Excellence",
    category: "Retail & Service",
    summary: "Strengthen communication, service recovery and customer experience skills for frontline work.",
    duration: "2 days",
    mode: "Classroom",
    price: "From $252",
    badge: "WSQ",
    image: serviceImage,
    outcomes: ["Understand customer expectations", "Communicate with confidence", "Resolve common service challenges"],
  },
  {
    slug: "diploma-in-beauty-wellness-international",
    title: "Diploma in Beauty & Wellness (International)",
    category: "Diplomas",
    summary: "Build broad beauty and wellness capabilities through a structured international programme.",
    duration: "Full-time / Part-time",
    mode: "Classroom",
    price: "Enquire for details",
    badge: "Diploma",
    image: diplomaImage,
    outcomes: ["Build a professional beauty foundation", "Practise client consultation and care", "Prepare for industry opportunities"],
  },
  {
    slug: "digital-marketing-strategy",
    title: "Digital Marketing Strategy",
    category: "AI & Business",
    summary: "Turn business objectives into focused digital campaigns with measurable outcomes.",
    duration: "2 days",
    mode: "Classroom",
    price: "Funding available",
    badge: "WSQ",
    image: aiImage,
    outcomes: ["Define campaign objectives", "Select suitable digital channels", "Use performance data to optimise activity"],
  },
  {
    slug: "service-leadership",
    title: "Service Leadership",
    category: "Retail & Service",
    summary: "Lead service teams with clearer standards, coaching practices and customer-focused decisions.",
    duration: "2 days",
    mode: "Classroom",
    price: "Funding available",
    badge: "WSQ",
    image: serviceImage,
    outcomes: ["Set service standards", "Coach frontline teams", "Turn feedback into practical improvements"],
  },
];

export const categories = [
  { name: "AI & Business", copy: "Work smarter and grow with technology.", image: aiImage },
  { name: "Beauty & Wellness", copy: "Build professional, hands-on expertise.", image: beautyImage },
  { name: "Retail & Service", copy: "Strengthen customer-facing skills.", image: serviceImage },
  { name: "Diplomas", copy: "Go deeper with structured learning.", image: diplomaImage },
] as const;

export const contact = {
  address: "300 Tanjong Pagar Road, #08-01, Singapore 088540",
  phone: "+65 6222 1234",
  email: "enquiry@soq.edu.sg",
  whatsapp: "https://wa.me/6562221234",
  portal: "https://soq.trainingsystemsg.com",
};
