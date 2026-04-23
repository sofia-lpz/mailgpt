import * as service from './service.js';

export const login = async (req, res) => {
    try {
        const { username, password } = req.body;
        const user = await crmService.login(username, password);
        if (user) {
            // Generate a JWT token
            const token = jwt.sign({ id: user.id, username: user.username }, process.env.JWT_SECRET, { expiresIn: '1h' });
            const role = user.role;
            res.send({ status: "OK", token, role });
            console.log(`User ${username} logged in`);
        }
    } catch (error) {
        if (error.message === 'User not found' || error.message === 'Invalid password') {
            res.status(401).send({ status: "Error", message: "Invalid credentials" });
        } else {
            console.error(error);
            res.status(500).send({ status: "Error", message: "Internal Server Error" });
        }
    }
};

export const register = async (req, res) => {
    if (!req.body.username || !req.body.password || !req.body.role) {
        return res.status(400).send({ status: "Error", message: "Username, password, and role are required" });
    }
    try {
        const { username, password, role } = req.body;
        const user = await service.register(username, password, role);
        if (user) {
            res.send({ status: "OK", message: "User registered successfully" });
            console.log(`User ${username} registered`);
        }
    } catch (error) {
        if (error.message === 'User already exists') {
            res.status(400).send({ status: "Error", message: "User already exists" });
        } else {
            console.error(error);
            res.status(500).send({ status: "Error", message: "Internal Server Error" });
        }
    }
};

export const getUnread = async (req, res) => {
    try {
        const emails = await service.getUnread();
        res.send({ status: "OK", emails });
    } catch (error) {
        console.error(error);
        res.status(500).send({ status: "Error", message: "Internal Server Error" });
    }
};

export const getSource = async (req, res) => {

    try {
        const messageId = req.body.messageId;
        console.log('Received request for email source with ID at controller:', messageId);
        const source = await service.getEmailbyId(messageId);
        res.send({ status: "OK", source });
    } catch (error) {
        console.error(error);
        res.status(500).send({ status: "Error", message: "Internal Server Error" });
    }
};

export const answer = async (req, res) => {
    if (!req.body || !req.body.messageId || !req.body.replyBody) {
        return res.status(400).send({ status: "Error", message: "Message ID and reply body are required" });
    }   
    try {
        const { messageId, replyBody } = req.body;  
        await service.answerEmail(messageId, replyBody);
        res.send({ status: "OK", message: "Email answered successfully" });
    } catch (error) {
        console.error(error);
        res.status(500).send({ status: "Error", message: "Internal Server Error" });
    }
};

export const generateAnswer = async (req, res) => {
    try {
        const { messageId } = req.query;
        const answer = await service.generateAnswer(messageId);
        res.send({ status: "OK", answer });
    } catch (error) {
        console.error(error);
        res.status(500).send({ status: "Error", message: "Internal Server Error" });
    }
};

export const tweak = async (req, res) => {
    try {
        // todo call helper to tweak the email answers
        // requires the email answer and feedback
        res.send({ status: "OK", message: "Model tweaked successfully" });
    } catch (error) {
        console.error(error);
        res.status(500).send({ status: "Error", message: "Internal Server Error" });
    }
};



// dashboard controllers

export const getEmailsReceived = async (req, res) => {
    try {
        const { period } = req.query; // day/week/month
        const data = await service.getEmailsReceived(period);
        res.send({ status: "OK", data });
    } catch (error) {
        console.error(error);
        res.status(500).send({ status: "Error", message: "Internal Server Error" });
    }
};

export const getEmailsAnswered = async (req, res) => {
    try {
        const { period } = req.query; // day/week/month
        const data = await service.getEmailsAnswered(period);
        res.send({ status: "OK", data });
    } catch (error) {
        console.error(error);
        res.status(500).send({ status: "Error", message: "Internal Server Error" });
    }
};

export const getPendingEmails = async (req, res) => {
    try {
        const count = await service.getPendingEmails();
        res.send({ status: "OK", count });
    } catch (error) {
        console.error(error);
        res.status(500).send({ status: "Error", message: "Internal Server Error" });
    }
};

export const getAvgResponseTime = async (req, res) => {
    try {
        const avgTime = await service.getAvgResponseTime();
        res.send({ status: "OK", avgTime });
    } catch (error) {
        console.error(error);
        res.status(500).send({ status: "Error", message: "Internal Server Error" });
    }
};

export const getMedianResponseTime = async (req, res) => {
    try {
        const medianTime = await service.getMedianResponseTime();
        res.send({ status: "OK", medianTime });
    } catch (error) {
        console.error(error);
        res.status(500).send({ status: "Error", message: "Internal Server Error" });
    }
};

export const getVolumeTrend = async (req, res) => {
    try {
        const trend = await service.getVolumeTrend();
        res.send({ status: "OK", trend });
    } catch (error) {
        console.error(error);
        res.status(500).send({ status: "Error", message: "Internal Server Error" });
    }
};

export const getResponseRateTrend = async (req, res) => {
    try {
        const trend = await service.getResponseRateTrend();
        res.send({ status: "OK", trend });
    } catch (error) {
        console.error(error);
        res.status(500).send({ status: "Error", message: "Internal Server Error" });
    }
};

export const getBusiestHours = async (req, res) => {
    try {
        const hours = await service.getBusiestHours();
        res.send({ status: "OK", hours });
    } catch (error) {
        console.error(error);
        res.status(500).send({ status: "Error", message: "Internal Server Error" });
    }
};