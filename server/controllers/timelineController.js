const { db, auth, admin } = require("../firebase");
const { createNotification } = require("./notificationController");

// Create Timeline
exports.createTimeline = async (req, res) => {
  try {
    const { projectId, name } = req.body;
    const timelineRef = db.collection("timelines").doc();
    const timelineData = {
      projectId,
      name,
      createdAt: new Date(),
      modifiedAt: new Date(),
    };
    await timelineRef.set(timelineData);
    res.status(200).json({ id: timelineRef.id, ...timelineData });
  } catch (error) {
    console.error("Error creating timeline:", error);
    res.status(500).json({ error: "Failed to create timeline" });
  }
};

// Read Timeline
exports.getTimeline = async (req, res) => {
  try {
    const { timelineId } = req.params;
    const timelineDoc = await db.collection("timelines").doc(timelineId).get();
    if (!timelineDoc.exists) {
      return res.status(404).json({ error: "Timeline not found" });
    }
    res.json({ id: timelineDoc.id, ...timelineDoc.data() });
  } catch (error) {
    console.error("Error fetching timeline:", error);
    res.status(500).json({ error: "Failed to fetch timeline" });
  }
};

// Update Timeline
exports.updateTimeline = async (req, res) => {
  try {
    const { timelineId } = req.params;
    const updateData = req.body;
    updateData.modifiedAt = new Date();
    await db.collection("timelines").doc(timelineId).update(updateData);
    res.json({ message: "Timeline updated successfully" });
  } catch (error) {
    console.error("Error updating timeline:", error);
    res.status(500).json({ error: "Failed to update timeline" });
  }
};

// Delete Timeline
exports.deleteTimeline = async (req, res) => {
  try {
    const { timelineId } = req.params;
    await db.collection("timelines").doc(timelineId).delete();
    res.json({ message: "Timeline deleted successfully" });
  } catch (error) {
    console.error("Error deleting timeline:", error);
    res.status(500).json({ error: "Failed to delete timeline" });
  }
};

// Create Event
exports.createEvent = async (req, res) => {
  const createdDocuments = [];
  const updatedDocuments = [];
  try {
    const { timelineId, eventName, dateRange, repeating, repeatEvery, description, reminders } =
      req.body;

    const startDate = new Date(dateRange.start);
    const endDate = new Date(dateRange.end);

    // Get timeline document first
    const timelineRef = db.collection("timelines").doc(timelineId);
    const timelineDoc = await timelineRef.get();
    if (!timelineDoc.exists) {
      return res.status(404).json({ error: "Timeline not found" });
    }

    // Store previous state for rollback
    const previousEvents = timelineDoc.data().events || [];
    updatedDocuments.push({
      ref: timelineRef,
      field: "events",
      previousValue: previousEvents,
    });

    // Create event document
    const eventData = {
      timelineId,
      eventName,
      dateRange: {
        start: startDate,
        end: endDate,
      },
      repeating,
      repeatEvery,
      description,
      reminders,
      createdAt: new Date(),
      modifiedAt: new Date(),
    };

    const eventRef = db.collection("events").doc();
    await eventRef.set(eventData);
    createdDocuments.push({
      ref: eventRef,
      data: eventData,
    });

    // Update timeline's events array
    await timelineRef.update({
      events: [...previousEvents, eventRef.id],
      modifiedAt: new Date(),
    });

    console.log(`Event added to database with ID: ${eventRef.id}`);

    res.status(200).json({ id: eventRef.id, ...eventData });
  } catch (error) {
    console.error("Error creating event:", error);

    // Rollback updates
    for (const doc of updatedDocuments) {
      try {
        await doc.ref.update({ [doc.field]: doc.previousValue });
        console.log(`Rolled back ${doc.field} in document ${doc.ref.path}`);
      } catch (rollbackError) {
        console.error(`Error rolling back document ${doc.ref.path}:`, rollbackError);
      }
    }

    // Delete created documents
    for (const doc of createdDocuments) {
      try {
        await doc.ref.delete();
        console.log(`Deleted document ${doc.ref.path}`);
      } catch (deleteError) {
        console.error(`Error deleting document ${doc.ref.path}:`, deleteError);
      }
    }

    res.status(500).json({ error: "Failed to create event" });
  }
};

// // Schedule notifications for reminders
// if (reminders && reminders.length > 0) {
//   const eventDoc = await eventRef.get();
//   const event = eventDoc.data();
//   // Get project users to notify
//   const projectDoc = await db.collection("projects").doc(event.projectId).get();
//   const project = projectDoc.data();
//   const usersToNotify = [
//     ...project.managers,
//     ...project.contentManagers,
//     ...project.contributors,
//   ];

