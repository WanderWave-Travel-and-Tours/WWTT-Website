const bcrypt = require('bcrypt');

const passwordToHash = "password123";
const saltRounds = 10;

async function generateHash() {
    try {
        const hash = await bcrypt.hash(passwordToHash, saltRounds);
        console.log("-----------------------------------------");
        console.log(`Original Password: ${passwordToHash}`);
        console.log(`Generated HASH: ${hash}`);
        console.log("-----------------------------------------");
        
    } catch (error) {
        console.error("Error generating hash:", error);
    }
}

generateHash();