import "./App.css";

import { useState, useEffect, useMemo } from "react";
import axios from "axios";
import {
  LineChart,
  Line,
  CartesianGrid,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";
import { io } from "socket.io-client";

interface Data {
  date: string;
  temperature: number;
  humidity: number;
  _id: string;
}

const App = () => {
  const notificationSound = useMemo(() => new Audio("/notification.mp3"), []);
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [chartData, setChartData] = useState<
    { time: string; temperature: number; humidity: number }[]
  >([]);
  const [isLoading, setIsLoading] = useState(true);

  const formatDate = (date: Date) => {
    return date.toISOString().split("T")[0]; // YYYY-MM-DD
  };

  useEffect(() => {
    const fetchData = async (date: Date) => {
      try {
        setIsLoading(true);
        const response = await axios.get(
          "http://localhost:3000/api/analyze/" + formatDate(date)
        );
        const data = response.data;

        // Xử lý dữ liệu để phù hợp với Recharts
        const processedData = data.map((item: Data) => ({
          time: new Date(item.date).toLocaleTimeString([], {
            hour: "2-digit",
            minute: "2-digit",
          }),
          temperature: item.temperature,
          humidity: item.humidity,
        }));

        setChartData(processedData);
      } catch (error) {
        console.error("Error fetching data:", error);
      } finally {
        setIsLoading(false);
      }
    };
    fetchData(selectedDate);
  }, [selectedDate]);

  function handleUpdateData(data: Data) {
    const date = new Date(data.date);
    if (formatDate(date) === formatDate(selectedDate)) {
      setChartData((prevData) => [
        ...prevData,
        {
          time: date.toLocaleTimeString([], {
            hour: "2-digit",
            minute: "2-digit",
          }),
          temperature: data.temperature,
          humidity: data.humidity,
        },
      ]);
      notificationSound.play().catch((err) => {
        console.error("Audio playback error:", err);
      });

      if (Notification.permission === "granted") {
        new Notification("New Data Received", {
          body: `Temperature: ${data.temperature}, Humidity: ${data.humidity}`,
        });
      }
    }
  }

  useEffect(() => {
    const socket = io("http://localhost:3000", {
      transports: ["websocket"],
      query: {
        auth: "true",
      },
    });

    socket.on("data-update", handleUpdateData);

    return () => {
      socket.close();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <h1 className="text-2xl font-bold text-center mb-4">
        Daily Temperature and Humidity
      </h1>

      {/* Box chọn ngày */}
      <div className="flex justify-center mb-4">
        <input
          type="date"
          className="border rounded p-2"
          value={formatDate(selectedDate)}
          onChange={(e) => setSelectedDate(new Date(e.target.value))}
        />
      </div>

      {/* Biểu đồ */}
      <div className="bg-white rounded shadow p-4">
        {!isLoading ? (
          <ResponsiveContainer width="100%" minWidth={800} height={400}>
            <LineChart data={chartData}>
              <CartesianGrid stroke="#ccc" />
              <XAxis
                dataKey="time"
                label={{ value: "Time", position: "insideBottom", offset: -5 }}
              />
              <YAxis />
              <Tooltip />
              <Legend />
              <Line
                type="monotone"
                dataKey="temperature"
                stroke="#ff7300"
                name="Temperature (°C)"
              />
              <Line
                type="monotone"
                dataKey="humidity"
                stroke="#387908"
                name="Humidity (%)"
              />
            </LineChart>
          </ResponsiveContainer>
        ) : (
          <p className="text-center">Loading chart...</p>
        )}
      </div>
    </div>
  );
};

export default App;
