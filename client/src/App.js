// CLIENT-SIDE (React.js)

import React, { useState, useEffect } from 'react';
import axios from 'axios';

const App = () => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [token, setToken] = useState(null);
  const [seats, setSeats] = useState([]);
  const [seatCount, setSeatCount] = useState(1);

  useEffect(() => {
    fetchSeats();
  }, []);

  const fetchSeats = async () => {
    try {
      const response = await axios.get('http://localhost:5000/api/seats');
      setSeats(response.data);
    } catch (error) {
      console.error('Error fetching seats:', error);
    }
  };

  const handleSignup = async () => {
    try {
      await axios.post('http://localhost:5000/api/signup', { username, password });
      alert('Signup successful!');
    } catch (error) {
      alert('Error during signup: ' + error.response.data.error);
    }
  };

  const handleLogin = async () => {
    try {
      const response = await axios.post('http://localhost:5000/api/login', { username, password });
      setToken(response.data.token);
      alert('Login successful!');
    } catch (error) {
      alert('Error during login: ' + error.response.data.error);
    }
  };

  const handleReserve = async () => {
    try {
      await axios.post(
        'http://localhost:5000/api/reserve',
        { seatCount },
        { headers: { Authorization: token } }
      );
      alert('Seats reserved successfully!');
      fetchSeats();
    } catch (error) {
      alert('Error during reservation: ' + error.response.data.error);
    }
  };

  const handleCancel = async () => {
    const seatNumbers = prompt('Enter seat numbers to cancel (comma-separated)').split(',');
    try {
      await axios.post(
        'http://localhost:5000/api/cancel',
        { seatNumbers: seatNumbers.map((s) => parseInt(s)) },
        { headers: { Authorization: token } }
      );
      alert('Reservation canceled successfully!');
      fetchSeats();
    } catch (error) {
      alert('Error during cancellation: ' + error.response.data.error);
    }
  };

  return (
    <div>
      <h1>Train Seat Booking System</h1>

      {!token ? (
        <div>
          <h2>Signup/Login</h2>
          <input
            type="text"
            placeholder="Username"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
          />
          <input
            type="password"
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
          <button onClick={handleSignup}>Signup</button>
          <button onClick={handleLogin}>Login</button>
        </div>
      ) : (
        <div>
          <h2>Reserve Seats</h2>
          <input
            type="number"
            value={seatCount}
            min="1"
            max="7"
            onChange={(e) => setSeatCount(e.target.value)}
          />
          <button onClick={handleReserve}>Reserve</button>
          <button onClick={handleCancel}>Cancel Reservation</button>

          <h3>Available Seats</h3>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: '10px' }}>
            {seats.map((seat) => (
              <div
                key={seat.seatNumber}
                style={{
                  padding: '10px',
                  border: '1px solid black',
                  backgroundColor: seat.isBooked ? 'red' : 'green',
                  color: 'white',
                  textAlign: 'center',
                }}
              >
                {seat.seatNumber}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default App;
