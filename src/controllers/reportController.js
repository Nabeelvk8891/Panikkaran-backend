import Report from "../models/Report.js";
import Appointment from "../models/Appointment.js";

export const createReport = async (req, res) => {
  try {
    const { reportedUser, job, reason, description } = req.body;

    if (!reportedUser || !job || !reason) {
      return res.status(400).json({ message: "Missing required fields" });
    }

    // ❌ block self report
    if (reportedUser.toString() === req.user.id.toString()) {
      return res
        .status(400)
        .json({ message: "You cannot report yourself" });
    }

    // ✅ CHECK COMPLETED APPOINTMENT
    const completedAppointment = await Appointment.findOne({
      user: req.user.id,
      worker: reportedUser,
      job: job,
      status: "completed",
    });

    if (!completedAppointment) {
      return res.status(403).json({
        message: "You can report a job only after the work is completed",
      });
    }

    // ❌ prevent duplicate report
    const alreadyReported = await Report.findOne({
      reporter: req.user.id,
      job,
    });

    if (alreadyReported) {
      return res.status(400).json({
        message: "You have already reported this job",
      });
    }

    const report = await Report.create({
      reporter: req.user.id,   
      reportedUser,
      job,
      reason,
      description,
    });

    res.status(201).json({
      message: "Report submitted successfully",
      report,
    });
  } catch (error) {
    console.error("CREATE REPORT ERROR:", error);
    res.status(500).json({ message: "Failed to submit report" });
  }
};



/* ADMIN – GET ALL REPORTS */
export const getAllReports = async (req, res) => {
  try {
    const reports = await Report.find()
      .populate("reporter", "name email")
      .populate("reportedUser", "name email isBlocked")
      .populate("job", "title")
      .sort({ createdAt: -1 });

    res.status(200).json(reports);
  } catch (error) {
    console.error("GET ALL REPORTS ERROR:", error);
    res.status(500).json({ message: "Failed to fetch reports" });
  }
};


/* ADMIN – UPDATE REPORT STATUS */
export const updateReportStatus = async (req, res) => {
  try {
    const { status, adminNote } = req.body;

    const report = await Report.findByIdAndUpdate(
      req.params.id,
      { status, adminNote },
      { new: true }
    );

    if (!report) {
      return res.status(404).json({ message: "Report not found" });
    }

    res.json({ message: "Report updated", report });
  } catch (error) {
    console.error("UPDATE REPORT ERROR:", error);
    res.status(500).json({ message: "Failed to update report" });
  }
};

