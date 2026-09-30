export const events = [
  {
    id: "EV001",
    name: "Capture The Flag 2027",
    category: "Competition",
    status: "upcoming",
    registrationStatus: "open",

    description:
      "National-level Capture The Flag competition organized by The Cyber Force (TCF) where participants solve real cybersecurity challenges.",

    venue: "VGEC Seminar Hall",
    eventDate: "2027-10-23",
    startTime: "14:00",
    endTime: "17:00",

    poster: "/assets/images/events/ctf2027.jpg",
    speakerName: "Rahul Sharma",

    registrationOpen: "2027-10-10T09:00",
    registrationClose: "2027-10-22T23:59",

    attendanceOpen: "2027-10-23T14:00",
    attendanceClose: "2027-10-23T17:15",

    participantLimit: 200,
    registeredCount: 143,

    eligibleDepartments: ["IT", "CE", "ICT"],
    eligibleYears: [2, 3, 4],

    rulebook: "/rulebooks/ctf2027.pdf",

    certificateAvailable: false,
    feedbackRequired: true
  },

  {
    id: "EV002",
    name: "Bug Bounty Bootcamp",
    category: "Workshop",
    status: "upcoming",
    registrationStatus: "open",

    description:
      "Hands-on workshop introducing bug bounty hunting, vulnerability reporting, and ethical hacking.",

    venue: "Computer Lab 3",
    eventDate: "2027-10-30",
    startTime: "10:00",
    endTime: "13:00",

    poster: "/assets/images/events/bugbounty.jpg",
    speakerName: "Priya Patel",

    registrationOpen: "2027-10-15T10:00",
    registrationClose: "2027-10-29T18:00",

    attendanceOpen: "2027-10-30T10:00",
    attendanceClose: "2027-10-30T13:15",

    participantLimit: 120,
    registeredCount: 68,

    eligibleDepartments: ["ALL"],
    eligibleYears: [1, 2, 3, 4],

    rulebook: "/rulebooks/bugbounty.pdf",

    certificateAvailable: false,
    feedbackRequired: true
  },

  {
    id: "EV003",
    name: "Linux & Kali Hands-on Workshop",
    category: "Workshop",
    status: "ongoing",
    registrationStatus: "closed",

    description:
      "Live practical session on Linux commands, Kali Linux tools, and basic penetration testing.",

    venue: "Cyber Security Lab",
    eventDate: "2027-09-27",
    startTime: "14:00",
    endTime: "16:00",

    poster: "/assets/images/events/linuxworkshop.jpg",
    speakerName: "Om Mehta",

    registrationOpen: "2027-09-15T09:00",
    registrationClose: "2027-09-27T13:30",

    attendanceOpen: "2027-09-27T14:00",
    attendanceClose: "2027-09-27T16:10",

    participantLimit: 80,
    registeredCount: 75,

    eligibleDepartments: ["IT", "CE", "ICT"],
    eligibleYears: [2, 3],

    rulebook: "/rulebooks/linux-kali.pdf",

    certificateAvailable: false,
    feedbackRequired: true
  },

  {
    id: "EV004",
    name: "Smart India Hackathon Internal Round",
    category: "Hackathon",
    status: "completed",
    registrationStatus: "closed",

    description:
      "Internal Smart India Hackathon idea pitching and prototype selection round.",

    venue: "Innovation Lab",
    eventDate: "2027-08-18",
    startTime: "09:00",
    endTime: "18:00",

    poster: "/assets/images/events/sih.jpg",
    speakerName: "Faculty Panel",

    registrationOpen: "2027-08-01T09:00",
    registrationClose: "2027-08-15T23:59",

    attendanceOpen: "2027-08-18T09:00",
    attendanceClose: "2027-08-18T18:30",

    participantLimit: 150,
    registeredCount: 132,

    eligibleDepartments: ["IT", "CE", "ICT", "EC"],
    eligibleYears: [2, 3, 4],

    rulebook: "/rulebooks/sih.pdf",

    certificateAvailable: true,
    feedbackRequired: false
  },

  {
    id: "EV005",
    name: "Phishing Awareness Session",
    category: "Seminar",
    status: "completed",
    registrationStatus: "closed",

    description:
      "Interactive cybersecurity awareness session about phishing attacks and email security.",

    venue: "VGEC Auditorium",
    eventDate: "2027-08-05",
    startTime: "11:00",
    endTime: "13:00",

    poster: "/assets/images/events/phishing.jpg",
    speakerName: "Neha Shah",

    registrationOpen: "2027-07-25T09:00",
    registrationClose: "2027-08-04T20:00",

    attendanceOpen: "2027-08-05T11:00",
    attendanceClose: "2027-08-05T13:15",

    participantLimit: 300,
    registeredCount: 210,

    eligibleDepartments: ["ALL"],
    eligibleYears: [1, 2, 3, 4],

    rulebook: "/rulebooks/phishing.pdf",

    certificateAvailable: true,
    feedbackRequired: true
  },

  {
    id: "EV006",
    name: "Web Security Masterclass",
    category: "Workshop",
    status: "upcoming",
    registrationStatus: "closed",

    description:
      "Advanced workshop covering OWASP Top 10 vulnerabilities and secure web development.",

    venue: "Seminar Hall",
    eventDate: "2027-11-08",
    startTime: "10:30",
    endTime: "15:30",

    poster: "/assets/images/events/websecurity.jpg",
    speakerName: "Harsh Vora",

    registrationOpen: "2027-10-20T09:00",
    registrationClose: "2027-11-02T18:00",

    attendanceOpen: "2027-11-08T10:30",
    attendanceClose: "2027-11-08T15:45",

    participantLimit: 100,
    registeredCount: 94,

    eligibleDepartments: ["IT", "CE", "ICT"],
    eligibleYears: [2, 3, 4],

    rulebook: "/rulebooks/websecurity.pdf",

    certificateAvailable: false,
    feedbackRequired: true
  },

  {
    id: "EV007",
    name: "Network Security Challenge",
    category: "Competition",
    status: "upcoming",
    registrationStatus: "full",

    description:
      "Team-based networking and cybersecurity competition using packet analysis and firewall configuration.",

    venue: "Networking Lab",
    eventDate: "2027-11-15",
    startTime: "09:30",
    endTime: "16:30",

    poster: "/assets/images/events/networking.jpg",
    speakerName: "Vivek Joshi",

    registrationOpen: "2027-10-28T09:00",
    registrationClose: "2027-11-10T18:00",

    attendanceOpen: "2027-11-15T09:30",
    attendanceClose: "2027-11-15T16:45",

    participantLimit: 60,
    registeredCount: 60,

    eligibleDepartments: ["IT", "CE"],
    eligibleYears: [2, 3],

    rulebook: "/rulebooks/networkchallenge.pdf",

    certificateAvailable: false,
    feedbackRequired: true
  },

  {
    id: "EV008",
    name: "Digital Forensics Workshop",
    category: "Workshop",
    status: "upcoming",
    registrationStatus: "open",

    description:
      "Introduction to digital forensics, evidence collection, and forensic investigation tools.",

    venue: "Cyber Lab",
    eventDate: "2027-11-22",
    startTime: "13:00",
    endTime: "17:00",

    poster: "/assets/images/events/forensics.jpg",
    speakerName: "Amit Desai",

    registrationOpen: "2027-11-01T09:00",
    registrationClose: "2027-11-20T20:00",

    attendanceOpen: "2027-11-22T13:00",
    attendanceClose: "2027-11-22T17:15",

    participantLimit: 90,
    registeredCount: 34,

    eligibleDepartments: ["IT"],
    eligibleYears: [2, 3, 4],

    rulebook: "/rulebooks/forensics.pdf",

    certificateAvailable: false,
    feedbackRequired: true
  }
];