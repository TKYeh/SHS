import { fetchGAS } from './api.js';
import { formatDate, formatTime } from './utils.js';

export const state = {
    currentDate: new Date(),
    currentUser: null,
    courses: [],
    reservations: [],
    selectedCourseId: null
};

export function setCurrentUser(user) {
    state.currentUser = user;
    updateUserInfo();
}

export async function loadData() {
    showLoading('coursesList', '載入課程中...');
    showLoading('reservationsList', '載入預約記錄中...');

    try {
        const [coursesResponse, reservationsResponse] = await Promise.all([
            fetchGAS('getCourses'),
            fetchGAS('getReservations', { userId: state.currentUser.userId })
        ]);

        state.courses = coursesResponse;
        state.reservations = reservationsResponse;

        renderCalendar();
        renderCourses();
        renderReservations();
    } catch (error) {
        showError('載入資料失敗：' + error.message);
        hideLoading('coursesList');
        hideLoading('reservationsList');
    }
}

export function initializeUI() {
    bindTabs();
    bindModalButtons();
    bindCalendarNavigation();
    bindCreateCourseForm();
    bindConfirmReserve();
}

function bindTabs() {
    document.querySelectorAll('.tab').forEach(tab => {
        tab.addEventListener('click', function () {
            const tabName = this.getAttribute('data-tab');
            document.querySelectorAll('.tab').forEach(t => t.classList.remove('active'));
            document.querySelectorAll('.tab-content').forEach(c => c.classList.remove('active'));
            this.classList.add('active');
            document.getElementById(`${tabName}Tab`).classList.add('active');
        });
    });
}

function bindModalButtons() {
    document.querySelectorAll('[data-modal]').forEach(element => {
        element.addEventListener('click', function (event) {
            event.preventDefault();
            const modalId = this.getAttribute('data-modal');
            closeModal(modalId);
        });
    });
}

function bindCalendarNavigation() {
    document.getElementById('prevMonth').addEventListener('click', () => {
        state.currentDate.setMonth(state.currentDate.getMonth() - 1);
        renderCalendar();
    });

    document.getElementById('nextMonth').addEventListener('click', () => {
        state.currentDate.setMonth(state.currentDate.getMonth() + 1);
        renderCalendar();
    });
}

function bindCreateCourseForm() {
    document.getElementById('createCourseForm').addEventListener('submit', async function (e) {
        e.preventDefault();

        const courseData = {
            teacherName: state.currentUser.displayName,
            courseName: document.getElementById('courseName').value,
            date: document.getElementById('courseDate').value,
            startTime: document.getElementById('startTime').value,
            endTime: document.getElementById('endTime').value,
            maxStudents: parseInt(document.getElementById('maxStudents').value)
        };

        try {
            const result = await fetchGAS('createCourse', courseData);
            if (result.success) {
                showSuccess('課程建立成功！');
                document.getElementById('createCourseForm').reset();
                closeModal('createCourseModal');
                loadData();
            } else {
                showError('建立失敗：' + result.message);
            }
        } catch (error) {
            showError('網路錯誤：' + error.message);
        }
    });
}

function bindConfirmReserve() {
    document.getElementById('confirmReserve').addEventListener('click', async function () {
        if (!state.selectedCourseId) return;

        const button = this;
        const originalText = button.textContent;
        button.textContent = '處理中...';
        button.disabled = true;

        try {
            const result = await fetchGAS('makeReservation', {
                userId: state.currentUser.userId,
                studentName: state.currentUser.displayName,
                courseId: state.selectedCourseId
            });

            if (result.success) {
                showModalSuccess('預約成功！');
                setTimeout(() => {
                    closeModal('reserveModal');
                    button.textContent = originalText;
                    button.disabled = false;
                    loadData();
                }, 1000);
            } else {
                showModalError(result.message);
                button.textContent = originalText;
                button.disabled = false;
            }
        } catch (error) {
            showModalError('網路錯誤：' + error.message);
            button.textContent = originalText;
            button.disabled = false;
        }
    });
}

export function showError(message) {
    const errorDiv = document.createElement('div');
    errorDiv.className = 'error';
    errorDiv.textContent = message;
    document.querySelector('.container').prepend(errorDiv);
    setTimeout(() => errorDiv.remove(), 5000);
}

export function showSuccess(message) {
    const successDiv = document.createElement('div');
    successDiv.className = 'success';
    successDiv.textContent = message;
    document.querySelector('.container').prepend(successDiv);
    setTimeout(() => successDiv.remove(), 5000);
}

export function showModalError(message) {
    const modal = document.getElementById('reserveModal');
    const content = document.getElementById('reserveContent');
    const prevError = modal.querySelector('.error');
    if (prevError) prevError.remove();
    const prevSuccess = modal.querySelector('.success');
    if (prevSuccess) prevSuccess.remove();

    const errorDiv = document.createElement('div');
    errorDiv.className = 'error';
    errorDiv.textContent = message;
    content.insertBefore(errorDiv, content.firstChild);
}

