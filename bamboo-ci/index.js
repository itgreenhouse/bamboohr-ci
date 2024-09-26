const express = require('express');
const axios = require('axios');
const FormData = require('form-data');
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

        // Log the data structure to inspect it
        console.log('API Response:', data);

        // Process current batch of surveys
        data.value.forEach(survey => {
            const email = survey.email.toLowerCase(); // Normalize email to lowercase

            // Add all surveys per normalized email
            if (!surveyMap[email]) {
                surveyMap[email] = {
                    surveys: []
                };
            }
            
            // Store the relevant data in the survey map
            surveyMap[email].surveys.push({
                traitPattern: survey.traitPattern,
                surveyReportLink: survey.surveyReportLink,
                surveyDate: survey.surveyDate
            });
        });

        // Check if there is a nextLink (i.e., more data to fetch)
        if (data.nextLink) {
            console.log(`Fetching more data from: ${data.nextLink}`);
            // Recursively fetch the next set of data
            return await fetchSurveyData(data.nextLink, surveyMap);
        }

        // Return all survey data grouped by email
        return surveyMap;

    } catch (error) {
        console.error('Error fetching survey data:', error);
        throw error;
    }
}

async function fetchEmployeeDirectory() {
    try {
        const options = {
            method: 'GET',
            url: `https://api.bamboohr.com/api/gateway.php/${process.env.BAMBOOHR_DOMAIN}/v1/employees/directory`,
            headers: {
                accept: 'application/json',
                authorization: `Basic ${Buffer.from(`${process.env.BAMBOOHR_API_KEY}:x`).toString('base64')}`
            }
        };

        const response = await axios.request(options);
        const data = response.data;

        // Extract employee id and workEmail from the employeeDirectory
        const employees = data.employees.map(employee => ({
            id: employee.id,                // Extract id
            workEmail: employee.workEmail    // Extract workEmail
        }));

        return employees; // Return the list of employees with id and workEmail
    } catch (error) {
        console.error('Error fetching employee directory:', error);
        throw error;
    }
}


async function fetchEmployeeFiles(employeeId) {
    try {
        const options = {
            method: 'GET',
            url: `https://api.bamboohr.com/api/gateway.php/${process.env.BAMBOOHR_DOMAIN}/v1/employees/${employeeId}/files/view`,
            headers: {
                accept: 'application/json',
                authorization: `Basic ${Buffer.from(`${process.env.BAMBOOHR_API_KEY}:x`).toString('base64')}`
            }
        };

        const response = await axios.request(options);
        const data = response.data;

        // Find the category with id 308 (Culture Index Reports)
        const category308 = data.categories.find(category => category.id === 308);

        // If category 308 exists, return its files; otherwise, return an empty array
        const existingFiles = category308 ? category308.files : [];

        // Extract and return just the file names
        return existingFiles.map(file => file.name);
    } catch (error) {
        console.error(`Error fetching files for employee ${employeeId}:`, error.response ? error.response.data : error.message);
        throw error;
    }
}

async function uploadSurveyReport(employeeId, survey) {
    try {
        const pdfResponse = await axios.get(survey.surveyReportLink, {
            responseType: 'arraybuffer' // Ensures the response is in binary format
        });

        const pdfBuffer = Buffer.from(pdfResponse.data);
        // Initialize FormData
        const form = new FormData();
        form.append('category', '308');
        form.append('fileName', `Culture_index_${survey.surveyDate}.pdf`);
        form.append('share', 'yes');

        // Add the file data
        form.append('file', pdfBuffer, {
            filename: `Culture_index_${survey.surveyDate}.pdf`,
            contentType: 'application/pdf' // Content-Type for a PDF file
        });

        // Send POST request to upload file
        const response = await axios.post(
            `https://api.bamboohr.com/api/gateway.php/${process.env.BAMBOOHR_DOMAIN}/v1/employees/${employeeId}/files/`,
            form,
            {
                headers: {
                    ...form.getHeaders(), // Get boundary and multipart headers from form-data
                    authorization: `Basic ${Buffer.from(`${process.env.BAMBOOHR_API_KEY}:x`).toString('base64')}`,
                    'Content-Length': form.getLengthSync() // Ensure content-length is specified
                }
            }
        );

        console.log(`File uploaded successfully for employee ${employeeId}:`, response.data);
    } catch (error) {
        console.error(`Error uploading file for employee ${employeeId}:`, error.response ? error.response.data : error.message);
    }
}

async function uploadNewSurveys(employeeDirectory, surveyData) {
    // Limit to the first 7 employees for testing
    const limitedEmployees = employeeDirectory.slice(7, 11);

    for (const employee of limitedEmployees) {
        const email = employee.workEmail.toLowerCase();
        const surveys = surveyData[email] ? surveyData[email].surveys : [];

        if (surveys.length === 0) continue; // Skip if no surveys for this employee

        const existingFiles = await fetchEmployeeFiles(employee.id);

        // Extract file names from the existing files
        const existingFileNames = existingFiles.map(file => file.fileName);

        for (const survey of surveys) {
            const newFileName = `Culture_index_${survey.surveyDate}.pdf`;

            // Upload the survey report only if the file does not already exist
            if (!existingFileNames.includes(newFileName)) {
                await uploadSurveyReport(employee.id, survey);
            } else {
                console.log(`File ${newFileName} already exists for employee ${employee.id}, skipping upload.`);
            }
        }
    }
}

// Test route to trigger both requests
app.get('/test', async (req, res) => {
    try {
        const surveyData = await fetchSurveyData();
        const employeeDirectory = await fetchEmployeeDirectory();
        const limitedEmployees = employeeDirectory.slice(7, 11);

        for (const employee of limitedEmployees) {
            const email = employee.workEmail.toLowerCase();
            const surveys = surveyData[email] ? surveyData[email].surveys : [];
    
            if (surveys.length === 0) continue; // Skip if no surveys for this employee
    
            const existingFiles = await fetchEmployeeFiles(employee.id);
    
            const existingFileNames = existingFiles.map(file => file.fileName);

            for (const survey of surveys) {
                const newFileName = `Culture_index_${survey.surveyDate}.pdf`;
    
                // Upload the survey report only if the file does not already exist
                if (!existingFileNames.includes(newFileName)) {
                    console.log(survey.surveyReportLink)
                } else {
                    console.log(`File ${newFileName} already exists for employee ${employee.id}, skipping upload.`);
                }
            }
        }
    
        
        // await uploadNewSurveys(employeeDirectory, surveyData);

        res.status(200).json({
            message: 'Data fetched and processed successfully',
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
