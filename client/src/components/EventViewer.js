import React, { useState } from "react";

function EventViewer({ contract }) {

  const [events, setEvents] = useState([]);

  const loadEvents = async () => {
    try {
      const allEvents = await contract.getPastEvents("allEvents", {
        fromBlock: 0,
        toBlock: "latest",
      });

      setEvents(allEvents.reverse());
    } catch (error) {
      alert(error.message);
    }
  };

  return (
    <div className="role-box">
      <h2>📜 Blockchain Activity Log</h2>

      <button onClick={loadEvents}>
        Load All Events
      </button>

      <ul style={{ marginTop: "20px" }}>
        {events.map((event, index) => (
          <li key={index}>
            <p><b>Event:</b> {event.event}</p>
            <p><b>Block:</b> {event.blockNumber}</p>
            <p><b>Transaction:</b> {event.transactionHash}</p>
            <hr />
          </li>
        ))}
      </ul>
    </div>
  );
}

export default EventViewer;
