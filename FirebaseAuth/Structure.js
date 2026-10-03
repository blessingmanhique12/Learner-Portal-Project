registrations/{uid}
  uid: string
  displayName: string
  email: string
  role: "learner" | "facilitator"
  createdAt: timestamp

tasks/{taskId}
  userId: string // owner — matches auth uid
  title: string
  category: string
  dueDate: string
  priority: "low" | "medium" | "high"
  completed: boolean
  createdAt: timestamp

bookings/{bookingId}
  userId: string // learner UID
  learnerName: string
  facilitatorId: string
  createdBy: string // facilitator UID
  topic: string
  preferredDate: string
  notes: string
  status: "pending" | "confirmed" | "completed"
  createdAt: timestamp

scores/{scoreId}
  userId: string
  stage: "html" | "rps" | "css" | "chess" | "javascript" | "skills-assessment"
  game: string
  score: number
  maxScore: number
  percentage: number
  passMark: number | null
  passed: boolean | null
  assessment: boolean
  completedAt: timestamp

learnerProgress/{uid}
  userId: string // owner — matches auth uid
  games: { html: boolean, rps: boolean, css: boolean, chess: boolean, javascript: boolean }
  lastScoreId: string
  latestAssessment: { score: number, maxScore: number, percentage: number, game: string } | null
  updatedAt: timestamp

resources/{resourceId}
  title: string
  type: string
  url: string
  description: string
