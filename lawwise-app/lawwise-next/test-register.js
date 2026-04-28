const axios = require('axios');

async function testRegister() {
  console.log('Sending registration request...');
  try {
    const response = await axios.post('http://localhost:3000/api/students/register', {
      fullName: 'Test Student',
      email: 'test' + Date.now() + '@gmail.com',
      password: 'password123',
      university: 'Test University',
      yearOfStudy: '1st Year'
    });
    console.log('✅ Success:', response.data);
  } catch (error) {
    console.error('❌ Error:', error.response ? error.response.status : error.message);
    if (error.response) {
      console.error('Response data:', error.response.data);
    }
  }
}

testRegister();
