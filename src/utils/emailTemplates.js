/* ================= COMMON WRAPPER ================= */
const baseTemplate = (title, body) => `
  <div style="font-family: Arial, sans-serif; background:#f9fafb; padding:20px;">
    <div style="max-width:600px; margin:auto; background:#ffffff; border-radius:8px; padding:24px;">
      <h2 style="color:#111827; margin-bottom:16px;">${title}</h2>
      <div style="color:#374151; font-size:14px; line-height:1.6;">
        ${body}
      </div>
      <hr style="margin:24px 0; border:none; border-top:1px solid #e5e7eb;" />
      <p style="font-size:12px; color:#6b7280;">
        Panikkaran • Local Job Platform
      </p>
    </div>
  </div>
`;

/* ================= APPOINTMENT ================= */

export const appointmentRequestedEmail = ({ name, jobTitle }) =>
  baseTemplate(
    "New Appointment Request",
    `
      <p>Hello <b>${name}</b>,</p>
      <p>You have received a new appointment request for the job:</p>
      <p><b>${jobTitle}</b></p>
      <p>Please log in to review and respond.</p>
    `
  );

export const appointmentAcceptedEmail = ({ name, jobTitle }) =>
  baseTemplate(
    "Appointment Accepted ✅",
    `
      <p>Hello <b>${name}</b>,</p>
      <p>Your appointment request for <b>${jobTitle}</b> has been accepted.</p>
      <p>You can now contact the employer.</p>
    `
  );

export const appointmentRejectedEmail = ({ name, jobTitle }) =>
  baseTemplate(
    "Appointment Rejected ❌",
    `
      <p>Hello <b>${name}</b>,</p>
      <p>Your appointment request for <b>${jobTitle}</b> was rejected.</p>
      <p>You may apply for other jobs.</p>
    `
  );

export const appointmentCancelledEmail = ({ name, jobTitle }) =>
  baseTemplate(
    "Appointment Cancelled",
    `
      <p>Hello <b>${name}</b>,</p>
      <p>The appointment for <b>${jobTitle}</b> has been cancelled.</p>
    `
  );

export const appointmentAcceptedByEmployerEmail = ({ name, jobTitle }) =>
  baseTemplate(
    "Appointment Accepted ✅",
    `
      <p>Hello <b>${name}</b>,</p>
      <p>
        You have <strong>accepted a customer's appointment request</strong>
        for <b>${jobTitle}</b>.
      </p>
      <p>
        Please contact your customer to proceed with the job.
      </p>
    `
  );

  export const appointmentRejectedByEmployerEmail = ({ name, jobTitle }) =>
  baseTemplate(
    "Appointment Rejected ❌",
    `
      <p>Hello <b>${name}</b>,</p>
      <p>
        You have <strong>rejected a customer's appointment request</strong>
        for <b>${jobTitle}</b>.
      </p>
      <p>
        No further action is required.
      </p>
    `
  );




/* ================= JOB ================= */

export const jobCompletedEmail = ({ name, jobTitle }) =>
  baseTemplate(
    "Job Completed 🎉",
    `
      <p>Hello <b>${name}</b>,</p>
      <p>The job <b>${jobTitle}</b> has been marked as completed.</p>
      <p>Thank you for using Panikkaran.</p>
    `
  );

export const newJobPostedEmail = ({ name, jobTitle }) =>
  baseTemplate(
    "New Job Posted 🆕",
    `
      <p>Hello <b>${name}</b>,</p>
      <p>A new job matching your interests has been posted:</p>
      <p><b>${jobTitle}</b></p>
      <p>Log in to apply.</p>
    `
  );

  /* ================= ADMIN ACTIONS ================= */

export const adminUserBlockedEmail = ({ name, reason }) =>
  baseTemplate(
    "Account Blocked ⚠️",
    `
      <p>Hello <b>${name}</b>,</p>
      <p>Your account has been <b>blocked by the admin</b>.</p>
      <p><b>Reason:</b> ${reason || "Policy violation"}</p>
      <p>If you think this is a mistake, please contact support.</p>
    `
  );

export const adminUserUnblockedEmail = ({ name }) =>
  baseTemplate(
    "Account Unblocked ✅",
    `
      <p>Hello <b>${name}</b>,</p>
      <p>Your account has been <b>unblocked</b>.</p>
      <p>You can now continue using Panikkaran.</p>
    `
  );

export const adminJobBlockedEmail = ({ name, jobTitle, reason }) =>
  baseTemplate(
    "Job Blocked ⚠️",
    `
      <p>Hello <b>${name}</b>,</p>
      <p>Your job <b>${jobTitle}</b> has been blocked by admin.</p>
      <p><b>Reason:</b> ${reason || "Violation of platform rules"}</p>
    `
  );

export const adminJobUnblockedEmail = ({ name, jobTitle }) =>
  baseTemplate(
    "Job Unblocked ✅",
    `
      <p>Hello <b>${name}</b>,</p>
      <p>Your job <b>${jobTitle}</b> has been unblocked.</p>
    `
  );

export const adminJobDeletedEmail = ({ name, jobTitle }) =>
  baseTemplate(
    "Job Removed ❌",
    `
      <p>Hello <b>${name}</b>,</p>
      <p>Your job <b>${jobTitle}</b> has been permanently removed by admin.</p>
    `
  );


/* ================= PAYMENT ================= */

export const paymentSuccessEmail = ({ name, amount }) =>
  baseTemplate(
    "Payment Successful 💳",
    `
      <p>Hello <b>${name}</b>,</p>
      <p>Your payment of <b>₹${amount}</b> was successful.</p>
    `
  );

export const paymentFailedEmail = ({ name, amount }) =>
  baseTemplate(
    "Payment Failed ❌",
    `
      <p>Hello <b>${name}</b>,</p>
      <p>Your payment of <b>₹${amount}</b> failed.</p>
      <p>Please try again.</p>
    `
  );

/* ================= FUTURE ================= */
// Password reset email will be added later here
