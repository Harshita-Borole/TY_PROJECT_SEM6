import React, { useEffect, useState } from "react";

function AdminRepairRequestsPanel() {
  const [requests, setRequests] = useState([]);

  useEffect(() => {
    fetch("http://localhost:5000/api/repair-requests")
      .then((res) => res.json())
      .then((data) => setRequests(data))
      .catch((err) => console.error("Error fetching repairs:", err));
  }, []);

  return (
    <>
      <p className="panel-desc">
        All repair and maintenance requests submitted by users.
      </p>

      <div className="table-scroll">
        <table className="data-table">
          <thead>
            <tr>
              <th>User</th>
              <th>Room</th>
              <th>Issue</th>
              <th>Date</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            {requests.map((req) => (
              <tr key={req.id}>
                <td>{req.username}</td>
                <td>{req.room_type}</td>
                <td>{req.issue}</td>
                <td>{req.created_at}</td>
                <td>{req.status || "Pending"}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  );
}

export default AdminRepairRequestsPanel;