registrations/{uid}
  uid: string
  displayName: string
  email: string
  username: string
  phone: string
  role: "learner" | "facilitator"
  programme: string
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
