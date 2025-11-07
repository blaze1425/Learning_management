/* ---------- GLOBAL ---------- */
* {
  margin: 0;
  padding: 0;
  box-sizing: border-box;
  font-family: "Poppins", sans-serif;
}

body {
  background: linear-gradient(120deg, #89f7fe, #66a6ff);
  min-height: 100vh;
  display: flex;
  flex-direction: column;
}

/* ---------- HEADER ---------- */
.header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  background: rgba(255, 255, 255, 0.2);
  backdrop-filter: blur(8px);
  padding: 15px 25px;
  color: #fff;
  box-shadow: 0 2px 10px rgba(0,0,0,0.2);
}

.logo {
  font-weight: 700;
  font-size: 1.3rem;
}

/* ---------- LOGIN ---------- */
.login-section {
  display: flex;
  justify-content: center;
  align-items: center;
  flex: 1;
  background: linear-gradient(135deg, #74ABE2, #5563DE);
}

.login-card {
  background: rgba(255, 255, 255, 0.25);
  backdrop-filter: blur(15px);
  padding: 40px;
  border-radius: 20px;
  text-align: center;
  color: #fff;
  width: 320px;
  box-shadow: 0 4px 30px rgba(0,0,0,0.2);
  transition: transform 0.3s;
}
.login-card:hover { transform: scale(1.02); }

.subtitle { font-size: 0.9rem; margin-bottom: 15px; }

input, select, button {
  width: 100%;
  margin: 8px 0;
  padding: 10px;
  border-radius: 10px;
  border: none;
  outline: none;
  font-size: 1rem;
}

button {
  background: #0078ff;
  color: white;
  cursor: pointer;
  transition: background 0.3s;
}
button:hover { background: #005ecc; }

/* ---------- DASHBOARD ---------- */
.hidden { display: none; }

.toolbar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 15px;
  background: #ffffffaa;
  backdrop-filter: blur(10px);
}

.grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
  gap: 20px;
  padding: 20px;
}

.course-card, .assign-card {
  background: #fff;
  border-radius: 15px;
  box-shadow: 0 6px 18px rgba(0,0,0,0.1);
  overflow: hidden;
  transition: transform 0.3s;
}
.course-card:hover, .assign-card:hover { transform: translateY(-6px); }

.course-card h3, .assign-card h3 {
  padding: 15px;
  color: #222;
}

.meta, .small { padding: 0 15px 10px; font-size: 0.9rem; color: #555; }

.logout-btn {
  background: #ff4b4b;
}
.logout-btn:hover {
  background: #d63c3c;
}

/* ---------- MODAL ---------- */
.modal {
  position: fixed;
  inset: 0;
  background: rgba(0,0,0,0.5);
  display: flex;
  justify-content: center;
  align-items: center;
}

.modal-content {
  background: #fff;
  border-radius: 15px;
  padding: 25px;
  width: 90%;
  max-width: 600px;
  position: relative;
  animation: fadeIn 0.3s ease;
}
@keyframes fadeIn { from {opacity:0; transform:scale(0.95);} to {opacity:1; transform:scale(1);} }

.close-btn {
  position: absolute;
  right: 10px;
  top: 10px;
  border: none;
  background: transparent;
  font-size: 20px;
  cursor: pointer;
}

/* ---------- FOOTER ---------- */
.footer {
  text-align: center;
  color: #fff;
  padding: 10px;
  background: rgba(255,255,255,0.15);
  backdrop-filter: blur(10px);
}
