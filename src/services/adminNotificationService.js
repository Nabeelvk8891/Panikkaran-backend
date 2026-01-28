import sendEmail from "../utils/sendEmail.js";
import {
  adminUserBlockedEmail,
  adminUserUnblockedEmail,
  adminJobBlockedEmail,
  adminJobUnblockedEmail,
  adminJobDeletedEmail,
} from "../utils/emailTemplates.js";

import { createNotification } from "../utils/createNotification.js";

/* ================= USER ================= */

export const notifyUserBlockedByAdmin = async (user, reason) => {
  if (!user?._id) return;

  if (user.email) {
    sendEmail(
      user.email,
      "Your account has been blocked",
      adminUserBlockedEmail({
        name: user.name,
        reason,
      })
    );
  }

  await createNotification({
    userId: user._id,
    title: "Account Blocked",
    message: `Your account was blocked by admin. Reason: ${
      reason || "Policy violation"
    }`,
    type: "USER_BLOCKED",
  });
};

export const notifyUserUnblockedByAdmin = async (user) => {
  if (!user?._id) return;

  if (user.email) {
    sendEmail(
      user.email,
      "Your account has been unblocked",
      adminUserUnblockedEmail({
        name: user.name,
      })
    );
  }

  await createNotification({
    userId: user._id,
    title: "Account Unblocked",
    message: "Your account has been unblocked by admin",
    type: "USER_UNBLOCKED",
  });
};

/* ================= JOB ================= */

export const notifyJobBlockedByAdmin = async (job, user, reason) => {
  if (!user?._id) return;

  if (user.email) {
    sendEmail(
      user.email,
      "Your job has been blocked",
      adminJobBlockedEmail({
        name: user.name,
        jobTitle: job.title,
        reason,
      })
    );
  }

  await createNotification({
    userId: user._id,
    title: "Job Blocked",
    message: `Your job "${job.title}" was blocked. Reason: ${
      reason || "Policy violation"
    }`,
    type: "JOB_BLOCKED",
  });
};

export const notifyJobUnblockedByAdmin = async (job, user) => {
  if (!user?._id) return;

  if (user.email) {
    sendEmail(
      user.email,
      "Your job has been unblocked",
      adminJobUnblockedEmail({
        name: user.name,
        jobTitle: job.title,
      })
    );
  }

  await createNotification({
    userId: user._id,
    title: "Job Unblocked",
    message: `Your job "${job.title}" has been unblocked`,
    type: "JOB_UNBLOCKED",
  });
};

export const notifyJobDeletedByAdmin = async (job, user) => {
  if (!user?._id) return;

  if (user.email) {
    sendEmail(
      user.email,
      "Your job has been removed",
      adminJobDeletedEmail({
        name: user.name,
        jobTitle: job.title,
      })
    );
  }

  await createNotification({
    userId: user._id,
    title: "Job Removed",
    message: `Your job "${job.title}" was permanently removed by admin`,
    type: "JOB_DELETED",
  });
};