//   // Create notification entries for each reminder
//   for (const reminder of reminders) {
//     const reminderDate = new Date(startDate);
//     reminderDate.setMinutes(reminderDate.getMinutes() - reminder);
//     for (const userId of usersToNotify) {
//       try {
//         await createNotification(
//           userId,
//           "event-reminder",
//           "Event Reminder",
//           `Reminder: "${eventName}" starts in ${reminder} minutes`,
//           ""
//         );
//       } catch (notifError) {
//         console.error("Error scheduling reminder notification:", notifError);
//       }
//     }
//   }
// }

// Update Event
exports.updateEvent = async (req, res) => {
  try {
    const { taskId } = req.params;
    const { timelineId, eventName, dateRange, repeating, repeatEvery, description, reminders } =
      req.body;

    const startDate = new Date(dateRange.start);
    const endDate = new Date(dateRange.end);

    const updateData = {
      timelineId,
      eventName,
      dateRange: {
        start: startDate,
        end: endDate,
      },
      repeating,
      repeatEvery,
      description,
      reminders,
      modifiedAt: new Date(),
    };

    console.log("Updating event with data:", updateData);
    await db.collection("events").doc(taskId).update(updateData);
    res.status(200).json({ message: "Event updated successfully" });
  } catch (error) {
    console.error("Error updating event:", error);
    res.status(500).json({ error: "Failed to update event" });
  }
};

// Read Events
exports.getEvents = async (req, res) => {
  try {
    const { timelineId } = req.params;
    const eventsSnapshot = await db
      .collection("events")
      .where("timelineId", "==", timelineId)
      .get();
    const events = eventsSnapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
    res.json(events);
  } catch (error) {
    console.error("Error fetching events:", error);
    res.status(500).json({ error: "Failed to fetch events" });
  }
};

// Delete Event
exports.deleteEvent = async (req, res) => {
  const deletedDocuments = [];
  const updatedDocuments = [];
  try {
    const { timelineId } = req.params;
    const { userId, taskId } = req.body;

    // Get timeline document first
    const timelineRef = db.collection("timelines").doc(timelineId);
    const timelineDoc = await timelineRef.get();

    if (!timelineDoc.exists) {
      return res.status(404).json({ error: "Timeline not found" });
    }

    const previousEvents = timelineDoc.data().events || [];

    // Store previous state for rollback
    updatedDocuments.push({
      ref: timelineRef,
      field: "events",
      previousValue: previousEvents,
    });

    // Remove taskId from timeline's events array
    const updatedEvents = previousEvents.filter((id) => id !== taskId);
    await timelineRef.update({
      events: updatedEvents,
      modifiedAt: new Date(),
    });

    // Delete the event document
    const eventRef = db.collection("events").doc(taskId);
    const eventDoc = await eventRef.get();
    if (eventDoc.exists) {
      deletedDocuments.push({
        ref: eventRef,
        data: eventDoc.data(),
      });
      await eventRef.delete();
    }

    res.status(200).json({ message: "Event deleted successfully" });
  } catch (error) {
    console.error("Error deleting event:", error);

    // Rollback updates
    for (const doc of updatedDocuments) {
      try {
        await doc.ref.update({ [doc.field]: doc.previousValue });
        console.log(`Rolled back ${doc.field} in document ${doc.ref.path}`);
      } catch (rollbackError) {
        console.error(`Error rolling back document ${doc.ref.path}:`, rollbackError);
      }
    }

    // Restore deleted documents
    for (const doc of deletedDocuments) {
      try {
        await doc.ref.set(doc.data);
        console.log(`Restored document ${doc.ref.path}`);
      } catch (restoreError) {
        console.error(`Error restoring document ${doc.ref.path}:`, restoreError);
      }
    }

    res.status(500).json({ error: "Failed to delete event" });
  }
};

// Fetch Timeline ID
exports.fetchTimelineId = async (req, res) => {
  try {
    const { projectId } = req.params;
    const timelineSnapshot = await db
      .collection("timelines")
      .where("projectId", "==", projectId)
      .limit(1)
      .get();

    if (timelineSnapshot.empty) {
      return res.status(404).json({ error: "Timeline not found" });
    }

    const timelineId = timelineSnapshot.docs[0].id;
    res.json({ timelineId });
  } catch (error) {
    console.error("Error fetching timeline ID:", error);
    res.status(500).json({ error: "Failed to fetch timeline ID" });
  }
};

exports.getEventDetails = async (req, res) => {
  try {
    const { taskId } = req.params;
    const eventDoc = await db.collection("events").doc(taskId).get();
    if (!eventDoc.exists) {
      return res.status(404).json({ error: "Event not found" });
    }
    res.json({ id: eventDoc.id, ...eventDoc.data() });
  } catch (error) {
    console.error("Error fetching event details:", error);
    res.status(500).json({ error: "Failed to fetch event details" });
  }
};
