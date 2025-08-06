import { useState } from 'react';
import { format, addDays, isSameDay } from 'date-fns';
import { es } from 'date-fns/locale';
import '../styles/components/calendar.css';

function Calendar({ selectedDate, onDateChange }) {
  const [currentDate, setCurrentDate] = useState(new Date());

  const nextDay = () => {
    const newDate = addDays(currentDate, 1);
    setCurrentDate(newDate);
    onDateChange(newDate);
  };

  const prevDay = () => {
    const newDate = addDays(currentDate, -1);
    setCurrentDate(newDate);
    onDateChange(newDate);
  };

  return (
    <div className="calendar-navigation">
      <button onClick={prevDay}>&lt; Anterior</button>
      <span>
        {format(currentDate, "EEEE d 'de' MMMM", { locale: es })}
      </span>
      <button onClick={nextDay}>Siguiente &gt;</button>
    </div>
  );
}

export default Calendar;