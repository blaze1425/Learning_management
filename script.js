// Simple LMS Portal (client-side) — script.js

// DOM refs
const loginSection = document.getElementById('loginSection');
const dashboard = document.getElementById('dashboard');
const nameInput = document.getElementById('nameInput');
const roleSelect = document.getElementById('roleSelect');
const loginBtn = document.getElementById('loginBtn');
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

// Default seed data
const defaultState = {
  users: [], // {id, name, role}
  courses: [
    { id: 'c1', title: 'Intro to Web', instructorId: null, students: [], description: 'HTML, CSS, JS basics' },
    { id: 'c2', title: 'Data Structures', instructorId: null, students: [], description: 'Arrays, LinkedList, Trees' }
  ],
  assignments: [
    // {id, courseId, title, description, dueDate, submissions: [{studentId, text, grade}]}
  ]
};

function loadState(){
  const raw = localStorage.getItem(STORAGE_KEY);
  if (!raw) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(defaultState));
    return JSON.parse(JSON.stringify(defaultState));
  }
  return JSON.parse(raw);
}

function saveState(s){ localStorage.setItem(STORAGE_KEY, JSON.stringify(s)); }

let state = loadState();
let currentUser = null; // {id, name, role}

// Utility
function uid(prefix='id'){ return prefix + Math.random().toString(36).slice(2,9); }

// Auth (mock)
loginBtn.addEventListener('click', () => {
  const name = nameInput.value.trim();
  const role = roleSelect.value;
  if (!name) return alert('Enter your name');

  const user = { id: uid('u'), name, role };
  state.users.push(user);
  saveState(state);
  currentUser = user;
  showDashboard();
});

logoutBtn.addEventListener('click', () => {
  currentUser = null;
  loginSection.classList.remove('hidden');
  dashboard.classList.add('hidden');
  userinfo.textContent = '';
});