export function showModalSuccess(message) {
    const modal = document.getElementById('reserveModal');
    const content = document.getElementById('reserveContent');
    const prevError = modal.querySelector('.error');
    if (prevError) prevError.remove();
    const prevSuccess = modal.querySelector('.success');
    if (prevSuccess) prevSuccess.remove();

    const successDiv = document.createElement('div');
    successDiv.className = 'success';
    successDiv.textContent = message;
    content.insertBefore(successDiv, content.firstChild);
}

export function closeModal(modalId) {
    if (!modalId) return;
    const modal = document.getElementById(modalId);
    if (!modal) return;
    modal.style.display = 'none';
    if (modalId === 'reserveModal') {
        state.selectedCourseId = null;
    }
}

export function showReserveModal(course) {
    state.selectedCourseId = course.id;

    const content = document.getElementById('reserveContent');
    content.innerHTML = '';

    const rows = [
        ['課程名稱', course.courseName],
        ['老師', course.teacherName],
        ['日期', formatDate(course.date)],
        ['時間', `${formatTime(course.startTime)} - ${formatTime(course.endTime)}`],
        ['剩餘名額', `${course.maxStudents - course.currentStudents}/${course.maxStudents}`]
    ];
    rows.forEach(([label, value]) => {
        const p = document.createElement('p');
        const strong = document.createElement('strong');
        strong.textContent = label + '：';
        p.appendChild(strong);
        p.appendChild(document.createTextNode(value));
        content.appendChild(p);
    });

    document.getElementById('reserveModal').style.display = 'block';
}

function updateUserInfo() {
    const userInfo = document.getElementById('userInfo');
    userInfo.innerHTML = '';

    const p1 = document.createElement('p');
    const strong = document.createElement('strong');
    strong.textContent = '歡迎，' + state.currentUser.displayName + '！';
    p1.appendChild(strong);

    const p2 = document.createElement('p');
    p2.textContent = '您可以查看課程行事曆、管理課程或查看您的預約。';

    userInfo.appendChild(p1);
    userInfo.appendChild(p2);
}

export function renderCalendar() {
    const year = state.currentDate.getFullYear();
    const month = state.currentDate.getMonth();
    document.getElementById('currentMonth').textContent = `${year}年${month + 1}月`;

    const firstDay = new Date(year, month, 1);
    const startDate = new Date(firstDay);
    startDate.setDate(startDate.getDate() - firstDay.getDay());

    const calendarDays = document.getElementById('calendarDays');
    calendarDays.innerHTML = '';

    for (let i = 0; i < 42; i++) {
        const dayElement = document.createElement('div');
        dayElement.className = 'day';

        const currentDay = new Date(startDate);
        currentDay.setDate(startDate.getDate() + i);

        const dayNumber = document.createElement('div');
        dayNumber.className = 'day-number';
        dayNumber.textContent = currentDay.getDate();

        if (currentDay.getMonth() !== month) {
            dayElement.classList.add('other-month');
        }

        dayElement.appendChild(dayNumber);

        const dayCourses = state.courses.filter(course => {
            const courseDate = new Date(course.date);
            return courseDate.toDateString() === currentDay.toDateString();
        });

        dayCourses.forEach(course => {
            const isReserved = state.reservations.some(r => r.courseId === course.id && r.status === 'active');
            const isFull = course.currentStudents >= course.maxStudents;
            const courseElement = document.createElement('div');
            courseElement.className = 'course-item';

            if (isReserved) {
                courseElement.classList.add('reserved');
                courseElement.title = '已預約';
            } else if (isFull) {
                courseElement.classList.add('full');
                courseElement.title = '已滿員';
            } else {
                courseElement.classList.add('available');
                courseElement.style.cursor = 'pointer';
            }

            courseElement.textContent = `${formatTime(course.startTime)} ${course.courseName}`;
            if (!isReserved && !isFull) {
                courseElement.onclick = () => showReserveModal(course);
            }
            dayElement.appendChild(courseElement);
        });

        calendarDays.appendChild(dayElement);
    }
}

