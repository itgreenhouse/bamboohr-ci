const express = require('express');
const axios = require('axios');
const { fetchEmployeeDirectory, uploadNewSurveys } = require('./employees'); // Import functions from employees.js
const { fetchApplications, fetchApplicationDetail, fetchJobSummaries, fetchStatuses, addApplicationComment, changeApplicantStatus, uploadApplicationSurveys } = require('./applicants');
require('dotenv').config();


const app = express();
app.use(express.json()); // Middleware to parse JSON requests

// Function to get survey data from Culture Index API using axios
async function fetchSurveyData(url = 'https://api.cultureindex.com/Surveys?api-version=2022-10-01', surveyMap = {}) {
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

        console.log('API Response:', data);

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

// Test route to trigger both requests
app.get('/employeesTest', async (req, res) => {
    try {
        const surveyData = await fetchSurveyData();
        const employeeDirectory = await fetchEmployeeDirectory();

        await uploadNewSurveys(employeeDirectory, surveyData);

        res.status(200).json({
            message: 'Data fetched and processed successfully'
        });
    } catch (error) {
        res.status(500).json({ message: 'Error fetching data', error: error.message });
    }
});

app.get('/applications', async (req, res) => {
    try {
        const surveyData = await fetchSurveyData();
        const applications = await fetchApplications();
        // const statuses = await fetchApplicationDetail(21497)

        await uploadApplicationSurveys(applications, surveyData)
        res.status(200).json({
            message: 'Applications fetched successfully',
            // surveyData: surveyData,
            // applications: applications,
            // statuses: statuses,
        });
    } catch (error) {
        res.status(500).json({ message: 'Error fetching applications', error: error.message });
    }
});

app.get('/test', async (req, res) => {
    try {
        // const changeStatus = await changeApplicantStatus();
        const surveyData = await fetchSurveyData();
        // const applications = await fetchApplications();
        // const applicationDetail = await fetchApplicationDetail();
        // // const status = await fetchStatuses();
        // const employeeDirectory = await fetchEmployeeDirectory();
        // const applications = await fetchApplications();
        res.status(200).json({
            message: 'Applications fetched successfully',
            // applicationDetail: applicationDetail,
            // status: status
            surveyData: surveyData,
            // changeStatus: changeStatus,
            // applications: applications,
            // employeeDirectory: employeeDirectory
        });
    } catch (error) {
        res.status(500).json({ message: 'Error fetching applications', error: error.message });
    }
});

// Start the server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});
