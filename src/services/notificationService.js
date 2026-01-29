import sendEmail from "../utils/sendEmail.js";
import {
  appointmentRequestedEmail,
  appointmentAcceptedEmail,
  appointmentRejectedEmail,
  appointmentCancelledEmail,
  appointmentAcceptedByEmployerEmail,
  appointmentRejectedByEmployerEmail,
  jobCompletedEmail,
  newJobPostedEmail,
  paymentSuccessEmail,
  paymentFailedEmail,
} from "../utils/emailTemplates.js";

import { notificationMessages } from "../utils/notificationMessages.js";
import { createNotification } from "../utils/createNotification.js";

/* ================= APPOINTMENT ================= */

export const notifyAppointmentRequested = async ({
  employer,
  worker,
  job,
}) => {
  /* ---------- EMPLOYER (REQUESTER) ---------- */
  if (employer?._id) {
    if (employer.email) {
      sendEmail(
        employer.email,
        "Appointment Request Sent",
        appointmentRequestedEmail({
          name: employer.name,
          jobTitle: job.title,
        })
      );
    }

    await createNotification({
      userId: employer._id,
      title: "Appointment Requested",
      message: `You requested an appointment for ${job.title}`,
      type: "APPOINTMENT_REQUESTED",
    });
  }

  /* ---------- WORKER (RECEIVER) ---------- */
  if (worker?._id) {
    if (worker.email) {
      sendEmail(
        worker.email,
        "New Appointment Request",
        appointmentRequestedEmail({
          name: worker.name,
          jobTitle: job.title,
        })
      );
    }

    const content = notificationMessages.APPOINTMENT_REQUESTED({
      name: employer.name, // ✅ WHO requested
      jobTitle: job.title,
    });

    await createNotification({
      userId: worker._id,
      title: content.title,
      message: content.message,
      type: "APPOINTMENT_REQUESTED",
    });
  }
};

export const notifyAppointmentAccepted = async ({
  employer,
  worker,
  job,
}) => {
  /* ---------- WORKER (REQUESTER GETS UPDATE) ---------- */
  if (worker?._id) {
    if (worker.email) {
      sendEmail(
        worker.email,
        "Appointment Accepted",
        appointmentAcceptedEmail({
          name: worker.name,
          jobTitle: job.title,
        })
      );
    }

    const content = notificationMessages.APPOINTMENT_ACCEPTED({
      jobTitle: job.title,
    });

    await createNotification({
      userId: worker._id,
      title: content.title,
      message: content.message,
      type: "APPOINTMENT_ACCEPTED",
    });
  }

  /* ---------- EMPLOYER (ACTOR) ---------- */
  if (employer?._id) {
    if (employer.email) {
      sendEmail(
        employer.email,
        "Appointment Accepted",
        appointmentAcceptedByEmployerEmail({
          name: employer.name,
          jobTitle: job.title,
        })
      );
    }

    await createNotification({
      userId: employer._id,
      title: "Appointment Accepted",
      message: `You accepted an appointment for ${job.title}`,
      type: "APPOINTMENT_ACCEPTED",
    });
  }
};

export const notifyAppointmentRejected = async ({
  employer,
  worker,
  job,
}) => {
  /* ---------- WORKER ---------- */
  if (worker?._id) {
    if (worker.email) {
      sendEmail(
        worker.email,
        "Appointment Rejected",
        appointmentRejectedEmail({
          name: worker.name,
          jobTitle: job.title,
        })
      );
    }

    const content = notificationMessages.APPOINTMENT_REJECTED({
      jobTitle: job.title,
    });

    await createNotification({
      userId: worker._id,
      title: content.title,
      message: content.message,
      type: "APPOINTMENT_REJECTED",
    });
  }

  /* ---------- EMPLOYER ---------- */
  if (employer?._id) {
    if (employer.email) {
      sendEmail(
        employer.email,
        "Appointment Rejected",
        appointmentRejectedByEmployerEmail({
          name: employer.name,
          jobTitle: job.title,
        })
      );
    }

    await createNotification({
      userId: employer._id,
      title: "Appointment Rejected",
      message: `You rejected an appointment for ${job.title}`,
      type: "APPOINTMENT_REJECTED",
    });
  }
};

export const notifyAppointmentCancelled = async ({
  employer,
  worker,
  job,
}) => {
  const content = notificationMessages.APPOINTMENT_CANCELLED({
    jobTitle: job.title,
  });

  if (worker?._id) {
    if (worker.email) {
      sendEmail(
        worker.email,
        "Appointment Cancelled",
        appointmentCancelledEmail({
          name: worker.name,
          jobTitle: job.title,
        })
      );
    }

    await createNotification({
      userId: worker._id,
      title: content.title,
      message: content.message,
      type: "APPOINTMENT_CANCELLED",
    });
  }

  if (employer?._id) {
    if (employer.email) {
      sendEmail(
        employer.email,
        "Appointment Cancelled",
        appointmentCancelledEmail({
          name: employer.name,
          jobTitle: job.title,
        })
      );
    }

    await createNotification({
      userId: employer._id,
      title: content.title,
      message: content.message,
      type: "APPOINTMENT_CANCELLED",
    });
  }
};

/* ================= JOB ================= */

export const notifyJobCompleted = async ({
  employer,
  worker,
  job,
}) => {
  const content = notificationMessages.JOB_COMPLETED({
    jobTitle: job.title,
  });

  if (worker?._id) {
    if (worker.email) {
      sendEmail(
        worker.email,
        "Job Completed",
        jobCompletedEmail({
          name: worker.name,
          jobTitle: job.title,
        })
      );
    }

    await createNotification({
      userId: worker._id,
      title: content.title,
      message: content.message,
      type: "JOB_COMPLETED",
    });
  }

  if (employer?._id) {
    if (employer.email) {
      sendEmail(
        employer.email,
        "Job Completed",
        jobCompletedEmail({
          name: employer.name,
          jobTitle: job.title,
        })
      );
    }

    await createNotification({
      userId: employer._id,
      title: content.title,
      message: content.message,
      type: "JOB_COMPLETED",
    });
  }
};

/* ================= JOB POST ================= */

export const notifyNewJobPosted = async ({
  user,
  job,
}) => {
  if (!user?._id) return;

  if (user.email) {
    sendEmail(
      user.email,
      "New Job Available",
      newJobPostedEmail({
        name: user.name,
        jobTitle: job.title,
      })
    );
  }

  await createNotification({
    userId: user._id,
    title: "New Job Posted",
    message: `A new job "${job.title}" is available`,
    type: "NEW_JOB",
  });
};

/* ================= PAYMENT ================= */

export const notifyPaymentSuccess = async ({
  user,
  amount,
}) => {
  if (!user?._id) return;

  if (user.email) {
    sendEmail(
      user.email,
      "Payment Successful",
      paymentSuccessEmail({
        name: user.name,
        amount,
      })
    );
  }

  const content = notificationMessages.PAYMENT_SUCCESS({ amount });

  await createNotification({
    userId: user._id,
    title: content.title,
    message: content.message,
    type: "PAYMENT_SUCCESS",
  });
};

export const notifyPaymentFailed = async ({
  user,
  amount,
}) => {
  if (!user?._id) return;

  if (user.email) {
    sendEmail(
      user.email,
      "Payment Failed",
      paymentFailedEmail({
        name: user.name,
        amount,
      })
    );
  }

  const content = notificationMessages.PAYMENT_FAILED({ amount });

  await createNotification({
    userId: user._id,
    title: content.title,
    message: content.message,
    type: "PAYMENT_FAILED",
  });
};
