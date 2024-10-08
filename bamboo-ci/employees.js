const axios = require('axios');
const FormData = require('form-data');
require('dotenv').config();


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

        const employees = data.employees.map(employee => ({
            id: employee.id,
            workEmail: employee.workEmail
        }));

        return employees;
    } catch (error) {
        console.error('Error fetching employee directory:', error);
        throw error;
    }
}

// Function to fetch employee files
async function fetchEmployeeFiles(employeeId) {
    try {
        const options = {
            method: 'GET',
            url: `https://api.bamboohr.com/api/gateway.php/${process.env.BAMBOOHR_DOMAIN}/v1/employees/${employeeId}/files/view`,
            headers: {
                accept: 'application/json',
                authorization: `Basic ${Buffer.from(`${process.env.BAMBOOHR_API_KEY}:x}`).toString('base64')}`
            }
        };

        const response = await axios.request(options);
        const data = response.data;

        const category308 = data.categories.find(category => category.id === 308);
        const existingFiles = category308 ? category308.files : [];

        return existingFiles.map(file => file.name);
    } catch (error) {
        console.error(`Error fetching files for employee ${employeeId}:`, error.response ? error.response.data : error.message);
        throw error;
    }
}

// Function to upload survey reports
async function uploadSurveyReport(employeeId, survey) {
    try {
        const pdfResponse = await axios.get(survey.surveyReportLink, {
            responseType: 'arraybuffer'
        });

        const pdfBuffer = Buffer.from(pdfResponse.data);
        const form = new FormData();
        form.append('category', '308');
        form.append('fileName', `CI_${survey.firstName}_${survey.lastName}_${survey.surveyDate}.pdf`);
        form.append('share', 'yes');
        form.append('file', pdfBuffer, {
            filename: `CI_${survey.firstName}_${survey.lastName}_${survey.surveyDate}.pdf`,
            contentType: 'application/pdf'
        });

        const response = await axios.post(
            `https://api.bamboohr.com/api/gateway.php/${process.env.BAMBOOHR_DOMAIN}/v1/employees/${employeeId}/files/`,
            form,
            {
                headers: {
                    ...form.getHeaders(),
                    authorization: `Basic ${Buffer.from(`${process.env.BAMBOOHR_API_KEY}:x`).toString('base64')}`,
                    'Content-Length': form.getLengthSync()
                }
            }
        );

        console.log(`File uploaded successfully for employee ${employeeId}:`, response.data);
    } catch (error) {
        console.error(`Error uploading file for employee ${employeeId}:`, error.response ? error.response.data : error.message);
    }
}

async function uploadNewSurveys(employeeDirectory, surveyData) {
    
    for (const employee of employeeDirectory) {
        const email = employee.workEmail ? employee.workEmail.toLowerCase() : null;

        if (!email) {
            console.log(`Skipping employee ${employee.id} due to null email.`);
            continue;
        }

        const surveys = surveyData[email] ? surveyData[email].surveys : [];
        if (surveys.length === 0) continue;

        const existingFiles = await fetchEmployeeFiles(employee.id);

        for (const survey of surveys) {
            const newFileName = `CI_${survey.firstName}_${survey.lastName}_${survey.surveyDate}.pdf`;

            if (!existingFiles.includes(newFileName)) {
                try {
                    await uploadSurveyReport(employee.id, survey);
                } catch (error) {
                    console.error(`Error uploading survey for employee ${employee.id}:`, error);
                }
            } else {
                console.log(`File ${newFileName} already exists for employee ${employee.id}, skipping upload.`);
            }
        }
    }
}


module.exports = {
    fetchEmployeeDirectory,
    fetchEmployeeFiles,
    uploadSurveyReport,
    uploadNewSurveys,
};
