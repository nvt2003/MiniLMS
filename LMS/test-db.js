console.log('test-db.js is running')
const db = require("./src/config/db");
async function test() {
    try{
        const [rows] = await db.query("SELECT 1");
        console.log("connection successfully:",rows);
    }catch(error){
        console.error("Error connection:",error.message);
    }
    
}