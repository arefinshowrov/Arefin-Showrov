import { Task } from "../db/db";

export interface TaskTemplate {
  category: "Hydration" | "Nutrition" | "Physical Health" | "Mental Wellness" | "Recovery";
  title: string;
  description: string;
  xpValue: number;
}

export const HEALTH_TEMPLATES: TaskTemplate[] = [
  // Hydration
  {
    category: "Hydration",
    title: "Drink Water (250ml+)",
    description: "Drink at least 250ml of water right now to maintain high metabolism and cellular volume.",
    xpValue: 15
  },
  {
    category: "Hydration",
    title: "Hydration Interval Check",
    description: "Refill a 1L water bottle and sip continuously. Avoid caffeine for the next 2 hours.",
    xpValue: 20
  },
  // Nutrition
  {
    category: "Nutrition",
    title: "Eat Nutritious Whole Food",
    description: "Consume a solid meal containing leafy greens, high quality protein, and zero refined sugars.",
    xpValue: 20
  },
  {
    category: "Nutrition",
    title: "Micronutrient Repletion",
    description: "Take high-potency vitamins, minerals, or eat a citrus seed-bearing fruit.",
    xpValue: 15
  },
  // Physical Health
  {
    category: "Physical Health",
    title: "Exercise Workout (30 mins)",
    description: "Complete 30 minutes of high-intensity physical training, run, or callisthenics.",
    xpValue: 40
  },
  {
    category: "Physical Health",
    title: "Ergonomic Posture Drill",
    description: "Stand up, pull shoulders back, chin tucked. Avoid slumping while seated at screens.",
    xpValue: 15
  },
  // Mental Wellness
  {
    category: "Mental Wellness",
    title: "Diaphragmatic Deep Breathing (5 mins)",
    description: "Perform 4-7-8 deep breathing: inhale for 4s, hold for 7s, exhale slowly for 8s.",
    xpValue: 20
  },
  {
    category: "Mental Wellness",
    title: "Digital Detox Break (10 mins)",
    description: "Shut off all digital devices, sit silently in reflection, and let your eyes de-focus.",
    xpValue: 15
  },
  // Recovery
  {
    category: "Recovery",
    title: "Optimize Sleep Window (7-9 Hours)",
    description: "Plan a rigorous 8-hour sleep duration tonight. Turn off glowing displays 1 hour before bed.",
    xpValue: 30
  },
  {
    category: "Recovery",
    title: "Sunlight Exposure (15 mins)",
    description: "Step outdoors into direct sunlight for 10-15 minutes to regulate circadian cortisol rhythms.",
    xpValue: 25
  }
];

/**
 * Generate 3 randomized tasks for a given challenge day.
 * Ensures the categories are distinct for that day, avoiding single-category saturation.
 */
export function generateTasksForDay(userId: string, dayNumber: number): Omit<Task, "id" | "createdAt">[] {
  // Shuffle categories
  const categories: Array<TaskTemplate["category"]> = ["Hydration", "Nutrition", "Physical Health", "Mental Wellness", "Recovery"];
  
  // Deterministic shuffle helper with some entropy based on dayNumber + userId length
  const saltValue = dayNumber + userId.charCodeAt(0) % 10;
  const shuffledCategories = [...categories].sort(() => 0.5 - Math.sin(saltValue));
  
  // Pick first 3 unique categories for the day
  const selectedCategories = shuffledCategories.slice(0, 3);

  const assignedTasks: Omit<Task, "id" | "createdAt">[] = [];

  selectedCategories.forEach(category => {
    // Find matching templates
    const templates = HEALTH_TEMPLATES.filter(t => t.category === category);
    // Draw template (alternating based on day)
    const templateIndex = dayNumber % templates.length;
    const template = templates[templateIndex];

    assignedTasks.push({
      userId,
      challengeDay: dayNumber,
      category: template.category,
      title: template.title,
      description: template.description,
      completed: false,
      completedAt: null,
      notes: "",
      xpEarned: template.xpValue
    });
  });

  return assignedTasks;
}
