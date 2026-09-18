users/{uid}
  displayName: string
  email: string
  role: "learner" | "assessor"
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
  userId: string
  topic: string
  preferredDate: string
  notes: string
  status: "pending" | "confirmed" | "completed"

scores/{scoreId}
  userId: string
  score: number
  duration: number
  completedAt: timestamp

resources/{resourceId}
  title: string
  type: string
  url: string
  description: string
