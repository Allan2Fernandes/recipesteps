const sql = require("mssql");

class DatabaseHandler{
    constructor(config) {
        this.config = config;
        this.connectionString = `Server=${this.config.server},1433;Database=${this.config.database};User Id=${this.config.user};Password=${this.config.password};Encrypt=true;trustServerCertificate=true`
        this.sql = require('mssql');
    }

    async connect(){
        await this.sql.connect(this.connectionString)
    }

    async queryDB(query){
        const result = await sql.query(query);
        return result['recordset']
    }

    async executeStoredprocedure(selectedRecipeSetID, stepNo){
        const request = new sql.Request();
        request.input('selectedRecipeSetID', sql.Int, selectedRecipeSetID)
        request.input('stepNo', sql.Int, stepNo)
        request.execute('sp_GetStepImage', (error, result) => {
            return result.recordsets
        })
    }
}

module.exports = DatabaseHandler