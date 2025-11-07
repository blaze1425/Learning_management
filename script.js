// Simple LMS Portal (client-side) — script.js

// DOM refs
const loginSection = document.getElementById('loginSection');
const dashboard = document.getElementById('dashboard');
const nameInput = document.getElementById('nameInput');
const roleSelect = document.getElementById('roleSelect');
const loginForm = document.getElementById('loginForm');
const loginBtn = document.getElementById('loginBtn');
const loginError = document.getElementById('loginError');
const userinfo = document.getElementById('userinfo');
const logoutBtn = document.getElementById('logoutBtn');

const btnCourses = document.getElementById('btnCourses');
const btnAssignments = document.getElementById('btnAssignments');
const btnCreateCourse = document.getElementById('btnCreateCourse');
const btnCreateAssignment = document.getElementById('btnCreateAssignment');

const contentArea = document.getElementById('contentArea');

const modal = document.getElementById('modal');
const modalBody = document.getElementById('modalBody');
const modalClose = document.getElementById('modalClose');

// Data model in localStorage
const STORAGE_KEY = 'lms_demo_data_v1';
const USER_KEY = 'lms_current_user';

// Default seed data
const defaultState = {
  users: [], // {id, name, role}
  courses: [
    { id: 'c1', title: 'Intro to Web', instructorId: null, students: [], description: 'HTML, CSS, JS basics' },
    { id: 'c2', title: 'Data Structures', instructorId: null, students: [], description: 'Arrays, LinkedList, Trees' }
  ],
  assignments: [
    // {id, courseId, title, description, dueDate, submissions: [{studentId, text, grade, submittedAt}]}
  ]
};

// Utility functions
function loadState(){
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      const initialState = JSON.parse(JSON.stringify(defaultState));
      localStorage.setItem(STORAGE_KEY, JSON.stringify(initialState));
      return initialState;
    }
    return JSON.parse(raw);
  } catch (e) {
    console.error('Error loading state:', e);
    showNotification('Error loading data. Resetting to defaults.', 'error');
    const initialState = JSON.parse(JSON.stringify(defaultState));
    localStorage.setItem(STORAGE_KEY, JSON.stringify(initialState));
    return initialState;
  }
}

function saveState(s){
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(s));
  } catch (e) {
    console.error('Error saving state:', e);
    showNotification('Storage is full. Please clear some data.', 'error');
  }
}

function uid(prefix='id'){ 
  return prefix + Math.random().toString(36).slice(2,9); 
}

// Sanitize input to prevent XSS
function sanitizeInput(str) {
  if (typeof str !== 'string') return '';
  const div = document.createElement('div');
  div.textContent = str;
  return div.innerHTML;
}

// Escape HTML for safe display
function escapeHtml(text) {
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}

// Show notification instead of alert
function showNotification(message, type = 'info') {
  // Remove existing notifications
  const existing = document.querySelector('.notification');
  if (existing) existing.remove();

  const notification = document.createElement('div');
  notification.className = `notification notification-${type}`;
  notification.textContent = message;
  notification.setAttribute('role', 'alert');
  notification.setAttribute('aria-live', 'assertive');
  document.body.appendChild(notification);

  // Auto remove after 3 seconds
  setTimeout(() => {
    notification.classList.add('fade-out');
    setTimeout(() => notification.remove(), 300);
  }, 3000);
}

// Validate date format
function isValidDate(dateString) {
  if (!dateString) return false;
  const regex = /^\d{4}-\d{2}-\d{2}$/;
  if (!regex.test(dateString)) return false;
  const date = new Date(dateString);
  return date instanceof Date && !isNaN(date);
}

let state = loadState();
let currentUser = null;

// Load saved user session
function loadUserSession() {
  try {
    const savedUser = localStorage.getItem(USER_KEY);
    if (savedUser) {
      const user = JSON.parse(savedUser);
      // Verify user still exists in state
      const userExists = state.users.find(u => u.id === user.id);
      if (userExists) {
        currentUser = user;
        showDashboard();
      } else {
        localStorage.removeItem(USER_KEY);
      }
    }
  } catch (e) {
    console.error('Error loading user session:', e);
    localStorage.removeItem(USER_KEY);
  }
}

// Save user session
function saveUserSession(user) {
  try {
    localStorage.setItem(USER_KEY, JSON.stringify(user));
  } catch (e) {
    console.error('Error saving user session:', e);
  }
}

