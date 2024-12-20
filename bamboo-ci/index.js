const express = require('express');
const axios = require('axios');
const { fetchEmployeeDirectory, uploadNewSurveys } = require('./employees'); // Import functions from employees.js
const { uploadApplicationSurveys, fetchApplications } = require('./applicants');
require('dotenv').config();


const app = express();
app.use(express.json()); // Middleware to parse JSON requests

// Function to get survey data from Culture Index API using axios
async function fetchSurveyData(url = 'https://api.cultureindex.com/Surveys?api-version=2022-10-01&skip=6700', surveyMap = {}) {
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

        // console.log('API Response:', data);

        data.value.forEach(survey => {
            const email = survey.email.toLowerCase();

            if (!surveyMap[email]) {
                surveyMap[email] = { surveys: [] };
            }

            surveyMap[email].surveys.push({
                firstName: survey.firstName,
                lastName: survey.lastName,
                traitPattern: survey.traitPattern,
                surveyReportLink: survey.surveyReportLink,
                surveyDate: survey.surveyDate,
            });
        });

        if (data.nextLink) {
            console.log(`Fetching more data from: ${data.nextLink}`);
            return await fetchSurveyData(data.nextLink, surveyMap);
        }

        return surveyMap;
    } catch (error) {
        console.error('Error fetching survey data:', error);
        throw error;
    }
}

function startScheduler() {
    console.log("Starting scheduler...");

    // Run /applications task every 20 minutes
    const applicationsInterval = 20 * 60 * 1000; // 20 minutes in milliseconds
    const runApplicationsTask = async () => {
        console.log(`Running /applications task at ${new Date().toISOString()}`);
        try {
            const surveyData = await fetchSurveyData();
            
            const applications = await fetchApplications();
            await uploadApplicationSurveys(applications, surveyData)
            console.log('/applications task completed successfully.');
            
            const employeeDirectory = await fetchEmployeeDirectory();
            await uploadNewSurveys(employeeDirectory, surveyData);
            console.log('/employees task completed successfully.');


            
        } catch (error) {
            console.error('Error running /applications task:', error);
        }
    };
    runApplicationsTask(); // Run immediately on startup
    setInterval(runApplicationsTask, applicationsInterval);
}

startScheduler();

// Test route to trigger both requests
app.get('/', (req, res) => {
    res.send('<h1>Cron job endpoint is working! Server is up!</h1>');
});

// Start the server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});
