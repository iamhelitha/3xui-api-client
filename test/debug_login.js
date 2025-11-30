require('dotenv').config();
const ThreeXUI = require('../index');

async function debugLogin() {
    console.log('Initializing client...');
    const client = new ThreeXUI(
        process.env.PANEL_URL,
        process.env.PANEL_USERNAME,
        process.env.PANEL_PASSWORD
    );

    console.log('Attempting login...');
    try {
        const result = await client.login();
        console.log('Login successful!');
        console.log('--- Login Result Structure ---');
        console.log(JSON.stringify(result, null, 2));
        console.log('------------------------------');
        
        console.log('Cookie value:', client.cookie);

    } catch (error) {
        console.error('Login failed:', error.message);
        if (error.response) {
            console.error('Status:', error.response.status);
            console.error('Data:', error.response.data);
        }
    }
}

debugLogin();