// Clear user session
function clearUserSession() {
  localStorage.removeItem(USER_KEY);
}

// Auth (mock)
loginForm.addEventListener('submit', (e) => {
  e.preventDefault();
  loginError.textContent = '';
  
  const name = nameInput.value.trim();
  const role = roleSelect.value;
  
  if (!name) {
    loginError.textContent = 'Please enter your name';
    nameInput.focus();
    return;
  }
  
  if (!role) {
    loginError.textContent = 'Please select a role';
    roleSelect.focus();
    return;
  }

  // Sanitize name
  const sanitizedName = sanitizeInput(name);
  if (sanitizedName.length < 2) {
    loginError.textContent = 'Name must be at least 2 characters';
    nameInput.focus();
    return;
  }

  const user = { id: uid('u'), name: sanitizedName, role };
  state.users.push(user);
  saveState(state);
  currentUser = user;
  saveUserSession(user);
  showDashboard();
  nameInput.value = '';
  roleSelect.value = '';
});

// Keyboard navigation for login
nameInput.addEventListener('keydown', (e) => {
  if (e.key === 'Enter') {
    e.preventDefault();
    roleSelect.focus();
  }
});

roleSelect.addEventListener('keydown', (e) => {
  if (e.key === 'Enter') {
    e.preventDefault();
    loginBtn.click();
  }
});

logoutBtn.addEventListener('click', () => {
  currentUser = null;
  clearUserSession();
  loginSection.classList.remove('hidden');
  dashboard.classList.add('hidden');
  userinfo.textContent = '';
  nameInput.focus();
});

// Dashboard UI
function showDashboard(){
  loginSection.classList.add('hidden');
  dashboard.classList.remove('hidden');
  userinfo.textContent = `${escapeHtml(currentUser.name)} — ${currentUser.role}`;
  // show/hide instructor actions
  if (currentUser.role === 'instructor'){
    btnCreateCourse.classList.remove('hidden');
    btnCreateAssignment.classList.remove('hidden');
  } else {
    btnCreateCourse.classList.add('hidden');
    btnCreateAssignment.classList.add('hidden');
  }
  showCourses();
}

// Show courses view
btnCourses.addEventListener('click', showCourses);

function showCourses(){
  contentArea.innerHTML = '';
  const header = document.createElement('div');
  header.className = 'card';
  header.innerHTML = `<h2>Courses</h2><p class="small">Browse and enroll in courses.</p>`;
  contentArea.appendChild(header);

  if (state.courses.length === 0) {
    const empty = document.createElement('div');
    empty.className = 'card small';
    empty.textContent = 'No courses available yet.';
    contentArea.appendChild(empty);
    return;
  }

  state.courses.forEach(course => {
    const c = document.createElement('div');
    c.className = 'course-card';
    const instr = course.instructorId ? (state.users.find(u=>u.id===course.instructorId)?.name || 'Instructor') : 'TBD';
    const isEnrolled = currentUser.role === 'student' && course.students.includes(currentUser.id);
    const enrolledText = isEnrolled ? ' (Enrolled)' : '';
    
    c.innerHTML = `
      <h3>${escapeHtml(course.title)}</h3>
      <div class="meta">Instructor: ${escapeHtml(instr)}${enrolledText}</div>
      <p class="small">${escapeHtml(course.description || '')}</p>
      <div class="btn-row" style="margin-top:10px">
        ${ currentUser.role === 'student' && !isEnrolled ? `<button class="btn secondary" data-action="enroll" data-id="${course.id}">Enroll</button>` : '' }
        ${ currentUser.role === 'instructor' ? `<button class="btn" data-action="manage" data-id="${course.id}">Manage</button>` : '' }
        <button class="btn secondary" data-action="view" data-id="${course.id}">View</button>
      </div>
    `;
    contentArea.appendChild(c);
  });

  // attach listeners
  contentArea.querySelectorAll('[data-action]').forEach(btn=>{
    btn.addEventListener('click', (e)=>{
      const action = btn.getAttribute('data-action');
      const id = btn.getAttribute('data-id');
      if (action === 'enroll') enrollInCourse(id);
      if (action === 'manage') openManageCourse(id);
      if (action === 'view') openViewCourse(id);
    });
  });
}

