const { db, auth, admin } = require("../firebase"); // Add admin import

// Create Timeline
exports.createTimeline = async (req, res) => {
  try {
    const { projectId, name } = req.body;
    const timelineRef = db.collection("timelines").doc();
    const timelineData = {
      projectId,
      name,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    await timelineRef.set(timelineData);
    res.status(201).json({ id: timelineRef.id, ...timelineData });
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
    updateData.updatedAt = new Date();
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
  try {
    const { timelineId, eventName, dateRange, repeating, repeatEvery, description, reminders } =
      req.body;

    const eventData = {
      timelineId,
      eventName,
      dateRange: {
        start: new Date(dateRange.start),
        end: new Date(dateRange.end),
      },
      repeating,
      repeatEvery,
      description,
      reminders,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    const eventRef = db.collection("events").doc();
    await eventRef.set(eventData);

    console.log(`Event added to database with ID: ${eventRef.id}`);

    res.status(201).json({ id: eventRef.id, ...eventData });
  } catch (error) {
    console.error("Error creating event:", error);
    res.status(500).json({ error: "Failed to create event" });
  }
};

// Read Events
exports.getEvents = async (req, res) => {
  try {
    const { timelineId } = req.params;
    const eventsSnapshot = await db
      .collection("timelines")
      .doc(timelineId)
      .collection("events")
      .get();
    const events = eventsSnapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
    res.json(events);
  } catch (error) {
    console.error("Error fetching events:", error);
    res.status(500).json({ error: "Failed to fetch events" });
  }
};

// Update Event
exports.updateEvent = async (req, res) => {
  try {
    const { timelineId, eventId } = req.params;
    const updateData = req.body;
    updateData.updatedAt = new Date();
    await db
      .collection("timelines")
      .doc(timelineId)
      .collection("events")
      .doc(eventId)
      .update(updateData);
    res.json({ message: "Event updated successfully" });
  } catch (error) {
    console.error("Error updating event:", error);
    res.status(500).json({ error: "Failed to update event" });
  }
};

// Delete Event
exports.deleteEvent = async (req, res) => {
  try {
    const { timelineId, eventId } = req.params;
    await db.collection("timelines").doc(timelineId).collection("events").doc(eventId).delete();
    res.json({ message: "Event deleted successfully" });
  } catch (error) {
    console.error("Error deleting event:", error);
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
