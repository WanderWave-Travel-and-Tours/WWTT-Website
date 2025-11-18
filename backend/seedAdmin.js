const mongoose = require('mongoose');
const AdminModel = require('./models/admin');

const MONGO_URI = "mongodb+srv://info_db_user:a16kQ68pv4ipugkw@cluster0.r4onuni.mongodb.net/?appName=Cluster0";

mongoose.connect(MONGO_URI)
    .then(() => console.log("Connected to DB"))
    .catch(err => console.log(err));

const createAdmin = async () => {
    try {
        const existingAdmin = await AdminModel.findOne({ username: "admin" });
        if (existingAdmin) {
            console.log("May admin account na!");
        } else {
            await AdminModel.create({
                username: "admin",
                password: "password123"
            });
            console.log("✅ SUCCESS: Admin created! User: admin | Pass: password123");
        }
    } catch (error) {
        console.log("Error:", error);
    } finally {
        mongoose.connection.close();
    }
};

createAdmin();