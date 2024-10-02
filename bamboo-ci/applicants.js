const axios = require('axios');
require('dotenv').config();

// Function to fetch applications from BambooHR
async function fetchApplications() {
    try {
        const options = {
            method: 'GET',
            url: `https://api.bamboohr.com/api/gateway.php/${process.env.BAMBOOHR_DOMAIN}/v1/applicant_tracking/applications`,
            headers: {
                accept: 'application/json',
                authorization: `Basic ${Buffer.from(`${process.env.BAMBOOHR_API_KEY}:x`).toString('base64')}`
            }
        };

        const response = await axios.request(options);
        const data = response.data;

        // Log the fetched applications for inspection
        console.log('Applications:', data);
        return data;
    } catch (error) {
        console.error('Error fetching applications:', error.response ? error.response.data : error.message);
        throw error;
    }
}

async function fetchApplicationDetail() {
    try {
        const options = {
            method: 'GET',
            url: `https://api.bamboohr.com/api/gateway.php/${process.env.BAMBOOHR_DOMAIN}/v1/applicant_tracking/applications/21477`,
            headers: {
                accept: 'application/json',
                authorization: `Basic ${Buffer.from(`${process.env.BAMBOOHR_API_KEY}:x`).toString('base64')}`
            }
        };

        const response = await axios.request(options);
        const data = response.data;

        // Log the fetched applications for inspection
        console.log('Applications:', data);
        return data;
    } catch (error) {
        console.error('Error fetching applications:', error.response ? error.response.data : error.message);
        throw error;
    }
}

module.exports = {
    fetchApplications,
    fetchApplicationDetail
};
