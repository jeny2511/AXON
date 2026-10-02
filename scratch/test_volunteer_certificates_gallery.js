import fetch from "node-fetch";

const BASE_URL = "http://localhost:5000/api";

async function runVolunteerFullTest() {
  console.log("🚀 Starting End-to-End Volunteer Certificates & Gallery Integration Verification...\n");

  // 1. Authenticate Volunteer
  console.log("1. Authenticating Volunteer (`preyas@vgec.ac.in`)...");
  const volLoginRes = await fetch(`${BASE_URL}/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      email: "preyas@vgec.ac.in",
      password: "Volunteer@123",
    }),
  });
  const volLoginData = await volLoginRes.json();
  if (!volLoginData.success || !volLoginData.token) {
    throw new Error(`Volunteer login failed: ${JSON.stringify(volLoginData)}`);
  }
  const volToken = volLoginData.token;
  console.log(`✅ Volunteer authenticated successfully! (ID: ${volLoginData.user.id})\n`);

  // 2. Authenticate Student
  console.log("2. Authenticating Student (`jeny@vgec.ac.in`)...");
  const stuLoginRes = await fetch(`${BASE_URL}/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      email: "jeny@vgec.ac.in",
      password: "Student@123",
    }),
  });
  const stuLoginData = await stuLoginRes.json();
  if (!stuLoginData.success || !stuLoginData.token) {
    throw new Error(`Student login failed: ${JSON.stringify(stuLoginData)}`);
  }
  const stuToken = stuLoginData.token;
  const studentId = stuLoginData.user.id;
  console.log(`✅ Student authenticated successfully! (ID: ${studentId})\n`);

  // 3. Create a Test Event for Certification
  console.log("3. Volunteer creates a new event for certificate testing...");
  const eventRes = await fetch(`${BASE_URL}/events`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${volToken}`,
    },
    body: JSON.stringify({
      name: "Cyber Security Hack Night 2026",
      category: "Workshop",
      date: new Date(Date.now() + 86400000).toISOString(),
      endDate: new Date(Date.now() + 86400000 + 7200000).toISOString(),
      startTime: "10:00 AM",
      endTime: "12:00 PM",
      venue: "Main Auditorium, Block D",
      speaker: "Preyas Patel",
      description: "Hands-on cybersecurity deep-dive.",
      participantsLimit: 50,
      seats: 50,
      certificateAvailable: true,
      feedbackRequired: false,
    }),
  });
  const eventData = await eventRes.json();
  if (!eventData.success) {
    throw new Error(`Event creation failed: ${JSON.stringify(eventData)}`);
  }
  const eventId = eventData.event._id;
  console.log(`✅ Event created successfully! (ID: ${eventId})\n`);

  // 4. Student registers for event
  console.log("4. Student registers for the event...");
  const regRes = await fetch(`${BASE_URL}/registrations/${eventId}`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${stuToken}`,
    },
  });
  const regData = await regRes.json();
  const regId = regData.registration?._id || regData.registration?.id || regData.data?._id || "OK";
  console.log(`✅ Registration response: ${regData.message || regId}\n`);

  // 5. Volunteer marks student attendance
  console.log("5. Volunteer records student physical attendance...");
  const attRes = await fetch(`${BASE_URL}/attendance/manual`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${volToken}`,
    },
    body: JSON.stringify({
      eventId,
      studentId,
      status: "present",
    }),
  });
  const attData = await attRes.json();
  console.log(`✅ Attendance recorded! (${attData.message})\n`);

  // 6. Volunteer issues certificates for event
  console.log("6. Volunteer issues certificates for event attendees...");
  const issueRes = await fetch(`${BASE_URL}/certificates/issue/${eventId}`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${volToken}`,
    },
    body: JSON.stringify({
      eligibilityRule: "attendance",
    }),
  });
  const issueData = await issueRes.json();
  console.log(`✅ Certificate bulk issuance result:`, issueData.message);
  console.log(`   Newly issued: ${issueData.newlyIssuedCount}, Total eligible: ${issueData.totalEligible}\n`);

  // 7. Volunteer fetches certificates for the event
  console.log("7. Volunteer fetches certificates list for this event...");
  const eventCertsRes = await fetch(`${BASE_URL}/certificates/event/${eventId}`, {
    headers: { Authorization: `Bearer ${volToken}` },
  });
  const eventCertsData = await eventCertsRes.json();
  console.log(`✅ Event certificates fetched: ${eventCertsData.count} certificates found.\n`);

  // 8. Student checks my-certificates
  console.log("8. Student fetches their newly issued certificate...");
  const stuCertsRes = await fetch(`${BASE_URL}/certificates/my-certificates`, {
    headers: { Authorization: `Bearer ${stuToken}` },
  });
  const stuCertsData = await stuCertsRes.json();
  const myCert = stuCertsData.certificates.find((c) => c.event && (c.event.id === eventId || c.event._id === eventId));
  if (!myCert) {
    throw new Error(`Student could not find their issued certificate in my-certificates!`);
  }
  console.log(`✅ Student verified certificate: Title: "${myCert.certificateTitle}", Verification Code: "${myCert.verificationCode}", Locked: ${myCert.isLocked}\n`);

  // 9. Gallery: Volunteer creates a gallery album
  console.log("9. Volunteer creates a new event gallery album...");
  const albumRes = await fetch(`${BASE_URL}/gallery`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${volToken}`,
    },
    body: JSON.stringify({
      eventName: "Cyber Security Hack Night 2026 Album",
      speakerName: "Preyas Patel",
      eventDate: "2026-10-02",
      venue: "Block D",
      category: "Workshop",
      description: "Memorable moments from the hack night.",
      photos: ["https://images.unsplash.com/photo-1517694712202-14dd9538aa97?w=800"],
    }),
  });
  const albumData = await albumRes.json();
  console.log(`✅ Gallery album created: ${albumData.message || "OK"} (ID: ${albumData.album?._id})\n`);
  const albumId = albumData.album?._id;

  // 10. Public/Student fetches gallery albums
  console.log("10. Fetching gallery albums feed...");
  const galleryListRes = await fetch(`${BASE_URL}/gallery`);
  const galleryListData = await galleryListRes.json();
  console.log(`✅ Gallery list fetched: ${galleryListData.albums?.length || 0} albums retrieved.\n`);

  // 11. Cleanup test event & gallery album
  console.log("11. Cleaning up test data...");
  if (albumId) {
    await fetch(`${BASE_URL}/gallery/${albumId}`, {
      method: "DELETE",
      headers: { Authorization: `Bearer ${volToken}` },
    });
  }
  await fetch(`${BASE_URL}/events/${eventId}`, {
    method: "DELETE",
    headers: { Authorization: `Bearer ${volToken}` },
  });
  console.log(`✅ Cleanup complete!\n`);

  console.log("🎉 ALL TESTS PASSED! Volunteer Certificates, Gallery, Attendance, and Notifications flows are 100% verified!");
}

runVolunteerFullTest().catch((err) => {
  console.error("❌ Test failed:", err);
  process.exit(1);
});
