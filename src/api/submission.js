// Submission API helpers keep page components from repeating request boilerplate.
// They return plain response data so the IDE page can stay focused on UI state.
import axiosClient from "../utils/axiosClient";

export const runCodeApi = async (problemId, code, language) => {
    try {
        const response = await axiosClient.post(`/submission/run/${problemId}`, {
            code,
            language,
        });
        return response.data;
    } catch (error) {
        throw error.response?.data || error.message;
    }
};

export const submitCodeApi = async (problemId, code, language) => {
    try {
        const response = await axiosClient.post(`/submission/submit/${problemId}`, {
            code,
            language,
        });
        return response.data;
    } catch (error) {
        throw error.response?.data || error.message;
    }
};

export const getSubmissionsApi = async (problemId) => {
    try {
        const response = await axiosClient.get(`/submission/getSubmission/${problemId}`);
        return response.data;
    } catch (error) {
        throw error.response?.data || error.message;
    }
}