// Enroll (student)
function enrollInCourse(courseId){
  if (currentUser.role !== 'student') return;
  const course = state.courses.find(c=>c.id===courseId);
  if (!course) {
    showNotification('Course not found', 'error');
    return;
  }
  if (!course.students.includes(currentUser.id)){
    course.students.push(currentUser.id);
    saveState(state);
    showNotification('Enrolled successfully!', 'success');
    showCourses();
  } else {
    showNotification('You are already enrolled in this course', 'info');
  }
}

// Manage course (instructor)
function openManageCourse(courseId){
  const course = state.courses.find(c=>c.id===courseId);
  if (!course) return;
  
  const courseTitle = escapeHtml(course.title);
  modalBody.innerHTML = `
    <h3>Manage: ${courseTitle}</h3>
    <p class="small">Students enrolled: ${course.students.length}</p>
    <div id="studentList"></div>
    <hr/>
    <button id="openAssignmentsBtn" class="btn">Open Assignments</button>
  `;
  modal.classList.remove('hidden');
  
  // student list
  const studentList = document.getElementById('studentList');
  if (course.students.length===0) {
    studentList.innerHTML = '<p class="small">No students yet.</p>';
  } else {
    course.students.forEach(sid=>{
      const u = state.users.find(uu=>uu.id===sid);
      const el = document.createElement('div');
      el.className = 'small';
      el.textContent = u ? escapeHtml(u.name) : 'Unknown student';
      studentList.appendChild(el);
    });
  }
  
  document.getElementById('openAssignmentsBtn').addEventListener('click', ()=>{
    modal.classList.add('hidden');
    showAssignments(courseId);
  });
}

// View course (student or instructor)
function openViewCourse(courseId){
  showAssignments(courseId);
}

// Assignments view (global or for a single course)
btnAssignments.addEventListener('click', ()=>showAssignments());
btnCreateCourse.addEventListener('click', openCreateCourseModal);
btnCreateAssignment.addEventListener('click', openCreateAssignmentModal);

function showAssignments(courseId=null){
  contentArea.innerHTML = '';
  const header = document.createElement('div');
  header.className = 'card';
  const courseTitle = courseId ? (state.courses.find(c=>c.id===courseId)?.title || '') : '';
  header.innerHTML = `<h2>Assignments${courseId ? ' — ' + escapeHtml(courseTitle) : ''}</h2><p class="small">List of assignments.</p>`;
  contentArea.appendChild(header);

  // filter assignments by courseId if provided
  let list = state.assignments.filter(a => (courseId ? a.courseId===courseId : true));
  
  // For students, only show assignments from enrolled courses
  if (currentUser.role === 'student') {
    const enrolledCourses = state.courses.filter(c => c.students.includes(currentUser.id));
    const enrolledCourseIds = enrolledCourses.map(c => c.id);
    list = list.filter(a => enrolledCourseIds.includes(a.courseId));
  }

  if (list.length===0){
    const empty = document.createElement('div');
    empty.className = 'card small';
    empty.textContent = 'No assignments yet.';
    contentArea.appendChild(empty);
    return;
  }

  list.forEach(assign=>{
    const course = state.courses.find(c=>c.id===assign.courseId) || {title: 'Unknown'};
    const hasSubmitted = currentUser.role === 'student' && 
      assign.submissions.some(s => s.studentId === currentUser.id);
    const submittedText = hasSubmitted ? ' (Submitted)' : '';
    
    const el = document.createElement('div');
    el.className = 'assign-card';
    el.innerHTML = `
      <h3>${escapeHtml(assign.title)}${submittedText}</h3>
      <div class="meta">Course: ${escapeHtml(course.title)} • Due: ${assign.dueDate || 'N/A'}</div>
      <p class="small">${escapeHtml(assign.description || '')}</p>
      <div class="btn-row" style="margin-top:10px">
        ${ currentUser.role === 'student' && !hasSubmitted ? `<button class="btn" data-action="submit" data-id="${assign.id}">Submit</button>` : '' }
        ${ currentUser.role === 'instructor' ? `<button class="btn" data-action="grade" data-id="${assign.id}">Grade / View</button>` : '' }
      </div>
    `;
    contentArea.appendChild(el);
  });

  contentArea.querySelectorAll('[data-action]').forEach(btn=>{
    btn.addEventListener('click', ()=>{
      const action = btn.getAttribute('data-action');
      const id = btn.getAttribute('data-id');
      if (action === 'submit') openSubmitModal(id);
      if (action === 'grade') openGradeModal(id);
    });
  });
}

