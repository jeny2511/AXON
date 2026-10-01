import { useState, useCallback, useEffect } from "react";
import {
  getActiveStudentId,
  getStudentProfile,
  getStudentRegistrations,
  getStudentAttendance,
} from "../services/studentService";
import { isLoggedIn } from "../services/authService";

// Simple custom hook to access active student data
export function useStudentData() {
  const [studentId, setStudentId] = useState(() => getActiveStudentId());
  const [student, setStudent] = useState(() => getStudentProfile(studentId));
  const [registrations, setRegistrations] = useState(() =>
    getStudentRegistrations(studentId)
  );
  const [attendance, setAttendance] = useState(() =>
    getStudentAttendance(studentId)
  );
  const [authenticated, setAuthenticated] = useState(() => isLoggedIn());

  const refresh = useCallback(() => {
    const currentId = getActiveStudentId();
    setStudentId(currentId);
    setStudent(getStudentProfile(currentId));
    setRegistrations(getStudentRegistrations(currentId));
    setAttendance(getStudentAttendance(currentId));
    setAuthenticated(isLoggedIn());
  }, []);

  useEffect(() => {
    const handleAuthChange = () => {
      refresh();
    };

    window.addEventListener("axon-auth-change", handleAuthChange);
    return () => {
      window.removeEventListener("axon-auth-change", handleAuthChange);
    };
  }, [refresh]);

  return {
    student,
    studentId,
    registrations,
    attendance,
    isLoggedIn: authenticated,
    refresh,
  };
}

export default useStudentData;
