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
    try {
        const { username, password } = req.body;
        const user = await crmService.register(username, password);
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
        const emails = await service.getUnreadEmails();
        res.send({ status: "OK", emails });
    } catch (error) {
        console.error(error);
        res.status(500).send({ status: "Error", message: "Internal Server Error" });
    }
};

export const getSource = async (req, res) => {
    try {
        const { emailId } = req.query;
        const source = await service.getEmailSource(emailId);
        res.send({ status: "OK", source });
    } catch (error) {
        console.error(error);
        res.status(500).send({ status: "Error", message: "Internal Server Error" });
    }
};

export const answer = async (req, res) => {
    try {
        const { emailId, answer } = req.body;  
        await service.answerEmail(emailId, answer);
        res.send({ status: "OK", message: "Email answered successfully" });
    } catch (error) {
        console.error(error);
        res.status(500).send({ status: "Error", message: "Internal Server Error" });
    }
};

export const generateAnswer = async (req, res) => {
    try {
        const { emailId } = req.query;
        const answer = await service.generateAnswer(emailId);
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

