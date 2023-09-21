const DatabaseHandler = require("./DatabaseHandler")
const http = require("http");
const url = require('url');
const fs = require('fs');
const process = require('node:process');

const sql = require("mssql");

const host = '0.0.0.0';
//const baseURL = "http://10.0.109.150:5052/"
const baseURL = "https://localhost:7000/"

var databaseVariables = process.env.DatabaseConnection.toString().split(',')
console.log(databaseVariables)
var config = {
    user: databaseVariables[1],
    password: databaseVariables[2],
    server: databaseVariables[0],
    database: databaseVariables[3]
}

var dbHandler = new DatabaseHandler(config);
dbHandler.connect()

const requestListener = async function (req, res) {
    if (req.url.includes('favicon')) {
        console.log(req.url)
        res.writeHead(200, { 'Content-Type': 'image/x-icon' });
        res.end();
        console.log('favicon requested');
        return;
    }
    // Parse the URL to get query parameters
    const parsedUrl = url.parse(req.url, true);
    const queryParams = parsedUrl.query;

    // Check if a specific query parameter exists
    const selectedRecipeSetID = queryParams.SetID; // Change "paramName" to the parameter you want to retrieve
    const stepNo = queryParams.StepNo;

    const request = new sql.Request();
    request.input('selectedRecipeSetID', sql.Int, selectedRecipeSetID)
    request.input('stepNo', sql.Int, stepNo)

    try {
        const result = await new Promise((resolve, reject) => {
            request.execute('sp_GetStepImage', (error, result) => {
                if (error) {
                    reject(error);
                } else {
                    resolve(result);
                }
            });
        });

        const image1Source = `${baseURL}api/Image/getImageOnFileName/${result.recordset[0]['ParamValue']}`
        const image2Source = `${baseURL}api/Image/getImageOnFileName/${result.recordset[1]['ParamValue']}`
        // Read the HTML template file
        fs.readFile('index.html', 'utf8', (readErr, template) => {
            if (readErr) {
                console.error(readErr);
                res.setHeader('Content-Type', 'text/html');
                res.writeHead(500); // Internal Server Error
                res.end(`<div>Error reading HTML template</div>`);
                return;
            }

            // Replace placeholders in the template with actual values
            template = template.replace('{{image1Source}}', image1Source);
            template = template.replace('{{image2Source}}', image2Source);
            template = template.replace('{{instructions}}', result.recordset[2]['ParamValue'])

            res.setHeader('Content-Type', 'text/html');
            res.writeHead(200);
            res.end(template);
        });
    } catch (error) {
        console.log(error);
        res.setHeader('Content-Type', 'text/html');
        res.writeHead(500); // Internal Server Error
        res.end(`<div>Error</div>`);
    }
};


const port = 3500
const server = http.createServer(requestListener);
server.listen(port, host, () => {
    console.log(`Server is running on http://${host}:${port}`);
});


