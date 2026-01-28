export const notificationMessages = {
  APPOINTMENT_REQUESTED: ({ name, jobTitle }) => ({
    title: "New Appointment Request",
    message: `${name} requested an appointment for ${jobTitle}`,
  }),

  APPOINTMENT_ACCEPTED: ({ jobTitle }) => ({
    title: "Appointment Accepted",
    message: `Your appointment for ${jobTitle} was accepted`,
  }),

  APPOINTMENT_REJECTED: ({ jobTitle }) => ({
    title: "Appointment Rejected",
    message: `Your appointment for ${jobTitle} was rejected`,
  }),

  APPOINTMENT_CANCELLED: ({ jobTitle }) => ({
    title: "Appointment Cancelled",
    message: `Appointment for ${jobTitle} was cancelled`,
  }),

  JOB_COMPLETED: ({ jobTitle }) => ({
    title: "Job Completed",
    message: `${jobTitle} has been marked as completed`,
  }),

  JOB_BLOCKED: ({ jobTitle }) => ({
    title: "Job Blocked",
    message: `${jobTitle} was blocked by admin`,
  }),

  PAYMENT_SUCCESS: ({ amount }) => ({
    title: "Payment Successful",
    message: `₹${amount} payment completed successfully`,
  }),

  PAYMENT_FAILED: ({ amount }) => ({
    title: "Payment Failed",
    message: `₹${amount} payment failed`,
  }),
};
