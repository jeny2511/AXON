import { useState, useCallback } from "react";
import {
  getActiveStudentId,
  getStudentProfile,
  getStudentRegistrations,
  getStudentAttendance,
} from "../services/studentService";

// Simple custom hook to access active student data
export function useStudentData() {
  const studentId = getActiveStudentId();
  const [student, setStudent] = useState(() => getStudentProfile(studentId));
  const [registrations, setRegistrations] = useState(() =>
    getStudentRegistrations(studentId)
  );
  const [attendance, setAttendance] = useState(() =>
    getStudentAttendance(studentId)
  );

  const refresh = useCallback(() => {
    const currentId = getActiveStudentId();
    setStudent(getStudentProfile(currentId));
    setRegistrations(getStudentRegistrations(currentId));
    setAttendance(getStudentAttendance(currentId));
  }, []);

  return { student, studentId, registrations, attendance, refresh };
}

export default useStudentData;
