const express = require('express');
const axios = require('axios');
require('dotenv').config();

const app = express();
app.use(express.json()); // Middleware to parse JSON requests

// Function to get survey data from Culture Index API using axios
async function fetchSurveyData(url = 'https://api.cultureindex.com/Surveys?api-version=2022-10-01') {
    try {
        const options = {
            method: 'GET',
            url: url,
            headers: {
                'Cache-Control': 'no-cache',
                'subscriptionkey': process.env.CULTURE_INDEX_API_KEY
            }
        };

        const response = await axios.request(options);
        const data = response.data;

        // Log the data structure to inspect it
        console.log('API Response:', data);

        // Get the current surveys from the 'value' field
        const currentSurveys = data.value || []; // Default to empty array if undefined

        // Log how many surveys were fetched in this batch
        console.log(`Fetched ${currentSurveys.length} surveys`);

        // Check if there is a nextLink (i.e., more data to fetch)
        if (data.nextLink) {
            console.log(`Fetching more data from: ${data.nextLink}`);

            // Recursively fetch the next set of data
            const nextSurveys = await fetchSurveyData(data.nextLink);

            // Combine current surveys with the next surveys
            return [
                ...currentSurveys, // Current batch of surveys
                ...nextSurveys // Combine with the next batch of surveys
            ];
        }

        // If no nextLink, return the current surveys
        return currentSurveys;
    } catch (error) {
        console.error('Error fetching survey data:', error);
        throw error;
    }
}

async function fetchEmployeeDirectory() {
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
        return response.data; // Return the employee data
    } catch (error) {
        console.error('Error fetching employee directory:', error);
        throw error;
    }
}

async function fetchEmployeeTest() {
    try {
        const options = {
            method: 'GET',
            url: `https://api.bamboohr.com/api/gateway.php/${process.env.BAMBOOHR_DOMAIN}/v1/employees/376/`,
            params: {fields: 'firstName'
            },
            headers: {
                accept: 'application/json',
                authorization: `Basic ${Buffer.from(`${process.env.BAMBOOHR_API_KEY}:x`).toString('base64')}`
            }
        };

        const response = await axios.request(options);
        return response.data; // Return the employee data
    } catch (error) {
        console.error('Error fetching employee directory:', error);
        throw error;
    }
}

async function uploadFileTest() {
    try {
        const options = {
            method: 'POST',
            url: `https://api.bamboohr.com/api/gateway.php/${process.env.BAMBOOHR_DOMAIN}/v1/employees/376/files`,
            headers: {
                accept: 'application/json',
                authorization: `Basic ${Buffer.from(`${process.env.BAMBOOHR_API_KEY}:x`).toString('base64')}`
            },
        };

        const response = await axios.request(options);
        return response.data; // Return the employee data
    } catch (error) {
        console.error('Error fetching employee directory:', error);
        throw error;
    }
}

async function fetchFields() {
    try {
        const options = {
            method: 'GET',
            url: `https://api.bamboohr.com/api/gateway.php/${process.env.BAMBOOHR_DOMAIN}/v1/meta/fields/`,
            headers: {
                accept: 'application/json',
                authorization: `Basic ${Buffer.from(`${process.env.BAMBOOHR_API_KEY}:x`).toString('base64')}`
            }
        };

        const response = await axios.request(options);
        return response.data; // Return the employee data
    } catch (error) {
        console.error('Error fetching employee directory:', error);
        throw error;
    }
}

// Test route to trigger both requests
app.get('/test', async (req, res) => {
    try {
        // const surveyData = await fetchSurveyData();
        // const employeeDirectory = await fetchEmployeeDirectory();
        // const employeeTest = await fetchEmployeeTest();
        // const fields = await fetchFields();
        const employeeFile = await uploadFileTest();
        
        res.status(200).json({
            message: 'Data fetched successfully',
            // surveyData,
            // employeeDirectory
            // employeeTest,
            // fields
            employeeFile
        });
    } catch (error) {
        res.status(500).json({ message: 'Error fetching data', error: error.message });
    }
});

// Start the server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});
