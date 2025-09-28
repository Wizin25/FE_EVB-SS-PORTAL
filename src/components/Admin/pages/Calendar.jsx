// Calendar.jsx
import React, { useState } from "react";

const daysOfWeek = ["CN", "T2", "T3", "T4", "T5", "T6", "T7"];

function getDaysInMonth(year, month) {
  return new Date(year, month + 1, 0).getDate();
}

function getFirstDayOfWeek(year, month) {
  return new Date(year, month, 1).getDay();
}

function todayDateObj() {
  const now = new Date();
  return { year: now.getFullYear(), month: now.getMonth(), date: now.getDate() };
}

// Component for single month calendar
function MonthCalendar({ year, month, today, selectedDate, onDateSelect }) {
  const daysInMonth = getDaysInMonth(year, month);
  const firstDay = getFirstDayOfWeek(year, month);

  // Build calendar grid
  const calendarRows = [];
  let cells = [];
  let day = 1;

  // Fill first week
  for (let i = 0; i < 7; i++) {
    if (i < firstDay) {
      cells.push(<td key={`empty-start-${i}`} style={{ padding: 12 }}></td>);
    } else {
      const isToday = day === today.date && month === today.month && year === today.year;
      const isSelected = selectedDate && day === selectedDate.date && month === selectedDate.month && year === selectedDate.year;
      
      cells.push(
        <td
          key={day}
          onClick={() => onDateSelect({ year, month, date: day })}
          style={{
            padding: 12,
            borderRadius: 10,
            background: isSelected 
              ? "linear-gradient(135deg, #f59e0b 0%, #f97316 100%)"
              : isToday
              ? "linear-gradient(135deg, #60a5fa 0%, #38bdf8 100%)"
              : "#f8fafc",
            color: isSelected || isToday ? "#fff" : "#334155",
            fontWeight: isSelected || isToday ? 700 : 500,
            textAlign: "center",
            cursor: "pointer",
            transition: "all 0.2s",
            fontSize: 16,
            minHeight: 40,
            verticalAlign: "middle",
          }}
          onMouseEnter={(e) => {
            if (!isSelected && !isToday) {
              e.target.style.background = "#e2e8f0";
            }
          }}
          onMouseLeave={(e) => {
            if (!isSelected && !isToday) {
              e.target.style.background = "#f8fafc";
            }
          }}
        >
          {day}
        </td>
      );
      day++;
    }
  }
  calendarRows.push(<tr key="row-0">{cells}</tr>);

  // Fill the rest
  let rowIdx = 1;
  while (day <= daysInMonth) {
    cells = [];
    for (let i = 0; i < 7; i++) {
      if (day > daysInMonth) {
        cells.push(<td key={`empty-end-${rowIdx}-${i}`} style={{ padding: 12 }}></td>);
      } else {
        const isToday = day === today.date && month === today.month && year === today.year;
        const isSelected = selectedDate && day === selectedDate.date && month === selectedDate.month && year === selectedDate.year;
        
        cells.push(
          <td
            key={day}
            onClick={() => onDateSelect({ year, month, date: day })}
            style={{
              padding: 12,
              borderRadius: 10,
              background: isSelected 
                ? "linear-gradient(135deg, #f59e0b 0%, #f97316 100%)"
                : isToday
                ? "linear-gradient(135deg, #60a5fa 0%, #38bdf8 100%)"
                : "#f8fafc",
              color: isSelected || isToday ? "#fff" : "#334155",
              fontWeight: isSelected || isToday ? 700 : 500,
              textAlign: "center",
              cursor: "pointer",
              transition: "all 0.2s",
              fontSize: 16,
              minHeight: 40,
              verticalAlign: "middle",
            }}
            onMouseEnter={(e) => {
              if (!isSelected && !isToday) {
                e.target.style.background = "#e2e8f0";
              }
            }}
            onMouseLeave={(e) => {
              if (!isSelected && !isToday) {
                e.target.style.background = "#f8fafc";
              }
            }}
          >
            {day}
          </td>
        );
        day++;
      }
    }
    calendarRows.push(<tr key={`row-${rowIdx}`}>{cells}</tr>);
    rowIdx++;
  }

  const monthNames = [
    "Tháng 1", "Tháng 2", "Tháng 3", "Tháng 4", "Tháng 5", "Tháng 6",
    "Tháng 7", "Tháng 8", "Tháng 9", "Tháng 10", "Tháng 11", "Tháng 12"
  ];

  return (
    <div style={{ flex: 1, margin: "0 10px" }}>
      <h3
        style={{
          fontSize: 20,
          fontWeight: 700,
          textAlign: "center",
          marginBottom: 16,
          color: "#334155",
          letterSpacing: 1,
        }}
      >
        {monthNames[month]} {year}
      </h3>
      <table
        style={{
          width: "100%",
          borderCollapse: "separate",
          borderSpacing: "4px",
          background: "#fff",
          borderRadius: 12,
          boxShadow: "0 2px 8px 0 #64748b11",
        }}
      >
        <thead>
          <tr>
            {daysOfWeek.map((d, idx) => (
              <th
                key={d}
                style={{
                  color: idx === 0 ? "#ef4444" : "#0ea5e9",
                  fontWeight: 700,
                  fontSize: 16,
                  padding: 8,
                  textAlign: "center",
                  letterSpacing: 1,
                  background: "#f1f5f9",
                  borderRadius: 8,
                }}
              >
                {d}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>{calendarRows}</tbody>
      </table>
    </div>
  );
}

export default function CalendarPage() {
  const today = todayDateObj();
  const [currentMonth, setCurrentMonth] = useState(today.month);
  const [currentYear, setCurrentYear] = useState(today.year);
  const [selectedDate, setSelectedDate] = useState(null);

  // Calculate next month
  const nextMonth = currentMonth === 11 ? 0 : currentMonth + 1;
  const nextYear = currentMonth === 11 ? currentYear + 1 : currentYear;

  function handlePrevMonth() {
    if (currentMonth === 0) {
      setCurrentMonth(11);
      setCurrentYear((y) => y - 1);
    } else {
      setCurrentMonth((m) => m - 1);
    }
  }

  function handleNextMonth() {
    if (currentMonth === 11) {
      setCurrentMonth(0);
      setCurrentYear((y) => y + 1);
    } else {
      setCurrentMonth((m) => m + 1);
    }
  }

  function handleDateSelect(date) {
    setSelectedDate(date);
  }

  function handleYearChange(e) {
    setCurrentYear(parseInt(e.target.value));
  }

  function handleMonthChange(e) {
    setCurrentMonth(parseInt(e.target.value));
  }

  const monthNames = [
    "Tháng 1", "Tháng 2", "Tháng 3", "Tháng 4", "Tháng 5", "Tháng 6",
    "Tháng 7", "Tháng 8", "Tháng 9", "Tháng 10", "Tháng 11", "Tháng 12"
  ];

  return (
    <div
      style={{
        maxWidth: 1000,
        margin: "40px auto",
        background: "linear-gradient(135deg, #f0f9ff 0%, #e0e7ff 100%)",
        borderRadius: 20,
        boxShadow: "0 8px 32px 0 #64748b22",
        padding: 40,
      }}
    >
      <h1
        style={{
          fontSize: 36,
          fontWeight: 800,
          textAlign: "center",
          marginBottom: 16,
          color: "#0ea5e9",
          letterSpacing: 1,
        }}
      >
        📅 Lịch Chọn Ngày
      </h1>

      {/* Date/Month/Year selectors */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          marginBottom: 24,
          gap: 16,
          flexWrap: "wrap",
        }}
      >
        <select
          value={currentMonth}
          onChange={handleMonthChange}
          style={{
            padding: "8px 16px",
            borderRadius: 8,
            border: "2px solid #e2e8f0",
            fontSize: 16,
            fontWeight: 600,
            color: "#334155",
            background: "#fff",
            cursor: "pointer",
          }}
        >
          {monthNames.map((name, index) => (
            <option key={index} value={index}>
              {name}
            </option>
          ))}
        </select>

        <input
          type="number"
          value={currentYear}
          onChange={handleYearChange}
          min="1900"
          max="2100"
          style={{
            padding: "8px 16px",
            borderRadius: 8,
            border: "2px solid #e2e8f0",
            fontSize: 16,
            fontWeight: 600,
            color: "#334155",
            background: "#fff",
            width: 100,
            textAlign: "center",
          }}
        />
      </div>

      {/* Navigation buttons */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          marginBottom: 24,
          gap: 20,
        }}
      >
        <button
          onClick={handlePrevMonth}
          style={{
            background: "linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%)",
            border: "none",
            borderRadius: 12,
            padding: "12px 20px",
            fontSize: 18,
            cursor: "pointer",
            color: "#fff",
            fontWeight: 600,
            transition: "all 0.2s",
            boxShadow: "0 2px 8px 0 #3b82f622",
          }}
          onMouseEnter={(e) => {
            e.target.style.transform = "translateY(-2px)";
            e.target.style.boxShadow = "0 4px 12px 0 #3b82f644";
          }}
          onMouseLeave={(e) => {
            e.target.style.transform = "translateY(0)";
            e.target.style.boxShadow = "0 2px 8px 0 #3b82f622";
          }}
        >
          ← Tháng trước
        </button>

        <button
          onClick={handleNextMonth}
          style={{
            background: "linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%)",
            border: "none",
            borderRadius: 12,
            padding: "12px 20px",
            fontSize: 18,
            cursor: "pointer",
            color: "#fff",
            fontWeight: 600,
            transition: "all 0.2s",
            boxShadow: "0 2px 8px 0 #3b82f622",
          }}
          onMouseEnter={(e) => {
            e.target.style.transform = "translateY(-2px)";
            e.target.style.boxShadow = "0 4px 12px 0 #3b82f644";
          }}
          onMouseLeave={(e) => {
            e.target.style.transform = "translateY(0)";
            e.target.style.boxShadow = "0 2px 8px 0 #3b82f622";
          }}
        >
          Tháng sau →
        </button>
      </div>

      {/* Selected date display */}
      {selectedDate && (
        <div
          style={{
            textAlign: "center",
            marginBottom: 20,
            padding: "12px 24px",
            background: "linear-gradient(135deg, #10b981 0%, #059669 100%)",
            color: "#fff",
            borderRadius: 12,
            fontWeight: 600,
            fontSize: 18,
            boxShadow: "0 2px 8px 0 #10b98122",
          }}
        >
          Ngày đã chọn: {selectedDate.date}/{selectedDate.month + 1}/{selectedDate.year}
        </div>
      )}

      {/* Two month calendars */}
      <div
        style={{
          display: "flex",
          gap: 20,
          justifyContent: "center",
          flexWrap: "wrap",
        }}
      >
        <MonthCalendar
          year={currentYear}
          month={currentMonth}
          today={today}
          selectedDate={selectedDate}
          onDateSelect={handleDateSelect}
        />
        <MonthCalendar
          year={nextYear}
          month={nextMonth}
          today={today}
          selectedDate={selectedDate}
          onDateSelect={handleDateSelect}
        />
      </div>
    </div>
  );
}
