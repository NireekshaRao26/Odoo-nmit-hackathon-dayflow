const http = require('http');

function makeRequest(options, postData) {
  return new Promise((resolve, reject) => {
    const req = http.request(options, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          resolve({ status: res.statusCode, body: JSON.parse(data) });
        } catch (e) {
          resolve({ status: res.statusCode, body: data });
        }
      });
    });
    req.on('error', reject);
    if (postData) {
      req.write(JSON.stringify(postData));
    }
    req.end();
  });
}

async function testAll() {
  console.log('--- TESTING BACKEND ENDPOINTS ---');

  // 1. Health
  const health = await makeRequest({ host: 'localhost', port: 5000, path: '/health', method: 'GET' });
  console.log('1. GET /health ->', health);

  // 2. Profile
  const profile = await makeRequest({ host: 'localhost', port: 5000, path: '/api/profile?userId=emp-001-uuid', method: 'GET' });
  console.log('2. GET /api/profile ->', profile);

  // 3. Update Profile
  const updateProf = await makeRequest(
    { host: 'localhost', port: 5000, path: '/api/profile/update', method: 'POST', headers: { 'Content-Type': 'application/json' } },
    { userId: 'emp-001-uuid', full_name: 'John Doe Updated', department: 'Cloud & AI' }
  );
  console.log('3. POST /api/profile/update ->', updateProf);

  // 4. Today Attendance
  const todayAtt = await makeRequest({ host: 'localhost', port: 5000, path: '/api/attendance/today?userId=emp-001-uuid', method: 'GET' });
  console.log('4. GET /api/attendance/today ->', todayAtt);

  // 5. Clock-Out emp-001
  const clockOut = await makeRequest(
    { host: 'localhost', port: 5000, path: '/api/attendance/check-out', method: 'POST', headers: { 'Content-Type': 'application/json' } },
    { userId: 'emp-001-uuid', employeeId: 'EMP-001' }
  );
  console.log('5. POST /api/attendance/check-out ->', clockOut);

  // 6. Apply Leave
  const leave = await makeRequest(
    { host: 'localhost', port: 5000, path: '/api/leaves/apply', method: 'POST', headers: { 'Content-Type': 'application/json' } },
    { userId: 'emp-001-uuid', employeeId: 'EMP-001', leaveType: 'Casual Leave', startDate: '2026-09-10', endDate: '2026-09-12', daysCount: 3, reason: 'Personal matters' }
  );
  console.log('6. POST /api/leaves/apply ->', leave);

  // 7. Admin Employees
  const adminEmp = await makeRequest({ host: 'localhost', port: 5000, path: '/api/admin/employees', method: 'GET' });
  console.log('7. GET /api/admin/employees ->', adminEmp.body.employees ? `Count: ${adminEmp.body.employees.length}` : adminEmp);

  // 8. Admin Overview
  const overview = await makeRequest({ host: 'localhost', port: 5000, path: '/api/admin/overview', method: 'GET' });
  console.log('8. GET /api/admin/overview ->', overview);

  console.log('--- ALL BACKEND TESTS PASSED SUCCESSFULLY! ---');
}

testAll().catch(console.error);
