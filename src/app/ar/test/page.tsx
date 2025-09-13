export default function ARTestPage() {
  return (
    <div style={{ 
      width: '100vw', 
      height: '100vh', 
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: '#f5f5f5',
      flexDirection: 'column',
      gap: '20px'
    }}>
      <h1>AR Test Page</h1>
      <p>Если вы видите эту страницу, роутинг работает!</p>
      <a href="/ar/view/test-model" style={{ 
        padding: '10px 20px', 
        backgroundColor: '#007bff', 
        color: 'white', 
        textDecoration: 'none',
        borderRadius: '5px'
      }}>
        Перейти к тестовой модели
      </a>
    </div>
  );
}
