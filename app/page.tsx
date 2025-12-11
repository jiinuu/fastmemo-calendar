'use client';

import { useState, useEffect } from 'react';
import FullCalendar from '@fullcalendar/react';
import dayGridPlugin from '@fullcalendar/daygrid';
import interactionPlugin from '@fullcalendar/interaction';

export default function Home() {
  const [events, setEvents] = useState([]);
  const [selectedMemo, setSelectedMemo] = useState<any>(null); // 선택된 메모 상태

  useEffect(() => {
    fetch('/api/memos')
      .then((res) => res.json())
      .then((data) => {
        if (!data.error) setEvents(data);
      })
      .catch(err => console.error(err));
  }, []);

  // 메모 클릭 시 실행되는 함수
  const handleEventClick = (info: any) => {
    // 클릭한 이벤트의 정보를 state에 저장 (팝업 열기)
    setSelectedMemo({
      title: info.event.title,
      date: info.event.startStr,
      url: info.event.extendedProps.url
    });
  };

  // 팝업 닫기 함수
  const closePopup = () => setSelectedMemo(null);

  return (
    <main style={{ padding: '20px', height: '100vh', backgroundColor: '#f8f9fa', color: '#333' }}>
      <h1 style={{ marginBottom: '20px', fontWeight: 'bold' }}>📅 내 메모 캘린더</h1>
      
      {/* 캘린더 영역 */}
      <div style={{ 
        backgroundColor: 'white', 
        padding: '20px', 
        borderRadius: '15px', 
        boxShadow: '0 4px 20px rgba(0,0,0,0.08)' 
      }}>
        <FullCalendar
          plugins={[dayGridPlugin, interactionPlugin]}
          initialView="dayGridMonth"
          events={events}
          height="auto"
          eventClick={handleEventClick} // 클릭 이벤트 연결
          eventColor="#3788d8" // 이벤트 배경색 (파란색)
          eventDisplay="block" // 텍스트 꽉 차게 보여주기
          headerToolbar={{
            left: 'prev,next today',
            center: 'title',
            right: 'dayGridMonth'
          }}
        />
      </div>

      {/* ✨ 상세 보기 팝업 (Modal) ✨ */}
      {selectedMemo && (
        <div style={{
          position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
          backgroundColor: 'rgba(0,0,0,0.5)', // 배경 어둡게
          display: 'flex', justifyContent: 'center', alignItems: 'center',
          zIndex: 1000
        }} onClick={closePopup}>
          <div style={{
            backgroundColor: 'white', padding: '30px', borderRadius: '15px',
            width: '90%', maxWidth: '500px', boxShadow: '0 10px 25px rgba(0,0,0,0.2)'
          }} onClick={(e) => e.stopPropagation()}> {/* 내부 클릭 시 닫힘 방지 */}
            
            <h3 style={{ marginTop: 0, color: '#666', fontSize: '14px' }}>{selectedMemo.date}</h3>
            <p style={{ fontSize: '18px', lineHeight: '1.6', margin: '20px 0', wordBreak: 'break-all' }}>
              {selectedMemo.title}
            </p>

            <div style={{ display: 'flex', gap: '10px', marginTop: '20px' }}>
              {selectedMemo.url && (
                <a 
                  href={selectedMemo.url} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  style={{
                    flex: 1, textAlign: 'center', padding: '12px', 
                    backgroundColor: '#0070f3', color: 'white', 
                    borderRadius: '8px', textDecoration: 'none', fontWeight: 'bold'
                  }}
                >
                  🔗 원본 링크 보기
                </a>
              )}
              <button 
                onClick={closePopup}
                style={{
                  flex: 1, padding: '12px', 
                  backgroundColor: '#eee', border: 'none', 
                  borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold'
                }}
              >
                닫기
              </button>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}