// Create Course (instructor)
function openCreateCourseModal(){
  modalBody.innerHTML = `
    <h3>Create Course</h3>
    <form id="createCourseForm">
      <input id="cTitle" placeholder="Course title" required aria-label="Course title" maxlength="100" />
      <textarea id="cDesc" placeholder="Short description" aria-label="Course description" maxlength="500"></textarea>
      <div id="courseError" class="error-message"></div>
      <button id="createCourseBtn" class="btn" type="submit">Create</button>
    </form>
  `;
  modal.classList.remove('hidden');
  
  const form = document.getElementById('createCourseForm');
  const errorDiv = document.getElementById('courseError');
  
  form.addEventListener('submit', (e) => {
    e.preventDefault();
    errorDiv.textContent = '';
    
    const t = document.getElementById('cTitle').value.trim();
    const d = document.getElementById('cDesc').value.trim();
    
    if (!t) {
      errorDiv.textContent = 'Title is required';
      document.getElementById('cTitle').focus();
      return;
    }
    
    if (t.length < 3) {
      errorDiv.textContent = 'Title must be at least 3 characters';
      document.getElementById('cTitle').focus();
      return;
    }
    
    const sanitizedTitle = sanitizeInput(t);
    const sanitizedDesc = sanitizeInput(d);
    
    const c = { 
      id: uid('c'), 
      title: sanitizedTitle, 
      description: sanitizedDesc, 
      instructorId: currentUser.id, 
      students: [] 
    };
    state.courses.push(c);
    saveState(state);
    modal.classList.add('hidden');
    showNotification('Course created successfully!', 'success');
    showCourses();
  });
}

// Create Assignment (instructor)
function openCreateAssignmentModal(){
  // choose course
  const myCourses = state.courses.filter(c=>c.instructorId === currentUser.id);
  if (myCourses.length===0) {
    showNotification('You must create a course first', 'error');
    return;
  }
  
  modalBody.innerHTML = `
    <h3>New Assignment</h3>
    <form id="createAssignForm">
      <select id="assignCourse" required aria-label="Select course">
        ${ myCourses.map(c=>`<option value="${c.id}">${escapeHtml(c.title)}</option>`).join('') }
      </select>
      <input id="assignTitle" placeholder="Assignment title" required aria-label="Assignment title" maxlength="100" />
      <textarea id="assignDesc" placeholder="Details / instructions" aria-label="Assignment description" maxlength="1000"></textarea>
      <input id="assignDue" type="date" placeholder="Due date" aria-label="Due date" />
      <div id="assignError" class="error-message"></div>
      <button id="createAssignBtn" class="btn" type="submit">Create Assignment</button>
    </form>
  `;
  modal.classList.remove('hidden');
  
  const form = document.getElementById('createAssignForm');
  const errorDiv = document.getElementById('assignError');
  
  form.addEventListener('submit', (e) => {
    e.preventDefault();
    errorDiv.textContent = '';
    
    const courseId = document.getElementById('assignCourse').value;
    const title = document.getElementById('assignTitle').value.trim();
    const desc = document.getElementById('assignDesc').value.trim();
    const due = document.getElementById('assignDue').value;
    
    if (!title) {
      errorDiv.textContent = 'Title is required';
      document.getElementById('assignTitle').focus();
      return;
    }
    
    if (title.length < 3) {
      errorDiv.textContent = 'Title must be at least 3 characters';
      document.getElementById('assignTitle').focus();
      return;
    }
    
    if (due && !isValidDate(due)) {
      errorDiv.textContent = 'Please enter a valid date (YYYY-MM-DD)';
      document.getElementById('assignDue').focus();
      return;
    }
    
    const sanitizedTitle = sanitizeInput(title);
    const sanitizedDesc = sanitizeInput(desc);
    
    const a = { 
      id: uid('a'), 
      courseId, 
      title: sanitizedTitle, 
      description: sanitizedDesc, 
      dueDate: due || null, 
      submissions: [] 
    };
    state.assignments.push(a);
    saveState(state);
    modal.classList.add('hidden');
    showNotification('Assignment created successfully!', 'success');
    showAssignments(courseId);
  });
}