export function renderCourses() {
    const coursesList = document.getElementById('coursesList');
    coursesList.innerHTML = '';

    if (state.courses.length === 0) {
        coursesList.innerHTML = '<p>目前沒有課程。</p>';
        return;
    }

    state.courses.forEach(course => {
        const courseCard = document.createElement('div');
        courseCard.className = 'course-card';

        const formattedDate = formatDate(course.date);
        const startTime = formatTime(course.startTime);
        const endTime = formatTime(course.endTime);
        const isFull = course.currentStudents >= course.maxStudents;
        const canReserve = !isFull && !state.reservations.some(r => r.courseId === course.id && r.status === 'active');

        const h3 = document.createElement('h3');
        h3.textContent = course.courseName;

        const courseInfo = document.createElement('div');
        courseInfo.className = 'course-info';
        const infoRows = [
            ['🏃 老師：', course.teacherName],
            ['📅 日期：', formattedDate],
            ['⏰ 時間：', `${startTime} - ${endTime}`],
            ['👥 人數：', `${course.currentStudents}/${course.maxStudents}`]
        ];

        infoRows.forEach(([label, value]) => {
            const row = document.createElement('div');
            row.className = 'info-row';
            const labelEl = document.createElement('span');
            labelEl.className = 'label';
            labelEl.textContent = label;
            const valueEl = document.createElement('span');
            valueEl.className = 'value';
            valueEl.textContent = value;
            row.appendChild(labelEl);
            row.appendChild(valueEl);
            courseInfo.appendChild(row);
        });

        const courseActions = document.createElement('div');
        courseActions.className = 'course-actions';
        const btn = document.createElement('button');
        if (canReserve) {
            btn.className = 'btn reserve-btn';
            btn.textContent = '預約課程';
            btn.onclick = () => showReserveModal(course);
        } else {
            btn.className = 'btn disabled-btn';
            btn.disabled = true;
            btn.textContent = isFull ? '已滿員' : '已預約';
        }
        courseActions.appendChild(btn);

        courseCard.appendChild(h3);
        courseCard.appendChild(courseInfo);
        courseCard.appendChild(courseActions);
        coursesList.appendChild(courseCard);
    });
}

export function renderReservations() {
    const reservationsList = document.getElementById('reservationsList');
    reservationsList.innerHTML = '';

    if (state.reservations.length === 0) {
        reservationsList.innerHTML = '<p>您還沒有預約任何課程。</p>';
        return;
    }

    state.reservations.forEach(reservation => {
        const course = state.courses.find(c => c.id === reservation.courseId);
        const reservationCard = document.createElement('div');
        reservationCard.className = 'course-card';

        const h3 = document.createElement('h3');
        h3.textContent = course ? course.courseName : '未知課程';

        const reservationInfo = document.createElement('div');
        reservationInfo.className = 'reservation-info';

        const courseDate = course ? formatDate(course.date) : '未知';
        const startTime = course ? formatTime(course.startTime) : '';
        const endTime = course ? formatTime(course.endTime) : '';
        const reservationTime = new Date(reservation.reservationTime).toLocaleString('zh-TW');
        const infoRows = [
            ['🏃 老師：', course ? course.teacherName : '未知'],
            ['📅 日期：', courseDate],
            ['⏰ 時間：', `${startTime} - ${endTime}`],
            ['📝 預約時間：', reservationTime]
        ];

        infoRows.forEach(([label, value]) => {
            const row = document.createElement('div');
            row.className = 'info-row';
            const labelEl = document.createElement('span');
            labelEl.className = 'label';
            labelEl.textContent = label;
            const valueEl = document.createElement('span');
            valueEl.className = 'value';
            valueEl.textContent = value;
            row.appendChild(labelEl);
            row.appendChild(valueEl);
            reservationInfo.appendChild(row);
        });

        const statusDiv = document.createElement('div');
        statusDiv.className = 'status-indicator status-' + reservation.status.toLowerCase();
        statusDiv.textContent = '狀態：' + (reservation.status === 'active' ? '已預約' : reservation.status);
        reservationInfo.appendChild(statusDiv);

        if (reservation.status === 'active') {
            const actionDiv = document.createElement('div');
            actionDiv.className = 'course-actions';
            const cancelBtn = document.createElement('button');
            cancelBtn.className = 'cancel-btn';
            cancelBtn.textContent = '取消預約';
            cancelBtn.onclick = () => cancelReservationHandler(reservation.id);
            actionDiv.appendChild(cancelBtn);
            reservationInfo.appendChild(actionDiv);
        }

        reservationCard.appendChild(h3);
        reservationCard.appendChild(reservationInfo);
        reservationsList.appendChild(reservationCard);
    });
}

async function cancelReservationHandler(reservationId) {
    if (!confirm('確認取消預約？')) return;

    try {
        const result = await fetchGAS('cancelReservation', {
            userId: state.currentUser.userId,
            reservationId
        });

        if (result.success) {
            showSuccess('已取消預約');
            loadData();
        } else {
            showError('取消失敗：' + result.message);
        }
    } catch (error) {
        showError('網路錯誤：' + error.message);
    }
}

export function showLoading(elementId, message = '載入中...') {
    const element = document.getElementById(elementId);
    element.innerHTML = `
        <div class="loading">
            <div class="spinner"></div>
            <p>${message}</p>
        </div>
    `;
}

export function hideLoading(elementId) {
    const element = document.getElementById(elementId);
    if (element) {
        element.innerHTML = '';
    }
}
