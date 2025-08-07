import { useState } from 'react';

const BookingPage = () => {
  const [selectedDate, setSelectedDate] = useState('');
  const [selectedTime, setSelectedTime] = useState('');

  const venues = [
    { id: 1, name: '篮球场A', price: '50元/小时' },
    { id: 2, name: '羽毛球场B', price: '30元/小时' }
  ];

  return (
    <div className="booking-page">
      <h1>场地预约</h1>
      
      <div className="booking-form">
        <section>
          <h3>选择场地</h3>
          <div className="venues-list">
            {venues.map(venue => (
              <div key={venue.id} className="venue-item">
                <h4>{venue.name}</h4>
                <p>{venue.price}</p>
              </div>
            ))}
          </div>
        </section>
        
        <section>
          <h3>选择日期</h3>
          <input 
            type="date" 
            value={selectedDate}
            onChange={(e) => setSelectedDate(e.target.value)}
          />
        </section>
        
        <section>
          <h3>选择时间</h3>
          <input 
            type="time" 
            value={selectedTime}
            onChange={(e) => setSelectedTime(e.target.value)}
          />
        </section>
        
        <button className="book-btn">立即预约</button>
      </div>
    </div>
  );
};

export default BookingPage;