// Student submit
function openSubmitModal(assignId){
  const assign = state.assignments.find(a=>a.id===assignId);
  if (!assign) {
    showNotification('Assignment not found', 'error');
    return;
  }
  
  // Check if already submitted
  const existingSubmission = assign.submissions.find(s => s.studentId === currentUser.id);
  if (existingSubmission) {
    showNotification('You have already submitted this assignment', 'info');
    return;
  }
  
  // Ensure enrolled
  const course = state.courses.find(c=>c.id===assign.courseId);
  if (!course) {
    showNotification('Course not found', 'error');
    return;
  }
  
  if (!course.students.includes(currentUser.id)) {
    showNotification('You must enroll in the course first', 'error');
    return;
  }
  
  modalBody.innerHTML = `
    <h3>Submit: ${escapeHtml(assign.title)}</h3>
    <form id="submitForm">
      <textarea id="submissionText" placeholder="Paste your answer / link / notes" required aria-label="Submission text" maxlength="5000"></textarea>
      <div id="submitError" class="error-message"></div>
      <button id="submitBtn" class="btn" type="submit">Submit</button>
    </form>
  `;
  modal.classList.remove('hidden');
  
  const form = document.getElementById('submitForm');
  const errorDiv = document.getElementById('submitError');
  
  form.addEventListener('submit', (e) => {
    e.preventDefault();
    errorDiv.textContent = '';
    
    const text = document.getElementById('submissionText').value.trim();
    if (!text) {
      errorDiv.textContent = 'Please enter your submission';
      document.getElementById('submissionText').focus();
      return;
    }
    
    if (text.length < 5) {
      errorDiv.textContent = 'Submission must be at least 5 characters';
      document.getElementById('submissionText').focus();
      return;
    }
    
    const sanitizedText = sanitizeInput(text);
    
    // Check again if already submitted (race condition)
    if (assign.submissions.some(s => s.studentId === currentUser.id)) {
      showNotification('You have already submitted this assignment', 'info');
      modal.classList.add('hidden');
      return;
    }
    
    assign.submissions.push({ 
      studentId: currentUser.id, 
      text: sanitizedText, 
      grade: null,
      submittedAt: new Date().toISOString()
    });
    saveState(state);
    modal.classList.add('hidden');
    showNotification('Assignment submitted successfully!', 'success');
    showAssignments(assign.courseId);
  });
}

// Instructor grade
function openGradeModal(assignId){
  const assign = state.assignments.find(a=>a.id===assignId);
  if (!assign) return;
  
  const assignTitle = escapeHtml(assign.title);
  let html = `<h3>Grade: ${assignTitle}</h3>`;
  
  if (assign.submissions.length===0) {
    html += `<p class="small">No submissions yet.</p>`;
  } else {
    assign.submissions.forEach((s, idx)=>{
      const user = state.users.find(u=>u.id===s.studentId) || {name: 'Unknown'};
      const userName = escapeHtml(user.name);
      const submissionText = escapeHtml(s.text);
      const currentGrade = s.grade ? escapeHtml(s.grade) : '—';
      const submittedAt = s.submittedAt ? new Date(s.submittedAt).toLocaleString() : '';
      
      html += `
        <div class="submission-item">
          <div><strong>${userName}</strong></div>
          ${submittedAt ? `<div class="small">Submitted: ${submittedAt}</div>` : ''}
          <div class="small">Submission: ${submissionText}</div>
          <div class="grade-input-row">
            <input id="grade_${idx}" placeholder="Grade (e.g. 85/100)" value="${s.grade || ''}" aria-label="Grade for ${userName}" />
            <button class="btn" data-idx="${idx}" id="saveGrade_${idx}">Save</button>
          </div>
          <div class="small">Current grade: ${currentGrade}</div>
        </div>
      `;
    });
  }
  
  modalBody.innerHTML = html;
  modal.classList.remove('hidden');

  assign.submissions.forEach((s, idx)=>{
    const btn = document.getElementById(`saveGrade_${idx}`);
    if (!btn) return;
    btn.addEventListener('click', ()=>{
      const val = document.getElementById(`grade_${idx}`).value.trim();
      if (val) {
        assign.submissions[idx].grade = sanitizeInput(val);
        saveState(state);
        showNotification('Grade saved successfully!', 'success');
        // refresh modal
        openGradeModal(assignId);
      }
    });
  });
}

// Close modal
modalClose.addEventListener('click', ()=> modal.classList.add('hidden'));
modal.addEventListener('click', (e)=> { 
  if (e.target===modal) modal.classList.add('hidden'); 
});

// ESC key to close modal
document.addEventListener('keydown', (e) => {
  if (e.key === 'Escape' && !modal.classList.contains('hidden')) {
    modal.classList.add('hidden');
  }
});

// Initialize: Load user session if exists
loadUserSession();
