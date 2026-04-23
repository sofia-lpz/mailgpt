import * as db from './sql.js';
import * as rag from '../services/rag.js';
import * as mailService from '../services/mailservice.js';

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
        const emails = await mailService.getUnreadEmails();
        
        return emails;
    } catch (error) {
        throw error;
    }
};

export const getRead = async () => {
    try {
        const emails = await mailService.getReadEmails();
        
        return emails;
    } catch (error) {
        throw error;
    }
};

export const answerEmail = async (messageId, replyBody) => {
    try {
        await mailService.reply(messageId, replyBody);
    } catch (error) {
        throw error;
    }
};

export const generateAnswer = async (messageId) => {
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

export const getEmailbyId = async (messageId) => {
    try {
        const emailSource = await mailService.getEmailbyId(messageId);
        return emailSource;
    } catch (error) { 
        throw error;
    }
};

// Dashboard functions

export const getEmailsReceived = async (timeframe) => {
    try {
        const count = await db.getEmailsReceived(timeframe);
        return count;
    } catch (error) {
        throw error;
    }
};

export const getEmailsAnswered = async (timeframe) => {
    try {
        const count = await db.getEmailsAnswered(timeframe);
        return count;
    } catch (error) {
        throw error;
    }
};

export const getPendingEmails = async () => {
    try {
        const count = await db.getPendingEmails();
        return count;
    } catch (error) {
        throw error;
    }
};

export const getAvgResponseTime = async () => {
    try {
        const avgTime = await db.getAvgResponseTime();
        return avgTime;
    } catch (error) {
         throw error;
    }
};

export const getMedianResponseTime = async () => {
    try {
        const medianTime = await db.getMedianResponseTime();
        return medianTime;
    } catch (error) {
        throw error;
    }
};

export const getVolumeTrend = async () => {
    try {
        const trend = await db.getVolumeTrend();
        return trend;
    } catch (error) {
        throw error;
    }
};

export const getResponseRateTrend = async () => {
    try {
        const trend = await db.getResponseRateTrend();
        return trend;
    } catch (error) {
        throw error;
    }
};

export const getBusiestHours = async () => {
    try {
        const hours = await db.getBusiestHours();
        return hours;
    } catch (error) {
        throw error;
    }
};