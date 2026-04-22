import * as db from './sql.js';
import * as rag from '../services/rag.js';

export const login = async (username, password) => {
  try {
      const user = await db.verifyPassword(username, password);
      return user;
    } catch (error) {
        throw error;
    }
};

export const register = async (username, password) => {
    try {
        const user = await db.register(username, password);
        return user;
    } catch (error) {
        throw error;
    }
};

export const getUnread = async () => {
    try {
        // todo call the gs service
        const emails = await db.getUnreadEmails();
        return emails;
    } catch (error) {
        throw error;
    }
};

export const answerEmail = async (emailId, answer) => {
    try {
        // todo call the gs service
    } catch (error) {
        throw error;
    }
};

export const generateAnswer = async (emailId) => {
    try {
        // todo call helper to get the context and generate the answer
        return answer;
    } catch (error) {
        throw error;
    }
};

export const tweak = async (answer, feedback) => {
    try {
        // todo call helper to tweak the email answers
    } catch (error) {
        throw error;
    }
};

export const getUser = async (username) => {
    try {
        const user = await db.getUserByUsername(username);
        return user;
    } catch (error) {
        throw error;
    }
};