// Dashboard UI
function showDashboard(){
  loginSection.classList.add('hidden');
  dashboard.classList.remove('hidden');
  userinfo.textContent = `${currentUser.name} — ${currentUser.role}`;
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

  state.courses.forEach(course => {
    const c = document.createElement('div');
    c.className = 'course-card';
    const instr = course.instructorId ? (state.users.find(u=>u.id===course.instructorId)?.name || 'Instructor') : 'TBD';
    c.innerHTML = `
      <h3>${course.title}</h3>
      <div class="meta">Instructor: ${instr}</div>
      <p class="small">${course.description || ''}</p>
      <div class="btn-row" style="margin-top:10px">
        ${ currentUser.role === 'student' ? `<button class="btn secondary" data-action="enroll" data-id="${course.id}">Enroll</button>` : '' }
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
  if (!course) return;
  if (!course.students.includes(currentUser.id)){
    course.students.push(currentUser.id);
    saveState(state);
    alert('Enrolled successfully');
    showCourses();
  } else {
    alert('Already enrolled');
  }
}

// Manage course (instructor)
function openManageCourse(courseId){
  const course = state.courses.find(c=>c.id===courseId);
  if (!course) return;
  modalBody.innerHTML = `
    <h3>Manage: ${course.title}</h3>
    <p class="small">Students enrolled: ${course.students.length}</p>
    <div id="studentList"></div>
    <hr/>
    <button id="openAssignmentsBtn" class="btn">Open Assignments</button>
  `;
  modal.classList.remove('hidden');
  // student list
  const studentList = document.getElementById('studentList');
  if (course.students.length===0) studentList.innerHTML = '<p class="small">No students yet.</p>';
  else {
    course.students.forEach(sid=>{
      const u = state.users.find(uu=>uu.id===sid);
      const el = document.createElement('div');
      el.className = 'small';
      el.textContent = u ? u.name : 'Unknown student';
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
  header.innerHTML = `<h2>Assignments ${courseId ? ' — ' + (state.courses.find(c=>c.id===courseId)?.title || '') : ''}</h2><p class="small">List of assignments.</p>`;
  contentArea.appendChild(header);

  // filter assignments by courseId if provided
  const list = state.assignments.filter(a => (courseId ? a.courseId===courseId : true));

  if (list.length===0){
    const empty = document.createElement('div');
    empty.className = 'card small';
    empty.textContent = 'No assignments yet.';
    contentArea.appendChild(empty);
    return;
  }

  list.forEach(assign=>{
    const course = state.courses.find(c=>c.id===assign.courseId) || {title: 'Unknown'};
    const el = document.createElement('div');
    el.className = 'assign-card';
    el.innerHTML = `
      <h3>${assign.title}</h3>
      <div class="meta">Course: ${course.title} • Due: ${assign.dueDate || 'N/A'}</div>
      <p class="small">${assign.description || ''}</p>
      <div class="btn-row" style="margin-top:10px">
        ${ currentUser.role === 'student' ? `<button class="btn" data-action="submit" data-id="${assign.id}">Submit</button>` : '' }
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
    <input id="cTitle" placeholder="Course title" />
    <textarea id="cDesc" placeholder="Short description"></textarea>
    <button id="createCourseBtn" class="btn">Create</button>
  `;
  modal.classList.remove('hidden');
  document.getElementById('createCourseBtn').addEventListener('click', ()=>{
    const t = document.getElementById('cTitle').value.trim();
    const d = document.getElementById('cDesc').value.trim();
    if (!t) return alert('Title required');
    const c = { id: uid('c'), title: t, description: d, instructorId: currentUser.id, students: [] };
    state.courses.push(c);
    saveState(state);
    modal.classList.add('hidden');
    showCourses();
  });
}

// Create Assignment (instructor)
function openCreateAssignmentModal(){
  // choose course
  const myCourses = state.courses.filter(c=>c.instructorId === currentUser.id);
  if (myCourses.length===0) return alert('You must create a course first');
  modalBody.innerHTML = `
    <h3>New Assignment</h3>
    <select id="assignCourse">${ myCourses.map(c=>`<option value="${c.id}">${c.title}</option>`).join('') }</select>
    <input id="assignTitle" placeholder="Assignment title" />
    <textarea id="assignDesc" placeholder="Details / instructions"></textarea>
    <input id="assignDue" placeholder="Due date (e.g. 2025-11-20)" />
    <button id="createAssignBtn" class="btn">Create Assignment</button>
  `;
  modal.classList.remove('hidden');
  document.getElementById('createAssignBtn').addEventListener('click', ()=>{
    const courseId = document.getElementById('assignCourse').value;
    const title = document.getElementById('assignTitle').value.trim();
    const desc = document.getElementById('assignDesc').value.trim();
    const due = document.getElementById('assignDue').value.trim();
    if (!title) return alert('Title required');
    const a = { id: uid('a'), courseId, title, description: desc, dueDate: due, submissions: [] };
    state.assignments.push(a);
    saveState(state);
    modal.classList.add('hidden');
    showAssignments(courseId);
  });
}

// Student submit
function openSubmitModal(assignId){
  const assign = state.assignments.find(a=>a.id===assignId);
  if (!assign) return;
  modalBody.innerHTML = `
    <h3>Submit: ${assign.title}</h3>
    <textarea id="submissionText" placeholder="Paste your answer / link / notes"></textarea>
    <button id="submitBtn" class="btn">Submit</button>
  `;
  modal.classList.remove('hidden');
  document.getElementById('submitBtn').addEventListener('click', ()=>{
    const text = document.getElementById('submissionText').value.trim();
    if (!text) return alert('Enter submission text or link');
    // ensure enrolled
    const course = state.courses.find(c=>c.id===assign.courseId);
    if (!course.students.includes(currentUser.id)) return alert('You must enroll in the course first');
    // add submission
    assign.submissions.push({ studentId: currentUser.id, text, grade: null });
    saveState(state);
    modal.classList.add('hidden');
    alert('Submitted!');
  });
}

// Instructor grade
function openGradeModal(assignId){
  const assign = state.assignments.find(a=>a.id===assignId);
  if (!assign) return;
  const course = state.courses.find(c=>c.id===assign.courseId);
  let html = `<h3>Grade: ${assign.title}</h3>`;
  if (assign.submissions.length===0) html += `<p class="small">No submissions yet.</p>`;
  else {
    assign.submissions.forEach((s, idx)=>{
      const user = state.users.find(u=>u.id===s.studentId) || {name: 'Unknown'};
      html += `
        <div style="margin-bottom:10px;padding:8px;border-radius:8px;background:#fbfbff">
          <div><strong>${user.name}</strong></div>
          <div class="small">Submission: ${s.text}</div>
          <div style="margin-top:6px">
            <input id="grade_${idx}" placeholder="Grade (e.g. 85/100)" />
            <button class="btn" data-idx="${idx}" id="saveGrade_${idx}">Save</button>
          </div>
          <div class="small">Current grade: ${s.grade ?? '—'}</div>
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
      assign.submissions[idx].grade = val || assign.submissions[idx].grade;
      saveState(state);
      alert('Saved grade');
      // refresh modal
      openGradeModal(assignId);
    });
  });
}

// Close modal
modalClose.addEventListener('click', ()=> modal.classList.add('hidden'));
modal.addEventListener('click', (e)=> { if (e.target===modal) modal.classList.add('hidden'); });

// Initial view
// showCourses();

