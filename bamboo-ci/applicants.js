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
        data.applications
        .filter(application => application.status.id == "1")
        .forEach(application => {
            applicationsMap.push({
                id: application.id, // Application ID
                status: application.status.id,
                email: application.applicant.email, // Applicant's email
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

async function fetchApplications2(url = `https://api.bamboohr.com/api/gateway.php/${process.env.BAMBOOHR_DOMAIN}/v1/applicant_tracking/applications?applicationStatusId=1&jobId=47`, allApplications = []) {
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

        // Append all applications from the current batch to the allApplications array
        allApplications.push(...data.applications);

        // Log the nextPageUrl for debugging
        console.log('Next Page URL:', data.nextPageUrl);

        // If there's a nextPageUrl, determine if it's relative or absolute
        if (data.nextPageUrl) {
            let nextUrl = data.nextPageUrl;

            // Prepend the base URL if nextPageUrl is relative
            if (nextUrl.startsWith('/')) {
                nextUrl = `https://api.bamboohr.com/api/gateway.php/${process.env.BAMBOOHR_DOMAIN}${nextUrl}`;
            }

            console.log(`Fetching more applications from: ${nextUrl}`);
            return await fetchApplications2(nextUrl, allApplications);
        }

        // Return all applications once there are no more pages
        return allApplications;

    } catch (error) {
        console.error('Error fetching applications:', error.response ? error.response.data : error.message);
        throw error;
    }
}

async function fetchJobSummaries() {
    try {
        const options = {
            method: 'GET',
            url: `https://api.bamboohr.com/api/gateway.php/${process.env.BAMBOOHR_DOMAIN}/v1/applicant_tracking/jobs?statusGroups=On%20Hold`,
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
            url: `https://api.bamboohr.com/api/gateway.php/${process.env.BAMBOOHR_DOMAIN}/v1/applicant_tracking/applications/21497`,
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

async function addApplicationComment(applicantionId, commentText) {
    try {
        const url = `https://api.bamboohr.com/api/gateway.php/${process.env.BAMBOOHR_DOMAIN}/v1/applicant_tracking/applications/${applicantionId}/comments`;

        const options = {
            method: 'POST',
            url: url,
            headers: {
                'content-type': 'application/json',
                'authorization': `Basic ${Buffer.from(`${process.env.BAMBOOHR_API_KEY}:x`).toString('base64')}`
            },
            data: {
                type: 'comment',
                comment: commentText
            }
        };

        const response = await axios.request(options);
        console.log('Comment added successfully:', response.data);
    } catch (error) {
        console.error('Error adding comment:', error.response ? error.response.data : error.message);
        throw error;
    }
}

async function changeApplicantStatus(applicationId) {
    try {
        const url = `https://api.bamboohr.com/api/gateway.php/${process.env.BAMBOOHR_DOMAIN}/v1/applicant_tracking/applications/${applicationId}/status`;

        const options = {
            method: 'POST',
            url: url,
            headers: {
                'content-type': 'application/json',
                'authorization': `Basic ${Buffer.from(`${process.env.BAMBOOHR_API_KEY}:x`).toString('base64')}`
            },
            data: {
                status: 29
            }
        };

        const response = await axios.request(options);
        console.log(`Status changed for application ${applicationId}`, response.data);
    } catch (error) {
        console.error(`Error changing status for application ${applicationId}:`, error.response ? error.response.data : error.message);
        throw error;
    }
}

async function uploadApplicationSurveys(applications, surveyData) {
    
    for (const applicant of applications) {
        const email = applicant.email ? applicant.email.toLowerCase() : null;
        const applicationId = applicant.id

        if (!email) {
            console.log(`Skipping applicant ${applicationId} due to null email.`);
            continue;
        }

        const surveys = surveyData[email] ? surveyData[email].surveys : [];
        if (surveys.length === 0) continue;

        for (const survey of surveys) {
            const reportLink = `${survey.surveyReportLink}`;
            const trait = `${survey.traitPattern}`

            try {
                const traitSurvey = `Trait: ${trait}\nSurvey Link: ${reportLink}`
                await addApplicationComment(applicationId, traitSurvey);
                await changeApplicantStatus(applicationId)
            } catch (error) {
                console.error(`Error uploading survey for applicant ${applicationId}:`, error);
            }
        }
    }
}


module.exports = {
    fetchApplications,
    fetchApplicationDetail,
    fetchStatuses,
    addApplicationComment,
    changeApplicantStatus,
    uploadApplicationSurveys,
    fetchApplications2,
    fetchJobSummaries
};
