const axios = require('axios');
require('dotenv').config();

// Function to fetch applications from BambooHR
async function fetchApplications(url = `https://api.bamboohr.com/api/gateway.php/${process.env.BAMBOOHR_DOMAIN}/v1/applicant_tracking/applications`, applicationsMap = []) {
    try {
        const options = {
            method: 'GET',
            url: url,
            headers: {
                accept: 'application/json',
                authorization: `Basic ${Buffer.from(`${process.env.BAMBOOHR_API_KEY}:x`).toString('base64')}`
            }
        };

        const response = await axios.request(options);
        const data = response.data;

        // Process current batch of applications without filtering by status
        data.applications.forEach(application => {
            applicationsMap.push({
                id: application.id, // Application ID
                email: application.applicant.email // Applicant's email
            });
        });

        // Log the nextPageUrl to debug if it's invalid
        console.log('Next Page URL:', data.nextPageUrl);

        // If there's a nextPageUrl, check if it's a relative or full URL
        if (data.nextPageUrl) {
            let nextUrl = data.nextPageUrl;

            // Prepend the base URL if nextPageUrl is relative
            if (nextUrl.startsWith('/')) {
                nextUrl = `https://api.bamboohr.com/api/gateway.php/${process.env.BAMBOOHR_DOMAIN}${nextUrl}`;
            }

            console.log(`Fetching more applications from: ${nextUrl}`);
            return await fetchApplications(nextUrl, applicationsMap);
        }

        // Return all filtered applications (only id and email)
        return applicationsMap;

    } catch (error) {
        console.error('Error fetching applications:', error.response ? error.response.data : error.message);
        throw error;
    }
}


async function fetchApplicationDetail() {
    try {
        const options = {
            method: 'GET',
            url: `https://api.bamboohr.com/api/gateway.php/${process.env.BAMBOOHR_DOMAIN}/v1/applicant_tracking/applications/19692`,
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

async function fetchStatuses() {
    try {
        const options = {
            method: 'GET',
            url: `https://api.bamboohr.com/api/gateway.php/${process.env.BAMBOOHR_DOMAIN}/v1/applicant_tracking/statuses`,
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
    fetchApplicationDetail,
    fetchStatuses
};
