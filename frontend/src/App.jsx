import { useEffect, useState, useCallback, useRef } from "react";
import axios from "axios";
import "./App.css";

const API_URL = "http://localhost:5001/api/students";

// Reusable Count-up component for stats
function AnimatedCounter({ value, duration = 400 }) {
  const [displayValue, setDisplayValue] = useState(0);
  const prevValueRef = useRef(0);

  useEffect(() => {
    let startTimestamp = null;
    const startValue = prevValueRef.current;
    const target = Number(value) || 0;

    if (startValue === target) return;

    const step = (timestamp) => {
      if (!startTimestamp) startTimestamp = timestamp;
      const progress = Math.min((timestamp - startTimestamp) / duration, 1);
      // Ease out cubic
      const easeProgress = 1 - Math.pow(1 - progress, 3);
      const current = Math.round(startValue + (target - startValue) * easeProgress);
      setDisplayValue(current);
      if (progress < 1) {
        window.requestAnimationFrame(step);
      } else {
        prevValueRef.current = target;
      }
    };

    const animId = window.requestAnimationFrame(step);
    return () => window.cancelAnimationFrame(animId);
  }, [value, duration]);

  return <span>{displayValue}</span>;
}

function App() {
  const [students, setStudents] = useState([]);
  const [search, setSearch] = useState("");
  const [branch, setBranch] = useState("All");
  const [showForm, setShowForm] = useState(false);
  const [editingStudent, setEditingStudent] = useState(null);
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [isClosingModal, setIsClosingModal] = useState(false);

  // Loading and action animation states
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitSuccessText, setSubmitSuccessText] = useState("");
  const [deletingId, setDeletingId] = useState(null);
  const [fadingOutId, setFadingOutId] = useState(null);

  // Toast notifications
  const [toasts, setToasts] = useState([]);

  const showToast = useCallback((message, type = "success") => {
    const id = Date.now() + Math.random();
    setToasts((prev) => [...prev, { id, message, type }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 3500);
  }, []);

  const removeToast = (id) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  };

  const [formData, setFormData] = useState({
    studentId: "",
    name: "",
    email: "",
    mobile: "",
    branch: "",
    semester: "",
    cgpa: ""
  });

  // Fetch all students
  const fetchStudents = useCallback(async () => {
    try {
      const response = await axios.get(API_URL);
      setStudents(response.data);
    } catch (error) {
      console.error("Error fetching students:", error);
      showToast("Error connecting to server", "error");
    } finally {
      setIsLoading(false);
    }
  }, [showToast]);

  useEffect(() => {
    let ignore = false;
    axios
      .get(API_URL)
      .then((res) => {
        if (!ignore) {
          setStudents(res.data);
          setIsLoading(false);
        }
      })
      .catch((err) => {
        if (!ignore) {
          console.error("Error fetching students:", err);
          showToast("Error connecting to server", "error");
          setIsLoading(false);
        }
      });

    return () => {
      ignore = true;
    };
  }, [showToast]);

  // Handle form input
  const handleChange = (e) => {
    setFormData((prev) => ({
      ...prev,
      [e.target.name]: e.target.value
    }));
  };

  // Add or update student
  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      if (editingStudent) {
        await axios.put(
          `${API_URL}/${editingStudent.studentId}`,
          formData
        );
        setSubmitSuccessText("Student Updated ✓");
        showToast("Student updated successfully!", "success");
      } else {
        await axios.post(API_URL, formData);
        setSubmitSuccessText("Student Added ✓");
        showToast("Student added successfully!", "success");
      }

      // Brief delay to display the success checkmark state on the button
      setTimeout(() => {
        setFormData({
          studentId: "",
          name: "",
          email: "",
          mobile: "",
          branch: "",
          semester: "",
          cgpa: ""
        });

        setEditingStudent(null);
        setShowForm(false);
        setSubmitSuccessText("");
        setIsSubmitting(false);
        fetchStudents();
      }, 600);
    } catch (error) {
      setIsSubmitting(false);
      setSubmitSuccessText("");
      const errMsg = error.response?.data?.message || "Something went wrong";
      showToast(errMsg, "error");
    }
  };

  // Delete student
  const deleteStudent = async (studentId) => {
    if (!window.confirm("Are you sure you want to delete this student?")) {
      return;
    }

    setDeletingId(studentId);

    try {
      await axios.delete(`${API_URL}/${studentId}`);
      // Animate row fading out before removing from state
      setFadingOutId(studentId);
      setTimeout(() => {
        setStudents((prev) => prev.filter((s) => s.studentId !== studentId));
        setFadingOutId(null);
        setDeletingId(null);
        showToast("Student deleted successfully", "success");
      }, 300);
    } catch (error) {
      console.error("Error deleting student:", error);
      setDeletingId(null);
      showToast(error.response?.data?.message || "Error deleting student", "error");
    }
  };

  // Edit student
  const editStudent = (student) => {
    setEditingStudent(student);
    setSubmitSuccessText("");

    setFormData({
      studentId: student.studentId,
      name: student.name,
      email: student.email,
      mobile: student.mobile,
      branch: student.branch,
      semester: student.semester,
      cgpa: student.cgpa
    });

    setShowForm(true);
  };

  // View student details
  const viewStudentDetails = (student) => {
    setSelectedStudent(student);
    setIsClosingModal(false);
  };

  const closeDetailsModal = () => {
    setIsClosingModal(true);
    setTimeout(() => {
      setSelectedStudent(null);
      setIsClosingModal(false);
    }, 250);
  };

  // Filter students
  const filteredStudents = students.filter((student) => {
    const matchesSearch =
      student.studentId.toString().toLowerCase().includes(search.toLowerCase()) ||
      student.name.toLowerCase().includes(search.toLowerCase()) ||
      (student.email && student.email.toLowerCase().includes(search.toLowerCase()));

    const matchesBranch =
      branch === "All" || student.branch === branch;

    return matchesSearch && matchesBranch;
  });

  // Get unique branches
  const branches = ["All", ...new Set(students.map((student) => student.branch).filter(Boolean))];

  return (
    <div className="app">
      {/* Toast Notification Container */}
      <div className="toast-container" role="region" aria-live="polite">
        {toasts.map((toast) => (
          <div key={toast.id} className={`toast ${toast.type}`}>
            <span className="toast-icon">
              {toast.type === "success" ? "✓" : toast.type === "error" ? "✕" : "ℹ"}
            </span>
            <span className="toast-message">{toast.message}</span>
            <button
              className="toast-close"
              onClick={() => removeToast(toast.id)}
              aria-label="Close notification"
            >
              ×
            </button>
          </div>
        ))}
      </div>

      <header>
        <h1>Student Management System</h1>
        <p>Manage student records efficiently</p>
      </header>

      <div className="container">
        {/* Top Section */}
        <div className="top-section">
          <button
            className="add-button"
            onClick={() => {
              setEditingStudent(null);
              setSubmitSuccessText("");
              setFormData({
                studentId: "",
                name: "",
                email: "",
                mobile: "",
                branch: "",
                semester: "",
                cgpa: ""
              });
              setShowForm(true);
            }}
          >
            <span className="button-icon">+</span> Add Student
          </button>

          <div className="total">
            Total Students: <strong><AnimatedCounter value={students.length} /></strong>
          </div>
        </div>

        {/* Form Container */}
        {showForm && (
          <div className="form-container">
            <h2>
              {editingStudent ? "Update Student" : "Add Student"}
            </h2>

            <form onSubmit={handleSubmit}>
              <input
                type="text"
                name="studentId"
                placeholder="Student ID"
                value={formData.studentId}
                onChange={handleChange}
                required
                disabled={!!editingStudent || isSubmitting}
              />

              <input
                type="text"
                name="name"
                placeholder="Name"
                value={formData.name}
                onChange={handleChange}
                required
                disabled={isSubmitting}
              />

              <input
                type="email"
                name="email"
                placeholder="Email"
                value={formData.email}
                onChange={handleChange}
                required
                disabled={isSubmitting}
              />

              <input
                type="text"
                name="mobile"
                placeholder="Mobile Number"
                value={formData.mobile}
                onChange={handleChange}
                required
                disabled={isSubmitting}
              />

              <input
                type="text"
                name="branch"
                placeholder="Branch"
                value={formData.branch}
                onChange={handleChange}
                required
                disabled={isSubmitting}
              />

              <input
                type="number"
                name="semester"
                placeholder="Semester"
                value={formData.semester}
                onChange={handleChange}
                required
                disabled={isSubmitting}
              />

              <input
                type="number"
                name="cgpa"
                placeholder="CGPA"
                step="0.01"
                value={formData.cgpa}
                onChange={handleChange}
                required
                disabled={isSubmitting}
              />

              <div className="form-buttons">
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className={`submit-btn ${submitSuccessText ? "btn-success" : ""}`}
                >
                  {submitSuccessText ? (
                    submitSuccessText
                  ) : isSubmitting ? (
                    <>
                      <span className="spinner"></span>
                      {editingStudent ? "Updating..." : "Adding..."}
                    </>
                  ) : editingStudent ? (
                    "Update Student"
                  ) : (
                    "Save Student"
                  )}
                </button>

                <button
                  type="button"
                  disabled={isSubmitting}
                  onClick={() => {
                    setShowForm(false);
                    setEditingStudent(null);
                    setSubmitSuccessText("");
                  }}
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Filters Section */}
        <div className="filters">
          <input
            type="text"
            placeholder="Search by ID or Name"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />

          <select
            value={branch}
            onChange={(e) => setBranch(e.target.value)}
          >
            {branches.map((item) => (
              <option key={item} value={item}>
                {item === "All" ? "All Branches" : item}
              </option>
            ))}
          </select>
        </div>

        {/* Table Container */}
        <div className="table-container">
          <table>
            <thead>
              <tr>
                <th>ID</th>
                <th>Name</th>
                <th>Email</th>
                <th>Mobile</th>
                <th>Branch</th>
                <th>Semester</th>
                <th>CGPA</th>
                <th>Actions</th>
              </tr>
            </thead>

            <tbody className="table-body">
              {isLoading ? (
                <tr>
                  <td colSpan="8" className="loading-state">
                    <div className="loading-spinner"></div>
                    <p>Loading student records...</p>
                  </td>
                </tr>
              ) : filteredStudents.length > 0 ? (
                filteredStudents.map((student, idx) => {
                  const isDeleting = deletingId === student.studentId;
                  const isFadingOut = fadingOutId === student.studentId;

                  return (
                    <tr
                      key={student._id || student.studentId}
                      className={`table-row ${isFadingOut ? "row-fading-out" : ""}`}
                      style={{ animationDelay: `${Math.min(idx * 35, 300)}ms` }}
                    >
                      <td><strong>{student.studentId}</strong></td>
                      <td>
                        <button
                          className="name-link"
                          onClick={() => viewStudentDetails(student)}
                          title="Click to view details"
                        >
                          {student.name}
                        </button>
                      </td>
                      <td>{student.email}</td>
                      <td>{student.mobile}</td>
                      <td><span className="branch-badge">{student.branch}</span></td>
                      <td>{student.semester}</td>
                      <td><span className="cgpa-badge">{student.cgpa}</span></td>

                      <td>
                        <button
                          className="view-button"
                          onClick={() => viewStudentDetails(student)}
                          title="View student details"
                        >
                          View
                        </button>

                        <button
                          className="edit-button"
                          onClick={() => editStudent(student)}
                          disabled={isDeleting}
                        >
                          Edit
                        </button>

                        <button
                          className="delete-button"
                          onClick={() => deleteStudent(student.studentId)}
                          disabled={isDeleting}
                        >
                          {isDeleting ? (
                            <>
                              <span className="spinner spinner-sm"></span> Deleting...
                            </>
                          ) : (
                            "Delete"
                          )}
                        </button>
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan="8" className="no-data">
                    <div className="empty-state">
                      <div className="empty-icon">📂</div>
                      <p className="empty-title">No students found</p>
                      <p className="empty-desc">
                        {search || branch !== "All"
                          ? "No records match your search criteria. Try adjusting the filters."
                          : "No students registered yet. Click 'Add Student' above to add one."}
                      </p>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Student Details Modal */}
      {selectedStudent && (
        <div
          className={`modal-backdrop ${isClosingModal ? "modal-closing" : ""}`}
          onClick={closeDetailsModal}
        >
          <div
            className={`modal-content ${isClosingModal ? "modal-closing" : ""}`}
            onClick={(e) => e.stopPropagation()}
            role="dialog"
            aria-modal="true"
          >
            <div className="modal-header">
              <h2>Student Details</h2>
              <button
                className="modal-close-btn"
                onClick={closeDetailsModal}
                aria-label="Close dialog"
              >
                ✕
              </button>
            </div>

            <div className="modal-body">
              <div className="detail-item">
                <span className="detail-label">Student ID</span>
                <span className="detail-value">{selectedStudent.studentId}</span>
              </div>
              <div className="detail-item">
                <span className="detail-label">Full Name</span>
                <span className="detail-value">{selectedStudent.name}</span>
              </div>
              <div className="detail-item">
                <span className="detail-label">Email Address</span>
                <span className="detail-value">{selectedStudent.email}</span>
              </div>
              <div className="detail-item">
                <span className="detail-label">Mobile Number</span>
                <span className="detail-value">{selectedStudent.mobile}</span>
              </div>
              <div className="detail-item">
                <span className="detail-label">Branch / Major</span>
                <span className="detail-value"><span className="branch-badge">{selectedStudent.branch}</span></span>
              </div>
              <div className="detail-item">
                <span className="detail-label">Semester</span>
                <span className="detail-value">{selectedStudent.semester}</span>
              </div>
              <div className="detail-item">
                <span className="detail-label">CGPA</span>
                <span className="detail-value"><span className="cgpa-badge">{selectedStudent.cgpa}</span></span>
              </div>
            </div>

            <div className="modal-footer">
              <button
                className="edit-button modal-btn"
                onClick={() => {
                  const s = selectedStudent;
                  closeDetailsModal();
                  editStudent(s);
                }}
              >
                Edit Student
              </button>
              <button
                className="modal-close-action modal-btn"
                onClick={closeDetailsModal}
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default App;