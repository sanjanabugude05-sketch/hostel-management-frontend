
import { useEffect, useState } from "react";
import "./style.css";

const API_URL = "http://127.0.0.1:8000";

export default function App() {
  
    const [chatInput, setChatInput] = useState("");
  const [chatMessages, setChatMessages] = useState([]);
  const [chatLoading, setChatLoading] = useState(false);

async function sendMessage(event) {
  event.preventDefault();

  const question = chatInput.trim();
  if (!question || chatLoading) return;

  setChatMessages((previous) => [
    ...previous,
    { role: "user", text: question },
  ]);
  setChatInput("");
  setChatLoading(true);

  try {
    const response = await fetch(`${API_URL}/chat`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ message: question }),
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(
        typeof data.detail === "string"
          ? data.detail
          : "Unable to get an AI response."
      );
    }

    setChatMessages((previous) => [
      ...previous,
      { role: "assistant", text: data.reply },
    ]);
  } catch (error) {
    setChatMessages((previous) => [
      ...previous,
      {
        role: "assistant",
        text: `Error: ${error.message}`,
      },
    ]);
  } finally {
    setChatLoading(false);
  }
}

  const [students, setStudents] = useState([]);
  const [rooms, setRooms] = useState([]);
  const [allocations, setAllocations] = useState([]);

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [age, setAge] = useState("");
  const [course, setCourse] = useState("");

  const [studentId, setStudentId] = useState("");
  const [roomId, setRoomId] = useState("");

  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);

  async function request(path, options = {}) {
    const response = await fetch(`${API_URL}${path}`, options);
    const data = await response.json();

    if (!response.ok) {
      const detail = data.detail;
      const errorMessage =
        typeof detail === "string"
          ? detail
          : Array.isArray(detail)
            ? detail.map((item) => item.msg).join(", ")
            : "Request failed";

      throw new Error(errorMessage);
    }

    return data;
  }

  async function loadStudents() {
    const data = await request("/students");
    const list = Array.isArray(data) ? data : data.students || [];
    setStudents(list);
  }

  async function loadRooms() {
    const data = await request("/rooms");
    setRooms(Array.isArray(data) ? data : data.rooms || []);
  }

  async function loadAllocations() {
    const data = await request("/allocations");
    setAllocations(
      Array.isArray(data) ? data : data.allocations || []
    );
  }

  async function loadAll() {
    try {
      await Promise.all([
        loadStudents(),
        loadRooms(),
        loadAllocations(),
      ]);
    } catch (error) {
      setMessage(`Could not load data: ${error.message}`);
    }
  }

  useEffect(() => {
    loadAll();
  }, []);

  async function addStudent(event) {
    event.preventDefault();
    setMessage("");
    setLoading(true);

    try {
      await request("/students", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: name.trim(),
          email: email.trim(),
          age: Number(age),
          course: course.trim(),
        }),
      });

      setMessage("Student added successfully!");
      setName("");
      setEmail("");
      setAge("");
      setCourse("");
      await loadStudents();
    } catch (error) {
      setMessage(`Could not add student: ${error.message}`);
    } finally {
      setLoading(false);
    }
  }

  async function allocateRoom(event) {
    event.preventDefault();
    setMessage("");

    if (!studentId || !roomId) {
      setMessage("Please select a student and a room.");
      return;
    }

    setLoading(true);

    try {
      await request("/allocations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          student_id: studentId,
          room_id: roomId,
        }),
      });

      setMessage("Room allocated successfully!");
      setStudentId("");
      setRoomId("");
      await loadAll();
    } catch (error) {
      setMessage(`Allocation failed: ${error.message}`);
    } finally {
      setLoading(false);
    }
  }

  function getId(item) {
    return String(item._id ?? item.id ?? "");
  }

  function getStudentName(id) {
    const student = students.find((item) => getId(item) === String(id));
    return student ? student.name : String(id ?? "Unknown");
  }

  function getRoomName(id) {
    const room = rooms.find((item) => getId(item) === String(id));
    return room
      ? `Room ${room.room_number ?? room.room_no ?? room.number ?? getId(room)}`
      : String(id ?? "Unknown");
  }

  return (
    <div className="app">
      <header>
        <h1>Hostel Management System</h1>
        <p>Manage students and room allocations</p>
      </header>

      <main>
        {message && (
          <section className="card" role="status">
            {message}
          </section>
        )}

        <section className="card">
          <h2>Add Student</h2>

          <form onSubmit={addStudent}>
            <input
              placeholder="Student name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
            />

            <input
              type="email"
              placeholder="Student email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />

            <input
              type="number"
              placeholder="Age"
              min="1"
              max="120"
              value={age}
              onChange={(e) => setAge(e.target.value)}
              required
            />

            <input
              placeholder="Course"
              value={course}
              onChange={(e) => setCourse(e.target.value)}
              required
            />

            <button type="submit" disabled={loading}>
              {loading ? "Please wait..." : "Add Student"}
            </button>
          </form>
        </section>

        <section className="card">
          <h2>Student List</h2>
          <button type="button" onClick={loadAll}>Refresh Data</button>

          {students.length === 0 ? (
            <p>No students found.</p>
          ) : (
            <ul>
              {students.map((student, index) => (
                <li key={getId(student) || index}>
                  <strong>{student.name}</strong>
                  <br />
                  Email: {student.email}
                  <br />
                  Age: {student.age ?? "Not provided"}
                  <br />
                  Course: {student.course ?? "Not provided"}
                </li>
              ))}
            </ul>
          )}
        </section>

        <section className="card">
          <h2>Allocate Room</h2>

          <form onSubmit={allocateRoom}>
            <label htmlFor="student">Select Student</label>
            <select
              id="student"
              value={studentId}
              onChange={(e) => setStudentId(e.target.value)}
              required
            >
              <option value="">Choose a student</option>
              {students.map((student) => (
                <option key={getId(student)} value={getId(student)}>
                  {student.name} — {student.email}
                </option>
              ))}
            </select>

            <label htmlFor="room">Select Room</label>
            <select
              id="room"
              value={roomId}
              onChange={(e) => setRoomId(e.target.value)}
              required
            >
              <option value="">Choose a room</option>
              {rooms.map((room) => (
                <option key={getId(room)} value={getId(room)}>
                  Room{" "}
                  {room.room_number ?? room.room_no ?? room.number ?? getId(room)}
                  {room.capacity != null
                    ? ` — Capacity: ${room.capacity}`
                    : ""}
                </option>
              ))}
            </select>

            <button
              type="submit"
              disabled={loading || students.length === 0 || rooms.length === 0}
            >
              {loading ? "Allocating..." : "Allocate Room"}
            </button>

            {students.length === 0 && (
              <p>Add a student before allocating a room.</p>
            )}
            {rooms.length === 0 && (
              <p>No rooms found. Add rooms through your existing backend first.</p>
            )}
          </form>
        </section>

        <section className="card">
          <h2>Room Allocations</h2>

          {allocations.length === 0 ? (
            <p>No allocations found.</p>
          ) : (
            <ul>
              {allocations.map((allocation, index) => (
                <li key={getId(allocation) || index}>
                  <strong>
                    {getStudentName(
                      allocation.student_id ?? allocation.studentId
                    )}
                  </strong>
                  <br />
                  {getRoomName(
                    allocation.room_id ?? allocation.roomId
                  )}
                </li>
              ))}
            </ul>
          )}
        </section>
        <section className="card">
  <h2>AI Hostel Assistant</h2>

  <div className="chat-messages">
    {chatMessages.map((item, index) => (
      <p key={index} className="chat-message">
        <strong>
          {item.role === "user" ? "You: " : "Assistant: "}
        </strong>
        {item.text}
      </p>
    ))}

    {chatLoading && <p>Assistant is thinking...</p>}
  </div>

  <form onSubmit={sendMessage}>
    <input
      type="text"
      placeholder="Ask a hostel-related question..."
      value={chatInput}
      onChange={(event) => setChatInput(event.target.value)}
      disabled={chatLoading}
      required
    />

    <button type="submit" disabled={chatLoading}>
      {chatLoading ? "Sending..." : "Send Message"}
    </button>
  </form>
</section>


<section className="card">
  <h2>AI Hostel Assistant</h2>
  <p>Ask questions about hostel services.</p>

  <div className="chat-messages">
    {chatMessages.length === 0 && (
      <p>Example: How do I get a hostel room?</p>
    )}

    {chatMessages.map((message, index) => (
      <div className="chat-message" key={index}>
        <strong>
          {message.role === "user" ? "You" : "AI Assistant"}:
        </strong>{" "}
        {message.text}
      </div>
    ))}

    {chatLoading && <p>AI is thinking...</p>}
  </div>

  <form onSubmit={sendMessage}>
    <input
      type="text"
      placeholder="Ask a hostel-related question..."
      value={chatInput}
      onChange={(event) => setChatInput(event.target.value)}
      maxLength={2000}
      required
    />

    <button type="submit" disabled={chatLoading}>
      {chatLoading ? "Sending..." : "Send"}
    </button>
  </form>
</section>
</main>
</div>
);
}
